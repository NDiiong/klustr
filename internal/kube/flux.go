package kube

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/types"
)

// Flux CD CR GVRs as of Flux v2.8.x. Kustomization and GitRepository have
// settled on v1; HelmRelease moved to v2 in Flux 2.3 (v2beta2 is still
// served on older installs but every release Klustr targets exposes v2).
var (
	fluxKustomizationGVR  = schema.GroupVersionResource{Group: "kustomize.toolkit.fluxcd.io", Version: "v1", Resource: "kustomizations"}
	fluxHelmReleaseGVR    = schema.GroupVersionResource{Group: "helm.toolkit.fluxcd.io", Version: "v2", Resource: "helmreleases"}
	fluxGitRepositoryGVR  = schema.GroupVersionResource{Group: "source.toolkit.fluxcd.io", Version: "v1", Resource: "gitrepositories"}
)

// fluxKindGVR maps the Klustr-side Flux kind identifiers (used by the
// frontend / Wails layer) to their canonical GVR. The "Flux" prefix keeps
// the kind names from colliding with the helm v3 HelmRelease detail tab in
// ResourceDetailPanel and disambiguates dispatch in the UI without a
// special-case for every site.
var fluxKindGVR = map[string]schema.GroupVersionResource{
	"FluxKustomization": fluxKustomizationGVR,
	"FluxHelmRelease":   fluxHelmReleaseGVR,
	"FluxGitRepository": fluxGitRepositoryGVR,
}

// fluxReconcileAnnotation is the trigger Flux controllers watch for to
// kick off a manual reconcile (same payload `flux reconcile` writes).
// The value must be a RFC3339Nano timestamp that's strictly greater than
// status.lastHandledReconcileAt or the controller treats it as already
// handled and ignores the change.
const fluxReconcileAnnotation = "reconcile.fluxcd.io/requestedAt"

// FluxCondition is the projection of one entry in .status.conditions that
// every Flux CR exposes (k8s metav1.Condition shape). Reading the Ready
// condition gives the user-facing health summary; the other conditions
// (Stalled, Reconciling) provide context the detail panel surfaces.
type FluxCondition struct {
	Type               string `json:"type"`
	Status             string `json:"status"`
	Reason             string `json:"reason"`
	Message            string `json:"message"`
	LastTransitionTime string `json:"lastTransitionTime"`
}

// ---------------------------------------------------------------------------
// Kustomization
// ---------------------------------------------------------------------------

// FluxKustomizationInfo is the row shape rendered in the Kustomizations list.
// Ready collapses .status.conditions[Ready] into a single label and Status
// carries the matching message so the list cell can show both at a glance.
type FluxKustomizationInfo struct {
	Name                string `json:"name"`
	Namespace           string `json:"namespace"`
	Ready               string `json:"ready"`
	Status              string `json:"status"`
	Suspended           bool   `json:"suspended"`
	Path                string `json:"path"`
	SourceRef           string `json:"sourceRef"`
	Revision            string `json:"revision"`
	LastAppliedRevision string `json:"lastAppliedRevision"`
	Interval            string `json:"interval"`
	CreatedAt           string `json:"createdAt"`
}

// FluxKustomizationDetail extends the row shape with the spec fields the
// detail panel renders alongside the conditions table.
type FluxKustomizationDetail struct {
	FluxKustomizationInfo
	Conditions         []FluxCondition `json:"conditions"`
	Prune              bool            `json:"prune"`
	Force              bool            `json:"force"`
	Wait               bool            `json:"wait"`
	TargetNamespace    string          `json:"targetNamespace"`
	ServiceAccountName string          `json:"serviceAccountName"`
	Timeout            string          `json:"timeout"`
	RetryInterval      string          `json:"retryInterval"`
	DependsOn          []string        `json:"dependsOn"`
}

func (m *ClientManager) ListFluxKustomizations(contextName, namespace string) []FluxKustomizationInfo {
	objs := listCachedCRs(m, contextName, fluxKustomizationGVR, namespace)
	out := make([]FluxKustomizationInfo, 0, len(objs))
	for _, obj := range objs {
		out = append(out, extractFluxKustomization(obj))
	}
	sortFluxRows(out, func(i int) (string, string) { return out[i].Namespace, out[i].Name })
	return out
}

