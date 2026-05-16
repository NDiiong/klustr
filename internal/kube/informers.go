package kube

import (
	"context"
	"fmt"
	"sort"
	"strings"
	"sync"
	"time"

	appsv1 "k8s.io/api/apps/v1"
	batchv1 "k8s.io/api/batch/v1"
	corev1 "k8s.io/api/core/v1"
	networkingv1 "k8s.io/api/networking/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/client-go/informers"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/cache"
)

const debounceWindow = 100 * time.Millisecond

type NamespaceInfo struct {
	Name      string `json:"name"`
	Phase     string `json:"phase"`
	CreatedAt string `json:"createdAt"`
}

type PodInfo struct {
	Name         string `json:"name"`
	Namespace    string `json:"namespace"`
	Status       string `json:"status"`
	Ready        string `json:"ready"`
	Restarts     int32  `json:"restarts"`
	Node         string `json:"node"`
	PodIP        string `json:"podIP"`
	CreatedAt    string `json:"createdAt"`
	CPURequestMC int64  `json:"cpuRequestMC"`
	CPULimitMC   int64  `json:"cpuLimitMC"`
	MemRequestB  int64  `json:"memRequestB"`
	MemLimitB    int64  `json:"memLimitB"`
}

type PodLogTarget struct {
	Pod        string   `json:"pod"`
	Containers []string `json:"containers"`
}

type OwnerRef struct {
	Kind string `json:"kind"`
	Name string `json:"name"`
}

type ContainerDetail struct {
	Name         string          `json:"name"`
	Image        string          `json:"image"`
	State        string          `json:"state"`
	StateReason  string          `json:"stateReason"`
	Ready        bool            `json:"ready"`
	RestartCount int32           `json:"restartCount"`
	StartedAt    string          `json:"startedAt"`
	LastState    string          `json:"lastState"`
	Ports        []ContainerPort `json:"ports"`
}

type ContainerPort struct {
	Name          string `json:"name"`
	ContainerPort int32  `json:"containerPort"`
	Protocol      string `json:"protocol"`
}

type ConditionDetail struct {
	Type    string `json:"type"`
	Status  string `json:"status"`
	Reason  string `json:"reason"`
	Message string `json:"message"`
}

type PodDetail struct {
	Name              string            `json:"name"`
	Namespace         string            `json:"namespace"`
	UID               string            `json:"uid"`
	Status            string            `json:"status"`
	Phase             string            `json:"phase"`
	Node              string            `json:"node"`
	PodIP             string            `json:"podIP"`
	HostIP            string            `json:"hostIP"`
	QOSClass          string            `json:"qosClass"`
	ServiceAccount    string            `json:"serviceAccount"`
	RestartPolicy     string            `json:"restartPolicy"`
	PriorityClassName string            `json:"priorityClassName"`
	CreatedAt         string            `json:"createdAt"`
	Labels            map[string]string `json:"labels"`
	Annotations       map[string]string `json:"annotations"`
	Owners            []OwnerRef        `json:"owners"`
	InitContainers    []ContainerDetail `json:"initContainers"`
	Containers        []ContainerDetail `json:"containers"`
	Conditions        []ConditionDetail `json:"conditions"`
}

type NetworkPolicyInfo struct {
	Name        string `json:"name"`
	Namespace   string `json:"namespace"`
	PodSelector string `json:"podSelector"`
	PolicyTypes string `json:"policyTypes"`
	CreatedAt   string `json:"createdAt"`
}

type StorageClassInfo struct {
	Name              string `json:"name"`
	Provisioner       string `json:"provisioner"`
	ReclaimPolicy     string `json:"reclaimPolicy"`
	VolumeBindingMode string `json:"volumeBindingMode"`
	AllowExpansion    bool   `json:"allowExpansion"`
	IsDefault         bool   `json:"isDefault"`
	CreatedAt         string `json:"createdAt"`
}

type PersistentVolumeInfo struct {
	Name          string `json:"name"`
	Capacity      string `json:"capacity"`
	AccessModes   string `json:"accessModes"`
	ReclaimPolicy string `json:"reclaimPolicy"`
	Status        string `json:"status"`
	Claim         string `json:"claim"`
	StorageClass  string `json:"storageClass"`
	CreatedAt     string `json:"createdAt"`
}

type PersistentVolumeClaimInfo struct {
	Name         string `json:"name"`
	Namespace    string `json:"namespace"`
	Status       string `json:"status"`
	Volume       string `json:"volume"`
	Capacity     string `json:"capacity"`
	AccessModes  string `json:"accessModes"`
	StorageClass string `json:"storageClass"`
	CreatedAt    string `json:"createdAt"`
}

type ReplicaSetInfo struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	Desired   int32  `json:"desired"`
	Current   int32  `json:"current"`
	Ready     int32  `json:"ready"`
	OwnedBy   string `json:"ownedBy"`
	Images    string `json:"images"`
	CreatedAt string `json:"createdAt"`
}

type DeploymentInfo struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	Ready     string `json:"ready"`
	UpToDate  int32  `json:"upToDate"`
	Available int32  `json:"available"`
	Strategy  string `json:"strategy"`
	Images    string `json:"images"`
	CreatedAt string `json:"createdAt"`
}

type ServiceInfo struct {
	Name       string `json:"name"`
	Namespace  string `json:"namespace"`
	Type       string `json:"type"`
	ClusterIP  string `json:"clusterIP"`
	ExternalIP string `json:"externalIP"`
	Ports      string `json:"ports"`
	CreatedAt  string `json:"createdAt"`
}

type ConfigMapInfo struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	Keys      int    `json:"keys"`
	CreatedAt string `json:"createdAt"`
}

type SecretInfo struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	Type      string `json:"type"`
	Keys      int    `json:"keys"`
	CreatedAt string `json:"createdAt"`
}

type StatefulSetInfo struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	Ready     string `json:"ready"`
	Service   string `json:"service"`
	Images    string `json:"images"`
	CreatedAt string `json:"createdAt"`
}

