package kube

import (
	"context"
	"fmt"
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
)

// cert-manager has served its core kinds at cert-manager.io/v1 since v1.0;
// every release Klustr targets exposes v1, so unlike Istio we pin the version
// rather than resolving it from the discovered CRD. Certificate, Issuer and
// CertificateRequest are namespaced; ClusterIssuer is cluster-scoped.
var (
	certManagerCertificateGVR = schema.GroupVersionResource{Group: "cert-manager.io", Version: "v1", Resource: "certificates"}
	certManagerIssuerGVR      = schema.GroupVersionResource{Group: "cert-manager.io", Version: "v1", Resource: "issuers"}
	certManagerClusterIssuer  = schema.GroupVersionResource{Group: "cert-manager.io", Version: "v1", Resource: "clusterissuers"}
)

// certManagerIssuingReason is the reason Klustr stamps on the Issuing status
// condition when manually triggering re-issuance, mirroring `cmctl renew`.
const certManagerIssuingReason = "ManuallyTriggered"

// CertManagerCondition is the projection of one entry in .status.conditions
// (the metav1.Condition shape every cert-manager resource uses). The Ready
// condition is the user-facing health signal; Issuing tells whether a
// re-issuance is currently in flight.
type CertManagerCondition struct {
	Type               string `json:"type"`
	Status             string `json:"status"`
	Reason             string `json:"reason"`
	Message            string `json:"message"`
	LastTransitionTime string `json:"lastTransitionTime"`
}

// ---------------------------------------------------------------------------
// Certificate
// ---------------------------------------------------------------------------

// CertManagerCertificateInfo is the row shape for the Certificates list.
// NotAfter drives the expiry-countdown column and RenewalTime tells the user
// when cert-manager will rotate it next.
type CertManagerCertificateInfo struct {
	Name        string `json:"name"`
	Namespace   string `json:"namespace"`
	Ready       string `json:"ready"`
	Status      string `json:"status"`
	SecretName  string `json:"secretName"`
	Issuer      string `json:"issuer"`
	CommonName  string `json:"commonName"`
	NotAfter    string `json:"notAfter"`
	RenewalTime string `json:"renewalTime"`
	CreatedAt   string `json:"createdAt"`
}

type CertManagerCertificateDetail struct {
	CertManagerCertificateInfo
	Conditions  []CertManagerCondition `json:"conditions"`
	IssuerKind  string                 `json:"issuerKind"`
	IssuerGroup string                 `json:"issuerGroup"`
	DNSNames    []string               `json:"dnsNames"`
	IPAddresses []string               `json:"ipAddresses"`
	URIs        []string               `json:"uris"`
	Usages      []string               `json:"usages"`
	NotBefore   string                 `json:"notBefore"`
	Duration    string                 `json:"duration"`
	RenewBefore string                 `json:"renewBefore"`
	IsCA        bool                   `json:"isCA"`
}

func (m *ClientManager) ListCertManagerCertificates(contextName, namespace string) []CertManagerCertificateInfo {
	objs := listCachedCRs(m, contextName, certManagerCertificateGVR, namespace)
	out := make([]CertManagerCertificateInfo, 0, len(objs))
	for _, obj := range objs {
		out = append(out, extractCertManagerCertificate(obj))
	}
	sortByNS(out, func(i int) (string, string) { return out[i].Namespace, out[i].Name })
	return out
}

func (m *ClientManager) GetCertManagerCertificate(ctx context.Context, contextName, namespace, name string) (*CertManagerCertificateDetail, error) {
	dyn, err := m.dynamicClient(contextName)
	if err != nil {
		return nil, err
	}
	obj, err := dyn.Resource(certManagerCertificateGVR).Namespace(namespace).Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}
	dnsNames, _, _ := unstructured.NestedStringSlice(obj.Object, "spec", "dnsNames")
	ipAddresses, _, _ := unstructured.NestedStringSlice(obj.Object, "spec", "ipAddresses")
	uris, _, _ := unstructured.NestedStringSlice(obj.Object, "spec", "uris")
	usages, _, _ := unstructured.NestedStringSlice(obj.Object, "spec", "usages")
	notBefore, _, _ := unstructured.NestedString(obj.Object, "status", "notBefore")
	duration, _, _ := unstructured.NestedString(obj.Object, "spec", "duration")
	renewBefore, _, _ := unstructured.NestedString(obj.Object, "spec", "renewBefore")
	isCA, _, _ := unstructured.NestedBool(obj.Object, "spec", "isCA")
	issuerKind, _, _ := unstructured.NestedString(obj.Object, "spec", "issuerRef", "kind")
	issuerGroup, _, _ := unstructured.NestedString(obj.Object, "spec", "issuerRef", "group")
	return &CertManagerCertificateDetail{
		CertManagerCertificateInfo: extractCertManagerCertificate(obj),
		Conditions:                 extractCertManagerConditions(obj),
		IssuerKind:                 issuerKind,
		IssuerGroup:                issuerGroup,
		DNSNames:                   append([]string{}, dnsNames...),
		IPAddresses:                append([]string{}, ipAddresses...),
		URIs:                       append([]string{}, uris...),
		Usages:                     append([]string{}, usages...),
		NotBefore:                  notBefore,
		Duration:                   duration,
		RenewBefore:                renewBefore,
		IsCA:                       isCA,
	}, nil
}

