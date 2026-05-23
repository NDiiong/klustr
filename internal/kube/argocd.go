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
	"k8s.io/client-go/dynamic"
)

// ArgoApplicationInfo is the row shape the Argo Applications view renders.
// It pulls together fields that live in different sub-paths of the
// Application CR so the frontend doesn't have to.
type ArgoApplicationInfo struct {
	Name           string `json:"name"`
	Namespace      string `json:"namespace"`
	Sync           string `json:"sync"`
	Health         string `json:"health"`
	Revision       string `json:"revision"`
	Project        string `json:"project"`
	RepoURL        string `json:"repoURL"`
	Path           string `json:"path"`
	TargetRevision string `json:"targetRevision"`
	AutoSync       bool   `json:"autoSync"`
	SelfHeal       bool   `json:"selfHeal"`
	Prune          bool   `json:"prune"`
	CreatedAt      string `json:"createdAt"`
}

// ListArgoApplications reads the cached Application CRs (via the same dynamic
// informer the generic CR view uses) and projects each into ArgoApplicationInfo.
// Caller should have started the CR watch first (the frontend does this on
// view mount).
func (m *ClientManager) ListArgoApplications(contextName, namespace string) []ArgoApplicationInfo {
	w, ok := m.watcher(contextName)
	if !ok || w.crd == nil {
		return []ArgoApplicationInfo{}
	}
	w.crd.crMu.Lock()
	started := w.crd.crWatches[argoApplicationGVR]
	w.crd.crMu.Unlock()
	if !started {
		return []ArgoApplicationInfo{}
	}
	lister := w.crd.crFactory.ForResource(argoApplicationGVR).Lister()
	var objs []runtime.Object
	var err error
	if namespace == "" {
		objs, err = lister.List(labels.Everything())
	} else {
		objs, err = lister.ByNamespace(namespace).List(labels.Everything())
	}
	if err != nil {
		return []ArgoApplicationInfo{}
	}
	out := make([]ArgoApplicationInfo, 0, len(objs))
	for _, raw := range objs {
		obj, ok := raw.(*unstructured.Unstructured)
		if !ok {
			continue
		}
		out = append(out, extractArgoApplication(obj))
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].Namespace != out[j].Namespace {
			return out[i].Namespace < out[j].Namespace
		}
		return out[i].Name < out[j].Name
	})
	return out
}

func extractArgoApplication(obj *unstructured.Unstructured) ArgoApplicationInfo {
	syncStatus, _, _ := unstructured.NestedString(obj.Object, "status", "sync", "status")
	health, _, _ := unstructured.NestedString(obj.Object, "status", "health", "status")
	revision, _, _ := unstructured.NestedString(obj.Object, "status", "sync", "revision")
	project, _, _ := unstructured.NestedString(obj.Object, "spec", "project")
	repoURL, _, _ := unstructured.NestedString(obj.Object, "spec", "source", "repoURL")
	path, _, _ := unstructured.NestedString(obj.Object, "spec", "source", "path")
	targetRev, _, _ := unstructured.NestedString(obj.Object, "spec", "source", "targetRevision")
	autoSync, selfHeal, prune := false, false, false
	if automated, found, _ := unstructured.NestedMap(obj.Object, "spec", "syncPolicy", "automated"); found && automated != nil {
		autoSync = true
		if v, ok := automated["selfHeal"].(bool); ok {
			selfHeal = v
		}
		if v, ok := automated["prune"].(bool); ok {
			prune = v
		}
	}
	return ArgoApplicationInfo{
		Name:           obj.GetName(),
		Namespace:      obj.GetNamespace(),
		Sync:           syncStatus,
		Health:         health,
		Revision:       revision,
		Project:        project,
		RepoURL:        repoURL,
		Path:           path,
		TargetRevision: targetRev,
		AutoSync:       autoSync,
		SelfHeal:       selfHeal,
		Prune:          prune,
		CreatedAt:      obj.GetCreationTimestamp().UTC().Format(time.RFC3339),
	}
}

// ArgoApplicationResource describes one managed resource as Argo reports it
// under Application.status.resources. The frontend turns each row into a
// clickable link that opens that resource's detail panel.
type ArgoApplicationResource struct {
	Group     string `json:"group"`
	Version   string `json:"version"`
	Kind      string `json:"kind"`
	Namespace string `json:"namespace"`
	Name      string `json:"name"`
	Sync      string `json:"sync"`
	Health    string `json:"health"`
	Message   string `json:"message"`
}

// argoApplicationGVR is the canonical GVR for argoproj.io/v1alpha1 Applications.
// Argo CD has used the same group + v1alpha1 storage version since 1.0.
var argoApplicationGVR = schema.GroupVersionResource{
	Group:    "argoproj.io",
	Version:  "v1alpha1",
	Resource: "applications",
}

