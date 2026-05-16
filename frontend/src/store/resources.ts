import { create } from 'zustand'
import type {
  ConfigMapInfo,
  DeploymentInfo,
  NamespaceInfo,
  PodInfo,
  SecretInfo,
  ServiceInfo,
} from '@/lib/api'

type ResourcesState = {
  namespaces: NamespaceInfo[]
  pods: PodInfo[]
  deployments: DeploymentInfo[]
  services: ServiceInfo[]
  configMaps: ConfigMapInfo[]
  secrets: SecretInfo[]
  setNamespaces: (list: NamespaceInfo[]) => void
  setPods: (list: PodInfo[]) => void
  setDeployments: (list: DeploymentInfo[]) => void
  setServices: (list: ServiceInfo[]) => void
  setConfigMaps: (list: ConfigMapInfo[]) => void
  setSecrets: (list: SecretInfo[]) => void
  reset: () => void
}

export const useResources = create<ResourcesState>((set) => ({
  namespaces: [],
  pods: [],
  deployments: [],
  services: [],
  configMaps: [],
  secrets: [],
  setNamespaces: (list) => set({ namespaces: list }),
  setPods: (list) => set({ pods: list }),
  setDeployments: (list) => set({ deployments: list }),
  setServices: (list) => set({ services: list }),
  setConfigMaps: (list) => set({ configMaps: list }),
  setSecrets: (list) => set({ secrets: list }),
  reset: () =>
    set({
      namespaces: [],
      pods: [],
      deployments: [],
      services: [],
      configMaps: [],
      secrets: [],
    }),
}))