func (m *ClientManager) GetFluxKustomization(ctx context.Context, contextName, namespace, name string) (*FluxKustomizationDetail, error) {
	dyn, err := m.dynamicClient(contextName)
	if err != nil {
		return nil, err
	}
	obj, err := dyn.Resource(fluxKustomizationGVR).Namespace(namespace).Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}
	info := extractFluxKustomization(obj)
	dependsOn, _, _ := unstructured.NestedSlice(obj.Object, "spec", "dependsOn")
	targetNS, _, _ := unstructured.NestedString(obj.Object, "spec", "targetNamespace")
	serviceAccount, _, _ := unstructured.NestedString(obj.Object, "spec", "serviceAccountName")
	prune, _, _ := unstructured.NestedBool(obj.Object, "spec", "prune")
	force, _, _ := unstructured.NestedBool(obj.Object, "spec", "force")
	wait, _, _ := unstructured.NestedBool(obj.Object, "spec", "wait")
	timeout, _, _ := unstructured.NestedString(obj.Object, "spec", "timeout")
	retry, _, _ := unstructured.NestedString(obj.Object, "spec", "retryInterval")
	return &FluxKustomizationDetail{
		FluxKustomizationInfo: info,
		Conditions:            extractFluxConditions(obj),
		Prune:                 prune,
		Force:                 force,
		Wait:                  wait,
		TargetNamespace:       targetNS,
		ServiceAccountName:    serviceAccount,
		Timeout:               timeout,
		RetryInterval:         retry,
		DependsOn:             extractDependsOnRefs(dependsOn),
	}, nil
}

func extractFluxKustomization(obj *unstructured.Unstructured) FluxKustomizationInfo {
	conds := extractFluxConditions(obj)
	readyStatus, readyMsg := readySummary(conds)
	suspended, _, _ := unstructured.NestedBool(obj.Object, "spec", "suspend")
	path, _, _ := unstructured.NestedString(obj.Object, "spec", "path")
	interval, _, _ := unstructured.NestedString(obj.Object, "spec", "interval")
	revision, _, _ := unstructured.NestedString(obj.Object, "status", "lastAttemptedRevision")
	appliedRev, _, _ := unstructured.NestedString(obj.Object, "status", "lastAppliedRevision")
	sourceRef, _, _ := unstructured.NestedMap(obj.Object, "spec", "sourceRef")
	return FluxKustomizationInfo{
		Name:                obj.GetName(),
		Namespace:           obj.GetNamespace(),
		Ready:               readyStatus,
		Status:              readyMsg,
		Suspended:           suspended,
		Path:                path,
		SourceRef:           formatSourceRef(sourceRef, obj.GetNamespace()),
		Revision:            revision,
		LastAppliedRevision: appliedRev,
		Interval:            interval,
		CreatedAt:           obj.GetCreationTimestamp().UTC().Format(time.RFC3339),
	}
}

// ---------------------------------------------------------------------------
// HelmRelease
// ---------------------------------------------------------------------------

// FluxHelmReleaseInfo is the row shape rendered in the Flux HelmReleases
// list. Chart / Version come from .spec.chart.spec for the legacy embedded
// chartTemplate, or .spec.chartRef for the new (Flux 2.3+) OCI/Helm ref.
type FluxHelmReleaseInfo struct {
	Name                string `json:"name"`
	Namespace           string `json:"namespace"`
	Ready               string `json:"ready"`
	Status              string `json:"status"`
	Suspended           bool   `json:"suspended"`
	Chart               string `json:"chart"`
	Version             string `json:"version"`
	SourceRef           string `json:"sourceRef"`
	LastAppliedRevision string `json:"lastAppliedRevision"`
	Interval            string `json:"interval"`
	CreatedAt           string `json:"createdAt"`
}

