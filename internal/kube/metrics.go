package kube

import (
	"context"
	"encoding/json"
	"strings"
	"sync"
	"time"

	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	metricsclient "k8s.io/metrics/pkg/client/clientset/versioned"
)

const volumeStatsCacheTTL = 30 * time.Second

type PodMetrics struct {
	Namespace                string `json:"namespace"`
	Name                     string `json:"name"`
	CPUMC                    int64  `json:"cpuMC"`
	MemB                     int64  `json:"memB"`
	ResourceMetricsAvailable bool   `json:"resourceMetricsAvailable"`
	VolumeUsageB             int64  `json:"volumeUsageB"`
	VolumeLimitB             int64  `json:"volumeLimitB"`
	VolumeStatsAvailable     bool   `json:"volumeStatsAvailable"`
}

type NodeMetrics struct {
	Name  string `json:"name"`
	CPUMC int64  `json:"cpuMC"`
	MemB  int64  `json:"memB"`
}

type metricsCache struct {
	mu          sync.Mutex
	client      map[string]metricsclient.Interface
	volumeStats map[string]cachedNodeStatsSummary
}

type cachedNodeStatsSummary struct {
	expires time.Time
	summary *nodeStatsSummary
}

func newMetricsCache() *metricsCache {
	return &metricsCache{
		client:      make(map[string]metricsclient.Interface),
		volumeStats: make(map[string]cachedNodeStatsSummary),
	}
}

func (m *ClientManager) ListPodMetrics(ctx context.Context, contextName, namespace string) ([]PodMetrics, error) {
	byPod := make(map[string]*PodMetrics)

	c, err := m.metricsClient(contextName)
	if err != nil {
		return nil, err
	}

	list, err := c.MetricsV1beta1().PodMetricses(namespace).List(ctx, metav1.ListOptions{})
	switch {
	case err == nil:
		for i := range list.Items {
			pm := &list.Items[i]
			var cpu, mem int64
			for _, c := range pm.Containers {
				if q, ok := c.Usage[corev1.ResourceCPU]; ok {
					cpu += q.MilliValue()
				}
				if q, ok := c.Usage[corev1.ResourceMemory]; ok {
					mem += q.Value()
				}
			}
			key := podMetricKey(pm.Namespace, pm.Name)
			byPod[key] = &PodMetrics{
				Namespace:                pm.Namespace,
				Name:                     pm.Name,
				CPUMC:                    cpu,
				MemB:                     mem,
				ResourceMetricsAvailable: true,
			}
		}
	case apierrors.IsNotFound(err) || apierrors.IsServiceUnavailable(err):
		// metrics-server is optional; kubelet volume stats may still be available.
	default:
		// Keep polling kubelet volume stats even when metrics-server is unavailable
		// or access to metrics.k8s.io is denied.
	}

	if cs, err := m.Clientset(contextName); err == nil {
		m.addPodVolumeStats(ctx, contextName, namespace, cs, byPod)
	}

	out := make([]PodMetrics, 0, len(byPod))
	for _, m := range byPod {
		out = append(out, *m)
	}
	return out, nil
}

func (m *ClientManager) addPodVolumeStats(ctx context.Context, contextName, namespace string, cs *kubernetes.Clientset, byPod map[string]*PodMetrics) {
	pods, err := cs.CoreV1().Pods(namespace).List(ctx, metav1.ListOptions{})
	if err != nil || len(pods.Items) == 0 {
		return
	}

	targetsByPod, podKeysByNode := podVolumeStatsTargets(pods.Items)
	if len(targetsByPod) == 0 {
		return
	}

	for nodeName, podKeys := range podKeysByNode {
		summary, err := m.nodeStatsSummary(ctx, contextName, cs, nodeName)
		if err != nil || summary == nil {
			continue
		}
		for i := range summary.Pods {
			podSummary := &summary.Pods[i]
			key := podMetricKey(podSummary.PodRef.Namespace, podSummary.PodRef.Name)
			if _, ok := podKeys[key]; !ok {
				continue
			}
			target := targetsByPod[key]
			used, limit, ok := podSummary.volumeStats(target)
			if !ok {
				continue
			}
			entry := byPod[key]
			if entry == nil {
				entry = &PodMetrics{Namespace: podSummary.PodRef.Namespace, Name: podSummary.PodRef.Name}
				byPod[key] = entry
			}
			entry.VolumeUsageB = used
			entry.VolumeLimitB = limit
			entry.VolumeStatsAvailable = true
		}
	}
}

func (m *ClientManager) ListNodeMetrics(ctx context.Context, contextName string) ([]NodeMetrics, error) {
	c, err := m.metricsClient(contextName)
	if err != nil {
		return nil, err
	}

	list, err := c.MetricsV1beta1().NodeMetricses().List(ctx, metav1.ListOptions{})
	if err != nil {
		if apierrors.IsNotFound(err) || apierrors.IsServiceUnavailable(err) {
			return []NodeMetrics{}, nil
		}
		return nil, err
	}

	out := make([]NodeMetrics, 0, len(list.Items))
	for i := range list.Items {
		nm := &list.Items[i]
		var cpu, mem int64
		if q, ok := nm.Usage["cpu"]; ok {
			cpu = q.MilliValue()
		}
		if q, ok := nm.Usage["memory"]; ok {
			mem = q.Value()
		}
		out = append(out, NodeMetrics{Name: nm.Name, CPUMC: cpu, MemB: mem})
	}
	return out, nil
}