type DaemonSetInfo struct {
	Name         string `json:"name"`
	Namespace    string `json:"namespace"`
	Desired      int32  `json:"desired"`
	Current      int32  `json:"current"`
	Ready        int32  `json:"ready"`
	UpToDate     int32  `json:"upToDate"`
	Available    int32  `json:"available"`
	NodeSelector string `json:"nodeSelector"`
	CreatedAt    string `json:"createdAt"`
}

type JobInfo struct {
	Name        string `json:"name"`
	Namespace   string `json:"namespace"`
	Completions string `json:"completions"`
	Duration    string `json:"duration"`
	Status      string `json:"status"`
	CreatedAt   string `json:"createdAt"`
}

type CronJobInfo struct {
	Name         string `json:"name"`
	Namespace    string `json:"namespace"`
	Schedule     string `json:"schedule"`
	Suspend      bool   `json:"suspend"`
	Active       int    `json:"active"`
	LastSchedule string `json:"lastSchedule"`
	CreatedAt    string `json:"createdAt"`
}

type IngressInfo struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	Class     string `json:"class"`
	Hosts     string `json:"hosts"`
	Address   string `json:"address"`
	Ports     string `json:"ports"`
	CreatedAt string `json:"createdAt"`
}

type NodeInfo struct {
	Name       string `json:"name"`
	Status     string `json:"status"`
	Roles      string `json:"roles"`
	Version    string `json:"version"`
	OSImage    string `json:"osImage"`
	InternalIP string `json:"internalIP"`
	CreatedAt  string `json:"createdAt"`
}

type ChangeFunc func(kind string)

type contextWatcher struct {
	factory  informers.SharedInformerFactory
	onChange ChangeFunc
	cancel   context.CancelFunc

	mu      sync.Mutex
	pending map[string]struct{}
	timer   *time.Timer
}

func newContextWatcher(cs *kubernetes.Clientset, onChange ChangeFunc) *contextWatcher {
	return &contextWatcher{
		factory:  informers.NewSharedInformerFactory(cs, 0),
		onChange: onChange,
		pending:  make(map[string]struct{}),
	}
}

func (w *contextWatcher) start(parent context.Context) error {
	ctx, cancel := context.WithCancel(parent)
	w.cancel = cancel

	ns := w.factory.Core().V1().Namespaces().Informer()
	if _, err := ns.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc:    func(any) { w.touch("Namespace") },
		UpdateFunc: func(any, any) { w.touch("Namespace") },
		DeleteFunc: func(any) { w.touch("Namespace") },
	}); err != nil {
		cancel()
		return err
	}

	pods := w.factory.Core().V1().Pods().Informer()
	if _, err := pods.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc:    func(any) { w.touch("Pod") },
		UpdateFunc: func(any, any) { w.touch("Pod") },
		DeleteFunc: func(any) { w.touch("Pod") },
	}); err != nil {
		cancel()
		return err
	}

	deployments := w.factory.Apps().V1().Deployments().Informer()
	if _, err := deployments.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc:    func(any) { w.touch("Deployment") },
		UpdateFunc: func(any, any) { w.touch("Deployment") },
		DeleteFunc: func(any) { w.touch("Deployment") },
	}); err != nil {
		cancel()
		return err
	}

	services := w.factory.Core().V1().Services().Informer()
	if _, err := services.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc:    func(any) { w.touch("Service") },
		UpdateFunc: func(any, any) { w.touch("Service") },
		DeleteFunc: func(any) { w.touch("Service") },
	}); err != nil {
		cancel()
		return err
	}

	configMaps := w.factory.Core().V1().ConfigMaps().Informer()
	if _, err := configMaps.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc:    func(any) { w.touch("ConfigMap") },
		UpdateFunc: func(any, any) { w.touch("ConfigMap") },
		DeleteFunc: func(any) { w.touch("ConfigMap") },
	}); err != nil {
		cancel()
		return err
	}

	secrets := w.factory.Core().V1().Secrets().Informer()
	if _, err := secrets.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc:    func(any) { w.touch("Secret") },
		UpdateFunc: func(any, any) { w.touch("Secret") },
		DeleteFunc: func(any) { w.touch("Secret") },
	}); err != nil {
		cancel()
		return err
	}

	statefulSets := w.factory.Apps().V1().StatefulSets().Informer()
	if _, err := statefulSets.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc:    func(any) { w.touch("StatefulSet") },
		UpdateFunc: func(any, any) { w.touch("StatefulSet") },
		DeleteFunc: func(any) { w.touch("StatefulSet") },
	}); err != nil {
		cancel()
		return err
	}

	daemonSets := w.factory.Apps().V1().DaemonSets().Informer()
	if _, err := daemonSets.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc:    func(any) { w.touch("DaemonSet") },
		UpdateFunc: func(any, any) { w.touch("DaemonSet") },
		DeleteFunc: func(any) { w.touch("DaemonSet") },
	}); err != nil {
		cancel()
		return err
	}

	jobs := w.factory.Batch().V1().Jobs().Informer()
	if _, err := jobs.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc:    func(any) { w.touch("Job") },
		UpdateFunc: func(any, any) { w.touch("Job") },
		DeleteFunc: func(any) { w.touch("Job") },
	}); err != nil {
		cancel()
		return err
	}

	cronJobs := w.factory.Batch().V1().CronJobs().Informer()
	if _, err := cronJobs.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc:    func(any) { w.touch("CronJob") },
		UpdateFunc: func(any, any) { w.touch("CronJob") },
		DeleteFunc: func(any) { w.touch("CronJob") },
	}); err != nil {
		cancel()
		return err
	}

	netpols := w.factory.Networking().V1().NetworkPolicies().Informer()
	if _, err := netpols.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc:    func(any) { w.touch("NetworkPolicy") },
		UpdateFunc: func(any, any) { w.touch("NetworkPolicy") },
		DeleteFunc: func(any) { w.touch("NetworkPolicy") },
	}); err != nil {
		cancel()
		return err
	}

	storageClasses := w.factory.Storage().V1().StorageClasses().Informer()
	if _, err := storageClasses.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc:    func(any) { w.touch("StorageClass") },
		UpdateFunc: func(any, any) { w.touch("StorageClass") },
		DeleteFunc: func(any) { w.touch("StorageClass") },
	}); err != nil {
		cancel()
		return err
	}

	pvs := w.factory.Core().V1().PersistentVolumes().Informer()
	if _, err := pvs.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc:    func(any) { w.touch("PersistentVolume") },
		UpdateFunc: func(any, any) { w.touch("PersistentVolume") },
		DeleteFunc: func(any) { w.touch("PersistentVolume") },
	}); err != nil {
		cancel()
		return err
	}

	pvcs := w.factory.Core().V1().PersistentVolumeClaims().Informer()
	if _, err := pvcs.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc:    func(any) { w.touch("PersistentVolumeClaim") },
		UpdateFunc: func(any, any) { w.touch("PersistentVolumeClaim") },
		DeleteFunc: func(any) { w.touch("PersistentVolumeClaim") },
	}); err != nil {
		cancel()
		return err
	}

	replicaSets := w.factory.Apps().V1().ReplicaSets().Informer()
	if _, err := replicaSets.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc:    func(any) { w.touch("ReplicaSet") },
		UpdateFunc: func(any, any) { w.touch("ReplicaSet") },
		DeleteFunc: func(any) { w.touch("ReplicaSet") },
	}); err != nil {
		cancel()
		return err
	}

	ingresses := w.factory.Networking().V1().Ingresses().Informer()
	if _, err := ingresses.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc:    func(any) { w.touch("Ingress") },
		UpdateFunc: func(any, any) { w.touch("Ingress") },
		DeleteFunc: func(any) { w.touch("Ingress") },
	}); err != nil {
		cancel()
		return err
	}

	nodes := w.factory.Core().V1().Nodes().Informer()
	if _, err := nodes.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc:    func(any) { w.touch("Node") },
		UpdateFunc: func(any, any) { w.touch("Node") },
		DeleteFunc: func(any) { w.touch("Node") },
	}); err != nil {
		cancel()
		return err
	}

	w.factory.Start(ctx.Done())
	go func() {
		w.factory.WaitForCacheSync(ctx.Done())
		for _, kind := range []string{
			"Namespace", "Pod", "Deployment", "Service", "ConfigMap", "Secret",
			"StatefulSet", "DaemonSet", "Job", "CronJob", "Ingress", "Node",
			"ReplicaSet", "PersistentVolumeClaim", "PersistentVolume", "StorageClass",
			"NetworkPolicy",
		} {
			w.touch(kind)
		}
	}()
	return nil
}

