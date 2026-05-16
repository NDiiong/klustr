import { create } from 'zustand'
import type { NamespaceInfo, PodInfo } from '@/lib/api'

type ResourcesState = {
  namespaces: NamespaceInfo[]
  pods: PodInfo[]
  setNamespaces: (list: NamespaceInfo[]) => void
  setPods: (list: PodInfo[]) => void
  reset: () => void
}

export const useResources = create<ResourcesState>((set) => ({
  namespaces: [],
  pods: [],
  setNamespaces: (list) => set({ namespaces: list }),
  setPods: (list) => set({ pods: list }),
  reset: () => set({ namespaces: [], pods: [] }),
}))
