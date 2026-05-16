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
  | 'replicasets'
  | 'persistentvolumeclaims'
  | 'persistentvolumes'
  | 'jobs'
  | 'cronjobs'
  | 'ingresses'
  | 'nodes'
  | 'namespaces'

export type ResourceKind =
  | 'Pod'
  | 'Deployment'
  | 'StatefulSet'
  | 'DaemonSet'
  | 'ReplicaSet'
  | 'PersistentVolumeClaim'
  | 'PersistentVolume'
  | 'Job'
  | 'CronJob'
  | 'Service'
  | 'ConfigMap'
  | 'Secret'
  | 'Ingress'
  | 'Node'
  | 'Namespace'

export type SelectedResource = {
  kind: ResourceKind
  namespace: string
  name: string
}

type UIState = {
  selectedContext: string | null
  selectedNamespace: string | null
  selectedView: ResourceView
  selectedResource: SelectedResource | null
  lastSelectedResource: SelectedResource | null
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
  lastSelectedResource: null,
  setSelectedContext: (name) =>
    set((s) =>
      s.selectedContext === name
        ? s
        : {
            selectedContext: name,
            selectedNamespace: null,
            selectedResource: null,
            lastSelectedResource: null,
          },
    ),
  setSelectedNamespace: (name) => set({ selectedNamespace: name }),
  setSelectedView: (view) =>
    set({ selectedView: view, selectedResource: null, lastSelectedResource: null }),
  setSelectedResource: (resource) =>
    set((s) => ({
      selectedResource: resource,
      lastSelectedResource: resource ?? s.selectedResource ?? s.lastSelectedResource,
    })),
}))
