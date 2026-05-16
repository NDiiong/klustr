package kube

import (
	"context"
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

type ClientManager struct {
	mu    sync.Mutex
	rules *clientcmd.ClientConfigLoadingRules
	cache map[string]*kubernetes.Clientset
}

func NewClientManager() *ClientManager {
	return &ClientManager{
		rules: clientcmd.NewDefaultClientConfigLoadingRules(),
		cache: make(map[string]*kubernetes.Clientset),
	}
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

func (m *ClientManager) restConfig(contextName string) (*rest.Config, error) {
	overrides := &clientcmd.ConfigOverrides{CurrentContext: contextName}
	return clientcmd.NewNonInteractiveDeferredLoadingClientConfig(m.rules, overrides).ClientConfig()
}
