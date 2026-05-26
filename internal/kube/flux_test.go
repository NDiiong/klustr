package kube

import (
	"testing"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
)

func TestExtractFluxKustomization(t *testing.T) {
	obj := &unstructured.Unstructured{Object: map[string]any{
		"metadata": map[string]any{
			"name":      "podinfo",
			"namespace": "flux-system",
		},
		"spec": map[string]any{
			"path":     "./kustomize",
			"interval": "10m0s",
			"suspend":  true,
			"sourceRef": map[string]any{
				"kind": "GitRepository",
				"name": "podinfo",
			},
		},
		"status": map[string]any{
			"lastAttemptedRevision": "main@sha1:abc",
			"lastAppliedRevision":   "main@sha1:abc",
			"conditions": []any{
				map[string]any{
					"type":    "Ready",
					"status":  "True",
					"reason":  "ReconciliationSucceeded",
					"message": "Applied revision: main@sha1:abc",
				},
			},
		},
	}}

	got := extractFluxKustomization(obj)
	if got.Name != "podinfo" || got.Namespace != "flux-system" {
		t.Errorf("identity wrong: %+v", got)
	}
	if got.Ready != "True" || got.Status != "Applied revision: main@sha1:abc" {
		t.Errorf("ready summary wrong: %+v", got)
	}
	if !got.Suspended {
		t.Errorf("suspend flag not propagated: %+v", got)
	}
	if got.SourceRef != "GitRepository/podinfo" {
		t.Errorf("sourceRef wrong: %q", got.SourceRef)
	}
	if got.Revision != "main@sha1:abc" || got.LastAppliedRevision != "main@sha1:abc" {
		t.Errorf("revision fields wrong: %+v", got)
	}
}

func TestExtractFluxKustomizationDefaults(t *testing.T) {
	obj := &unstructured.Unstructured{Object: map[string]any{
		"metadata": map[string]any{"name": "bare", "namespace": "flux-system"},
		"spec":     map[string]any{},
	}}
	got := extractFluxKustomization(obj)
	if got.Ready != "" || got.Status != "" {
		t.Errorf("missing Ready condition should produce empty ready summary: %+v", got)
	}
	if got.Suspended {
		t.Error("missing suspend should default to false")
	}
}

func TestExtractFluxHelmReleaseChartTemplate(t *testing.T) {
	obj := &unstructured.Unstructured{Object: map[string]any{
		"metadata": map[string]any{"name": "redis", "namespace": "infra"},
		"spec": map[string]any{
			"interval": "5m0s",
			"chart": map[string]any{
				"spec": map[string]any{
					"chart":   "redis",
					"version": "20.0.0",
					"sourceRef": map[string]any{
						"kind":      "HelmRepository",
						"name":      "bitnami",
						"namespace": "flux-system",
					},
				},
			},
		},
		"status": map[string]any{
			"lastAppliedRevision": "20.0.0",
			"conditions": []any{
				map[string]any{"type": "Ready", "status": "False", "reason": "InstallFailed", "message": "values mismatch"},
			},
		},
	}}
	got := extractFluxHelmRelease(obj)
	if got.Chart != "redis" || got.Version != "20.0.0" {
		t.Errorf("chart fields wrong: %+v", got)
	}
	if got.SourceRef != "HelmRepository/flux-system/bitnami" {
		t.Errorf("cross-namespace sourceRef wrong: %q", got.SourceRef)
	}
	if got.Ready != "False" || got.Status != "values mismatch" {
		t.Errorf("ready summary wrong: %+v", got)
	}
}

func TestExtractFluxHelmReleaseChartRef(t *testing.T) {
	obj := &unstructured.Unstructured{Object: map[string]any{
		"metadata": map[string]any{"name": "demo", "namespace": "apps"},
		"spec": map[string]any{
			"chartRef": map[string]any{
				"kind": "OCIRepository",
				"name": "podinfo",
			},
		},
	}}
	got := extractFluxHelmRelease(obj)
	if got.Chart != "podinfo" {
		t.Errorf("chartRef.name should populate Chart: %+v", got)
	}
	if got.SourceRef != "OCIRepository/podinfo" {
		t.Errorf("chartRef sourceRef wrong: %q", got.SourceRef)
	}
}

func TestExtractFluxGitRepositoryRefPrecedence(t *testing.T) {
	cases := []struct {
		name string
		ref  map[string]any
		want string
	}{
		{"commit beats tag", map[string]any{"commit": "deadbeef", "tag": "v1"}, "commit: deadbeef"},
		{"semver beats tag", map[string]any{"semver": ">=1.2", "tag": "v1"}, "semver: >=1.2"},
		{"tag beats branch", map[string]any{"tag": "v1", "branch": "main"}, "tag: v1"},
		{"branch only", map[string]any{"branch": "main"}, "branch: main"},
		{"empty", map[string]any{}, ""},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			obj := &unstructured.Unstructured{Object: map[string]any{
				"spec": map[string]any{"ref": tc.ref},
			}}
			got := extractGitRef(obj)
			if got != tc.want {
				t.Errorf("got %q, want %q", got, tc.want)
			}
		})
	}
}

func TestExtractFluxConditions(t *testing.T) {
	t.Run("missing status returns empty slice not nil", func(t *testing.T) {
		obj := &unstructured.Unstructured{Object: map[string]any{}}
		out := extractFluxConditions(obj)
		if out == nil {
			t.Fatal("should be empty slice not nil")
		}
	})
	t.Run("skips entries without type or status", func(t *testing.T) {
		obj := &unstructured.Unstructured{Object: map[string]any{
			"status": map[string]any{
				"conditions": []any{
					map[string]any{"type": "Ready"},
					map[string]any{"status": "True"},
					map[string]any{"type": "Reconciling", "status": "True", "reason": "Pulling"},
				},
			},
		}}
		out := extractFluxConditions(obj)
		if len(out) != 1 || out[0].Type != "Reconciling" {
			t.Errorf("got %+v", out)
		}
	})
}

func TestFormatSourceRef(t *testing.T) {
	cases := []struct {
		name     string
		ref      map[string]any
		parentNS string
		want     string
	}{
		{"same namespace omitted", map[string]any{"kind": "GitRepository", "name": "podinfo", "namespace": "flux-system"}, "flux-system", "GitRepository/podinfo"},
		{"empty namespace omitted", map[string]any{"kind": "GitRepository", "name": "podinfo"}, "flux-system", "GitRepository/podinfo"},
		{"cross-namespace included", map[string]any{"kind": "HelmRepository", "name": "bitnami", "namespace": "infra"}, "apps", "HelmRepository/infra/bitnami"},
		{"missing kind", map[string]any{"name": "podinfo"}, "flux-system", "podinfo"},
		{"missing name → empty", map[string]any{"kind": "GitRepository"}, "flux-system", ""},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := formatSourceRef(tc.ref, tc.parentNS)
			if got != tc.want {
				t.Errorf("got %q, want %q", got, tc.want)
			}
		})
	}
}

func TestExtractDependsOnRefs(t *testing.T) {
	in := []any{
		map[string]any{"name": "a"},
		map[string]any{"name": "b", "namespace": "infra"},
		map[string]any{"namespace": "infra"}, // skipped: no name
	}
	got := extractDependsOnRefs(in)
	want := []string{"a", "infra/b"}
	if len(got) != len(want) {
		t.Fatalf("got %d, want %d (%+v)", len(got), len(want), got)
	}
	for i, w := range want {
		if got[i] != w {
			t.Errorf("[%d] got %q, want %q", i, got[i], w)
		}
	}
}
