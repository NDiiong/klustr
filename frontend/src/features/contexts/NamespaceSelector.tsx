import { useEffect } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { api } from '@/lib/api'
import { onKubeChange } from '@/lib/events'
import { useResources } from '@/store/resources'
import { useUIStore } from '@/store/ui'

export function NamespaceSelector() {
  const selectedContext = useUIStore((s) => s.selectedContext)
  const selectedNamespace = useUIStore((s) => s.selectedNamespace)
  const setSelectedNamespace = useUIStore((s) => s.setSelectedNamespace)
  const namespaces = useResources((s) => s.namespaces)
  const setNamespaces = useResources((s) => s.setNamespaces)

  useEffect(() => {
    if (!selectedContext) {
      setNamespaces([])
      return
    }
    let cancelled = false
    const reload = () => {
      api.listNamespaces(selectedContext).then((list) => {
        if (!cancelled) setNamespaces(list ?? [])
      })
    }
    reload()
    const unsub = onKubeChange('Namespace', (ctx) => {
      if (ctx === selectedContext) reload()
    })
    return () => {
      cancelled = true
      unsub()
    }
  }, [selectedContext, setNamespaces])

  const disabled = !selectedContext
  const label = !selectedContext
    ? 'No context'
    : namespaces.length === 0
      ? 'Loading…'
      : (selectedNamespace ?? 'All namespaces')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <span className="max-w-[14rem] truncate">{label}</span>
          <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 max-w-[90vw]" align="start">
        <DropdownMenuLabel>Namespaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setSelectedNamespace(null)}>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {selectedNamespace === null ? (
              <Check className="size-3.5 shrink-0" />
            ) : (
              <span className="inline-block size-3.5 shrink-0" />
            )}
            <span className="text-sm">All namespaces</span>
          </div>
        </DropdownMenuItem>
        {namespaces.length === 0 ? (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">No namespaces.</div>
        ) : (
          namespaces.map((ns) => {
            const isSelected = selectedNamespace === ns.name
            return (
              <DropdownMenuItem key={ns.name} onSelect={() => setSelectedNamespace(ns.name)}>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  {isSelected ? (
                    <Check className="size-3.5 shrink-0" />
                  ) : (
                    <span className="inline-block size-3.5 shrink-0" />
                  )}
                  <span className="truncate text-sm">{ns.name}</span>
                  {ns.phase !== 'Active' && (
                    <span className="ml-auto rounded bg-muted px-1 py-px text-[10px] uppercase tracking-wide text-muted-foreground">
                      {ns.phase}
                    </span>
                  )}
                </div>
              </DropdownMenuItem>
            )
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