func (w *contextWatcher) stop() {
	if w.cancel != nil {
		w.cancel()
	}
	w.mu.Lock()
	if w.timer != nil {
		w.timer.Stop()
		w.timer = nil
	}
	w.pending = make(map[string]struct{})
	w.mu.Unlock()
}

func (w *contextWatcher) touch(kind string) {
	w.mu.Lock()
	w.pending[kind] = struct{}{}
	if w.timer == nil {
		w.timer = time.AfterFunc(debounceWindow, w.flush)
	}
	w.mu.Unlock()
}

func (w *contextWatcher) flush() {
	w.mu.Lock()
	kinds := make([]string, 0, len(w.pending))
	for k := range w.pending {
		kinds = append(kinds, k)
	}
	w.pending = make(map[string]struct{})
	w.timer = nil
	cb := w.onChange
	w.mu.Unlock()

	if cb == nil {
		return
	}
	for _, k := range kinds {
		cb(k)
	}
}

func (w *contextWatcher) Namespaces() []NamespaceInfo {
	list, err := w.factory.Core().V1().Namespaces().Lister().List(labels.Everything())
	if err != nil {
		return []NamespaceInfo{}
	}
	out := make([]NamespaceInfo, 0, len(list))
	for _, ns := range list {
		out = append(out, NamespaceInfo{
			Name:      ns.Name,
			Phase:     string(ns.Status.Phase),
			CreatedAt: ns.CreationTimestamp.UTC().Format(time.RFC3339),
		})
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Name < out[j].Name })
	return out
}

func (w *contextWatcher) Pod(namespace, name string) (*PodDetail, error) {
	p, err := w.factory.Core().V1().Pods().Lister().Pods(namespace).Get(name)
	if err != nil {
		return nil, err
	}
	owners := make([]OwnerRef, 0, len(p.OwnerReferences))
	for _, o := range p.OwnerReferences {
		owners = append(owners, OwnerRef{Kind: o.Kind, Name: o.Name})
	}
	return &PodDetail{
		Name:              p.Name,
		Namespace:         p.Namespace,
		UID:               string(p.UID),
		Status:            derivePodStatus(p),
		Phase:             string(p.Status.Phase),
		Node:              p.Spec.NodeName,
		PodIP:             p.Status.PodIP,
		HostIP:            p.Status.HostIP,
		QOSClass:          string(p.Status.QOSClass),
		ServiceAccount:    p.Spec.ServiceAccountName,
		RestartPolicy:     string(p.Spec.RestartPolicy),
		PriorityClassName: p.Spec.PriorityClassName,
		CreatedAt:         p.CreationTimestamp.UTC().Format(time.RFC3339),
		Labels:            p.Labels,
		Annotations:       p.Annotations,
		Owners:            owners,
		InitContainers:    containerDetails(p.Spec.InitContainers, p.Status.InitContainerStatuses),
		Containers:        containerDetails(p.Spec.Containers, p.Status.ContainerStatuses),
		Conditions:        podConditions(p.Status.Conditions),
	}, nil
}

