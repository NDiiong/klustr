import { useEffect, useState } from 'react'
import { Box } from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { api, type PodInfo } from '@/lib/api'
import { onKubeChange } from '@/lib/events'
import { useUIStore } from '@/store/ui'

export function PodSearchPalette() {
  const [open, setOpen] = useState(false)
  const selectedContext = useUIStore((s) => s.selectedContext)
  const setSelectedResource = useUIStore((s) => s.setSelectedResource)
  const setSelectedView = useUIStore((s) => s.setSelectedView)
  const [pods, setPods] = useState<PodInfo[]>([])

  useEffect(() => {
    if (!selectedContext) {
      setPods([])
      return
    }
    const reload = () => {
      api
        .listPods(selectedContext, '')
        .then((list) => setPods(list ?? []))
        .catch(() => setPods([]))
    }
    reload()
    return onKubeChange('Pod', (ctx) => {
      if (ctx === selectedContext) reload()
    })
  }, [selectedContext])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'p' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Pod search"
      description="Jump to any pod across the cluster"
    >
      <CommandInput placeholder="Search pods (namespace, name)…" />
      <CommandList>
        <CommandEmpty>
          {selectedContext ? 'No matching pods.' : 'Select a context first.'}
        </CommandEmpty>
        {pods.length > 0 && (
          <CommandGroup heading={`Pods (${pods.length})`}>
            {pods.map((p) => (
              <CommandItem
                key={`${p.namespace}/${p.name}`}
                value={`${p.namespace}/${p.name}`}
                onSelect={() => {
                  setSelectedView('pods')
                  setSelectedResource({ kind: 'Pod', namespace: p.namespace, name: p.name })
                  setOpen(false)
                }}
              >
                <Box />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{p.name}</div>
                  <div className="truncate text-[10px] text-muted-foreground">
                    {p.namespace} · {p.status} · {p.ready}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
