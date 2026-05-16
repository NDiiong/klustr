import { useEffect, useState } from 'react'
import { Boxes, Folder, Network } from 'lucide-react'
import { useUIStore } from '@/store/ui'
import { usePortForwards } from '@/store/portForwards'
import { api } from '@/lib/api'

export function StatusBar() {
  const selectedContext = useUIStore((s) => s.selectedContext)
  const selectedNamespace = useUIStore((s) => s.selectedNamespace)
  const portForwards = usePortForwards((s) => s.list)
  const [serverVersion, setServerVersion] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedContext) {
      setServerVersion(null)
      return
    }
    let cancelled = false
    api
      .pingContext(selectedContext)
      .then((v) => {
        if (!cancelled) setServerVersion(v.gitVersion)
      })
      .catch(() => {
        if (!cancelled) setServerVersion(null)
      })
    return () => {
      cancelled = true
    }
  }, [selectedContext])

  return (
    <footer className="flex h-6 shrink-0 items-center gap-3 border-t border-border bg-background px-3 text-[10px] text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <Boxes className="size-3" />
        {selectedContext ?? 'no context'}
      </span>
      {selectedContext && (
        <span className="inline-flex items-center gap-1.5">
          <Folder className="size-3" />
          {selectedNamespace ?? 'all namespaces'}
        </span>
      )}
      {serverVersion && (
        <span className="font-mono">
          Kubernetes {serverVersion}
        </span>
      )}
      {portForwards.length > 0 && (
        <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
          <Network className="size-3" />
          {portForwards.length} forward{portForwards.length === 1 ? '' : 's'}
        </span>
      )}
      <span className="ml-auto font-mono">Klustr</span>
    </footer>
  )
}
