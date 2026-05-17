import { create } from 'zustand'
import {
  DEFAULT_DARK,
  DEFAULT_LIGHT,
  THEME_CSS_CLASSES,
  getTheme,
  isThemeId,
  type ThemeDefinition,
  type ThemeId,
} from '@/features/_shared/themes'

const THEME_STORAGE_KEY = 'klustr-theme'

function readSavedThemeId(): ThemeId | null {
  const saved = localStorage.getItem(THEME_STORAGE_KEY)
  if (isThemeId(saved)) return saved
  if (saved === 'dark') return DEFAULT_DARK
  if (saved === 'light') return DEFAULT_LIGHT
  return null
}

function systemThemeId(): ThemeId {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? DEFAULT_DARK : DEFAULT_LIGHT
}

function applyThemeClasses(theme: ThemeDefinition) {
  const root = document.documentElement
  root.classList.toggle('dark', theme.mode === 'dark')
  for (const cls of THEME_CSS_CLASSES) {
    root.classList.toggle(cls, theme.cssClass === cls)
  }
}

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
  | 'storageclasses'
  | 'networkpolicies'
  | 'horizontalpodautoscalers'
  | 'poddisruptionbudgets'
  | 'endpointslices'
  | 'resourcequotas'
  | 'limitranges'
  | 'ingressclasses'
  | 'priorityclasses'
  | 'runtimeclasses'
  | 'leases'
  | 'mutatingwebhookconfigurations'
  | 'validatingwebhookconfigurations'
  | 'endpoints'
  | 'replicationcontrollers'
  | 'events'
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
  | 'StorageClass'
  | 'NetworkPolicy'
  | 'HorizontalPodAutoscaler'
  | 'PodDisruptionBudget'
  | 'EndpointSlice'
  | 'ResourceQuota'
  | 'LimitRange'
  | 'IngressClass'
  | 'PriorityClass'
  | 'RuntimeClass'
  | 'Lease'
  | 'MutatingWebhookConfiguration'
  | 'ValidatingWebhookConfiguration'
  | 'Endpoints'
  | 'ReplicationController'
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
  themeId: ThemeId
  setSelectedContext: (name: string | null) => void
  setSelectedNamespace: (name: string | null) => void
  setSelectedView: (view: ResourceView) => void
  setSelectedResource: (resource: SelectedResource | null) => void
  setTheme: (id: ThemeId) => void
}

export const useUIStore = create<UIState>((set) => {
  const saved = readSavedThemeId()
  const initialThemeId = saved ?? systemThemeId()
  applyThemeClasses(getTheme(initialThemeId))

  const mql = window.matchMedia('(prefers-color-scheme: dark)')
  const onSystemChange = (e: MediaQueryListEvent) => {
    const next = e.matches ? DEFAULT_DARK : DEFAULT_LIGHT
    applyThemeClasses(getTheme(next))
    set({ themeId: next })
  }
  let followingSystem = saved === null
  if (followingSystem) {
    mql.addEventListener('change', onSystemChange)
  }

  return {
    selectedContext: null,
    selectedNamespace: null,
    selectedView: 'overview',
    selectedResource: null,
    lastSelectedResource: null,
    themeId: initialThemeId,
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
    setTheme: (id) => {
      if (followingSystem) {
        mql.removeEventListener('change', onSystemChange)
        followingSystem = false
      }
      applyThemeClasses(getTheme(id))
      localStorage.setItem(THEME_STORAGE_KEY, id)
      set({ themeId: id })
    },
  }
})