// SyncArgoApplication triggers a sync on an Argo CD Application by writing the
// top-level `operation.sync` field. The Argo application-controller watches
// for `operation` being set, runs the sync, then clears the field once done.
//
// revision is the git ref to sync to ("" → "HEAD" which means the target
// revision currently stored in spec.source.targetRevision).
func (m *ClientManager) SyncArgoApplication(ctx context.Context, contextName, namespace, name, revision string, prune bool) error {
	if revision == "" {
		revision = "HEAD"
	}
	dyn, err := m.dynamicClient(contextName)
	if err != nil {
		return err
	}
	patch := map[string]any{
		"operation": map[string]any{
			"initiatedBy": map[string]any{
				"username":  "klustr",
				"automated": false,
			},
			"sync": map[string]any{
				"revision": revision,
				"prune":    prune,
				"syncStrategy": map[string]any{
					"hook": map[string]any{},
				},
			},
		},
	}
	body, err := json.Marshal(patch)
	if err != nil {
		return err
	}
	_, err = dyn.Resource(argoApplicationGVR).Namespace(namespace).Patch(
		ctx, name, types.MergePatchType, body, metav1.PatchOptions{},
	)
	if err != nil {
		return fmt.Errorf("sync %s/%s: %w", namespace, name, err)
	}
	return nil
}

// ListArgoApplicationResources reads the Application's status.resources slice
// and returns it in a typed form so the frontend can render a table of
// managed resources and let the user drill into each one.
func (m *ClientManager) ListArgoApplicationResources(ctx context.Context, contextName, namespace, name string) ([]ArgoApplicationResource, error) {
	dyn, err := m.dynamicClient(contextName)
	if err != nil {
		return nil, err
	}
	obj, err := dyn.Resource(argoApplicationGVR).Namespace(namespace).Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}
	return extractArgoResources(obj), nil
}

func extractArgoResources(obj *unstructured.Unstructured) []ArgoApplicationResource {
	raw, found, err := unstructured.NestedSlice(obj.Object, "status", "resources")
	if err != nil || !found {
		return []ArgoApplicationResource{}
	}
	out := make([]ArgoApplicationResource, 0, len(raw))
	for _, item := range raw {
		m, ok := item.(map[string]any)
		if !ok {
			continue
		}
		group, _ := m["group"].(string)
		version, _ := m["version"].(string)
		kind, _ := m["kind"].(string)
		ns, _ := m["namespace"].(string)
		name, _ := m["name"].(string)
		status, _ := m["status"].(string)
		var health, message string
		if h, ok := m["health"].(map[string]any); ok {
			health, _ = h["status"].(string)
			message, _ = h["message"].(string)
		}
		if kind == "" || name == "" {
			continue
		}
		out = append(out, ArgoApplicationResource{
			Group:     group,
			Version:   version,
			Kind:      kind,
			Namespace: ns,
			Name:      name,
			Sync:      status,
			Health:    health,
			Message:   message,
		})
	}
	return out
}

// argoResourcesFinalizer is the finalizer Argo CD's application-controller
// watches for. Its presence tells Argo to clean up every resource the
// Application manages before allowing the Application CR itself to be
// removed. Absence means a plain DELETE leaves the managed resources
// orphaned — which is the same trap users hit in the Argo CD UI.
const argoResourcesFinalizer = "resources-finalizer.argocd.argoproj.io"

// DeleteArgoApplication deletes an Argo CD Application with the requested
// cascade behaviour, matching what the Argo CD UI exposes.
//
//   - "foreground"    → add finalizer, DELETE with PropagationForeground
//     (the API server blocks until Argo's cleanup completes; safest).
//   - "background"    → add finalizer, DELETE with PropagationBackground
//     (returns immediately; Argo cleans up asynchronously).
//   - "non-cascading" → strip the finalizer if present, DELETE with
//     PropagationOrphan; the Application CR is removed, the managed
//     resources stay in the cluster.
//
// Empty mode defaults to "foreground" — the safe choice.
func (m *ClientManager) DeleteArgoApplication(ctx context.Context, contextName, namespace, name, cascade string) error {
	dyn, err := m.dynamicClient(contextName)
	if err != nil {
		return err
	}
	resource := dyn.Resource(argoApplicationGVR).Namespace(namespace)

	var propagation metav1.DeletionPropagation
	switch cascade {
	case "", "foreground":
		propagation = metav1.DeletePropagationForeground
		if err := setArgoFinalizer(ctx, resource, name, true); err != nil {
			return err
		}
	case "background":
		propagation = metav1.DeletePropagationBackground
		if err := setArgoFinalizer(ctx, resource, name, true); err != nil {
			return err
		}
	case "non-cascading":
		propagation = metav1.DeletePropagationOrphan
		if err := setArgoFinalizer(ctx, resource, name, false); err != nil {
			return err
		}
	default:
		return fmt.Errorf("invalid cascade mode: %q (want foreground|background|non-cascading)", cascade)
	}

	if err := resource.Delete(ctx, name, metav1.DeleteOptions{PropagationPolicy: &propagation}); err != nil {
		return fmt.Errorf("delete application %s/%s: %w", namespace, name, err)
	}
	return nil
}

