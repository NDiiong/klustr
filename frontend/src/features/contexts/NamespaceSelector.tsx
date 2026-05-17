import { useEffect, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
  const [open, setOpen] = useState(false)

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

  const select = (ns: string | null) => {
    setSelectedNamespace(ns)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <span className="max-w-[14rem] truncate">{label}</span>
          <ChevronDown />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 max-w-[90vw] p-0" align="start">
        <Command>
          <CommandInput placeholder="Filter namespaces…" />
          <CommandList>
            <CommandEmpty>No namespaces match.</CommandEmpty>
            <CommandGroup heading="Namespaces">
              <CommandItem value="__all__ All namespaces" onSelect={() => select(null)}>
                {selectedNamespace === null ? (
                  <Check className="size-3.5 shrink-0" />
                ) : (
                  <span className="inline-block size-3.5 shrink-0" />
                )}
                <span className="text-sm">All namespaces</span>
              </CommandItem>
              {namespaces.map((ns) => {
                const isSelected = selectedNamespace === ns.name
                return (
                  <CommandItem key={ns.name} value={ns.name} onSelect={() => select(ns.name)}>
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
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