type FluxHelmReleaseDetail struct {
	FluxHelmReleaseInfo
	Conditions       []FluxCondition `json:"conditions"`
	ReleaseName      string          `json:"releaseName"`
	TargetNamespace  string          `json:"targetNamespace"`
	StorageNamespace string          `json:"storageNamespace"`
	ServiceAccount   string          `json:"serviceAccount"`
	Timeout          string          `json:"timeout"`
	DependsOn        []string        `json:"dependsOn"`
}

func (m *ClientManager) ListFluxHelmReleases(contextName, namespace string) []FluxHelmReleaseInfo {
	objs := listCachedCRs(m, contextName, fluxHelmReleaseGVR, namespace)
	out := make([]FluxHelmReleaseInfo, 0, len(objs))
	for _, obj := range objs {
		out = append(out, extractFluxHelmRelease(obj))
	}
	sortFluxRows(out, func(i int) (string, string) { return out[i].Namespace, out[i].Name })
	return out
}

func (m *ClientManager) GetFluxHelmRelease(ctx context.Context, contextName, namespace, name string) (*FluxHelmReleaseDetail, error) {
	dyn, err := m.dynamicClient(contextName)
	if err != nil {
		return nil, err
	}
	obj, err := dyn.Resource(fluxHelmReleaseGVR).Namespace(namespace).Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}
	info := extractFluxHelmRelease(obj)
	releaseName, _, _ := unstructured.NestedString(obj.Object, "spec", "releaseName")
	targetNS, _, _ := unstructured.NestedString(obj.Object, "spec", "targetNamespace")
	storageNS, _, _ := unstructured.NestedString(obj.Object, "spec", "storageNamespace")
	serviceAccount, _, _ := unstructured.NestedString(obj.Object, "spec", "serviceAccountName")
	timeout, _, _ := unstructured.NestedString(obj.Object, "spec", "timeout")
	dependsOn, _, _ := unstructured.NestedSlice(obj.Object, "spec", "dependsOn")
	return &FluxHelmReleaseDetail{
		FluxHelmReleaseInfo: info,
		Conditions:          extractFluxConditions(obj),
		ReleaseName:         releaseName,
		TargetNamespace:     targetNS,
		StorageNamespace:    storageNS,
		ServiceAccount:      serviceAccount,
		Timeout:             timeout,
		DependsOn:           extractDependsOnRefs(dependsOn),
	}, nil
}

func extractFluxHelmRelease(obj *unstructured.Unstructured) FluxHelmReleaseInfo {
	conds := extractFluxConditions(obj)
	readyStatus, readyMsg := readySummary(conds)
	suspended, _, _ := unstructured.NestedBool(obj.Object, "spec", "suspend")
	interval, _, _ := unstructured.NestedString(obj.Object, "spec", "interval")
	appliedRev, _, _ := unstructured.NestedString(obj.Object, "status", "lastAppliedRevision")
	if appliedRev == "" {
		// Older Flux installs surface this under history[0].
		if hist, found, _ := unstructured.NestedSlice(obj.Object, "status", "history"); found && len(hist) > 0 {
			if h0, ok := hist[0].(map[string]any); ok {
				if r, _ := h0["chartVersion"].(string); r != "" {
					appliedRev = r
				}
			}
		}
	}

	// Chart name + version live in two shapes depending on Flux version:
	//   .spec.chart.spec.chart / .version  (legacy in-place chartTemplate)
	//   .spec.chartRef.name + .spec.chartRef.kind (OCIRepository / HelmChart)
	chart, version, sourceRef := extractHelmReleaseChart(obj)

	return FluxHelmReleaseInfo{
		Name:                obj.GetName(),
		Namespace:           obj.GetNamespace(),
		Ready:               readyStatus,
		Status:              readyMsg,
		Suspended:           suspended,
		Chart:               chart,
		Version:             version,
		SourceRef:           sourceRef,
		LastAppliedRevision: appliedRev,
		Interval:            interval,
		CreatedAt:           obj.GetCreationTimestamp().UTC().Format(time.RFC3339),
	}
}