func extractCertManagerCertificate(obj *unstructured.Unstructured) CertManagerCertificateInfo {
	conds := extractCertManagerConditions(obj)
	readyStatus, readyMsg := certManagerReady(conds)
	secretName, _, _ := unstructured.NestedString(obj.Object, "spec", "secretName")
	commonName, _, _ := unstructured.NestedString(obj.Object, "spec", "commonName")
	notAfter, _, _ := unstructured.NestedString(obj.Object, "status", "notAfter")
	renewalTime, _, _ := unstructured.NestedString(obj.Object, "status", "renewalTime")
	return CertManagerCertificateInfo{
		Name:        obj.GetName(),
		Namespace:   obj.GetNamespace(),
		Ready:       readyStatus,
		Status:      readyMsg,
		SecretName:  secretName,
		Issuer:      formatIssuerRef(obj),
		CommonName:  commonName,
		NotAfter:    notAfter,
		RenewalTime: renewalTime,
		CreatedAt:   obj.GetCreationTimestamp().UTC().Format(time.RFC3339),
	}
}

// ---------------------------------------------------------------------------
// Issuer / ClusterIssuer
// ---------------------------------------------------------------------------

// CertManagerIssuerInfo is the row shape shared by both Issuer (namespaced)
// and ClusterIssuer (cluster-scoped). Namespace is empty for ClusterIssuers.
// Type collapses the one-of spec block (acme / ca / selfSigned / vault /
// venafi) into a single scannable column.
type CertManagerIssuerInfo struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	Ready     string `json:"ready"`
	Status    string `json:"status"`
	Type      string `json:"type"`
	CreatedAt string `json:"createdAt"`
}

type CertManagerIssuerDetail struct {
	CertManagerIssuerInfo
	Conditions []CertManagerCondition `json:"conditions"`
	ACMEServer string                 `json:"acmeServer"`
	ACMEEmail  string                 `json:"acmeEmail"`
}

func (m *ClientManager) ListCertManagerIssuers(contextName, namespace string) []CertManagerIssuerInfo {
	return m.listCertManagerIssuers(contextName, certManagerIssuerGVR, namespace)
}

func (m *ClientManager) ListCertManagerClusterIssuers(contextName string) []CertManagerIssuerInfo {
	return m.listCertManagerIssuers(contextName, certManagerClusterIssuer, "")
}

func (m *ClientManager) listCertManagerIssuers(contextName string, gvr schema.GroupVersionResource, namespace string) []CertManagerIssuerInfo {
	objs := listCachedCRs(m, contextName, gvr, namespace)
	out := make([]CertManagerIssuerInfo, 0, len(objs))
	for _, obj := range objs {
		out = append(out, extractCertManagerIssuer(obj))
	}
	sortByNS(out, func(i int) (string, string) { return out[i].Namespace, out[i].Name })
	return out
}

func (m *ClientManager) GetCertManagerIssuer(ctx context.Context, contextName, namespace, name string) (*CertManagerIssuerDetail, error) {
	return m.getCertManagerIssuer(ctx, contextName, certManagerIssuerGVR, namespace, name)
}

func (m *ClientManager) GetCertManagerClusterIssuer(ctx context.Context, contextName, name string) (*CertManagerIssuerDetail, error) {
	return m.getCertManagerIssuer(ctx, contextName, certManagerClusterIssuer, "", name)
}

func (m *ClientManager) getCertManagerIssuer(ctx context.Context, contextName string, gvr schema.GroupVersionResource, namespace, name string) (*CertManagerIssuerDetail, error) {
	dyn, err := m.dynamicClient(contextName)
	if err != nil {
		return nil, err
	}
	ri := dyn.Resource(gvr)
	var obj *unstructured.Unstructured
	if namespace == "" {
		obj, err = ri.Get(ctx, name, metav1.GetOptions{})
	} else {
		obj, err = ri.Namespace(namespace).Get(ctx, name, metav1.GetOptions{})
	}
	if err != nil {
		return nil, err
	}
	acmeServer, _, _ := unstructured.NestedString(obj.Object, "spec", "acme", "server")
	acmeEmail, _, _ := unstructured.NestedString(obj.Object, "spec", "acme", "email")
	return &CertManagerIssuerDetail{
		CertManagerIssuerInfo: extractCertManagerIssuer(obj),
		Conditions:            extractCertManagerConditions(obj),
		ACMEServer:            acmeServer,
		ACMEEmail:             acmeEmail,
	}, nil
}

