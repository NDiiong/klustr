import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ContextSwitcher } from '@/features/contexts/ContextSwitcher'
import { ConnectionStatus } from '@/features/contexts/ConnectionStatus'
import { NamespaceSelector } from '@/features/contexts/NamespaceSelector'
import { PodsView } from '@/features/pods/PodsView'
import { api } from '@/lib/api'
import { useUIStore, type ResourceView } from '@/store/ui'
import { useResources } from '@/store/resources'

type NavItem = { label: string; view?: ResourceView }

const RESOURCE_GROUPS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: 'Workloads',
    items: [
      { label: 'Pods', view: 'pods' },
      { label: 'Deployments' },
      { label: 'StatefulSets' },
      { label: 'DaemonSets' },
      { label: 'Jobs' },
      { label: 'CronJobs' },
    ],
  },
  {
    label: 'Config',
    items: [{ label: 'ConfigMaps' }, { label: 'Secrets' }],
  },
  {
    label: 'Network',
    items: [{ label: 'Services' }, { label: 'Ingresses' }],
  },
  {
    label: 'Cluster',
    items: [{ label: 'Nodes' }, { label: 'Namespaces' }],
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
  if (view === 'pods') return <PodsView />
  return (
    <div className="flex h-full items-center justify-center">
      <ConnectionStatus />
    </div>
  )
}

function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const selectedContext = useUIStore((s) => s.selectedContext)
  const selectedView = useUIStore((s) => s.selectedView)
  const setSelectedView = useUIStore((s) => s.setSelectedView)
  const resetResources = useResources((s) => s.reset)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    if (!selectedContext) return
    api.startWatch(selectedContext).catch(console.error)
    return () => {
      api.stopWatch(selectedContext).catch(console.error)
      resetResources()
    }
  }, [selectedContext, resetResources])

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-tight">Klustr</span>
          <ContextSwitcher />
          <NamespaceSelector />
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          >
            {theme === 'dark' ? <Sun /> : <Moon />}
          </Button>
          <Button variant="ghost" size="sm" disabled>
            Settings
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
    </div>
  )
}

export default App
