package kube

import (
	"testing"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
)

func TestExtractCertManagerCertificate(t *testing.T) {
	obj := &unstructured.Unstructured{Object: map[string]any{
		"metadata": map[string]any{"name": "web-tls", "namespace": "default"},
		"spec": map[string]any{
			"secretName": "web-tls",
			"commonName": "example.com",
			"issuerRef": map[string]any{
				"kind": "ClusterIssuer",
				"name": "letsencrypt-prod",
			},
		},
		"status": map[string]any{
			"notAfter":    "2026-09-01T00:00:00Z",
			"renewalTime": "2026-08-01T00:00:00Z",
			"conditions": []any{
				map[string]any{
					"type":    "Ready",
					"status":  "True",
					"reason":  "Ready",
					"message": "Certificate is up to date and has not expired",
				},
			},
		},
	}}

	got := extractCertManagerCertificate(obj)
	if got.Name != "web-tls" || got.Namespace != "default" {
		t.Errorf("identity wrong: %+v", got)
	}
	if got.Ready != "True" || got.Status != "Certificate is up to date and has not expired" {
		t.Errorf("ready summary wrong: %+v", got)
	}
	if got.SecretName != "web-tls" || got.CommonName != "example.com" {
		t.Errorf("spec fields wrong: %+v", got)
	}
	if got.Issuer != "ClusterIssuer/letsencrypt-prod" {
		t.Errorf("issuerRef wrong: %q", got.Issuer)
	}
	if got.NotAfter != "2026-09-01T00:00:00Z" || got.RenewalTime != "2026-08-01T00:00:00Z" {
		t.Errorf("validity fields wrong: %+v", got)
	}
}

func TestFormatIssuerRefDefaultsToName(t *testing.T) {
	obj := &unstructured.Unstructured{Object: map[string]any{
		"spec": map[string]any{
			"issuerRef": map[string]any{"kind": "Issuer", "name": "ca-issuer"},
		},
	}}
	if got := formatIssuerRef(obj); got != "ca-issuer" {
		t.Errorf("default Issuer kind should be elided: %q", got)
	}

	empty := &unstructured.Unstructured{Object: map[string]any{"spec": map[string]any{}}}
	if got := formatIssuerRef(empty); got != "" {
		t.Errorf("absent issuerRef should be empty: %q", got)
	}
}

func TestExtractCertManagerIssuerType(t *testing.T) {
	obj := &unstructured.Unstructured{Object: map[string]any{
		"metadata": map[string]any{"name": "letsencrypt-prod"},
		"spec": map[string]any{
			"acme": map[string]any{
				"server": "https://acme-v02.api.letsencrypt.org/directory",
				"email":  "ops@example.com",
			},
		},
		"status": map[string]any{
			"conditions": []any{
				map[string]any{"type": "Ready", "status": "True", "reason": "ACMEAccountRegistered"},
			},
		},
	}}

	got := extractCertManagerIssuer(obj)
	if got.Name != "letsencrypt-prod" {
		t.Errorf("identity wrong: %+v", got)
	}
	if got.Type != "acme" {
		t.Errorf("issuer type wrong: %q", got.Type)
	}
	if got.Ready != "True" || got.Status != "ACMEAccountRegistered" {
		t.Errorf("ready summary should fall back to reason: %+v", got)
	}
}

func TestExtractCertManagerConditionsEmpty(t *testing.T) {
	obj := &unstructured.Unstructured{Object: map[string]any{
		"metadata": map[string]any{"name": "bare", "namespace": "default"},
		"spec":     map[string]any{},
	}}
	conds := extractCertManagerConditions(obj)
	if conds == nil {
		t.Fatal("conditions must be a non-nil empty slice for JSON friendliness")
	}
	if len(conds) != 0 {
		t.Errorf("expected no conditions: %+v", conds)
	}
	status, msg := certManagerReady(conds)
	if status != "" || msg != "" {
		t.Errorf("missing Ready condition should produce empty summary: %q %q", status, msg)
	}
}
