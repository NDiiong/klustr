import { create } from 'zustand'
import type { NamespaceInfo } from '@/lib/api'

type ResourcesState = {
  namespaces: NamespaceInfo[]
  setNamespaces: (list: NamespaceInfo[]) => void
  reset: () => void
}

export const useResources = create<ResourcesState>((set) => ({
  namespaces: [],
  setNamespaces: (list) => set({ namespaces: list }),
  reset: () => set({ namespaces: [] }),
}))