// setArgoFinalizer adds or removes argoResourcesFinalizer on the named
// Application. It's a Get → mutate → Update because the unstructured
// dynamic client can't strategic-merge a list field cleanly.
func setArgoFinalizer(ctx context.Context, resource dynamic.ResourceInterface, name string, want bool) error {
	obj, err := resource.Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		return fmt.Errorf("get application %s: %w", name, err)
	}
	finalizers := obj.GetFinalizers()
	has := false
	idx := -1
	for i, f := range finalizers {
		if f == argoResourcesFinalizer {
			has = true
			idx = i
			break
		}
	}
	switch {
	case want && !has:
		obj.SetFinalizers(append(finalizers, argoResourcesFinalizer))
	case !want && has:
		obj.SetFinalizers(append(finalizers[:idx], finalizers[idx+1:]...))
	default:
		return nil
	}
	if _, err := resource.Update(ctx, obj, metav1.UpdateOptions{}); err != nil {
		return fmt.Errorf("update finalizers on %s: %w", name, err)
	}
	return nil
}

// ArgoApplicationHistoryEntry is one row in .status.history[]. Argo records
// every completed deployment here so a rollback can target a known-good
// revision by id rather than by SHA.
type ArgoApplicationHistoryEntry struct {
	ID              int64  `json:"id"`
	Revision        string `json:"revision"`
	DeployedAt      string `json:"deployedAt"`
	DeployStartedAt string `json:"deployStartedAt"`
	RepoURL         string `json:"repoURL"`
	Path            string `json:"path"`
	TargetRevision  string `json:"targetRevision"`
	InitiatedBy     string `json:"initiatedBy"`
	Automated       bool   `json:"automated"`
}

// ListArgoApplicationHistory returns the .status.history[] entries newest-
// first. Empty slice (not nil) when the Application has no history yet.
func (m *ClientManager) ListArgoApplicationHistory(ctx context.Context, contextName, namespace, name string) ([]ArgoApplicationHistoryEntry, error) {
	dyn, err := m.dynamicClient(contextName)
	if err != nil {
		return nil, err
	}
	obj, err := dyn.Resource(argoApplicationGVR).Namespace(namespace).Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}
	raw, found, err := unstructured.NestedSlice(obj.Object, "status", "history")
	if err != nil || !found {
		return []ArgoApplicationHistoryEntry{}, nil
	}
	out := make([]ArgoApplicationHistoryEntry, 0, len(raw))
	for _, item := range raw {
		entry, ok := item.(map[string]any)
		if !ok {
			continue
		}
		out = append(out, extractArgoHistoryEntry(entry))
	}
	sort.Slice(out, func(i, j int) bool { return out[i].ID > out[j].ID })
	return out, nil
}

// argoNumber accepts both float64 (JSON default) and int64 because the
// dynamic client's deserialization may yield either depending on path.
func argoNumber(v any) int64 {
	switch n := v.(type) {
	case int64:
		return n
	case float64:
		return int64(n)
	case int:
		return int64(n)
	}
	return 0
}

func extractArgoHistoryEntry(m map[string]any) ArgoApplicationHistoryEntry {
	id := argoNumber(m["id"])
	revision, _ := m["revision"].(string)
	deployedAt, _ := m["deployedAt"].(string)
	deployStartedAt, _ := m["deployStartedAt"].(string)
	var repoURL, path, targetRev string
	if src, ok := m["source"].(map[string]any); ok {
		repoURL, _ = src["repoURL"].(string)
		path, _ = src["path"].(string)
		targetRev, _ = src["targetRevision"].(string)
	}
	var initiatedBy string
	automated := false
	if ib, ok := m["initiatedBy"].(map[string]any); ok {
		initiatedBy, _ = ib["username"].(string)
		if v, ok := ib["automated"].(bool); ok {
			automated = v
		}
	}
	return ArgoApplicationHistoryEntry{
		ID:              id,
		Revision:        revision,
		DeployedAt:      deployedAt,
		DeployStartedAt: deployStartedAt,
		RepoURL:         repoURL,
		Path:            path,
		TargetRevision:  targetRev,
		InitiatedBy:     initiatedBy,
		Automated:       automated,
	}
}

