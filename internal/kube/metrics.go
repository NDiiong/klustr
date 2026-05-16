package kube

import (
	"context"
	"sync"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	metricsclient "k8s.io/metrics/pkg/client/clientset/versioned"
)

type PodMetrics struct {
	Namespace string `json:"namespace"`
	Name      string `json:"name"`
	CPUMC     int64  `json:"cpuMC"`
	MemB      int64  `json:"memB"`
}

type metricsCache struct {
	mu     sync.Mutex
	client map[string]metricsclient.Interface
}

func newMetricsCache() *metricsCache {
	return &metricsCache{client: make(map[string]metricsclient.Interface)}
}

func (m *ClientManager) ListPodMetrics(ctx context.Context, contextName, namespace string) ([]PodMetrics, error) {
	c, err := m.metricsClient(contextName)
	if err != nil {
		return nil, err
	}

	list, err := c.MetricsV1beta1().PodMetricses(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		if apierrors.IsNotFound(err) || apierrors.IsServiceUnavailable(err) {
			return []PodMetrics{}, nil
		}
		return nil, err
	}

	out := make([]PodMetrics, 0, len(list.Items))
	for i := range list.Items {
		pm := &list.Items[i]
		var cpu, mem int64
		for _, c := range pm.Containers {
			if q, ok := c.Usage["cpu"]; ok {
				cpu += q.MilliValue()
			}
			if q, ok := c.Usage["memory"]; ok {
				mem += q.Value()
			}
		}
		out = append(out, PodMetrics{
			Namespace: pm.Namespace,
			Name:      pm.Name,
			CPUMC:     cpu,
			MemB:      mem,
		})
	}
	return out, nil
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