func extractCertManagerIssuer(obj *unstructured.Unstructured) CertManagerIssuerInfo {
	conds := extractCertManagerConditions(obj)
	readyStatus, readyMsg := certManagerReady(conds)
	return CertManagerIssuerInfo{
		Name:      obj.GetName(),
		Namespace: obj.GetNamespace(),
		Ready:     readyStatus,
		Status:    readyMsg,
		Type:      issuerType(obj),
		CreatedAt: obj.GetCreationTimestamp().UTC().Format(time.RFC3339),
	}
}

// ---------------------------------------------------------------------------
// Renew
// ---------------------------------------------------------------------------

// RenewCertificate triggers a manual re-issuance the same way `cmctl renew`
// does: it sets the Issuing status condition to True. The cert-manager
// certificate-trigger controller observes that and reissues immediately
// rather than waiting for the renewal window. Uses the status subresource so
// the spec is never touched.
func (m *ClientManager) RenewCertificate(ctx context.Context, contextName, namespace, name string) error {
	if err := m.assertWritable(contextName); err != nil {
		return err
	}
	dyn, err := m.dynamicClient(contextName)
	if err != nil {
		return err
	}
	ri := dyn.Resource(certManagerCertificateGVR).Namespace(namespace)
	obj, err := ri.Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		return fmt.Errorf("get certificate %s/%s: %w", namespace, name, err)
	}
	conds, _, _ := unstructured.NestedSlice(obj.Object, "status", "conditions")
	issuing := map[string]any{
		"type":               "Issuing",
		"status":             "True",
		"reason":             certManagerIssuingReason,
		"message":            "Certificate re-issuance manually triggered by Klustr",
		"lastTransitionTime": time.Now().UTC().Format(time.RFC3339),
		"observedGeneration": obj.GetGeneration(),
	}
	replaced := false
	for i, c := range conds {
		cm, ok := c.(map[string]any)
		if !ok {
			continue
		}
		if t, _ := cm["type"].(string); t == "Issuing" {
			conds[i] = issuing
			replaced = true
			break
		}
	}
	if !replaced {
		conds = append(conds, issuing)
	}
	if err := unstructured.SetNestedSlice(obj.Object, conds, "status", "conditions"); err != nil {
		return err
	}
	if _, err := ri.UpdateStatus(ctx, obj, metav1.UpdateOptions{}); err != nil {
		return fmt.Errorf("renew certificate %s/%s: %w", namespace, name, err)
	}
	return nil
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

// extractCertManagerConditions reads .status.conditions[] in the
// metav1.Condition shape. Returns an empty slice (not nil) so the JSON
// encoder never emits null for a resource cert-manager hasn't reconciled yet.
func extractCertManagerConditions(obj *unstructured.Unstructured) []CertManagerCondition {
	raw, found, _ := unstructured.NestedSlice(obj.Object, "status", "conditions")
	if !found {
		return []CertManagerCondition{}
	}
	out := make([]CertManagerCondition, 0, len(raw))
	for _, item := range raw {
		cm, ok := item.(map[string]any)
		if !ok {
			continue
		}
		t, _ := cm["type"].(string)
		s, _ := cm["status"].(string)
		if t == "" || s == "" {
			continue
		}
		reason, _ := cm["reason"].(string)
		message, _ := cm["message"].(string)
		ts, _ := cm["lastTransitionTime"].(string)
		out = append(out, CertManagerCondition{Type: t, Status: s, Reason: reason, Message: message, LastTransitionTime: ts})
	}
	return out
}

// certManagerReady returns the (status, message) of the Ready condition,
// cert-manager's user-facing health signal. Empty strings when the resource
// has no Ready condition yet.
func certManagerReady(conds []CertManagerCondition) (status, message string) {
	for _, c := range conds {
		if c.Type == "Ready" {
			msg := c.Message
			if msg == "" {
				msg = c.Reason
			}
			return c.Status, msg
		}
	}
	return "", ""
}

// formatIssuerRef collapses .spec.issuerRef into "Kind/name" (or just name
// when kind is the default Issuer). Empty when issuerRef is absent.
func formatIssuerRef(obj *unstructured.Unstructured) string {
	name, _, _ := unstructured.NestedString(obj.Object, "spec", "issuerRef", "name")
	if name == "" {
		return ""
	}
	kind, _, _ := unstructured.NestedString(obj.Object, "spec", "issuerRef", "kind")
	if kind == "" || kind == "Issuer" {
		return name
	}
	return kind + "/" + name
}

// issuerType reports which provider block an Issuer/ClusterIssuer spec
// carries. cert-manager's spec is a one-of, so the first present key wins.
func issuerType(obj *unstructured.Unstructured) string {
	spec, found, _ := unstructured.NestedMap(obj.Object, "spec")
	if !found {
		return ""
	}
	for _, t := range []string{"acme", "ca", "vault", "selfSigned", "venafi"} {
		if _, ok := spec[t]; ok {
			return t
		}
	}
	return ""
}
