import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ContextSwitcher } from '@/features/contexts/ContextSwitcher'
import { ConnectionStatus } from '@/features/contexts/ConnectionStatus'
import { NamespaceSelector } from '@/features/contexts/NamespaceSelector'
import { PodsView } from '@/features/pods/PodsView'
import { DeploymentsView } from '@/features/deployments/DeploymentsView'
import { ServicesView } from '@/features/services/ServicesView'
import { ConfigMapsView } from '@/features/configmaps/ConfigMapsView'
import { SecretsView } from '@/features/secrets/SecretsView'
import { StatefulSetsView } from '@/features/statefulsets/StatefulSetsView'
import { DaemonSetsView } from '@/features/daemonsets/DaemonSetsView'
import { ReplicaSetsView } from '@/features/replicasets/ReplicaSetsView'
import { PersistentVolumeClaimsView } from '@/features/pvcs/PersistentVolumeClaimsView'
import { PersistentVolumesView } from '@/features/pvs/PersistentVolumesView'
import { StorageClassesView } from '@/features/storageclasses/StorageClassesView'
import { NetworkPoliciesView } from '@/features/networkpolicies/NetworkPoliciesView'
import { JobsView } from '@/features/jobs/JobsView'
import { CronJobsView } from '@/features/cronjobs/CronJobsView'
import { IngressesView } from '@/features/ingresses/IngressesView'
import { NodesView } from '@/features/nodes/NodesView'
import { NamespacesView } from '@/features/namespaces/NamespacesView'
import { ResourceDetailPanel } from '@/features/_shared/ResourceDetailPanel'
import { CommandPalette } from '@/features/_shared/CommandPalette'
import { StatusBar } from '@/features/_shared/StatusBar'
import { PodSearchPalette } from '@/features/pods/PodSearchPalette'
import { PortForwardIndicator } from '@/features/portforward/PortForwardIndicator'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { api } from '@/lib/api'
import { onPFUpdate } from '@/lib/events'
import { useUIStore, type ResourceView } from '@/store/ui'
import { useResources } from '@/store/resources'
import { usePortForwards } from '@/store/portForwards'

type NavItem = { label: string; view?: ResourceView }

const RESOURCE_GROUPS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: 'Workloads',
    items: [
      { label: 'Pods', view: 'pods' },
      { label: 'Deployments', view: 'deployments' },
      { label: 'StatefulSets', view: 'statefulsets' },
      { label: 'DaemonSets', view: 'daemonsets' },
      { label: 'ReplicaSets', view: 'replicasets' },
      { label: 'Jobs', view: 'jobs' },
      { label: 'CronJobs', view: 'cronjobs' },
    ],
  },
  {
    label: 'Config',
    items: [
      { label: 'ConfigMaps', view: 'configmaps' },
      { label: 'Secrets', view: 'secrets' },
    ],
  },
  {
    label: 'Network',
    items: [
      { label: 'Services', view: 'services' },
      { label: 'Ingresses', view: 'ingresses' },
      { label: 'NetworkPolicies', view: 'networkpolicies' },
    ],
  },
  {
    label: 'Storage',
    items: [
      { label: 'PersistentVolumeClaims', view: 'persistentvolumeclaims' },
      { label: 'PersistentVolumes', view: 'persistentvolumes' },
      { label: 'StorageClasses', view: 'storageclasses' },
    ],
  },
  {
    label: 'Cluster',
    items: [
      { label: 'Nodes', view: 'nodes' },
      { label: 'Namespaces', view: 'namespaces' },
    ],
  },
]

type Theme = 'light' | 'dark'

const THEME_KEY = 'klustr-theme'

