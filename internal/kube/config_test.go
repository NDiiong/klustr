package kube

import (
	"os"
	"path/filepath"
	"testing"

	"k8s.io/client-go/tools/clientcmd"
)

const sampleKubeconfig = `apiVersion: v1
kind: Config
current-context: prod
contexts:
- name: prod
  context:
    cluster: prod-cluster
    user: prod-user
    namespace: app
- name: dev
  context:
    cluster: dev-cluster
    user: dev-user
clusters:
- name: prod-cluster
  cluster:
    server: https://prod.example
- name: dev-cluster
  cluster:
    server: https://dev.example
users:
- name: prod-user
  user: {}
- name: dev-user
  user: {}
`

func TestLoadRawConfig(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "kubeconfig")
	if err := os.WriteFile(path, []byte(sampleKubeconfig), 0o600); err != nil {
		t.Fatalf("write kubeconfig: %v", err)
	}

	rules := &clientcmd.ClientConfigLoadingRules{ExplicitPath: path}
	kc, err := loadRawConfig(rules)
	if err != nil {
		t.Fatalf("loadRawConfig: %v", err)
	}

	if kc.CurrentContext != "prod" {
		t.Errorf("current context: got %q, want prod", kc.CurrentContext)
	}
	if len(kc.Contexts) != 2 {
		t.Fatalf("expected 2 contexts, got %d", len(kc.Contexts))
	}
	if kc.Contexts[0].Name != "dev" || kc.Contexts[1].Name != "prod" {
		t.Errorf("contexts not sorted: %+v", kc.Contexts)
	}
	prod := kc.Contexts[1]
	if prod.Cluster != "prod-cluster" || prod.Server != "https://prod.example" {
		t.Errorf("prod cluster/server wrong: %+v", prod)
	}
	if prod.User != "prod-user" || prod.Namespace != "app" {
		t.Errorf("prod user/namespace wrong: %+v", prod)
	}
}

func TestLoadRawConfigMissingFile(t *testing.T) {
	rules := &clientcmd.ClientConfigLoadingRules{ExplicitPath: filepath.Join(t.TempDir(), "nope")}
	if _, err := loadRawConfig(rules); err == nil {
		t.Fatal("expected error for missing file")
	}
}
