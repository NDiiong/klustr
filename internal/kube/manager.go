package kube

import (
	"context"
	"fmt"
	"sync"
	"time"

	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

const pingTimeout = 5 * time.Second

type ServerVersion struct {
	GitVersion string `json:"gitVersion"`
	Platform   string `json:"platform"`
}

type ContextChange struct {
	Context string
	Kind    string
}

type ClientManager struct {
	mu       sync.Mutex
	rules    *clientcmd.ClientConfigLoadingRules
	cache    map[string]*kubernetes.Clientset
	watchers map[string]*contextWatcher
	logs     *logSessionManager
	onChange func(ContextChange)
}

func NewClientManager() *ClientManager {
	return &ClientManager{
		rules:    clientcmd.NewDefaultClientConfigLoadingRules(),
		cache:    make(map[string]*kubernetes.Clientset),
		watchers: make(map[string]*contextWatcher),
		logs:     newLogSessionManager(),
	}
}

func (m *ClientManager) SetOnChange(cb func(ContextChange)) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.onChange = cb
}

func (m *ClientManager) Kubeconfig() (*Kubeconfig, error) {
	return loadRawConfig(m.rules)
}

func (m *ClientManager) Clientset(contextName string) (*kubernetes.Clientset, error) {
	m.mu.Lock()
	if cs, ok := m.cache[contextName]; ok {
		m.mu.Unlock()
		return cs, nil
	}
	m.mu.Unlock()

	cfg, err := m.restConfig(contextName)
	if err != nil {
		return nil, err
	}
	cs, err := kubernetes.NewForConfig(cfg)
	if err != nil {
		return nil, err
	}

	m.mu.Lock()
	m.cache[contextName] = cs
	m.mu.Unlock()
	return cs, nil
}

func (m *ClientManager) Ping(ctx context.Context, contextName string) (*ServerVersion, error) {
	cfg, err := m.restConfig(contextName)
	if err != nil {
		return nil, err
	}
	cfgCopy := *cfg
	cfgCopy.Timeout = pingTimeout

	cs, err := kubernetes.NewForConfig(&cfgCopy)
	if err != nil {
		return nil, err
	}

	type result struct {
		v   *ServerVersion
		err error
	}
	done := make(chan result, 1)
	go func() {
		info, err := cs.Discovery().ServerVersion()
		if err != nil {
			done <- result{nil, err}
			return
		}
		done <- result{&ServerVersion{GitVersion: info.GitVersion, Platform: info.Platform}, nil}
	}()

	select {
	case r := <-done:
		return r.v, r.err
	case <-ctx.Done():
		return nil, ctx.Err()
	}
}

func (m *ClientManager) Watch(ctx context.Context, contextName string) error {
	cs, err := m.Clientset(contextName)
	if err != nil {
		return err
	}

	m.mu.Lock()
	if existing, ok := m.watchers[contextName]; ok {
		m.mu.Unlock()
		existing.stop()
		m.mu.Lock()
	}
	cb := m.onChange
	m.mu.Unlock()

	w := newContextWatcher(cs, func(kind string) {
		if cb != nil {
			cb(ContextChange{Context: contextName, Kind: kind})
		}
	})
	if err := w.start(ctx); err != nil {
		return err
	}

	m.mu.Lock()
	m.watchers[contextName] = w
	m.mu.Unlock()
	return nil
}

func (m *ClientManager) StopWatch(contextName string) {
	m.mu.Lock()
	w, ok := m.watchers[contextName]
	if ok {
		delete(m.watchers, contextName)
	}
	m.mu.Unlock()
	if ok {
		w.stop()
	}
}

func (m *ClientManager) Namespaces(contextName string) []NamespaceInfo {
	m.mu.Lock()
	w, ok := m.watchers[contextName]
	m.mu.Unlock()
	if !ok {
		return []NamespaceInfo{}
	}
	return w.Namespaces()
}

func (m *ClientManager) Pods(contextName, namespace string) []PodInfo {
	m.mu.Lock()
	w, ok := m.watchers[contextName]
	m.mu.Unlock()
	if !ok {
		return []PodInfo{}
	}
	return w.Pods(namespace)
}