// extractHelmReleaseChart unpacks the chart name, version, and human source
// reference from a HelmRelease, supporting both the embedded chartTemplate
// and the chartRef (Flux 2.3+) shapes. Empty strings when neither block is
// populated — the caller renders "—" placeholders in that case.
func extractHelmReleaseChart(obj *unstructured.Unstructured) (chart, version, sourceRef string) {
	if chartTemplate, found, _ := unstructured.NestedMap(obj.Object, "spec", "chart", "spec"); found && chartTemplate != nil {
		chart, _ = chartTemplate["chart"].(string)
		version, _ = chartTemplate["version"].(string)
		if sr, ok := chartTemplate["sourceRef"].(map[string]any); ok {
			sourceRef = formatSourceRef(sr, obj.GetNamespace())
		}
		return
	}
	if chartRef, found, _ := unstructured.NestedMap(obj.Object, "spec", "chartRef"); found && chartRef != nil {
		chart, _ = chartRef["name"].(string)
		sourceRef = formatSourceRef(chartRef, obj.GetNamespace())
	}
	return
}

// ---------------------------------------------------------------------------
// GitRepository
// ---------------------------------------------------------------------------

type FluxGitRepositoryInfo struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	Ready     string `json:"ready"`
	Status    string `json:"status"`
	Suspended bool   `json:"suspended"`
	URL       string `json:"url"`
	Ref       string `json:"ref"`
	Revision  string `json:"revision"`
	Interval  string `json:"interval"`
	CreatedAt string `json:"createdAt"`
}

type FluxGitRepositoryDetail struct {
	FluxGitRepositoryInfo
	Conditions     []FluxCondition `json:"conditions"`
	SecretRef      string          `json:"secretRef"`
	Timeout        string          `json:"timeout"`
	IgnorePatterns string          `json:"ignorePatterns"`
	Verification   string          `json:"verification"`
}

func (m *ClientManager) ListFluxGitRepositories(contextName, namespace string) []FluxGitRepositoryInfo {
	objs := listCachedCRs(m, contextName, fluxGitRepositoryGVR, namespace)
	out := make([]FluxGitRepositoryInfo, 0, len(objs))
	for _, obj := range objs {
		out = append(out, extractFluxGitRepository(obj))
	}
	sortFluxRows(out, func(i int) (string, string) { return out[i].Namespace, out[i].Name })
	return out
}

func (m *ClientManager) GetFluxGitRepository(ctx context.Context, contextName, namespace, name string) (*FluxGitRepositoryDetail, error) {
	dyn, err := m.dynamicClient(contextName)
	if err != nil {
		return nil, err
	}
	obj, err := dyn.Resource(fluxGitRepositoryGVR).Namespace(namespace).Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}
	info := extractFluxGitRepository(obj)
	timeout, _, _ := unstructured.NestedString(obj.Object, "spec", "timeout")
	ignore, _, _ := unstructured.NestedString(obj.Object, "spec", "ignore")
	verifyMode, _, _ := unstructured.NestedString(obj.Object, "spec", "verify", "mode")
	secretRef := ""
	if sr, _, _ := unstructured.NestedMap(obj.Object, "spec", "secretRef"); sr != nil {
		secretRef, _ = sr["name"].(string)
	}
	return &FluxGitRepositoryDetail{
		FluxGitRepositoryInfo: info,
		Conditions:            extractFluxConditions(obj),
		SecretRef:             secretRef,
		Timeout:               timeout,
		IgnorePatterns:        ignore,
		Verification:          verifyMode,
	}, nil
}

func extractFluxGitRepository(obj *unstructured.Unstructured) FluxGitRepositoryInfo {
	conds := extractFluxConditions(obj)
	readyStatus, readyMsg := readySummary(conds)
	suspended, _, _ := unstructured.NestedBool(obj.Object, "spec", "suspend")
	url, _, _ := unstructured.NestedString(obj.Object, "spec", "url")
	interval, _, _ := unstructured.NestedString(obj.Object, "spec", "interval")
	revision, _, _ := unstructured.NestedString(obj.Object, "status", "artifact", "revision")
	return FluxGitRepositoryInfo{
		Name:      obj.GetName(),
		Namespace: obj.GetNamespace(),
		Ready:     readyStatus,
		Status:    readyMsg,
		Suspended: suspended,
		URL:       url,
		Ref:       extractGitRef(obj),
		Revision:  revision,
		Interval:  interval,
		CreatedAt: obj.GetCreationTimestamp().UTC().Format(time.RFC3339),
	}
}

