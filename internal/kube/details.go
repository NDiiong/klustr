package kube

import (
	"fmt"
	"sort"
	"time"

	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type ContainerSummary struct {
	Name     string   `json:"name"`
	Image    string   `json:"image"`
	Ports    []string `json:"ports"`
	Command  []string `json:"command"`
	Args     []string `json:"args"`
	EnvCount int      `json:"envCount"`
}

type DeploymentDetail struct {
	Name        string             `json:"name"`
	Namespace   string             `json:"namespace"`
	UID         string             `json:"uid"`
	Strategy    string             `json:"strategy"`
	Replicas    int32              `json:"replicas"`
	Ready       int32              `json:"ready"`
	Updated     int32              `json:"updated"`
	Available   int32              `json:"available"`
	Unavailable int32              `json:"unavailable"`
	Selector    map[string]string  `json:"selector"`
	Containers  []ContainerSummary `json:"containers"`
	Conditions  []ConditionDetail  `json:"conditions"`
	Labels      map[string]string  `json:"labels"`
	Annotations map[string]string  `json:"annotations"`
	CreatedAt   string             `json:"createdAt"`
}

type StatefulSetDetail struct {
	Name                string             `json:"name"`
	Namespace           string             `json:"namespace"`
	UID                 string             `json:"uid"`
	Replicas            int32              `json:"replicas"`
	Ready               int32              `json:"ready"`
	Service             string             `json:"service"`
	UpdateStrategy      string             `json:"updateStrategy"`
	PodManagementPolicy string             `json:"podManagementPolicy"`
	Selector            map[string]string  `json:"selector"`
	Containers          []ContainerSummary `json:"containers"`
	Labels              map[string]string  `json:"labels"`
	Annotations         map[string]string  `json:"annotations"`
	CreatedAt           string             `json:"createdAt"`
}

type PersistentVolumeDetail struct {
	Name          string            `json:"name"`
	UID           string            `json:"uid"`
	Status        string            `json:"status"`
	Capacity      string            `json:"capacity"`
	AccessModes   []string          `json:"accessModes"`
	ReclaimPolicy string            `json:"reclaimPolicy"`
	StorageClass  string            `json:"storageClass"`
	VolumeMode    string            `json:"volumeMode"`
	Claim         string            `json:"claim"`
	Source        string            `json:"source"`
	Message       string            `json:"message"`
	Reason        string            `json:"reason"`
	Labels        map[string]string `json:"labels"`
	Annotations   map[string]string `json:"annotations"`
	CreatedAt     string            `json:"createdAt"`
}

type PersistentVolumeClaimDetail struct {
	Name         string            `json:"name"`
	Namespace    string            `json:"namespace"`
	UID          string            `json:"uid"`
	Status       string            `json:"status"`
	Volume       string            `json:"volume"`
	StorageClass string            `json:"storageClass"`
	VolumeMode   string            `json:"volumeMode"`
	AccessModes  []string          `json:"accessModes"`
	Capacity     string            `json:"capacity"`
	Request      string            `json:"request"`
	Selector     map[string]string `json:"selector"`
	Conditions   []ConditionDetail `json:"conditions"`
	Labels       map[string]string `json:"labels"`
	Annotations  map[string]string `json:"annotations"`
	CreatedAt    string            `json:"createdAt"`
}

type ReplicaSetDetail struct {
	Name        string             `json:"name"`
	Namespace   string             `json:"namespace"`
	UID         string             `json:"uid"`
	Desired     int32              `json:"desired"`
	Current     int32              `json:"current"`
	Ready       int32              `json:"ready"`
	Available   int32              `json:"available"`
	Owners      []OwnerRef         `json:"owners"`
	Selector    map[string]string  `json:"selector"`
	Containers  []ContainerSummary `json:"containers"`
	Conditions  []ConditionDetail  `json:"conditions"`
	Labels      map[string]string  `json:"labels"`
	Annotations map[string]string  `json:"annotations"`
	CreatedAt   string             `json:"createdAt"`
}

type DaemonSetDetail struct {
	Name           string             `json:"name"`
	Namespace      string             `json:"namespace"`
	UID            string             `json:"uid"`
	Desired        int32              `json:"desired"`
	Current        int32              `json:"current"`
	Ready          int32              `json:"ready"`
	UpToDate       int32              `json:"upToDate"`
	Available      int32              `json:"available"`
	Misscheduled   int32              `json:"misscheduled"`
	NodeSelector   map[string]string  `json:"nodeSelector"`
	UpdateStrategy string             `json:"updateStrategy"`
	Selector       map[string]string  `json:"selector"`
	Containers     []ContainerSummary `json:"containers"`
	Labels         map[string]string  `json:"labels"`
	Annotations    map[string]string  `json:"annotations"`
	CreatedAt      string             `json:"createdAt"`
}

type JobDetail struct {
	Name           string             `json:"name"`
	Namespace      string             `json:"namespace"`
	UID            string             `json:"uid"`
	Completions    string             `json:"completions"`
	Parallelism    int32              `json:"parallelism"`
	BackoffLimit   int32              `json:"backoffLimit"`
	Active         int32              `json:"active"`
	Succeeded      int32              `json:"succeeded"`
	Failed         int32              `json:"failed"`
	StartTime      string             `json:"startTime"`
	CompletionTime string             `json:"completionTime"`
	Duration       string             `json:"duration"`
	Status         string             `json:"status"`
	Containers     []ContainerSummary `json:"containers"`
	Labels         map[string]string  `json:"labels"`
	Annotations    map[string]string  `json:"annotations"`
	CreatedAt      string             `json:"createdAt"`
}

type CronJobDetail struct {
	Name                       string             `json:"name"`
	Namespace                  string             `json:"namespace"`
	UID                        string             `json:"uid"`
	Schedule                   string             `json:"schedule"`
	TimeZone                   string             `json:"timeZone"`
	Suspend                    bool               `json:"suspend"`
	ConcurrencyPolicy          string             `json:"concurrencyPolicy"`
	StartingDeadlineSeconds    int64              `json:"startingDeadlineSeconds"`
	SuccessfulJobsHistoryLimit int32              `json:"successfulJobsHistoryLimit"`
	FailedJobsHistoryLimit     int32              `json:"failedJobsHistoryLimit"`
	Active                     int                `json:"active"`
	LastSchedule               string             `json:"lastSchedule"`
	Containers                 []ContainerSummary `json:"containers"`
	Labels                     map[string]string  `json:"labels"`
	Annotations                map[string]string  `json:"annotations"`
	CreatedAt                  string             `json:"createdAt"`
}

type ServicePortDetail struct {
	Name       string `json:"name"`
	Protocol   string `json:"protocol"`
	Port       int32  `json:"port"`
	TargetPort string `json:"targetPort"`
	NodePort   int32  `json:"nodePort"`
}

type ServiceDetail struct {
	Name            string              `json:"name"`
	Namespace       string              `json:"namespace"`
	UID             string              `json:"uid"`
	Type            string              `json:"type"`
	ClusterIPs      []string            `json:"clusterIPs"`
	ExternalIPs     []string            `json:"externalIPs"`
	Selector        map[string]string   `json:"selector"`
	Ports           []ServicePortDetail `json:"ports"`
	SessionAffinity string              `json:"sessionAffinity"`
	Labels          map[string]string   `json:"labels"`
	Annotations     map[string]string   `json:"annotations"`
	CreatedAt       string              `json:"createdAt"`
}

type ConfigMapDetail struct {
	Name        string            `json:"name"`
	Namespace   string            `json:"namespace"`
	UID         string            `json:"uid"`
	Data        map[string]string `json:"data"`
	BinaryKeys  []string          `json:"binaryKeys"`
	Labels      map[string]string `json:"labels"`
	Annotations map[string]string `json:"annotations"`
	CreatedAt   string            `json:"createdAt"`
}

type SecretKeyInfo struct {
	Key  string `json:"key"`
	Size int    `json:"size"`
}

type SecretDetail struct {
	Name        string            `json:"name"`
	Namespace   string            `json:"namespace"`
	UID         string            `json:"uid"`
	Type        string            `json:"type"`
	Keys        []SecretKeyInfo   `json:"keys"`
	Labels      map[string]string `json:"labels"`
	Annotations map[string]string `json:"annotations"`
	CreatedAt   string            `json:"createdAt"`
}

type IngressPathDetail struct {
	Path        string `json:"path"`
	PathType    string `json:"pathType"`
	ServiceName string `json:"serviceName"`
	ServicePort string `json:"servicePort"`
}

type IngressRuleDetail struct {
	Host  string              `json:"host"`
	Paths []IngressPathDetail `json:"paths"`
}

type IngressTLSDetail struct {
	Hosts      []string `json:"hosts"`
	SecretName string   `json:"secretName"`
}

type IngressDetail struct {
	Name        string              `json:"name"`
	Namespace   string              `json:"namespace"`
	UID         string              `json:"uid"`
	Class       string              `json:"class"`
	Rules       []IngressRuleDetail `json:"rules"`
	TLS         []IngressTLSDetail  `json:"tls"`
	Addresses   []string            `json:"addresses"`
	Labels      map[string]string   `json:"labels"`
	Annotations map[string]string   `json:"annotations"`
	CreatedAt   string              `json:"createdAt"`
}

type NodeTaintDetail struct {
	Key    string `json:"key"`
	Value  string `json:"value"`
	Effect string `json:"effect"`
}

type NodeDetail struct {
	Name             string            `json:"name"`
	UID              string            `json:"uid"`
	Status           string            `json:"status"`
	Roles            string            `json:"roles"`
	Version          string            `json:"version"`
	OSImage          string            `json:"osImage"`
	KernelVersion    string            `json:"kernelVersion"`
	ContainerRuntime string            `json:"containerRuntime"`
	Architecture     string            `json:"architecture"`
	InternalIP       string            `json:"internalIP"`
	Hostname         string            `json:"hostname"`
	Capacity         map[string]string `json:"capacity"`
	Allocatable      map[string]string `json:"allocatable"`
	Taints           []NodeTaintDetail `json:"taints"`
	Labels           map[string]string `json:"labels"`
	Annotations      map[string]string `json:"annotations"`
	Conditions       []ConditionDetail `json:"conditions"`
	CreatedAt        string            `json:"createdAt"`
}

type NamespaceDetail struct {
	Name        string            `json:"name"`
	UID         string            `json:"uid"`
	Phase       string            `json:"phase"`
	Labels      map[string]string `json:"labels"`
	Annotations map[string]string `json:"annotations"`
	CreatedAt   string            `json:"createdAt"`
}

// ===== Lister-backed Get methods =====

func (w *contextWatcher) Deployment(namespace, name string) (*DeploymentDetail, error) {
	d, err := w.factory.Apps().V1().Deployments().Lister().Deployments(namespace).Get(name)
	if err != nil {
		return nil, err
	}
	var desired int32
	if d.Spec.Replicas != nil {
		desired = *d.Spec.Replicas
	}
	strategy := string(d.Spec.Strategy.Type)
	if strategy == "" {
		strategy = string(appsv1.RollingUpdateDeploymentStrategyType)
	}
	return &DeploymentDetail{
		Name:        d.Name,
		Namespace:   d.Namespace,
		UID:         string(d.UID),
		Strategy:    strategy,
		Replicas:    desired,
		Ready:       d.Status.ReadyReplicas,
		Updated:     d.Status.UpdatedReplicas,
		Available:   d.Status.AvailableReplicas,
		Unavailable: d.Status.UnavailableReplicas,
		Selector:    matchLabels(d.Spec.Selector),
		Containers:  containerSummaries(d.Spec.Template.Spec.Containers),
		Conditions:  deploymentConditions(d.Status.Conditions),
		Labels:      d.Labels,
		Annotations: d.Annotations,
		CreatedAt:   d.CreationTimestamp.UTC().Format(time.RFC3339),
	}, nil
}

func (w *contextWatcher) StatefulSet(namespace, name string) (*StatefulSetDetail, error) {
	s, err := w.factory.Apps().V1().StatefulSets().Lister().StatefulSets(namespace).Get(name)
	if err != nil {
		return nil, err
	}
	var desired int32
	if s.Spec.Replicas != nil {
		desired = *s.Spec.Replicas
	}
	return &StatefulSetDetail{
		Name:                s.Name,
		Namespace:           s.Namespace,
		UID:                 string(s.UID),
		Replicas:            desired,
		Ready:               s.Status.ReadyReplicas,
		Service:             s.Spec.ServiceName,
		UpdateStrategy:      string(s.Spec.UpdateStrategy.Type),
		PodManagementPolicy: string(s.Spec.PodManagementPolicy),
		Selector:            matchLabels(s.Spec.Selector),
		Containers:          containerSummaries(s.Spec.Template.Spec.Containers),
		Labels:              s.Labels,
		Annotations:         s.Annotations,
		CreatedAt:           s.CreationTimestamp.UTC().Format(time.RFC3339),
	}, nil
}

func (w *contextWatcher) PersistentVolume(name string) (*PersistentVolumeDetail, error) {
	p, err := w.factory.Core().V1().PersistentVolumes().Lister().Get(name)
	if err != nil {
		return nil, err
	}
	modes := make([]string, 0, len(p.Spec.AccessModes))
	for _, m := range p.Spec.AccessModes {
		modes = append(modes, string(m))
	}
	cap := ""
	if q, ok := p.Spec.Capacity[corev1.ResourceStorage]; ok {
		cap = q.String()
	}
	vm := ""
	if p.Spec.VolumeMode != nil {
		vm = string(*p.Spec.VolumeMode)
	}
	claim := ""
	if p.Spec.ClaimRef != nil {
		claim = p.Spec.ClaimRef.Namespace + "/" + p.Spec.ClaimRef.Name
	}
	return &PersistentVolumeDetail{
		Name:          p.Name,
		UID:           string(p.UID),
		Status:        string(p.Status.Phase),
		Capacity:      cap,
		AccessModes:   modes,
		ReclaimPolicy: string(p.Spec.PersistentVolumeReclaimPolicy),
		StorageClass:  p.Spec.StorageClassName,
		VolumeMode:    vm,
		Claim:         claim,
		Source:        pvSource(p),
		Message:       p.Status.Message,
		Reason:        p.Status.Reason,
		Labels:        p.Labels,
		Annotations:   p.Annotations,
		CreatedAt:     p.CreationTimestamp.UTC().Format(time.RFC3339),
	}, nil
}

func pvSource(p *corev1.PersistentVolume) string {
	s := p.Spec.PersistentVolumeSource
	switch {
	case s.HostPath != nil:
		return "HostPath:" + s.HostPath.Path
	case s.NFS != nil:
		return "NFS:" + s.NFS.Server + ":" + s.NFS.Path
	case s.CSI != nil:
		return "CSI:" + s.CSI.Driver
	case s.Local != nil:
		return "Local:" + s.Local.Path
	}
	return ""
}

func (w *contextWatcher) PersistentVolumeClaim(namespace, name string) (*PersistentVolumeClaimDetail, error) {
	p, err := w.factory.Core().V1().PersistentVolumeClaims().Lister().PersistentVolumeClaims(namespace).Get(name)
	if err != nil {
		return nil, err
	}
	modes := make([]string, 0, len(p.Spec.AccessModes))
	for _, m := range p.Spec.AccessModes {
		modes = append(modes, string(m))
	}
	cap := ""
	if q, ok := p.Status.Capacity[corev1.ResourceStorage]; ok {
		cap = q.String()
	}
	req := ""
	if q, ok := p.Spec.Resources.Requests[corev1.ResourceStorage]; ok {
		req = q.String()
	}
	sc := ""
	if p.Spec.StorageClassName != nil {
		sc = *p.Spec.StorageClassName
	}
	vm := ""
	if p.Spec.VolumeMode != nil {
		vm = string(*p.Spec.VolumeMode)
	}
	conds := make([]ConditionDetail, 0, len(p.Status.Conditions))
	for _, c := range p.Status.Conditions {
		conds = append(conds, ConditionDetail{
			Type:    string(c.Type),
			Status:  string(c.Status),
			Reason:  c.Reason,
			Message: c.Message,
		})
	}
	return &PersistentVolumeClaimDetail{
		Name:         p.Name,
		Namespace:    p.Namespace,
		UID:          string(p.UID),
		Status:       string(p.Status.Phase),
		Volume:       p.Spec.VolumeName,
		StorageClass: sc,
		VolumeMode:   vm,
		AccessModes:  modes,
		Capacity:     cap,
		Request:      req,
		Selector:     matchLabels(p.Spec.Selector),
		Conditions:   conds,
		Labels:       p.Labels,
		Annotations:  p.Annotations,
		CreatedAt:    p.CreationTimestamp.UTC().Format(time.RFC3339),
	}, nil
}

func (w *contextWatcher) ReplicaSet(namespace, name string) (*ReplicaSetDetail, error) {
	r, err := w.factory.Apps().V1().ReplicaSets().Lister().ReplicaSets(namespace).Get(name)
	if err != nil {
		return nil, err
	}
	var desired int32
	if r.Spec.Replicas != nil {
		desired = *r.Spec.Replicas
	}
	owners := make([]OwnerRef, 0, len(r.OwnerReferences))
	for _, o := range r.OwnerReferences {
		owners = append(owners, OwnerRef{Kind: o.Kind, Name: o.Name})
	}
	conds := make([]ConditionDetail, 0, len(r.Status.Conditions))
	for _, c := range r.Status.Conditions {
		conds = append(conds, ConditionDetail{
			Type:    string(c.Type),
			Status:  string(c.Status),
			Reason:  c.Reason,
			Message: c.Message,
		})
	}
	return &ReplicaSetDetail{
		Name:        r.Name,
		Namespace:   r.Namespace,
		UID:         string(r.UID),
		Desired:     desired,
		Current:     r.Status.Replicas,
		Ready:       r.Status.ReadyReplicas,
		Available:   r.Status.AvailableReplicas,
		Owners:      owners,
		Selector:    matchLabels(r.Spec.Selector),
		Containers:  containerSummaries(r.Spec.Template.Spec.Containers),
		Conditions:  conds,
		Labels:      r.Labels,
		Annotations: r.Annotations,
		CreatedAt:   r.CreationTimestamp.UTC().Format(time.RFC3339),
	}, nil
}

func (w *contextWatcher) DaemonSet(namespace, name string) (*DaemonSetDetail, error) {
	d, err := w.factory.Apps().V1().DaemonSets().Lister().DaemonSets(namespace).Get(name)
	if err != nil {
		return nil, err
	}
	return &DaemonSetDetail{
		Name:           d.Name,
		Namespace:      d.Namespace,
		UID:            string(d.UID),
		Desired:        d.Status.DesiredNumberScheduled,
		Current:        d.Status.CurrentNumberScheduled,
		Ready:          d.Status.NumberReady,
		UpToDate:       d.Status.UpdatedNumberScheduled,
		Available:      d.Status.NumberAvailable,
		Misscheduled:   d.Status.NumberMisscheduled,
		NodeSelector:   d.Spec.Template.Spec.NodeSelector,
		UpdateStrategy: string(d.Spec.UpdateStrategy.Type),
		Selector:       matchLabels(d.Spec.Selector),
		Containers:     containerSummaries(d.Spec.Template.Spec.Containers),
		Labels:         d.Labels,
		Annotations:    d.Annotations,
		CreatedAt:      d.CreationTimestamp.UTC().Format(time.RFC3339),
	}, nil
}

func (w *contextWatcher) Job(namespace, name string) (*JobDetail, error) {
	j, err := w.factory.Batch().V1().Jobs().Lister().Jobs(namespace).Get(name)
	if err != nil {
		return nil, err
	}
	var desired int32 = 1
	if j.Spec.Completions != nil {
		desired = *j.Spec.Completions
	}
	var parallelism int32 = 1
	if j.Spec.Parallelism != nil {
		parallelism = *j.Spec.Parallelism
	}
	var backoff int32 = 6
	if j.Spec.BackoffLimit != nil {
		backoff = *j.Spec.BackoffLimit
	}
	startTime := ""
	if j.Status.StartTime != nil {
		startTime = j.Status.StartTime.UTC().Format(time.RFC3339)
	}
	completionTime := ""
	if j.Status.CompletionTime != nil {
		completionTime = j.Status.CompletionTime.UTC().Format(time.RFC3339)
	}
	return &JobDetail{
		Name:           j.Name,
		Namespace:      j.Namespace,
		UID:            string(j.UID),
		Completions:    fmt.Sprintf("%d/%d", j.Status.Succeeded, desired),
		Parallelism:    parallelism,
		BackoffLimit:   backoff,
		Active:         j.Status.Active,
		Succeeded:      j.Status.Succeeded,
		Failed:         j.Status.Failed,
		StartTime:      startTime,
		CompletionTime: completionTime,
		Duration:       jobDuration(j),
		Status:         jobStatus(j),
		Containers:     containerSummaries(j.Spec.Template.Spec.Containers),
		Labels:         j.Labels,
		Annotations:    j.Annotations,
		CreatedAt:      j.CreationTimestamp.UTC().Format(time.RFC3339),
	}, nil
}

func (w *contextWatcher) CronJob(namespace, name string) (*CronJobDetail, error) {
	c, err := w.factory.Batch().V1().CronJobs().Lister().CronJobs(namespace).Get(name)
	if err != nil {
		return nil, err
	}
	suspend := false
	if c.Spec.Suspend != nil {
		suspend = *c.Spec.Suspend
	}
	var startingDeadline int64
	if c.Spec.StartingDeadlineSeconds != nil {
		startingDeadline = *c.Spec.StartingDeadlineSeconds
	}
	var successHistory int32 = 3
	if c.Spec.SuccessfulJobsHistoryLimit != nil {
		successHistory = *c.Spec.SuccessfulJobsHistoryLimit
	}
	var failedHistory int32 = 1
	if c.Spec.FailedJobsHistoryLimit != nil {
		failedHistory = *c.Spec.FailedJobsHistoryLimit
	}
	timeZone := ""
	if c.Spec.TimeZone != nil {
		timeZone = *c.Spec.TimeZone
	}
	last := ""
	if c.Status.LastScheduleTime != nil {
		last = c.Status.LastScheduleTime.UTC().Format(time.RFC3339)
	}
	return &CronJobDetail{
		Name:                       c.Name,
		Namespace:                  c.Namespace,
		UID:                        string(c.UID),
		Schedule:                   c.Spec.Schedule,
		TimeZone:                   timeZone,
		Suspend:                    suspend,
		ConcurrencyPolicy:          string(c.Spec.ConcurrencyPolicy),
		StartingDeadlineSeconds:    startingDeadline,
		SuccessfulJobsHistoryLimit: successHistory,
		FailedJobsHistoryLimit:     failedHistory,
		Active:                     len(c.Status.Active),
		LastSchedule:               last,
		Containers:                 containerSummaries(c.Spec.JobTemplate.Spec.Template.Spec.Containers),
		Labels:                     c.Labels,
		Annotations:                c.Annotations,
		CreatedAt:                  c.CreationTimestamp.UTC().Format(time.RFC3339),
	}, nil
}

func (w *contextWatcher) Service(namespace, name string) (*ServiceDetail, error) {
	s, err := w.factory.Core().V1().Services().Lister().Services(namespace).Get(name)
	if err != nil {
		return nil, err
	}
	clusterIPs := s.Spec.ClusterIPs
	if len(clusterIPs) == 0 && s.Spec.ClusterIP != "" {
		clusterIPs = []string{s.Spec.ClusterIP}
	}
	ports := make([]ServicePortDetail, 0, len(s.Spec.Ports))
	for _, p := range s.Spec.Ports {
		ports = append(ports, ServicePortDetail{
			Name:       p.Name,
			Protocol:   string(p.Protocol),
			Port:       p.Port,
			TargetPort: p.TargetPort.String(),
			NodePort:   p.NodePort,
		})
	}
	externalIPs := s.Spec.ExternalIPs
	if s.Spec.Type == corev1.ServiceTypeLoadBalancer {
		for _, ing := range s.Status.LoadBalancer.Ingress {
			if ing.IP != "" {
				externalIPs = append(externalIPs, ing.IP)
			} else if ing.Hostname != "" {
				externalIPs = append(externalIPs, ing.Hostname)
			}
		}
	}
	return &ServiceDetail{
		Name:            s.Name,
		Namespace:       s.Namespace,
		UID:             string(s.UID),
		Type:            string(s.Spec.Type),
		ClusterIPs:      clusterIPs,
		ExternalIPs:     externalIPs,
		Selector:        s.Spec.Selector,
		Ports:           ports,
		SessionAffinity: string(s.Spec.SessionAffinity),
		Labels:          s.Labels,
		Annotations:     s.Annotations,
		CreatedAt:       s.CreationTimestamp.UTC().Format(time.RFC3339),
	}, nil
}

func (w *contextWatcher) ConfigMap(namespace, name string) (*ConfigMapDetail, error) {
	c, err := w.factory.Core().V1().ConfigMaps().Lister().ConfigMaps(namespace).Get(name)
	if err != nil {
		return nil, err
	}
	binaryKeys := make([]string, 0, len(c.BinaryData))
	for k := range c.BinaryData {
		binaryKeys = append(binaryKeys, k)
	}
	sort.Strings(binaryKeys)
	return &ConfigMapDetail{
		Name:        c.Name,
		Namespace:   c.Namespace,
		UID:         string(c.UID),
		Data:        c.Data,
		BinaryKeys:  binaryKeys,
		Labels:      c.Labels,
		Annotations: c.Annotations,
		CreatedAt:   c.CreationTimestamp.UTC().Format(time.RFC3339),
	}, nil
}

func (w *contextWatcher) Secret(namespace, name string) (*SecretDetail, error) {
	s, err := w.factory.Core().V1().Secrets().Lister().Secrets(namespace).Get(name)
	if err != nil {
		return nil, err
	}
	keys := make([]SecretKeyInfo, 0, len(s.Data))
	for k, v := range s.Data {
		keys = append(keys, SecretKeyInfo{Key: k, Size: len(v)})
	}
	sort.Slice(keys, func(i, j int) bool { return keys[i].Key < keys[j].Key })
	return &SecretDetail{
		Name:        s.Name,
		Namespace:   s.Namespace,
		UID:         string(s.UID),
		Type:        string(s.Type),
		Keys:        keys,
		Labels:      s.Labels,
		Annotations: s.Annotations,
		CreatedAt:   s.CreationTimestamp.UTC().Format(time.RFC3339),
	}, nil
}

func (w *contextWatcher) Ingress(namespace, name string) (*IngressDetail, error) {
	ing, err := w.factory.Networking().V1().Ingresses().Lister().Ingresses(namespace).Get(name)
	if err != nil {
		return nil, err
	}
	class := ""
	if ing.Spec.IngressClassName != nil {
		class = *ing.Spec.IngressClassName
	}
	rules := make([]IngressRuleDetail, 0, len(ing.Spec.Rules))
	for _, r := range ing.Spec.Rules {
		paths := []IngressPathDetail{}
		if r.HTTP != nil {
			for _, p := range r.HTTP.Paths {
				svcName := ""
				svcPort := ""
				if p.Backend.Service != nil {
					svcName = p.Backend.Service.Name
					if p.Backend.Service.Port.Number != 0 {
						svcPort = fmt.Sprintf("%d", p.Backend.Service.Port.Number)
					} else {
						svcPort = p.Backend.Service.Port.Name
					}
				}
				pathType := ""
				if p.PathType != nil {
					pathType = string(*p.PathType)
				}
				paths = append(paths, IngressPathDetail{
					Path:        p.Path,
					PathType:    pathType,
					ServiceName: svcName,
					ServicePort: svcPort,
				})
			}
		}
		rules = append(rules, IngressRuleDetail{Host: r.Host, Paths: paths})
	}
	tls := make([]IngressTLSDetail, 0, len(ing.Spec.TLS))
	for _, t := range ing.Spec.TLS {
		tls = append(tls, IngressTLSDetail{Hosts: t.Hosts, SecretName: t.SecretName})
	}
	addresses := make([]string, 0, len(ing.Status.LoadBalancer.Ingress))
	for _, lb := range ing.Status.LoadBalancer.Ingress {
		if lb.IP != "" {
			addresses = append(addresses, lb.IP)
		} else if lb.Hostname != "" {
			addresses = append(addresses, lb.Hostname)
		}
	}
	return &IngressDetail{
		Name:        ing.Name,
		Namespace:   ing.Namespace,
		UID:         string(ing.UID),
		Class:       class,
		Rules:       rules,
		TLS:         tls,
		Addresses:   addresses,
		Labels:      ing.Labels,
		Annotations: ing.Annotations,
		CreatedAt:   ing.CreationTimestamp.UTC().Format(time.RFC3339),
	}, nil
}

func (w *contextWatcher) Node(name string) (*NodeDetail, error) {
	n, err := w.factory.Core().V1().Nodes().Lister().Get(name)
	if err != nil {
		return nil, err
	}
	capacity := quantitiesToStrings(n.Status.Capacity)
	allocatable := quantitiesToStrings(n.Status.Allocatable)
	taints := make([]NodeTaintDetail, 0, len(n.Spec.Taints))
	for _, t := range n.Spec.Taints {
		taints = append(taints, NodeTaintDetail{Key: t.Key, Value: t.Value, Effect: string(t.Effect)})
	}
	hostname := ""
	for _, a := range n.Status.Addresses {
		if a.Type == corev1.NodeHostName {
			hostname = a.Address
			break
		}
	}
	return &NodeDetail{
		Name:             n.Name,
		UID:              string(n.UID),
		Status:           nodeStatus(n),
		Roles:            nodeRoles(n),
		Version:          n.Status.NodeInfo.KubeletVersion,
		OSImage:          n.Status.NodeInfo.OSImage,
		KernelVersion:    n.Status.NodeInfo.KernelVersion,
		ContainerRuntime: n.Status.NodeInfo.ContainerRuntimeVersion,
		Architecture:     n.Status.NodeInfo.Architecture,
		InternalIP:       nodeInternalIP(n),
		Hostname:         hostname,
		Capacity:         capacity,
		Allocatable:      allocatable,
		Taints:           taints,
		Labels:           n.Labels,
		Annotations:      n.Annotations,
		Conditions:       nodeConditions(n.Status.Conditions),
		CreatedAt:        n.CreationTimestamp.UTC().Format(time.RFC3339),
	}, nil
}

func (w *contextWatcher) Namespace(name string) (*NamespaceDetail, error) {
	n, err := w.factory.Core().V1().Namespaces().Lister().Get(name)
	if err != nil {
		return nil, err
	}
	return &NamespaceDetail{
		Name:        n.Name,
		UID:         string(n.UID),
		Phase:       string(n.Status.Phase),
		Labels:      n.Labels,
		Annotations: n.Annotations,
		CreatedAt:   n.CreationTimestamp.UTC().Format(time.RFC3339),
	}, nil
}

// ===== helpers =====

func containerSummaries(specs []corev1.Container) []ContainerSummary {
	out := make([]ContainerSummary, 0, len(specs))
	for _, c := range specs {
		ports := make([]string, 0, len(c.Ports))
		for _, p := range c.Ports {
			proto := string(p.Protocol)
			if proto == "" {
				proto = "TCP"
			}
			ports = append(ports, fmt.Sprintf("%d/%s", p.ContainerPort, proto))
		}
		out = append(out, ContainerSummary{
			Name:     c.Name,
			Image:    c.Image,
			Ports:    ports,
			Command:  append([]string(nil), c.Command...),
			Args:     append([]string(nil), c.Args...),
			EnvCount: len(c.Env) + len(c.EnvFrom),
		})
	}
	return out
}

func matchLabels(sel *metav1.LabelSelector) map[string]string {
	if sel == nil {
		return nil
	}
	return sel.MatchLabels
}

func deploymentConditions(conds []appsv1.DeploymentCondition) []ConditionDetail {
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

func nodeConditions(conds []corev1.NodeCondition) []ConditionDetail {
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

func quantitiesToStrings(m corev1.ResourceList) map[string]string {
	out := make(map[string]string, len(m))
	for k, v := range m {
		out[string(k)] = v.String()
	}
	return out
}

