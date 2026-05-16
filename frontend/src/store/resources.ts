import { create } from 'zustand'
import type {
  ConfigMapInfo,
  CronJobInfo,
  DaemonSetInfo,
  ReplicaSetInfo,
  PersistentVolumeClaimInfo,
  PersistentVolumeInfo,
  StorageClassInfo,
  NetworkPolicyInfo,
  HorizontalPodAutoscalerInfo,
  PodDisruptionBudgetInfo,
  EndpointSliceInfo,
  ResourceQuotaInfo,
  LimitRangeInfo,
  IngressClassInfo,
  PriorityClassInfo,
  RuntimeClassInfo,
  LeaseInfo,
  WebhookConfigurationInfo,
  EndpointsInfo,
  ReplicationControllerInfo,
  DeploymentInfo,
  IngressInfo,
  JobInfo,
  NamespaceInfo,
  NodeInfo,
  PodInfo,
  SecretInfo,
  ServiceInfo,
  StatefulSetInfo,
} from '@/lib/api'

type ResourcesState = {
  namespaces: NamespaceInfo[]
  pods: PodInfo[]
  deployments: DeploymentInfo[]
  services: ServiceInfo[]
  configMaps: ConfigMapInfo[]
  secrets: SecretInfo[]
  statefulSets: StatefulSetInfo[]
  daemonSets: DaemonSetInfo[]
  replicaSets: ReplicaSetInfo[]
  persistentVolumeClaims: PersistentVolumeClaimInfo[]
  persistentVolumes: PersistentVolumeInfo[]
  storageClasses: StorageClassInfo[]
  networkPolicies: NetworkPolicyInfo[]
  horizontalPodAutoscalers: HorizontalPodAutoscalerInfo[]
  podDisruptionBudgets: PodDisruptionBudgetInfo[]
  endpointSlices: EndpointSliceInfo[]
  resourceQuotas: ResourceQuotaInfo[]
  limitRanges: LimitRangeInfo[]
  ingressClasses: IngressClassInfo[]
  priorityClasses: PriorityClassInfo[]
  runtimeClasses: RuntimeClassInfo[]
  leases: LeaseInfo[]
  mutatingWebhookConfigurations: WebhookConfigurationInfo[]
  validatingWebhookConfigurations: WebhookConfigurationInfo[]
  endpoints: EndpointsInfo[]
  replicationControllers: ReplicationControllerInfo[]
  jobs: JobInfo[]
  cronJobs: CronJobInfo[]
  ingresses: IngressInfo[]
  nodes: NodeInfo[]
  setNamespaces: (list: NamespaceInfo[]) => void
  setPods: (list: PodInfo[]) => void
  setDeployments: (list: DeploymentInfo[]) => void
  setServices: (list: ServiceInfo[]) => void
  setConfigMaps: (list: ConfigMapInfo[]) => void
  setSecrets: (list: SecretInfo[]) => void
  setStatefulSets: (list: StatefulSetInfo[]) => void
  setDaemonSets: (list: DaemonSetInfo[]) => void
  setReplicaSets: (list: ReplicaSetInfo[]) => void
  setPersistentVolumeClaims: (list: PersistentVolumeClaimInfo[]) => void
  setPersistentVolumes: (list: PersistentVolumeInfo[]) => void
  setStorageClasses: (list: StorageClassInfo[]) => void
  setNetworkPolicies: (list: NetworkPolicyInfo[]) => void
  setHorizontalPodAutoscalers: (list: HorizontalPodAutoscalerInfo[]) => void
  setPodDisruptionBudgets: (list: PodDisruptionBudgetInfo[]) => void
  setEndpointSlices: (list: EndpointSliceInfo[]) => void
  setResourceQuotas: (list: ResourceQuotaInfo[]) => void
  setLimitRanges: (list: LimitRangeInfo[]) => void
  setIngressClasses: (list: IngressClassInfo[]) => void
  setPriorityClasses: (list: PriorityClassInfo[]) => void
  setRuntimeClasses: (list: RuntimeClassInfo[]) => void
  setLeases: (list: LeaseInfo[]) => void
  setMutatingWebhookConfigurations: (list: WebhookConfigurationInfo[]) => void
  setValidatingWebhookConfigurations: (list: WebhookConfigurationInfo[]) => void
  setEndpoints: (list: EndpointsInfo[]) => void
  setReplicationControllers: (list: ReplicationControllerInfo[]) => void
  setJobs: (list: JobInfo[]) => void
  setCronJobs: (list: CronJobInfo[]) => void
  setIngresses: (list: IngressInfo[]) => void
  setNodes: (list: NodeInfo[]) => void
  reset: () => void
}