type podVolumeStatsTarget struct {
	names    map[string]struct{}
	fallback bool
}

type nodeStatsSummary struct {
	Pods []podStatsSummary `json:"pods"`
}

type podStatsSummary struct {
	PodRef struct {
		Name      string `json:"name"`
		Namespace string `json:"namespace"`
	} `json:"podRef"`
	Volume           []volumeStatsSummary `json:"volume"`
	EphemeralStorage struct {
		UsedBytes     *int64 `json:"usedBytes"`
		CapacityBytes *int64 `json:"capacityBytes"`
	} `json:"ephemeral-storage"`
}

type volumeStatsSummary struct {
	Name          string `json:"name"`
	UsedBytes     *int64 `json:"usedBytes"`
	CapacityBytes *int64 `json:"capacityBytes"`
}

func podVolumeStatsTargets(pods []corev1.Pod) (map[string]podVolumeStatsTarget, map[string]map[string]struct{}) {
	targetsByPod := make(map[string]podVolumeStatsTarget)
	podKeysByNode := make(map[string]map[string]struct{})
	for i := range pods {
		p := &pods[i]
		if p.Namespace == "" || p.Name == "" || p.Spec.NodeName == "" {
			continue
		}
		preferred := make(map[string]struct{})
		fallback := make(map[string]struct{})
		for _, v := range p.Spec.Volumes {
			if v.Name == "" {
				continue
			}
			switch {
			case v.PersistentVolumeClaim != nil:
				preferred[v.Name] = struct{}{}
			case v.Ephemeral != nil && v.Ephemeral.VolumeClaimTemplate != nil:
				preferred[v.Name] = struct{}{}
			case v.EmptyDir != nil && v.EmptyDir.SizeLimit != nil:
				fallback[v.Name] = struct{}{}
			}
		}

		target := podVolumeStatsTarget{}
		switch {
		case len(preferred) > 0:
			target.names = preferred
		case len(fallback) > 0:
			target.names = fallback
			target.fallback = true
		default:
			continue
		}

		key := podMetricKey(p.Namespace, p.Name)
		targetsByPod[key] = target
		if podKeysByNode[p.Spec.NodeName] == nil {
			podKeysByNode[p.Spec.NodeName] = make(map[string]struct{})
		}
		podKeysByNode[p.Spec.NodeName][key] = struct{}{}
	}
	return targetsByPod, podKeysByNode
}

func (s *podStatsSummary) volumeStats(target podVolumeStatsTarget) (usedB, limitB int64, ok bool) {
	var hasUsed, hasLimit bool
	for _, v := range s.Volume {
		if _, selected := target.names[v.Name]; !selected {
			continue
		}
		if v.UsedBytes != nil {
			usedB += *v.UsedBytes
			hasUsed = true
		}
		if v.CapacityBytes != nil {
			limitB += *v.CapacityBytes
			hasLimit = true
		}
	}
	if target.fallback && !hasUsed && s.EphemeralStorage.UsedBytes != nil {
		usedB = *s.EphemeralStorage.UsedBytes
		hasUsed = true
	}
	if target.fallback && !hasLimit && s.EphemeralStorage.CapacityBytes != nil {
		limitB = *s.EphemeralStorage.CapacityBytes
		hasLimit = true
	}
	return usedB, limitB, hasUsed || hasLimit
}

func (m *ClientManager) nodeStatsSummary(ctx context.Context, contextName string, cs *kubernetes.Clientset, nodeName string) (*nodeStatsSummary, error) {
	cacheKey := contextName + "|" + nodeName
	now := time.Now()
	m.metrics.mu.Lock()
	if cached, ok := m.metrics.volumeStats[cacheKey]; ok && cached.expires.After(now) {
		m.metrics.mu.Unlock()
		return cached.summary, nil
	}
	m.metrics.mu.Unlock()

	raw, err := cs.CoreV1().RESTClient().Get().
		Resource("nodes").
		Name(nodeName).
		SubResource("proxy").
		Suffix("stats", "summary").
		Do(ctx).
		Raw()
	if err != nil {
		return nil, err
	}
	var summary nodeStatsSummary
	if err := json.Unmarshal(raw, &summary); err != nil {
		return nil, err
	}

	m.metrics.mu.Lock()
	m.metrics.volumeStats[cacheKey] = cachedNodeStatsSummary{
		expires: now.Add(volumeStatsCacheTTL),
		summary: &summary,
	}
	m.metrics.mu.Unlock()
	return &summary, nil
}

func podMetricKey(namespace, name string) string {
	return namespace + "/" + name
}

func (mc *metricsCache) invalidate(contextName string) {
	mc.mu.Lock()
	defer mc.mu.Unlock()
	delete(mc.client, contextName)
	for key := range mc.volumeStats {
		if strings.HasPrefix(key, contextName+"|") {
			delete(mc.volumeStats, key)
		}
	}
}

func (m *ClientManager) metricsClient(contextName string) (metricsclient.Interface, error) {
	m.metrics.mu.Lock()
	if c, ok := m.metrics.client[contextName]; ok {
		m.metrics.mu.Unlock()
		return c, nil
	}
	m.metrics.mu.Unlock()

	cfg, err := m.restConfig(contextName)
	if err != nil {
		return nil, err
	}
	c, err := metricsclient.NewForConfig(cfg)
	if err != nil {
		return nil, err
	}

	m.metrics.mu.Lock()
	m.metrics.client[contextName] = c
	m.metrics.mu.Unlock()
	return c, nil
}