func containerDetails(specs []corev1.Container, statuses []corev1.ContainerStatus) []ContainerDetail {
	byName := make(map[string]corev1.ContainerStatus, len(statuses))
	for _, s := range statuses {
		byName[s.Name] = s
	}
	out := make([]ContainerDetail, 0, len(specs))
	for _, c := range specs {
		ports := make([]ContainerPort, 0, len(c.Ports))
		for _, p := range c.Ports {
			proto := string(p.Protocol)
			if proto == "" {
				proto = "TCP"
			}
			ports = append(ports, ContainerPort{
				Name:          p.Name,
				ContainerPort: p.ContainerPort,
				Protocol:      proto,
			})
		}
		d := ContainerDetail{Name: c.Name, Image: c.Image, Ports: ports}
		if s, ok := byName[c.Name]; ok {
			d.Ready = s.Ready
			d.RestartCount = s.RestartCount
			switch {
			case s.State.Running != nil:
				d.State = "Running"
				d.StartedAt = s.State.Running.StartedAt.UTC().Format(time.RFC3339)
			case s.State.Waiting != nil:
				d.State = "Waiting"
				d.StateReason = s.State.Waiting.Reason
			case s.State.Terminated != nil:
				d.State = "Terminated"
				d.StateReason = s.State.Terminated.Reason
				if s.State.Terminated.Reason == "" {
					d.StateReason = fmt.Sprintf("ExitCode:%d", s.State.Terminated.ExitCode)
				}
				if !s.State.Terminated.FinishedAt.IsZero() {
					d.StartedAt = s.State.Terminated.StartedAt.UTC().Format(time.RFC3339)
				}
			}
			if s.LastTerminationState.Terminated != nil {
				reason := s.LastTerminationState.Terminated.Reason
				if reason == "" {
					reason = fmt.Sprintf("ExitCode:%d", s.LastTerminationState.Terminated.ExitCode)
				}
				d.LastState = reason
			}
		}
		out = append(out, d)
	}
	return out
}

func podConditions(conds []corev1.PodCondition) []ConditionDetail {
	out := make([]ConditionDetail, 0, len(conds))
	for _, c := range conds {
		out = append(out, ConditionDetail{
			Type:    string(c.Type),
			Status:  string(c.Status),
			Reason:  c.Reason,
			Message: c.Message,
		})
	}
	return out
}

func (w *contextWatcher) PodLogTargets(namespace string, selector map[string]string) []PodLogTarget {
	if len(selector) == 0 {
		return []PodLogTarget{}
	}
	sel := labels.SelectorFromSet(labels.Set(selector))
	lister := w.factory.Core().V1().Pods().Lister()
	var (
		pods []*corev1.Pod
		err  error
	)
	if namespace == "" {
		pods, err = lister.List(sel)
	} else {
		pods, err = lister.Pods(namespace).List(sel)
	}
	if err != nil {
		return []PodLogTarget{}
	}
	out := make([]PodLogTarget, 0, len(pods))
	for _, p := range pods {
		containers := make([]string, 0, len(p.Spec.Containers))
		for _, c := range p.Spec.Containers {
			containers = append(containers, c.Name)
		}
		out = append(out, PodLogTarget{Pod: p.Name, Containers: containers})
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Pod < out[j].Pod })
	return out
}

func (w *contextWatcher) Pods(namespace string) []PodInfo {
	lister := w.factory.Core().V1().Pods().Lister()
	var (
		pods []*corev1.Pod
		err  error
	)
	if namespace == "" {
		pods, err = lister.List(labels.Everything())
	} else {
		pods, err = lister.Pods(namespace).List(labels.Everything())
	}
	if err != nil {
		return []PodInfo{}
	}
	out := make([]PodInfo, 0, len(pods))
	for _, p := range pods {
		ready, total := 0, len(p.Spec.Containers)
		var restarts int32
		for _, cs := range p.Status.ContainerStatuses {
			if cs.Ready {
				ready++
			}
			restarts += cs.RestartCount
		}
		cpuReq, cpuLim, memReq, memLim := podResourceTotals(p)
		out = append(out, PodInfo{
			Name:         p.Name,
			Namespace:    p.Namespace,
			Status:       derivePodStatus(p),
			Ready:        fmt.Sprintf("%d/%d", ready, total),
			Restarts:     restarts,
			Node:         p.Spec.NodeName,
			PodIP:        p.Status.PodIP,
			CreatedAt:    p.CreationTimestamp.UTC().Format(time.RFC3339),
			CPURequestMC: cpuReq,
			CPULimitMC:   cpuLim,
			MemRequestB:  memReq,
			MemLimitB:    memLim,
		})
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].Namespace != out[j].Namespace {
			return out[i].Namespace < out[j].Namespace
		}
		return out[i].Name < out[j].Name
	})
	return out
}

func (w *contextWatcher) Deployments(namespace string) []DeploymentInfo {
	lister := w.factory.Apps().V1().Deployments().Lister()
	var (
		deps []*appsv1.Deployment
		err  error
	)
	if namespace == "" {
		deps, err = lister.List(labels.Everything())
	} else {
		deps, err = lister.Deployments(namespace).List(labels.Everything())
	}
	if err != nil {
		return []DeploymentInfo{}
	}
	out := make([]DeploymentInfo, 0, len(deps))
	for _, d := range deps {
		var desired int32
		if d.Spec.Replicas != nil {
			desired = *d.Spec.Replicas
		}
		strategy := string(d.Spec.Strategy.Type)
		if strategy == "" {
			strategy = string(appsv1.RollingUpdateDeploymentStrategyType)
		}
		images := make([]string, 0, len(d.Spec.Template.Spec.Containers))
		for _, c := range d.Spec.Template.Spec.Containers {
			images = append(images, c.Image)
		}
		out = append(out, DeploymentInfo{
			Name:      d.Name,
			Namespace: d.Namespace,
			Ready:     fmt.Sprintf("%d/%d", d.Status.ReadyReplicas, desired),
			UpToDate:  d.Status.UpdatedReplicas,
			Available: d.Status.AvailableReplicas,
			Strategy:  strategy,
			Images:    strings.Join(images, ", "),
			CreatedAt: d.CreationTimestamp.UTC().Format(time.RFC3339),
		})
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].Namespace != out[j].Namespace {
			return out[i].Namespace < out[j].Namespace
		}
		return out[i].Name < out[j].Name
	})
	return out
}