function emptyLists() {
  return {
    namespaces: [] as NamespaceInfo[],
    pods: [] as PodInfo[],
    deployments: [] as DeploymentInfo[],
    services: [] as ServiceInfo[],
    configMaps: [] as ConfigMapInfo[],
    secrets: [] as SecretInfo[],
    statefulSets: [] as StatefulSetInfo[],
    daemonSets: [] as DaemonSetInfo[],
    replicaSets: [] as ReplicaSetInfo[],
    persistentVolumeClaims: [] as PersistentVolumeClaimInfo[],
    persistentVolumes: [] as PersistentVolumeInfo[],
    storageClasses: [] as StorageClassInfo[],
    networkPolicies: [] as NetworkPolicyInfo[],
    horizontalPodAutoscalers: [] as HorizontalPodAutoscalerInfo[],
    podDisruptionBudgets: [] as PodDisruptionBudgetInfo[],
    endpointSlices: [] as EndpointSliceInfo[],
    resourceQuotas: [] as ResourceQuotaInfo[],
    limitRanges: [] as LimitRangeInfo[],
    ingressClasses: [] as IngressClassInfo[],
    priorityClasses: [] as PriorityClassInfo[],
    runtimeClasses: [] as RuntimeClassInfo[],
    leases: [] as LeaseInfo[],
    mutatingWebhookConfigurations: [] as WebhookConfigurationInfo[],
    validatingWebhookConfigurations: [] as WebhookConfigurationInfo[],
    endpoints: [] as EndpointsInfo[],
    replicationControllers: [] as ReplicationControllerInfo[],
    jobs: [] as JobInfo[],
    cronJobs: [] as CronJobInfo[],
    ingresses: [] as IngressInfo[],
    nodes: [] as NodeInfo[],
  }
}

export const useResources = create<ResourcesState>((set) => ({
  ...emptyLists(),
  setNamespaces: (list) => set({ namespaces: list }),
  setPods: (list) => set({ pods: list }),
  setDeployments: (list) => set({ deployments: list }),
  setServices: (list) => set({ services: list }),
  setConfigMaps: (list) => set({ configMaps: list }),
  setSecrets: (list) => set({ secrets: list }),
  setStatefulSets: (list) => set({ statefulSets: list }),
  setDaemonSets: (list) => set({ daemonSets: list }),
  setReplicaSets: (list) => set({ replicaSets: list }),
  setPersistentVolumeClaims: (list) => set({ persistentVolumeClaims: list }),
  setPersistentVolumes: (list) => set({ persistentVolumes: list }),
  setStorageClasses: (list) => set({ storageClasses: list }),
  setNetworkPolicies: (list) => set({ networkPolicies: list }),
  setHorizontalPodAutoscalers: (list) => set({ horizontalPodAutoscalers: list }),
  setPodDisruptionBudgets: (list) => set({ podDisruptionBudgets: list }),
  setEndpointSlices: (list) => set({ endpointSlices: list }),
  setResourceQuotas: (list) => set({ resourceQuotas: list }),
  setLimitRanges: (list) => set({ limitRanges: list }),
  setIngressClasses: (list) => set({ ingressClasses: list }),
  setPriorityClasses: (list) => set({ priorityClasses: list }),
  setRuntimeClasses: (list) => set({ runtimeClasses: list }),
  setLeases: (list) => set({ leases: list }),
  setMutatingWebhookConfigurations: (list) => set({ mutatingWebhookConfigurations: list }),
  setValidatingWebhookConfigurations: (list) => set({ validatingWebhookConfigurations: list }),
  setEndpoints: (list) => set({ endpoints: list }),
  setReplicationControllers: (list) => set({ replicationControllers: list }),
  setJobs: (list) => set({ jobs: list }),
  setCronJobs: (list) => set({ cronJobs: list }),
  setIngresses: (list) => set({ ingresses: list }),
  setNodes: (list) => set({ nodes: list }),
  reset: () => set(emptyLists()),
}))