// extractGitRef collapses .spec.ref into a single human-readable label.
// Flux accepts branch/tag/semver/commit as alternative one-of fields; the
// CRD doesn't forbid setting more than one, so pick the most specific.
func extractGitRef(obj *unstructured.Unstructured) string {
	ref, _, _ := unstructured.NestedMap(obj.Object, "spec", "ref")
	if ref == nil {
		return ""
	}
	if v, _ := ref["commit"].(string); v != "" {
		return "commit: " + v
	}
	if v, _ := ref["semver"].(string); v != "" {
		return "semver: " + v
	}
	if v, _ := ref["tag"].(string); v != "" {
		return "tag: " + v
	}
	if v, _ := ref["branch"].(string); v != "" {
		return "branch: " + v
	}
	if v, _ := ref["name"].(string); v != "" {
		return "name: " + v
	}
	return ""
}

// ---------------------------------------------------------------------------
// Mutations: Reconcile, Suspend/Resume
// ---------------------------------------------------------------------------

// ReconcileFluxResource flips the reconcile.fluxcd.io/requestedAt annotation
// to a fresh RFC3339Nano timestamp. The Flux controller for this kind picks
// it up on its next sync poll (interval ≤ a few seconds typically) and
// reconciles immediately, the same path `flux reconcile <kind> <name>` uses.
func (m *ClientManager) ReconcileFluxResource(ctx context.Context, contextName, kind, namespace, name string) error {
	gvr, ok := fluxKindGVR[kind]
	if !ok {
		return fmt.Errorf("unsupported flux kind: %q", kind)
	}
	dyn, err := m.dynamicClient(contextName)
	if err != nil {
		return err
	}
	patch := map[string]any{
		"metadata": map[string]any{
			"annotations": map[string]any{
				fluxReconcileAnnotation: time.Now().UTC().Format(time.RFC3339Nano),
			},
		},
	}
	body, err := json.Marshal(patch)
	if err != nil {
		return err
	}
	_, err = dyn.Resource(gvr).Namespace(namespace).Patch(
		ctx, name, types.MergePatchType, body, metav1.PatchOptions{},
	)
	if err != nil {
		return fmt.Errorf("reconcile %s %s/%s: %w", kind, namespace, name, err)
	}
	return nil
}