func (w *contextWatcher) Services(namespace string) []ServiceInfo {
	lister := w.factory.Core().V1().Services().Lister()
	var (
		svcs []*corev1.Service
		err  error
	)
	if namespace == "" {
		svcs, err = lister.List(labels.Everything())
	} else {
		svcs, err = lister.Services(namespace).List(labels.Everything())
	}
	if err != nil {
		return []ServiceInfo{}
	}
	out := make([]ServiceInfo, 0, len(svcs))
	for _, s := range svcs {
		out = append(out, ServiceInfo{
			Name:       s.Name,
			Namespace:  s.Namespace,
			Type:       string(s.Spec.Type),
			ClusterIP:  serviceClusterIP(s),
			ExternalIP: serviceExternalIP(s),
			Ports:      servicePorts(s),
			CreatedAt:  s.CreationTimestamp.UTC().Format(time.RFC3339),
		})
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].Namespace != out[j].Namespace {
			return out[i].Namespace < out[j].Namespace
		}
		return out[i].Name < out[j].Name
	})
	return out
}

func (w *contextWatcher) ConfigMaps(namespace string) []ConfigMapInfo {
	lister := w.factory.Core().V1().ConfigMaps().Lister()
	var (
		cms []*corev1.ConfigMap
		err error
	)
	if namespace == "" {
		cms, err = lister.List(labels.Everything())
	} else {
		cms, err = lister.ConfigMaps(namespace).List(labels.Everything())
	}
	if err != nil {
		return []ConfigMapInfo{}
	}
	out := make([]ConfigMapInfo, 0, len(cms))
	for _, c := range cms {
		out = append(out, ConfigMapInfo{
			Name:      c.Name,
			Namespace: c.Namespace,
			Keys:      len(c.Data) + len(c.BinaryData),
			CreatedAt: c.CreationTimestamp.UTC().Format(time.RFC3339),
		})
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].Namespace != out[j].Namespace {
			return out[i].Namespace < out[j].Namespace
		}
		return out[i].Name < out[j].Name
	})
	return out
}

func (w *contextWatcher) Secrets(namespace string) []SecretInfo {
	lister := w.factory.Core().V1().Secrets().Lister()
	var (
		secs []*corev1.Secret
		err  error
	)
	if namespace == "" {
		secs, err = lister.List(labels.Everything())
	} else {
		secs, err = lister.Secrets(namespace).List(labels.Everything())
	}
	if err != nil {
		return []SecretInfo{}
	}
	out := make([]SecretInfo, 0, len(secs))
	for _, s := range secs {
		out = append(out, SecretInfo{
			Name:      s.Name,
			Namespace: s.Namespace,
			Type:      string(s.Type),
			Keys:      len(s.Data),
			CreatedAt: s.CreationTimestamp.UTC().Format(time.RFC3339),
		})
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].Namespace != out[j].Namespace {
			return out[i].Namespace < out[j].Namespace
		}
		return out[i].Name < out[j].Name
	})
	return out
}

func (w *contextWatcher) StatefulSets(namespace string) []StatefulSetInfo {
	lister := w.factory.Apps().V1().StatefulSets().Lister()
	var (
		sets []*appsv1.StatefulSet
		err  error
	)
	if namespace == "" {
		sets, err = lister.List(labels.Everything())
	} else {
		sets, err = lister.StatefulSets(namespace).List(labels.Everything())
	}
	if err != nil {
		return []StatefulSetInfo{}
	}
	out := make([]StatefulSetInfo, 0, len(sets))
	for _, s := range sets {
		var desired int32
		if s.Spec.Replicas != nil {
			desired = *s.Spec.Replicas
		}
		images := make([]string, 0, len(s.Spec.Template.Spec.Containers))
		for _, c := range s.Spec.Template.Spec.Containers {
			images = append(images, c.Image)
		}
		out = append(out, StatefulSetInfo{
			Name:      s.Name,
			Namespace: s.Namespace,
			Ready:     fmt.Sprintf("%d/%d", s.Status.ReadyReplicas, desired),
			Service:   s.Spec.ServiceName,
			Images:    strings.Join(images, ", "),
			CreatedAt: s.CreationTimestamp.UTC().Format(time.RFC3339),
		})
	}
	sortByNamespaceName(out, func(i int) (string, string) { return out[i].Namespace, out[i].Name })
	return out
}

func (w *contextWatcher) NetworkPolicies(namespace string) []NetworkPolicyInfo {
	lister := w.factory.Networking().V1().NetworkPolicies().Lister()
	var (
		policies []*networkingv1.NetworkPolicy
		err      error
	)
	if namespace == "" {
		policies, err = lister.List(labels.Everything())
	} else {
		policies, err = lister.NetworkPolicies(namespace).List(labels.Everything())
	}
	if err != nil {
		return []NetworkPolicyInfo{}
	}
	out := make([]NetworkPolicyInfo, 0, len(policies))
	for _, p := range policies {
		types := make([]string, 0, len(p.Spec.PolicyTypes))
		for _, t := range p.Spec.PolicyTypes {
			types = append(types, string(t))
		}
		out = append(out, NetworkPolicyInfo{
			Name:        p.Name,
			Namespace:   p.Namespace,
			PodSelector: formatLabelSelector(&p.Spec.PodSelector),
			PolicyTypes: strings.Join(types, ","),
			CreatedAt:   p.CreationTimestamp.UTC().Format(time.RFC3339),
		})
	}
	sortByNamespaceName(out, func(i int) (string, string) { return out[i].Namespace, out[i].Name })
	return out
}

func (w *contextWatcher) StorageClasses() []StorageClassInfo {
	scs, err := w.factory.Storage().V1().StorageClasses().Lister().List(labels.Everything())
	if err != nil {
		return []StorageClassInfo{}
	}
	out := make([]StorageClassInfo, 0, len(scs))
	for _, s := range scs {
		mode := ""
		if s.VolumeBindingMode != nil {
			mode = string(*s.VolumeBindingMode)
		}
		reclaim := ""
		if s.ReclaimPolicy != nil {
			reclaim = string(*s.ReclaimPolicy)
		}
		allow := false
		if s.AllowVolumeExpansion != nil {
			allow = *s.AllowVolumeExpansion
		}
		isDefault := s.Annotations["storageclass.kubernetes.io/is-default-class"] == "true"
		out = append(out, StorageClassInfo{
			Name:              s.Name,
			Provisioner:       s.Provisioner,
			ReclaimPolicy:     reclaim,
			VolumeBindingMode: mode,
			AllowExpansion:    allow,
			IsDefault:         isDefault,
			CreatedAt:         s.CreationTimestamp.UTC().Format(time.RFC3339),
		})
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Name < out[j].Name })
	return out
}

