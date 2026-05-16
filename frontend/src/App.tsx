import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

const RESOURCE_GROUPS = [
  { label: 'Workloads', items: ['Pods', 'Deployments', 'StatefulSets', 'DaemonSets', 'Jobs', 'CronJobs'] },
  { label: 'Config', items: ['ConfigMaps', 'Secrets'] },
  { label: 'Network', items: ['Services', 'Ingresses'] },
  { label: 'Cluster', items: ['Nodes', 'Namespaces'] },
]

type Theme = 'light' | 'dark'

const THEME_KEY = 'klustr-theme'

function getInitialTheme(): Theme {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === 'dark' || saved === 'light') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-tight">Klustr</span>
          <Button variant="outline" size="sm" disabled>
            No context
          </Button>
          <Button variant="outline" size="sm" disabled>
            All namespaces
          </Button>
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
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="cursor-default rounded px-2 py-1 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <main className="flex flex-1 items-center justify-center overflow-auto p-6">
          <div className="text-center text-sm text-muted-foreground">
            Select a kubeconfig context to get started.
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
