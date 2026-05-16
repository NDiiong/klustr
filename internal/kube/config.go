package kube

import (
	"sort"

	"k8s.io/client-go/tools/clientcmd"
)

type ContextInfo struct {
	Name      string `json:"name"`
	Cluster   string `json:"cluster"`
	Server    string `json:"server"`
	User      string `json:"user"`
	Namespace string `json:"namespace"`
}

type Kubeconfig struct {
	Contexts       []ContextInfo `json:"contexts"`
	CurrentContext string        `json:"currentContext"`
}

func loadRawConfig(rules *clientcmd.ClientConfigLoadingRules) (*Kubeconfig, error) {
	raw, err := rules.Load()
	if err != nil {
		return nil, err
	}

	contexts := make([]ContextInfo, 0, len(raw.Contexts))
	for name, c := range raw.Contexts {
		var server string
		if cl, ok := raw.Clusters[c.Cluster]; ok {
			server = cl.Server
		}
		contexts = append(contexts, ContextInfo{
			Name:      name,
			Cluster:   c.Cluster,
			Server:    server,
			User:      c.AuthInfo,
			Namespace: c.Namespace,
		})
	}
	sort.Slice(contexts, func(i, j int) bool { return contexts[i].Name < contexts[j].Name })

	return &Kubeconfig{
		Contexts:       contexts,
		CurrentContext: raw.CurrentContext,
	}, nil
}