func (w *contextWatcher) PersistentVolumes() []PersistentVolumeInfo {
	pvs, err := w.factory.Core().V1().PersistentVolumes().Lister().List(labels.Everything())
	if err != nil {
		return []PersistentVolumeInfo{}
	}
	out := make([]PersistentVolumeInfo, 0, len(pvs))
	for _, p := range pvs {
		cap := ""
		if q, ok := p.Spec.Capacity[corev1.ResourceStorage]; ok {
			cap = q.String()
		}
		modes := make([]string, 0, len(p.Spec.AccessModes))
		for _, m := range p.Spec.AccessModes {
			modes = append(modes, string(m))
		}
		claim := ""
		if p.Spec.ClaimRef != nil {
			claim = p.Spec.ClaimRef.Namespace + "/" + p.Spec.ClaimRef.Name
		}
		out = append(out, PersistentVolumeInfo{
			Name:          p.Name,
			Capacity:      cap,
			AccessModes:   strings.Join(modes, ","),
			ReclaimPolicy: string(p.Spec.PersistentVolumeReclaimPolicy),
			Status:        string(p.Status.Phase),
			Claim:         claim,
			StorageClass:  p.Spec.StorageClassName,
			CreatedAt:     p.CreationTimestamp.UTC().Format(time.RFC3339),
		})
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Name < out[j].Name })
	return out
}

func (w *contextWatcher) PersistentVolumeClaims(namespace string) []PersistentVolumeClaimInfo {
	lister := w.factory.Core().V1().PersistentVolumeClaims().Lister()
	var (
		pvcs []*corev1.PersistentVolumeClaim
		err  error
	)
	if namespace == "" {
		pvcs, err = lister.List(labels.Everything())
	} else {
		pvcs, err = lister.PersistentVolumeClaims(namespace).List(labels.Everything())
	}
	if err != nil {
		return []PersistentVolumeClaimInfo{}
	}
	out := make([]PersistentVolumeClaimInfo, 0, len(pvcs))
	for _, p := range pvcs {
		cap := ""
		if q, ok := p.Status.Capacity[corev1.ResourceStorage]; ok {
			cap = q.String()
		} else if q, ok := p.Spec.Resources.Requests[corev1.ResourceStorage]; ok {
			cap = q.String()
		}
		modes := make([]string, 0, len(p.Spec.AccessModes))
		for _, m := range p.Spec.AccessModes {
			modes = append(modes, string(m))
		}
		sc := ""
		if p.Spec.StorageClassName != nil {
			sc = *p.Spec.StorageClassName
		}
		out = append(out, PersistentVolumeClaimInfo{
			Name:         p.Name,
			Namespace:    p.Namespace,
			Status:       string(p.Status.Phase),
			Volume:       p.Spec.VolumeName,
			Capacity:     cap,
			AccessModes:  strings.Join(modes, ","),
			StorageClass: sc,
			CreatedAt:    p.CreationTimestamp.UTC().Format(time.RFC3339),
		})
	}
	sortByNamespaceName(out, func(i int) (string, string) { return out[i].Namespace, out[i].Name })
	return out
}

func (w *contextWatcher) ReplicaSets(namespace string) []ReplicaSetInfo {
	lister := w.factory.Apps().V1().ReplicaSets().Lister()
	var (
		sets []*appsv1.ReplicaSet
		err  error
	)
	if namespace == "" {
		sets, err = lister.List(labels.Everything())
	} else {
		sets, err = lister.ReplicaSets(namespace).List(labels.Everything())
	}
	if err != nil {
		return []ReplicaSetInfo{}
	}
	out := make([]ReplicaSetInfo, 0, len(sets))
	for _, r := range sets {
		var desired int32
		if r.Spec.Replicas != nil {
			desired = *r.Spec.Replicas
		}
		owner := ""
		for _, o := range r.OwnerReferences {
			if o.Controller != nil && *o.Controller {
				owner = o.Kind + "/" + o.Name
				break
			}
		}
		images := make([]string, 0, len(r.Spec.Template.Spec.Containers))
		for _, c := range r.Spec.Template.Spec.Containers {
			images = append(images, c.Image)
		}
		out = append(out, ReplicaSetInfo{
			Name:      r.Name,
			Namespace: r.Namespace,
			Desired:   desired,
			Current:   r.Status.Replicas,
			Ready:     r.Status.ReadyReplicas,
			OwnedBy:   owner,
			Images:    strings.Join(images, ", "),
			CreatedAt: r.CreationTimestamp.UTC().Format(time.RFC3339),
		})
	}
	sortByNamespaceName(out, func(i int) (string, string) { return out[i].Namespace, out[i].Name })
	return out
}

func (w *contextWatcher) DaemonSets(namespace string) []DaemonSetInfo {
	lister := w.factory.Apps().V1().DaemonSets().Lister()
	var (
		sets []*appsv1.DaemonSet
		err  error
	)
	if namespace == "" {
		sets, err = lister.List(labels.Everything())
	} else {
		sets, err = lister.DaemonSets(namespace).List(labels.Everything())
	}
	if err != nil {
		return []DaemonSetInfo{}
	}
	out := make([]DaemonSetInfo, 0, len(sets))
	for _, d := range sets {
		out = append(out, DaemonSetInfo{
			Name:         d.Name,
			Namespace:    d.Namespace,
			Desired:      d.Status.DesiredNumberScheduled,
			Current:      d.Status.CurrentNumberScheduled,
			Ready:        d.Status.NumberReady,
			UpToDate:     d.Status.UpdatedNumberScheduled,
			Available:    d.Status.NumberAvailable,
			NodeSelector: formatNodeSelector(d.Spec.Template.Spec.NodeSelector),
			CreatedAt:    d.CreationTimestamp.UTC().Format(time.RFC3339),
		})
	}
	sortByNamespaceName(out, func(i int) (string, string) { return out[i].Namespace, out[i].Name })
	return out
}

