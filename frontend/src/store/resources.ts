import { create } from 'zustand'
import type {
  ConfigMapInfo,
  CronJobInfo,
  DaemonSetInfo,
  ReplicaSetInfo,
  PersistentVolumeClaimInfo,
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
  setJobs: (list) => set({ jobs: list }),
  setCronJobs: (list) => set({ cronJobs: list }),
  setIngresses: (list) => set({ ingresses: list }),
  setNodes: (list) => set({ nodes: list }),
  reset: () => set(emptyLists()),
}))