func (m *ClientManager) Pod(contextName, namespace, name string) (*PodDetail, error) {
	m.mu.Lock()
	w, ok := m.watchers[contextName]
	m.mu.Unlock()
	if !ok {
		return nil, fmt.Errorf("no active watch for context %q", contextName)
	}
	return w.Pod(namespace, name)
}

func (m *ClientManager) StartLogs(
	parent context.Context,
	contextName, namespace, podName, container string,
	follow bool,
	tailLines int64,
	onLine LogLineFunc,
	onClose LogCloseFunc,
) (string, error) {
	cs, err := m.Clientset(contextName)
	if err != nil {
		return "", err
	}
	return m.logs.start(parent, cs, namespace, podName, container, follow, tailLines, onLine, onClose)
}

func (m *ClientManager) StopLogs(id string) {
	m.logs.stop(id)
}

func (m *ClientManager) Deployments(contextName, namespace string) []DeploymentInfo {
	m.mu.Lock()
	w, ok := m.watchers[contextName]
	m.mu.Unlock()
	if !ok {
		return []DeploymentInfo{}
	}
	return w.Deployments(namespace)
}

func (m *ClientManager) Services(contextName, namespace string) []ServiceInfo {
	m.mu.Lock()
	w, ok := m.watchers[contextName]
	m.mu.Unlock()
	if !ok {
		return []ServiceInfo{}
	}
	return w.Services(namespace)
}

func (m *ClientManager) ConfigMaps(contextName, namespace string) []ConfigMapInfo {
	m.mu.Lock()
	w, ok := m.watchers[contextName]
	m.mu.Unlock()
	if !ok {
		return []ConfigMapInfo{}
	}
	return w.ConfigMaps(namespace)
}

func (m *ClientManager) Secrets(contextName, namespace string) []SecretInfo {
	m.mu.Lock()
	w, ok := m.watchers[contextName]
	m.mu.Unlock()
	if !ok {
		return []SecretInfo{}
	}
	return w.Secrets(namespace)
}

func (m *ClientManager) StatefulSets(contextName, namespace string) []StatefulSetInfo {
	m.mu.Lock()
	w, ok := m.watchers[contextName]
	m.mu.Unlock()
	if !ok {
		return []StatefulSetInfo{}
	}
	return w.StatefulSets(namespace)
}

func (m *ClientManager) DaemonSets(contextName, namespace string) []DaemonSetInfo {
	m.mu.Lock()
	w, ok := m.watchers[contextName]
	m.mu.Unlock()
	if !ok {
		return []DaemonSetInfo{}
	}
	return w.DaemonSets(namespace)
}

func (m *ClientManager) Jobs(contextName, namespace string) []JobInfo {
	m.mu.Lock()
	w, ok := m.watchers[contextName]
	m.mu.Unlock()
	if !ok {
		return []JobInfo{}
	}
	return w.Jobs(namespace)
}

func (m *ClientManager) CronJobs(contextName, namespace string) []CronJobInfo {
	m.mu.Lock()
	w, ok := m.watchers[contextName]
	m.mu.Unlock()
	if !ok {
		return []CronJobInfo{}
	}
	return w.CronJobs(namespace)
}

func (m *ClientManager) Ingresses(contextName, namespace string) []IngressInfo {
	m.mu.Lock()
	w, ok := m.watchers[contextName]
	m.mu.Unlock()
	if !ok {
		return []IngressInfo{}
	}
	return w.Ingresses(namespace)
}

func (m *ClientManager) Nodes(contextName string) []NodeInfo {
	m.mu.Lock()
	w, ok := m.watchers[contextName]
	m.mu.Unlock()
	if !ok {
		return []NodeInfo{}
	}
	return w.Nodes()
}

func (m *ClientManager) restConfig(contextName string) (*rest.Config, error) {
	overrides := &clientcmd.ConfigOverrides{CurrentContext: contextName}
	return clientcmd.NewNonInteractiveDeferredLoadingClientConfig(m.rules, overrides).ClientConfig()
}
