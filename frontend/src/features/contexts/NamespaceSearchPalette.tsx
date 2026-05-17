import { useEffect, useState } from 'react'
import { Folder } from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { useResources } from '@/store/resources'
import { useUIStore } from '@/store/ui'

export function NamespaceSearchPalette() {
  const [open, setOpen] = useState(false)
  const selectedContext = useUIStore((s) => s.selectedContext)
  const selectedNamespace = useUIStore((s) => s.selectedNamespace)
  const setSelectedNamespace = useUIStore((s) => s.setSelectedNamespace)
  const namespaces = useResources((s) => s.namespaces)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'n' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const select = (ns: string | null) => {
    setSelectedNamespace(ns)
    setOpen(false)
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Namespace search"
      description="Switch to any namespace in the current context"
    >
      <CommandInput placeholder="Search namespaces…" />
      <CommandList>
        <CommandEmpty>
          {selectedContext ? 'No matching namespaces.' : 'Select a context first.'}
        </CommandEmpty>
        <CommandGroup heading={`Namespaces (${namespaces.length})`}>
          <CommandItem value="__all__ All namespaces" onSelect={() => select(null)}>
            <Folder />
            <span>All namespaces</span>
            {selectedNamespace === null && (
              <span className="ml-auto text-[10px] text-muted-foreground">current</span>
            )}
          </CommandItem>
          {namespaces.map((ns) => (
            <CommandItem key={ns.name} value={ns.name} onSelect={() => select(ns.name)}>
              <Folder />
              <span className="truncate">{ns.name}</span>
              {ns.phase !== 'Active' && (
                <span className="rounded bg-muted px-1 py-px text-[10px] uppercase tracking-wide text-muted-foreground">
                  {ns.phase}
                </span>
              )}
              {ns.name === selectedNamespace && (
                <span className="ml-auto text-[10px] text-muted-foreground">current</span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