func (w *contextWatcher) Jobs(namespace string) []JobInfo {
	lister := w.factory.Batch().V1().Jobs().Lister()
	var (
		jobs []*batchv1.Job
		err  error
	)
	if namespace == "" {
		jobs, err = lister.List(labels.Everything())
	} else {
		jobs, err = lister.Jobs(namespace).List(labels.Everything())
	}
	if err != nil {
		return []JobInfo{}
	}
	out := make([]JobInfo, 0, len(jobs))
	for _, j := range jobs {
		var desired int32 = 1
		if j.Spec.Completions != nil {
			desired = *j.Spec.Completions
		}
		out = append(out, JobInfo{
			Name:        j.Name,
			Namespace:   j.Namespace,
			Completions: fmt.Sprintf("%d/%d", j.Status.Succeeded, desired),
			Duration:    jobDuration(j),
			Status:      jobStatus(j),
			CreatedAt:   j.CreationTimestamp.UTC().Format(time.RFC3339),
		})
	}
	sortByNamespaceName(out, func(i int) (string, string) { return out[i].Namespace, out[i].Name })
	return out
}

func (w *contextWatcher) CronJobs(namespace string) []CronJobInfo {
	lister := w.factory.Batch().V1().CronJobs().Lister()
	var (
		cjs []*batchv1.CronJob
		err error
	)
	if namespace == "" {
		cjs, err = lister.List(labels.Everything())
	} else {
		cjs, err = lister.CronJobs(namespace).List(labels.Everything())
	}
	if err != nil {
		return []CronJobInfo{}
	}
	out := make([]CronJobInfo, 0, len(cjs))
	for _, c := range cjs {
		suspend := false
		if c.Spec.Suspend != nil {
			suspend = *c.Spec.Suspend
		}
		last := "—"
		if c.Status.LastScheduleTime != nil {
			last = c.Status.LastScheduleTime.UTC().Format(time.RFC3339)
		}
		out = append(out, CronJobInfo{
			Name:         c.Name,
			Namespace:    c.Namespace,
			Schedule:     c.Spec.Schedule,
			Suspend:      suspend,
			Active:       len(c.Status.Active),
			LastSchedule: last,
			CreatedAt:    c.CreationTimestamp.UTC().Format(time.RFC3339),
		})
	}
	sortByNamespaceName(out, func(i int) (string, string) { return out[i].Namespace, out[i].Name })
	return out
}

func (w *contextWatcher) Ingresses(namespace string) []IngressInfo {
	lister := w.factory.Networking().V1().Ingresses().Lister()
	var (
		ings []*networkingv1.Ingress
		err  error
	)
	if namespace == "" {
		ings, err = lister.List(labels.Everything())
	} else {
		ings, err = lister.Ingresses(namespace).List(labels.Everything())
	}
	if err != nil {
		return []IngressInfo{}
	}
	out := make([]IngressInfo, 0, len(ings))
	for _, ing := range ings {
		class := ""
		if ing.Spec.IngressClassName != nil {
			class = *ing.Spec.IngressClassName
		}
		hosts := make([]string, 0, len(ing.Spec.Rules))
		for _, r := range ing.Spec.Rules {
			if r.Host != "" {
				hosts = append(hosts, r.Host)
			}
		}
		addresses := make([]string, 0, len(ing.Status.LoadBalancer.Ingress))
		for _, lb := range ing.Status.LoadBalancer.Ingress {
			if lb.IP != "" {
				addresses = append(addresses, lb.IP)
			} else if lb.Hostname != "" {
				addresses = append(addresses, lb.Hostname)
			}
		}
		ports := "80"
		if len(ing.Spec.TLS) > 0 {
			ports = "80, 443"
		}
		out = append(out, IngressInfo{
			Name:      ing.Name,
			Namespace: ing.Namespace,
			Class:     class,
			Hosts:     strings.Join(hosts, ", "),
			Address:   strings.Join(addresses, ", "),
			Ports:     ports,
			CreatedAt: ing.CreationTimestamp.UTC().Format(time.RFC3339),
		})
	}
	sortByNamespaceName(out, func(i int) (string, string) { return out[i].Namespace, out[i].Name })
	return out
}

func (w *contextWatcher) Nodes() []NodeInfo {
	list, err := w.factory.Core().V1().Nodes().Lister().List(labels.Everything())
	if err != nil {
		return []NodeInfo{}
	}
	out := make([]NodeInfo, 0, len(list))
	for _, n := range list {
		out = append(out, NodeInfo{
			Name:       n.Name,
			Status:     nodeStatus(n),
			Roles:      nodeRoles(n),
			Version:    n.Status.NodeInfo.KubeletVersion,
			OSImage:    n.Status.NodeInfo.OSImage,
			InternalIP: nodeInternalIP(n),
			CreatedAt:  n.CreationTimestamp.UTC().Format(time.RFC3339),
		})
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Name < out[j].Name })
	return out
}

func sortByNamespaceName[T any](slice []T, key func(int) (string, string)) {
	sort.Slice(slice, func(i, j int) bool {
		ni, n := key(i)
		nj, m := key(j)
		if ni != nj {
			return ni < nj
		}
		return n < m
	})
}

func formatLabelSelector(sel *metav1.LabelSelector) string {
	if sel == nil || (len(sel.MatchLabels) == 0 && len(sel.MatchExpressions) == 0) {
		return "<all>"
	}
	parts := make([]string, 0, len(sel.MatchLabels)+len(sel.MatchExpressions))
	for k, v := range sel.MatchLabels {
		parts = append(parts, k+"="+v)
	}
	sort.Strings(parts)
	for _, m := range sel.MatchExpressions {
		parts = append(parts, fmt.Sprintf("%s %s %v", m.Key, m.Operator, m.Values))
	}
	return strings.Join(parts, ",")
}

func formatNodeSelector(sel map[string]string) string {
	if len(sel) == 0 {
		return "<none>"
	}
	parts := make([]string, 0, len(sel))
	for k, v := range sel {
		parts = append(parts, k+"="+v)
	}
	sort.Strings(parts)
	return strings.Join(parts, ",")
}

func jobDuration(j *batchv1.Job) string {
	if j.Status.StartTime == nil {
		return ""
	}
	end := time.Now()
	if j.Status.CompletionTime != nil {
		end = j.Status.CompletionTime.Time
	}
	d := end.Sub(j.Status.StartTime.Time).Round(time.Second)
	return d.String()
}

