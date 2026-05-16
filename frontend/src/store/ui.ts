import { create } from 'zustand'

export type ResourceView = 'overview' | 'pods' | 'deployments'

type UIState = {
  selectedContext: string | null
  selectedNamespace: string | null
  selectedView: ResourceView
  setSelectedContext: (name: string | null) => void
  setSelectedNamespace: (name: string | null) => void
  setSelectedView: (view: ResourceView) => void
}

export const useUIStore = create<UIState>((set) => ({
  selectedContext: null,
  selectedNamespace: null,
  selectedView: 'overview',
  setSelectedContext: (name) =>
    set((s) => (s.selectedContext === name ? s : { selectedContext: name, selectedNamespace: null })),
  setSelectedNamespace: (name) => set({ selectedNamespace: name }),
  setSelectedView: (view) => set({ selectedView: view }),
}))
