package kube

import (
	"context"
	"sort"
	"sync"
	"time"

	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/client-go/informers"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/cache"
)

const debounceWindow = 100 * time.Millisecond

type NamespaceInfo struct {
	Name      string `json:"name"`
	Phase     string `json:"phase"`
	CreatedAt string `json:"createdAt"`
}

type ChangeFunc func(kind string)

type contextWatcher struct {
	factory  informers.SharedInformerFactory
	onChange ChangeFunc
	cancel   context.CancelFunc

	mu      sync.Mutex
	pending map[string]struct{}
	timer   *time.Timer
}

func newContextWatcher(cs *kubernetes.Clientset, onChange ChangeFunc) *contextWatcher {
	return &contextWatcher{
		factory:  informers.NewSharedInformerFactory(cs, 0),
		onChange: onChange,
		pending:  make(map[string]struct{}),
	}
}

func (w *contextWatcher) start(parent context.Context) error {
	ctx, cancel := context.WithCancel(parent)
	w.cancel = cancel

	ns := w.factory.Core().V1().Namespaces().Informer()
	if _, err := ns.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc:    func(any) { w.touch("Namespace") },
		UpdateFunc: func(any, any) { w.touch("Namespace") },
		DeleteFunc: func(any) { w.touch("Namespace") },
	}); err != nil {
		cancel()
		return err
	}

	w.factory.Start(ctx.Done())
	go func() {
		w.factory.WaitForCacheSync(ctx.Done())
		w.touch("Namespace")
	}()
	return nil
}

func (w *contextWatcher) stop() {
	if w.cancel != nil {
		w.cancel()
	}
	w.mu.Lock()
	if w.timer != nil {
		w.timer.Stop()
		w.timer = nil
	}
	w.pending = make(map[string]struct{})
	w.mu.Unlock()
}

func (w *contextWatcher) touch(kind string) {
	w.mu.Lock()
	w.pending[kind] = struct{}{}
	if w.timer == nil {
		w.timer = time.AfterFunc(debounceWindow, w.flush)
	}
	w.mu.Unlock()
}

func (w *contextWatcher) flush() {
	w.mu.Lock()
	kinds := make([]string, 0, len(w.pending))
	for k := range w.pending {
		kinds = append(kinds, k)
	}
	w.pending = make(map[string]struct{})
	w.timer = nil
	cb := w.onChange
	w.mu.Unlock()

	if cb == nil {
		return
	}
	for _, k := range kinds {
		cb(k)
	}
}

func (w *contextWatcher) Namespaces() []NamespaceInfo {
	list, err := w.factory.Core().V1().Namespaces().Lister().List(labels.Everything())
	if err != nil {
		return []NamespaceInfo{}
	}
	out := make([]NamespaceInfo, 0, len(list))
	for _, ns := range list {
		out = append(out, NamespaceInfo{
			Name:      ns.Name,
			Phase:     string(ns.Status.Phase),
			CreatedAt: ns.CreationTimestamp.UTC().Format(time.RFC3339),
		})
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Name < out[j].Name })
	return out
}
