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

func (a *App) GetPod(contextName, namespace, name string) (*kube.PodDetail, error) {
	return a.clients.Pod(contextName, namespace, name)
}

func (a *App) ListDeployments(name, namespace string) []kube.DeploymentInfo {
	return a.clients.Deployments(name, namespace)
}

func (a *App) ListServices(name, namespace string) []kube.ServiceInfo {
	return a.clients.Services(name, namespace)
}

func (a *App) ListConfigMaps(name, namespace string) []kube.ConfigMapInfo {
	return a.clients.ConfigMaps(name, namespace)
}

func (a *App) ListSecrets(name, namespace string) []kube.SecretInfo {
	return a.clients.Secrets(name, namespace)
}

func (a *App) ListStatefulSets(name, namespace string) []kube.StatefulSetInfo {
	return a.clients.StatefulSets(name, namespace)
}

func (a *App) ListDaemonSets(name, namespace string) []kube.DaemonSetInfo {
	return a.clients.DaemonSets(name, namespace)
}

func (a *App) ListJobs(name, namespace string) []kube.JobInfo {
	return a.clients.Jobs(name, namespace)
}

func (a *App) ListCronJobs(name, namespace string) []kube.CronJobInfo {
	return a.clients.CronJobs(name, namespace)
}

func (a *App) ListIngresses(name, namespace string) []kube.IngressInfo {
	return a.clients.Ingresses(name, namespace)
}

func (a *App) ListNodes(name string) []kube.NodeInfo {
	return a.clients.Nodes(name)
}