// RollbackArgoApplication queues a rollback operation referencing the given
// history id. Argo's application-controller picks this up like any other
// operation, restoring the Application to the state recorded in that history
// entry. prune=true also removes resources that were created after that
// history entry (matches `argocd app rollback --prune`).
func (m *ClientManager) RollbackArgoApplication(ctx context.Context, contextName, namespace, name string, id int64, prune bool) error {
	dyn, err := m.dynamicClient(contextName)
	if err != nil {
		return err
	}
	patch := map[string]any{
		"operation": map[string]any{
			"initiatedBy": map[string]any{
				"username":  "klustr",
				"automated": false,
			},
			"rollback": map[string]any{
				"id":    id,
				"prune": prune,
			},
		},
	}
	body, err := json.Marshal(patch)
	if err != nil {
		return err
	}
	_, err = dyn.Resource(argoApplicationGVR).Namespace(namespace).Patch(
		ctx, name, types.MergePatchType, body, metav1.PatchOptions{},
	)
	if err != nil {
		return fmt.Errorf("rollback %s/%s to id=%d: %w", namespace, name, id, err)
	}
	return nil
}

// argoAutomationBackupAnnotation stashes the prior spec.syncPolicy.automated
// block (as JSON) when the user suspends auto-sync from Klustr, so a later
// Resume can restore the exact same flags (selfHeal / prune / etc.) rather
// than guessing defaults.
const argoAutomationBackupAnnotation = "klustr.io/argo-automation-suspended"

// SetArgoApplicationAutomation toggles spec.syncPolicy.automated.
//
// enabled=false (suspend) → snapshots the current automated block into the
// klustr.io/argo-automation-suspended annotation, then removes it from spec.
// enabled=true (resume)   → restores the automated block from that
// annotation (or sets an empty {} if there is no backup), clearing the
// annotation on the way out.
func (m *ClientManager) SetArgoApplicationAutomation(ctx context.Context, contextName, namespace, name string, enabled bool) error {
	dyn, err := m.dynamicClient(contextName)
	if err != nil {
		return err
	}
	resource := dyn.Resource(argoApplicationGVR).Namespace(namespace)
	obj, err := resource.Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		return fmt.Errorf("get application %s/%s: %w", namespace, name, err)
	}

	annotations := obj.GetAnnotations()
	if annotations == nil {
		annotations = map[string]string{}
	}

	if enabled {
		var automated map[string]any
		if raw, ok := annotations[argoAutomationBackupAnnotation]; ok && raw != "" {
			if err := json.Unmarshal([]byte(raw), &automated); err != nil || automated == nil {
				automated = map[string]any{}
			}
			delete(annotations, argoAutomationBackupAnnotation)
			obj.SetAnnotations(annotations)
		} else {
			automated = map[string]any{}
		}
		if err := unstructured.SetNestedField(obj.Object, automated, "spec", "syncPolicy", "automated"); err != nil {
			return fmt.Errorf("set automated: %w", err)
		}
	} else {
		if current, found, _ := unstructured.NestedMap(obj.Object, "spec", "syncPolicy", "automated"); found {
			if data, err := json.Marshal(current); err == nil {
				annotations[argoAutomationBackupAnnotation] = string(data)
				obj.SetAnnotations(annotations)
			}
		}
		unstructured.RemoveNestedField(obj.Object, "spec", "syncPolicy", "automated")
	}

	if _, err := resource.Update(ctx, obj, metav1.UpdateOptions{}); err != nil {
		return fmt.Errorf("update automation on %s/%s: %w", namespace, name, err)
	}
	return nil
}

// RefreshArgoApplication forces Argo to recompute the Application's status
// without running a sync, via the `argocd.argoproj.io/refresh` annotation.
// mode is "normal" or "hard"; empty defaults to "normal".
func (m *ClientManager) RefreshArgoApplication(ctx context.Context, contextName, namespace, name, mode string) error {
	if mode == "" {
		mode = "normal"
	}
	dyn, err := m.dynamicClient(contextName)
	if err != nil {
		return err
	}
	patch := map[string]any{
		"metadata": map[string]any{
			"annotations": map[string]any{
				"argocd.argoproj.io/refresh": mode,
			},
		},
	}
	body, err := json.Marshal(patch)
	if err != nil {
		return err
	}
	_, err = dyn.Resource(argoApplicationGVR).Namespace(namespace).Patch(
		ctx, name, types.MergePatchType, body, metav1.PatchOptions{},
	)
	if err != nil {
		return fmt.Errorf("refresh %s/%s: %w", namespace, name, err)
	}
	return nil
}