function getInitialTheme(): Theme {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === 'dark' || saved === 'light') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function MainView() {
  const view = useUIStore((s) => s.selectedView)
  switch (view) {
    case 'pods':
      return <PodsView />
    case 'deployments':
      return <DeploymentsView />
    case 'services':
      return <ServicesView />
    case 'configmaps':
      return <ConfigMapsView />
    case 'secrets':
      return <SecretsView />
    case 'statefulsets':
      return <StatefulSetsView />
    case 'daemonsets':
      return <DaemonSetsView />
    case 'replicasets':
      return <ReplicaSetsView />
    case 'persistentvolumeclaims':
      return <PersistentVolumeClaimsView />
    case 'persistentvolumes':
      return <PersistentVolumesView />
    case 'storageclasses':
      return <StorageClassesView />
    case 'networkpolicies':
      return <NetworkPoliciesView />
    case 'jobs':
      return <JobsView />
    case 'cronjobs':
      return <CronJobsView />
    case 'ingresses':
      return <IngressesView />
    case 'nodes':
      return <NodesView />
    case 'namespaces':
      return <NamespacesView />
    default:
      return (
        <div className="flex flex-1 items-center justify-center">
          <ConnectionStatus />
        </div>
      )
  }
}

const NAV_VIEWS: ResourceView[] = RESOURCE_GROUPS.flatMap((g) =>
  g.items.map((i) => i.view).filter((v): v is ResourceView => v !== undefined),
)

function isEditableTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false
  if (t.isContentEditable) return true
  const tag = t.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const selectedContext = useUIStore((s) => s.selectedContext)
  const selectedView = useUIStore((s) => s.selectedView)
  const setSelectedView = useUIStore((s) => s.setSelectedView)
  const selectedResource = useUIStore((s) => s.selectedResource)
  const resetResources = useResources((s) => s.reset)
  const setPortForwards = usePortForwards((s) => s.setList)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
      if (isEditableTarget(e.target)) return
      e.preventDefault()
      const current = NAV_VIEWS.indexOf(selectedView)
      const start = current >= 0 ? current : 0
      const delta = e.key === 'ArrowDown' ? 1 : -1
      const next = (start + delta + NAV_VIEWS.length) % NAV_VIEWS.length
      setSelectedView(NAV_VIEWS[next])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedView, setSelectedView])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    const reload = () => {
      api.listPortForwards().then((list) => setPortForwards(list ?? []))
    }
    reload()
    return onPFUpdate(reload)
  }, [setPortForwards])

  useEffect(() => {
    if (!selectedContext) return
    api.startWatch(selectedContext).catch(console.error)
    return () => {
      api.stopWatch(selectedContext).catch(console.error)
      resetResources()
    }
  }, [selectedContext, resetResources])

  return (
    <TooltipProvider delayDuration={250}>
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-tight">Klustr</span>
          <ContextSwitcher />
          <NamespaceSelector />
        </div>
        <div className="flex items-center gap-1">
          <PortForwardIndicator />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          >
            {theme === 'dark' ? <Sun /> : <Moon />}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-56 shrink-0 overflow-y-auto border-r border-border bg-sidebar text-sidebar-foreground">
          <nav className="flex flex-col gap-4 p-3">
            {RESOURCE_GROUPS.map((group) => (
              <div key={group.label}>
                <div className="px-2 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {group.label}
                </div>
                <ul className="flex flex-col">
                  {group.items.map((item) => {
                    const active = item.view !== undefined && item.view === selectedView
                    const enabled = item.view !== undefined
                    return (
                      <li
                        key={item.label}
                        aria-disabled={!enabled}
                        className={[
                          'rounded px-2 py-1 text-sm',
                          enabled
                            ? 'cursor-pointer text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                            : 'cursor-default text-muted-foreground/60',
                          active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : '',
                        ].join(' ')}
                        onClick={() => {
                          if (item.view) setSelectedView(item.view)
                        }}
                      >
                        {item.label}
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <main className="flex flex-1 overflow-hidden">
          <MainView />
        </main>
      </div>

      <StatusBar />

      <ResourceDetailPanel contextName={selectedContext} resource={selectedResource} />
      <CommandPalette />
      <PodSearchPalette />
      <Toaster position="bottom-right" />
    </div>
    </TooltipProvider>
  )
}

export default App
