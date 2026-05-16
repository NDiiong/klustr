import {
  ListConfigMaps,
  ListContexts,
  ListCronJobs,
  ListDaemonSets,
  ListDeployments,
  ListIngresses,
  ListJobs,
  ListNamespaces,
  ListNodes,
  ListPods,
  ListSecrets,
  ListServices,
  ListStatefulSets,
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
export type ServiceInfo = kube.ServiceInfo
export type ConfigMapInfo = kube.ConfigMapInfo
export type SecretInfo = kube.SecretInfo
export type StatefulSetInfo = kube.StatefulSetInfo
export type DaemonSetInfo = kube.DaemonSetInfo
export type JobInfo = kube.JobInfo
export type CronJobInfo = kube.CronJobInfo
export type IngressInfo = kube.IngressInfo
export type NodeInfo = kube.NodeInfo

export const api = {
  listContexts: (): Promise<Kubeconfig> => ListContexts(),
  pingContext: (name: string): Promise<ServerVersion> => PingContext(name),
  startWatch: (name: string): Promise<void> => StartWatch(name),
  stopWatch: (name: string): Promise<void> => StopWatch(name),
  listNamespaces: (name: string): Promise<NamespaceInfo[]> => ListNamespaces(name),
  listPods: (name: string, namespace: string): Promise<PodInfo[]> => ListPods(name, namespace),
  listDeployments: (name: string, namespace: string): Promise<DeploymentInfo[]> =>
    ListDeployments(name, namespace),
  listServices: (name: string, namespace: string): Promise<ServiceInfo[]> =>
    ListServices(name, namespace),
  listConfigMaps: (name: string, namespace: string): Promise<ConfigMapInfo[]> =>
    ListConfigMaps(name, namespace),
  listSecrets: (name: string, namespace: string): Promise<SecretInfo[]> =>
    ListSecrets(name, namespace),
  listStatefulSets: (name: string, namespace: string): Promise<StatefulSetInfo[]> =>
    ListStatefulSets(name, namespace),
  listDaemonSets: (name: string, namespace: string): Promise<DaemonSetInfo[]> =>
    ListDaemonSets(name, namespace),
  listJobs: (name: string, namespace: string): Promise<JobInfo[]> => ListJobs(name, namespace),
  listCronJobs: (name: string, namespace: string): Promise<CronJobInfo[]> =>
    ListCronJobs(name, namespace),
  listIngresses: (name: string, namespace: string): Promise<IngressInfo[]> =>
    ListIngresses(name, namespace),
  listNodes: (name: string): Promise<NodeInfo[]> => ListNodes(name),
}
