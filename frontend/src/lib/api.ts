import {
  ListContexts,
  ListDeployments,
  ListNamespaces,
  ListPods,
  PingContext,
  StartWatch,
  StopWatch,
} from '@/lib/wails/wailsjs/go/app/App'
import { kube } from '@/lib/wails/wailsjs/go/models'

export type ContextInfo = kube.ContextInfo
export type Kubeconfig = kube.Kubeconfig
export type ServerVersion = kube.ServerVersion
export type NamespaceInfo = kube.NamespaceInfo
export type PodInfo = kube.PodInfo
export type DeploymentInfo = kube.DeploymentInfo

export const api = {
  listContexts: (): Promise<Kubeconfig> => ListContexts(),
  pingContext: (name: string): Promise<ServerVersion> => PingContext(name),
  startWatch: (name: string): Promise<void> => StartWatch(name),
  stopWatch: (name: string): Promise<void> => StopWatch(name),
  listNamespaces: (name: string): Promise<NamespaceInfo[]> => ListNamespaces(name),
  listPods: (name: string, namespace: string): Promise<PodInfo[]> => ListPods(name, namespace),
  listDeployments: (name: string, namespace: string): Promise<DeploymentInfo[]> =>
    ListDeployments(name, namespace),
}
