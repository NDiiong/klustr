import {
  ApplyResourceYAML,
  DeleteResource,
  ListEvents,
  ListPodMetrics,
  ListPortForwards,
  PodLogTargets,
  SaveTextFile,
  StartPortForward,
  StopPortForward,
  GetConfigMap,
  GetCronJob,
  GetDaemonSet,
  GetReplicaSet,
  GetPersistentVolumeClaim,
  GetDeployment,
  GetIngress,
  GetJob,
  GetNamespace,
  GetNode,
  GetPod,
  GetResourceYAML,
  GetSecret,
  GetService,
  GetStatefulSet,
  ListConfigMaps,
  ListContexts,
  ListCronJobs,
  ListDaemonSets,
  ListReplicaSets,
  ListPersistentVolumeClaims,
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
  ResizeExec,
  ScaleResource,
  SendExecInput,
  StartExec,
  StartPodLogs,
  StartWatch,
  StopExec,
  StopPodLogs,
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
export type ReplicaSetInfo = kube.ReplicaSetInfo
export type PersistentVolumeClaimInfo = kube.PersistentVolumeClaimInfo
export type JobInfo = kube.JobInfo
export type CronJobInfo = kube.CronJobInfo
export type IngressInfo = kube.IngressInfo
export type NodeInfo = kube.NodeInfo
export type PodDetail = kube.PodDetail
export type ContainerDetail = kube.ContainerDetail
export type ContainerPort = kube.ContainerPort
export type ConditionDetail = kube.ConditionDetail
export type OwnerRef = kube.OwnerRef
export type ContainerSummary = kube.ContainerSummary
export type DeploymentDetail = kube.DeploymentDetail
export type StatefulSetDetail = kube.StatefulSetDetail
export type DaemonSetDetail = kube.DaemonSetDetail
export type ReplicaSetDetail = kube.ReplicaSetDetail
export type PersistentVolumeClaimDetail = kube.PersistentVolumeClaimDetail
export type JobDetail = kube.JobDetail
export type CronJobDetail = kube.CronJobDetail
export type ServiceDetail = kube.ServiceDetail
export type ServicePortDetail = kube.ServicePortDetail
export type ConfigMapDetail = kube.ConfigMapDetail
export type SecretDetail = kube.SecretDetail
export type SecretKeyInfo = kube.SecretKeyInfo
export type IngressDetail = kube.IngressDetail
export type IngressRuleDetail = kube.IngressRuleDetail
export type IngressPathDetail = kube.IngressPathDetail
export type IngressTLSDetail = kube.IngressTLSDetail
export type NodeDetail = kube.NodeDetail
export type NodeTaintDetail = kube.NodeTaintDetail
export type NamespaceDetail = kube.NamespaceDetail
export type PortForwardInfo = kube.PortForwardInfo
export type PodLogTarget = kube.PodLogTarget
export type EventInfo = kube.EventInfo
export type PodMetrics = kube.PodMetrics

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
  listReplicaSets: (name: string, namespace: string): Promise<ReplicaSetInfo[]> =>
    ListReplicaSets(name, namespace),
  listPersistentVolumeClaims: (name: string, namespace: string): Promise<PersistentVolumeClaimInfo[]> =>
    ListPersistentVolumeClaims(name, namespace),
  listJobs: (name: string, namespace: string): Promise<JobInfo[]> => ListJobs(name, namespace),
  listCronJobs: (name: string, namespace: string): Promise<CronJobInfo[]> =>
    ListCronJobs(name, namespace),
  listIngresses: (name: string, namespace: string): Promise<IngressInfo[]> =>
    ListIngresses(name, namespace),
  listNodes: (name: string): Promise<NodeInfo[]> => ListNodes(name),
  getPod: (contextName: string, namespace: string, name: string): Promise<PodDetail> =>
    GetPod(contextName, namespace, name),
  startPodLogs: (
    contextName: string,
    namespace: string,
    podName: string,
    container: string,
    follow: boolean,
    tailLines: number,
  ): Promise<string> =>
    StartPodLogs(contextName, namespace, podName, container, follow, tailLines),
  stopPodLogs: (sessionId: string): Promise<void> => StopPodLogs(sessionId),
  startExec: (
    contextName: string,
    namespace: string,
    podName: string,
    container: string,
    command: string[],
  ): Promise<string> => StartExec(contextName, namespace, podName, container, command),
  sendExecInput: (sessionId: string, data: string): Promise<void> => SendExecInput(sessionId, data),
  resizeExec: (sessionId: string, cols: number, rows: number): Promise<void> =>
    ResizeExec(sessionId, cols, rows),
  stopExec: (sessionId: string): Promise<void> => StopExec(sessionId),
  getDeployment: (ctx: string, ns: string, name: string): Promise<DeploymentDetail> =>
    GetDeployment(ctx, ns, name),
  getStatefulSet: (ctx: string, ns: string, name: string): Promise<StatefulSetDetail> =>
    GetStatefulSet(ctx, ns, name),
  getDaemonSet: (ctx: string, ns: string, name: string): Promise<DaemonSetDetail> =>
    GetDaemonSet(ctx, ns, name),
  getReplicaSet: (ctx: string, ns: string, name: string): Promise<ReplicaSetDetail> =>
    GetReplicaSet(ctx, ns, name),
  getPersistentVolumeClaim: (ctx: string, ns: string, name: string): Promise<PersistentVolumeClaimDetail> =>
    GetPersistentVolumeClaim(ctx, ns, name),
  getJob: (ctx: string, ns: string, name: string): Promise<JobDetail> => GetJob(ctx, ns, name),
  getCronJob: (ctx: string, ns: string, name: string): Promise<CronJobDetail> =>
    GetCronJob(ctx, ns, name),
  getService: (ctx: string, ns: string, name: string): Promise<ServiceDetail> =>
    GetService(ctx, ns, name),
  getConfigMap: (ctx: string, ns: string, name: string): Promise<ConfigMapDetail> =>
    GetConfigMap(ctx, ns, name),
  getSecret: (ctx: string, ns: string, name: string): Promise<SecretDetail> =>
    GetSecret(ctx, ns, name),
  getIngress: (ctx: string, ns: string, name: string): Promise<IngressDetail> =>
    GetIngress(ctx, ns, name),
  getNode: (ctx: string, name: string): Promise<NodeDetail> => GetNode(ctx, name),
  getNamespace: (ctx: string, name: string): Promise<NamespaceDetail> => GetNamespace(ctx, name),
  getResourceYAML: (ctx: string, kind: string, ns: string, name: string): Promise<string> =>
    GetResourceYAML(ctx, kind, ns, name),
  applyResourceYAML: (ctx: string, yamlBody: string): Promise<void> =>
    ApplyResourceYAML(ctx, yamlBody),
  deleteResource: (ctx: string, kind: string, ns: string, name: string): Promise<void> =>
    DeleteResource(ctx, kind, ns, name),
  scaleResource: (ctx: string, kind: string, ns: string, name: string, replicas: number): Promise<void> =>
    ScaleResource(ctx, kind, ns, name, replicas),
  startPortForward: (
    ctx: string,
    namespace: string,
    podName: string,
    localPort: number,
    remotePort: number,
  ): Promise<PortForwardInfo> => StartPortForward(ctx, namespace, podName, localPort, remotePort),
  stopPortForward: (id: string): Promise<void> => StopPortForward(id),
  listPortForwards: (): Promise<PortForwardInfo[]> => ListPortForwards(),
  saveTextFile: (defaultName: string, content: string): Promise<string> =>
    SaveTextFile(defaultName, content),
  podLogTargets: (
    contextName: string,
    namespace: string,
    selector: Record<string, string>,
  ): Promise<PodLogTarget[]> => PodLogTargets(contextName, namespace, selector),
  listEvents: (
    contextName: string,
    namespace: string,
    kind: string,
    name: string,
  ): Promise<EventInfo[]> => ListEvents(contextName, namespace, kind, name),
  listPodMetrics: (contextName: string, namespace: string): Promise<PodMetrics[]> =>
    ListPodMetrics(contextName, namespace),
}
