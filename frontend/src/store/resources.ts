import { create } from 'zustand'
import type { DeploymentInfo, NamespaceInfo, PodInfo } from '@/lib/api'

type ResourcesState = {
  namespaces: NamespaceInfo[]
  pods: PodInfo[]
  deployments: DeploymentInfo[]
  setNamespaces: (list: NamespaceInfo[]) => void
  setPods: (list: PodInfo[]) => void
  setDeployments: (list: DeploymentInfo[]) => void
  reset: () => void
}

export const useResources = create<ResourcesState>((set) => ({
  namespaces: [],
  pods: [],
  deployments: [],
  setNamespaces: (list) => set({ namespaces: list }),
  setPods: (list) => set({ pods: list }),
  setDeployments: (list) => set({ deployments: list }),
  reset: () => set({ namespaces: [], pods: [], deployments: [] }),
}))
