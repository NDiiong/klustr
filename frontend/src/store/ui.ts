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

const COLLAPSED_NAV_GROUPS_KEY = 'klustr-collapsed-nav-groups'

function readCollapsedNavGroups(): string[] {
  try {
    const raw = localStorage.getItem(COLLAPSED_NAV_GROUPS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

const DEFAULT_CONTEXT_KEY = 'klustr-default-context'

function readDefaultContext(): string | null {
  const v = localStorage.getItem(DEFAULT_CONTEXT_KEY)
  return v && v.length > 0 ? v : null
}

export type ResourceView =
  | 'overview'
  | 'workloadsoverview'
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

export type DetailTab = 'overview' | 'logs' | 'exec' | 'events' | 'yaml'

export type PendingAction =
  | { kind: 'delete'; resource: SelectedResource }
  | { kind: 'portforward'; resource: SelectedResource }

type UIState = {
  selectedContext: string | null
  selectedNamespace: string | null
  selectedView: ResourceView
  selectedResource: SelectedResource | null
  lastSelectedResource: SelectedResource | null
  requestedTab: DetailTab | null
  pendingAction: PendingAction | null
  themeId: ThemeId
  collapsedNavGroups: string[]
  defaultContext: string | null
  setSelectedContext: (name: string | null) => void
  setSelectedNamespace: (name: string | null) => void
  setSelectedView: (view: ResourceView) => void
  setSelectedResource: (resource: SelectedResource | null) => void
  openResource: (resource: SelectedResource, tab?: DetailTab) => void
  setPendingAction: (action: PendingAction | null) => void
  setTheme: (id: ThemeId) => void
  toggleNavGroup: (label: string) => void
  setDefaultContext: (name: string | null) => void
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

  const initialDefaultContext = readDefaultContext()

  return {
    selectedContext: initialDefaultContext,
    selectedNamespace: null,
    selectedView: 'overview',
    selectedResource: null,
    lastSelectedResource: null,
    requestedTab: null,
    pendingAction: null,
    themeId: initialThemeId,
    collapsedNavGroups: readCollapsedNavGroups(),
    defaultContext: initialDefaultContext,
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
      set({
        selectedView: view,
        selectedResource: null,
        lastSelectedResource: null,
        requestedTab: null,
      }),
    setSelectedResource: (resource) =>
      set((s) => ({
        selectedResource: resource,
        lastSelectedResource: resource ?? s.selectedResource ?? s.lastSelectedResource,
        requestedTab: null,
      })),
    openResource: (resource, tab) =>
      set({
        selectedResource: resource,
        lastSelectedResource: resource,
        requestedTab: tab ?? null,
      }),
    setPendingAction: (action) => set({ pendingAction: action }),
    setTheme: (id) => {
      if (followingSystem) {
        mql.removeEventListener('change', onSystemChange)
        followingSystem = false
      }
      applyThemeClasses(getTheme(id))
      localStorage.setItem(THEME_STORAGE_KEY, id)
      set({ themeId: id })
    },
    toggleNavGroup: (label) =>
      set((s) => {
        const next = s.collapsedNavGroups.includes(label)
          ? s.collapsedNavGroups.filter((g) => g !== label)
          : [...s.collapsedNavGroups, label]
        localStorage.setItem(COLLAPSED_NAV_GROUPS_KEY, JSON.stringify(next))
        return { collapsedNavGroups: next }
      }),
    setDefaultContext: (name) => {
      if (name && name.length > 0) {
        localStorage.setItem(DEFAULT_CONTEXT_KEY, name)
      } else {
        localStorage.removeItem(DEFAULT_CONTEXT_KEY)
      }
      set({ defaultContext: name && name.length > 0 ? name : null })
    },
  }
})
