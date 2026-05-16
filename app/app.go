package app

import (
	"context"

	"klustr/internal/kube"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const eventKubeChange = "kube:change"

type App struct {
	ctx     context.Context
	clients *kube.ClientManager
}

func New() *App {
	return &App{
		clients: kube.NewClientManager(),
	}
}

func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
	a.clients.SetOnChange(func(c kube.ContextChange) {
		runtime.EventsEmit(ctx, eventKubeChange, c.Context, c.Kind)
	})
}

func (a *App) ListContexts() (*kube.Kubeconfig, error) {
	return a.clients.Kubeconfig()
}

func (a *App) PingContext(name string) (*kube.ServerVersion, error) {
	return a.clients.Ping(a.ctx, name)
}

func (a *App) StartWatch(name string) error {
	return a.clients.Watch(a.ctx, name)
}

func (a *App) StopWatch(name string) {
	a.clients.StopWatch(name)
}

func (a *App) ListNamespaces(name string) []kube.NamespaceInfo {
	return a.clients.Namespaces(name)
}

func (a *App) ListPods(name, namespace string) []kube.PodInfo {
	return a.clients.Pods(name, namespace)
}