func jobStatus(j *batchv1.Job) string {
	for _, c := range j.Status.Conditions {
		if c.Status != corev1.ConditionTrue {
			continue
		}
		switch c.Type {
		case batchv1.JobComplete:
			return "Complete"
		case batchv1.JobFailed:
			return "Failed"
		case batchv1.JobSuspended:
			return "Suspended"
		}
	}
	if j.Status.Active > 0 {
		return "Running"
	}
	return "Pending"
}

func nodeStatus(n *corev1.Node) string {
	ready := "Unknown"
	for _, c := range n.Status.Conditions {
		if c.Type == corev1.NodeReady {
			switch c.Status {
			case corev1.ConditionTrue:
				ready = "Ready"
			default:
				ready = "NotReady"
			}
		}
	}
	if n.Spec.Unschedulable {
		ready += ",SchedulingDisabled"
	}
	return ready
}

func nodeRoles(n *corev1.Node) string {
	const prefix = "node-role.kubernetes.io/"
	roles := make([]string, 0)
	for k := range n.Labels {
		if strings.HasPrefix(k, prefix) {
			role := strings.TrimPrefix(k, prefix)
			if role != "" {
				roles = append(roles, role)
			}
		}
	}
	if len(roles) == 0 {
		return "<none>"
	}
	sort.Strings(roles)
	return strings.Join(roles, ",")
}

func nodeInternalIP(n *corev1.Node) string {
	for _, addr := range n.Status.Addresses {
		if addr.Type == corev1.NodeInternalIP {
			return addr.Address
		}
	}
	return ""
}

func serviceClusterIP(s *corev1.Service) string {
	if s.Spec.ClusterIP == "" {
		return "<none>"
	}
	return s.Spec.ClusterIP
}

func serviceExternalIP(s *corev1.Service) string {
	switch s.Spec.Type {
	case corev1.ServiceTypeExternalName:
		return s.Spec.ExternalName
	case corev1.ServiceTypeLoadBalancer:
		ips := make([]string, 0, len(s.Status.LoadBalancer.Ingress))
		for _, ing := range s.Status.LoadBalancer.Ingress {
			if ing.IP != "" {
				ips = append(ips, ing.IP)
			} else if ing.Hostname != "" {
				ips = append(ips, ing.Hostname)
			}
		}
		if len(ips) > 0 {
			return strings.Join(ips, ",")
		}
		return "<pending>"
	}
	if len(s.Spec.ExternalIPs) > 0 {
		return strings.Join(s.Spec.ExternalIPs, ",")
	}
	return "<none>"
}

func servicePorts(s *corev1.Service) string {
	if len(s.Spec.Ports) == 0 {
		return "<none>"
	}
	parts := make([]string, 0, len(s.Spec.Ports))
	for _, p := range s.Spec.Ports {
		if p.NodePort != 0 {
			parts = append(parts, fmt.Sprintf("%d:%d/%s", p.Port, p.NodePort, p.Protocol))
		} else {
			parts = append(parts, fmt.Sprintf("%d/%s", p.Port, p.Protocol))
		}
	}
	return strings.Join(parts, ",")
}

// podResourceTotals sums cpu/mem requests and limits across init+regular
// containers, returning millicores and bytes. A zero result means unset
// for that dimension.
func podResourceTotals(p *corev1.Pod) (cpuReq, cpuLim, memReq, memLim int64) {
	add := func(list []corev1.Container) {
		for _, c := range list {
			if q, ok := c.Resources.Requests[corev1.ResourceCPU]; ok {
				cpuReq += q.MilliValue()
			}
			if q, ok := c.Resources.Limits[corev1.ResourceCPU]; ok {
				cpuLim += q.MilliValue()
			}
			if q, ok := c.Resources.Requests[corev1.ResourceMemory]; ok {
				memReq += q.Value()
			}
			if q, ok := c.Resources.Limits[corev1.ResourceMemory]; ok {
				memLim += q.Value()
			}
		}
	}
	add(p.Spec.Containers)
	return
}

// derivePodStatus mirrors kubectl's STATUS column logic: it walks init
// then regular container states to surface CrashLoopBackOff,
// ImagePullBackOff, ContainerCreating, Completed, OOMKilled, Init:Reason
// etc. instead of the coarse Pod.Status.Phase.
func derivePodStatus(p *corev1.Pod) string {
	if p.DeletionTimestamp != nil {
		return "Terminating"
	}

	for i, init := range p.Status.InitContainerStatuses {
		switch {
		case init.State.Terminated != nil && init.State.Terminated.ExitCode == 0:
			continue
		case init.State.Terminated != nil:
			if init.State.Terminated.Reason != "" {
				return "Init:" + init.State.Terminated.Reason
			}
			if init.State.Terminated.Signal != 0 {
				return fmt.Sprintf("Init:Signal:%d", init.State.Terminated.Signal)
			}
			return fmt.Sprintf("Init:ExitCode:%d", init.State.Terminated.ExitCode)
		case init.State.Waiting != nil && init.State.Waiting.Reason != "" && init.State.Waiting.Reason != "PodInitializing":
			return "Init:" + init.State.Waiting.Reason
		default:
			return fmt.Sprintf("Init:%d/%d", i, len(p.Spec.InitContainers))
		}
	}

	for i := len(p.Status.ContainerStatuses) - 1; i >= 0; i-- {
		c := p.Status.ContainerStatuses[i]
		if c.State.Waiting != nil && c.State.Waiting.Reason != "" {
			return c.State.Waiting.Reason
		}
		if c.State.Terminated != nil {
			if c.State.Terminated.Reason != "" {
				return c.State.Terminated.Reason
			}
			if c.State.Terminated.Signal != 0 {
				return fmt.Sprintf("Signal:%d", c.State.Terminated.Signal)
			}
			return fmt.Sprintf("ExitCode:%d", c.State.Terminated.ExitCode)
		}
	}

	if p.Status.Reason != "" {
		return p.Status.Reason
	}
	return string(p.Status.Phase)
}