// SetFluxResourceSuspended toggles .spec.suspend. While suspended, the
// controller leaves the resource alone — useful for taking a managed
// workload offline temporarily without deleting the Flux object.
func (m *ClientManager) SetFluxResourceSuspended(ctx context.Context, contextName, kind, namespace, name string, suspended bool) error {
	gvr, ok := fluxKindGVR[kind]
	if !ok {
		return fmt.Errorf("unsupported flux kind: %q", kind)
	}
	dyn, err := m.dynamicClient(contextName)
	if err != nil {
		return err
	}
	patch := map[string]any{
		"spec": map[string]any{
			"suspend": suspended,
		},
	}
	body, err := json.Marshal(patch)
	if err != nil {
		return err
	}
	_, err = dyn.Resource(gvr).Namespace(namespace).Patch(
		ctx, name, types.MergePatchType, body, metav1.PatchOptions{},
	)
	if err != nil {
		return fmt.Errorf("suspend %s %s/%s: %w", kind, namespace, name, err)
	}
	return nil
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

// listCachedCRs returns the cached CR list for the given GVR. The frontend
// calls api.ensureCustomResourceWatch before any view that lists Flux
// resources, so by the time these methods run the dynamic informer is
// already populated; if not we return an empty slice rather than blocking.
func listCachedCRs(m *ClientManager, contextName string, gvr schema.GroupVersionResource, namespace string) []*unstructured.Unstructured {
	w, ok := m.watcher(contextName)
	if !ok || w.crd == nil {
		return nil
	}
	w.crd.crMu.Lock()
	started := w.crd.crWatches[gvr]
	w.crd.crMu.Unlock()
	if !started {
		return nil
	}
	lister := w.crd.crFactory.ForResource(gvr).Lister()
	var raw []runtime.Object
	var err error
	if namespace == "" {
		raw, err = lister.List(labels.Everything())
	} else {
		raw, err = lister.ByNamespace(namespace).List(labels.Everything())
	}
	if err != nil {
		return nil
	}
	out := make([]*unstructured.Unstructured, 0, len(raw))
	for _, r := range raw {
		if u, ok := r.(*unstructured.Unstructured); ok {
			out = append(out, u)
		}
	}
	return out
}

// sortFluxRows sorts any of the FluxXxxInfo slices by (namespace, name).
// Defined as a generic helper instead of a per-type sort so the list
// methods stay short and consistent.
func sortFluxRows[T any](rows []T, key func(int) (string, string)) {
	sort.Slice(rows, func(i, j int) bool {
		ni, nameI := key(i)
		nj, nameJ := key(j)
		if ni != nj {
			return ni < nj
		}
		return nameI < nameJ
	})
}

// extractFluxConditions reads .status.conditions[] in the metav1.Condition
// shape every Flux CR uses. Returns an empty slice (not nil) so the JSON
// encoder never emits `null` for a missing status block.
func extractFluxConditions(obj *unstructured.Unstructured) []FluxCondition {
	raw, found, _ := unstructured.NestedSlice(obj.Object, "status", "conditions")
	if !found {
		return []FluxCondition{}
	}
	out := make([]FluxCondition, 0, len(raw))
	for _, item := range raw {
		m, ok := item.(map[string]any)
		if !ok {
			continue
		}
		t, _ := m["type"].(string)
		s, _ := m["status"].(string)
		if t == "" || s == "" {
			continue
		}
		reason, _ := m["reason"].(string)
		message, _ := m["message"].(string)
		ts, _ := m["lastTransitionTime"].(string)
		out = append(out, FluxCondition{Type: t, Status: s, Reason: reason, Message: message, LastTransitionTime: ts})
	}
	return out
}

// readySummary returns the (status, message) pair of the Ready condition,
// which Flux conventionally uses as the user-facing health signal. Empty
// strings when there's no Ready condition yet (resource still being
// reconciled the first time).
func readySummary(conds []FluxCondition) (status, message string) {
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

// formatSourceRef collapses a Flux sourceRef block (kind+name, optionally
// namespace) into the "Kind/namespace/name" or "Kind/name" form Klustr
// renders inline. parentNS is the namespace of the owning CR — Flux treats
// sourceRef.namespace as a same-namespace default when omitted.
func formatSourceRef(ref map[string]any, parentNS string) string {
	if ref == nil {
		return ""
	}
	kind, _ := ref["kind"].(string)
	name, _ := ref["name"].(string)
	ns, _ := ref["namespace"].(string)
	if name == "" {
		return ""
	}
	if ns == "" || ns == parentNS {
		if kind == "" {
			return name
		}
		return kind + "/" + name
	}
	if kind == "" {
		return ns + "/" + name
	}
	return kind + "/" + ns + "/" + name
}

// extractDependsOnRefs flattens .spec.dependsOn[] entries (which are
// objects with name + optional namespace) into "namespace/name" strings.
// Returns empty slice (not nil) for JSON friendliness.
func extractDependsOnRefs(raw []any) []string {
	out := make([]string, 0, len(raw))
	for _, item := range raw {
		m, ok := item.(map[string]any)
		if !ok {
			continue
		}
		name, _ := m["name"].(string)
		if name == "" {
			continue
		}
		ns, _ := m["namespace"].(string)
		if ns == "" {
			out = append(out, name)
		} else {
			out = append(out, ns+"/"+name)
		}
	}
	return out
}

