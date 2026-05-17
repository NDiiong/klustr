import { useEffect, useMemo, useState } from 'react'
import { LayoutGrid, Star } from 'lucide-react'
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
import { selectFavorites, useNamespaceFavorites } from '@/store/namespaceFavorites'
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
  const selectedNamespaces = useUIStore((s) => s.selectedNamespaces)
  const setSelectedContext = useUIStore((s) => s.setSelectedContext)
  const toggleSelectedNamespace = useUIStore((s) => s.toggleSelectedNamespace)
  const clearSelectedNamespaces = useUIStore((s) => s.clearSelectedNamespaces)
  const setSelectedView = useUIStore((s) => s.setSelectedView)
  const favorites = useNamespaceFavorites(selectFavorites(selectedContext))
  const toggleFavorite = useNamespaceFavorites((s) => s.toggle)

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

  const favoriteSet = useMemo(() => new Set(favorites), [favorites])
  const { favoriteNamespaces, otherNamespaces } = useMemo(() => {
    const fav: NamespaceInfo[] = []
    const others: NamespaceInfo[] = []
    for (const ns of [...namespaces].sort((a, b) => a.name.localeCompare(b.name))) {
      if (favoriteSet.has(ns.name)) fav.push(ns)
      else others.push(ns)
    }
    return { favoriteNamespaces: fav, otherNamespaces: others }
  }, [namespaces, favoriteSet])
  const selectedSet = useMemo(() => new Set(selectedNamespaces), [selectedNamespaces])

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
                onSelect={() => clearSelectedNamespaces()}
              >
                <NamespaceCheckbox checked={selectedNamespaces.length === 0} />
                <span className="flex-1 truncate">All namespaces</span>
              </CommandItem>
              {favoriteNamespaces.map((n) => (
                <NamespaceItem
                  key={`fav-${n.name}`}
                  ns={n}
                  selected={selectedSet.has(n.name)}
                  favorite
                  onToggle={() => toggleSelectedNamespace(n.name)}
                  onToggleFavorite={() => toggleFavorite(selectedContext, n.name)}
                />
              ))}
              {otherNamespaces.map((n) => (
                <NamespaceItem
                  key={n.name}
                  ns={n}
                  selected={selectedSet.has(n.name)}
                  favorite={false}
                  onToggle={() => toggleSelectedNamespace(n.name)}
                  onToggleFavorite={() => toggleFavorite(selectedContext, n.name)}
                />
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}

type NamespaceItemProps = {
  ns: NamespaceInfo
  selected: boolean
  favorite: boolean
  onToggle: () => void
  onToggleFavorite: () => void
}

function NamespaceItem({ ns, selected, favorite, onToggle, onToggleFavorite }: NamespaceItemProps) {
  return (
    <CommandItem value={`namespace ${ns.name}`} onSelect={onToggle}>
      <NamespaceCheckbox checked={selected} />
      <span className="flex-1 truncate">{ns.name}</span>
      <button
        type="button"
        aria-label={favorite ? `Unfavorite ${ns.name}` : `Favorite ${ns.name}`}
        title={favorite ? 'Unfavorite' : 'Favorite'}
        onClick={(e) => {
          e.stopPropagation()
          onToggleFavorite()
        }}
        className={[
          '-mr-1.5 inline-flex size-5 shrink-0 items-center justify-center rounded transition-colors',
          favorite
            ? 'text-amber-500 hover:bg-muted'
            : 'text-muted-foreground/40 hover:bg-muted hover:text-foreground',
        ].join(' ')}
      >
        <Star className={['size-3.5', favorite ? 'fill-current' : ''].join(' ')} />
      </button>
    </CommandItem>
  )
}

function NamespaceCheckbox({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={[
        'inline-flex size-3.5 shrink-0 items-center justify-center rounded-[3px] border transition-colors',
        checked
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-muted-foreground/40 bg-transparent',
      ].join(' ')}
    >
      {checked && (
        <svg
          viewBox="0 0 12 12"
          className="size-2.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="2.5 6.5 5 9 9.5 3.5" />
        </svg>
      )}
    </span>
  )
}
