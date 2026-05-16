import { useEffect, useMemo, useState } from 'react'
import { Folder, LayoutGrid } from 'lucide-react'
import { ProviderIcon } from '@/features/_shared/providerIcons'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { api, type ContextInfo, type NamespaceInfo } from '@/lib/api'
import { onKubeChange } from '@/lib/events'
import { useUIStore, type ResourceView } from '@/store/ui'

type ViewEntry = { id: ResourceView; label: string }

const VIEWS: ViewEntry[] = [
  { id: 'pods', label: 'Pods' },
  { id: 'deployments', label: 'Deployments' },
  { id: 'statefulsets', label: 'StatefulSets' },
  { id: 'daemonsets', label: 'DaemonSets' },
  { id: 'jobs', label: 'Jobs' },
  { id: 'cronjobs', label: 'CronJobs' },
  { id: 'configmaps', label: 'ConfigMaps' },
  { id: 'secrets', label: 'Secrets' },
  { id: 'services', label: 'Services' },
  { id: 'ingresses', label: 'Ingresses' },
  { id: 'nodes', label: 'Nodes' },
  { id: 'namespaces', label: 'Namespaces' },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const selectedContext = useUIStore((s) => s.selectedContext)
  const selectedNamespace = useUIStore((s) => s.selectedNamespace)
  const setSelectedContext = useUIStore((s) => s.setSelectedContext)
  const setSelectedNamespace = useUIStore((s) => s.setSelectedNamespace)
  const setSelectedView = useUIStore((s) => s.setSelectedView)

  const [contexts, setContexts] = useState<ContextInfo[]>([])
  const [namespaces, setNamespaces] = useState<NamespaceInfo[]>([])

  useEffect(() => {
    api
      .listContexts()
      .then((cfg) => setContexts(cfg.contexts))
      .catch(() => setContexts([]))
  }, [])

  useEffect(() => {
    if (!selectedContext) {
      setNamespaces([])
      return
    }
    const reload = () => {
      api
        .listNamespaces(selectedContext)
        .then((list) => setNamespaces(list ?? []))
        .catch(() => setNamespaces([]))
    }
    reload()
    return onKubeChange('Namespace', (ctx) => {
      if (ctx === selectedContext) reload()
    })
  }, [selectedContext])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const groupedNamespaces = useMemo(
    () => [...namespaces].sort((a, b) => a.name.localeCompare(b.name)),
    [namespaces],
  )

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command palette"
      description="Switch context, namespace, or view"
    >
      <CommandInput placeholder="Switch context, namespace, or view…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>

        {VIEWS.length > 0 && (
          <CommandGroup heading="Views">
            {VIEWS.map((v) => (
              <CommandItem
                key={v.id}
                value={`view ${v.label}`}
                onSelect={() => {
                  setSelectedView(v.id)
                  setOpen(false)
                }}
              >
                <LayoutGrid />
                <span>{v.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {contexts.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Contexts">
              {contexts.map((c) => (
                <CommandItem
                  key={c.name}
                  value={`context ${c.name} ${c.server}`}
                  onSelect={() => {
                    setSelectedContext(c.name)
                    setOpen(false)
                  }}
                >
                  <ProviderIcon context={c} />
                  <span className="truncate">{c.name}</span>
                  {c.name === selectedContext && (
                    <span className="ml-auto text-[10px] text-muted-foreground">current</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {selectedContext && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Namespaces">
              <CommandItem
                value="namespace all"
                onSelect={() => {
                  setSelectedNamespace(null)
                  setOpen(false)
                }}
              >
                <Folder />
                <span>All namespaces</span>
                {selectedNamespace === null && (
                  <span className="ml-auto text-[10px] text-muted-foreground">current</span>
                )}
              </CommandItem>
              {groupedNamespaces.map((n) => (
                <CommandItem
                  key={n.name}
                  value={`namespace ${n.name}`}
                  onSelect={() => {
                    setSelectedNamespace(n.name)
                    setOpen(false)
                  }}
                >
                  <Folder />
                  <span className="truncate">{n.name}</span>
                  {n.name === selectedNamespace && (
                    <span className="ml-auto text-[10px] text-muted-foreground">current</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
