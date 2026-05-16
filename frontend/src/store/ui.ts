import { create } from 'zustand'

export type ResourceView =
  | 'overview'
  | 'pods'
  | 'deployments'
  | 'services'
  | 'configmaps'
  | 'secrets'
  | 'statefulsets'
  | 'daemonsets'
  | 'jobs'
  | 'cronjobs'
  | 'ingresses'
  | 'nodes'
  | 'namespaces'

export type SelectedResource = {
  kind: 'Pod'
  namespace: string
  name: string
}

type UIState = {
  selectedContext: string | null
  selectedNamespace: string | null
  selectedView: ResourceView
  selectedResource: SelectedResource | null
  setSelectedContext: (name: string | null) => void
  setSelectedNamespace: (name: string | null) => void
  setSelectedView: (view: ResourceView) => void
  setSelectedResource: (resource: SelectedResource | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  selectedContext: null,
  selectedNamespace: null,
  selectedView: 'overview',
  selectedResource: null,
  setSelectedContext: (name) =>
    set((s) =>
      s.selectedContext === name
        ? s
        : { selectedContext: name, selectedNamespace: null, selectedResource: null },
    ),
  setSelectedNamespace: (name) => set({ selectedNamespace: name }),
  setSelectedView: (view) => set({ selectedView: view, selectedResource: null }),
  setSelectedResource: (resource) => set({ selectedResource: resource }),
}))
