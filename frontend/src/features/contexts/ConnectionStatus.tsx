import { useEffect, useState } from 'react'
import { api, type ServerVersion } from '@/lib/api'
import { useUIStore } from '@/store/ui'

type Status =
  | { kind: 'idle' }
  | { kind: 'pinging' }
  | { kind: 'connected'; version: ServerVersion }
  | { kind: 'error'; message: string }

export function ConnectionStatus() {
  const selected = useUIStore((s) => s.selectedContext)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  useEffect(() => {
    if (!selected) {
      setStatus({ kind: 'idle' })
      return
    }
    let cancelled = false
    setStatus({ kind: 'pinging' })
    api
      .pingContext(selected)
      .then((v) => {
        if (cancelled) return
        setStatus({ kind: 'connected', version: v })
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setStatus({ kind: 'error', message: String(e) })
      })
    return () => {
      cancelled = true
    }
  }, [selected])

  if (status.kind === 'idle') {
    return (
      <div className="text-sm text-muted-foreground">Select a kubeconfig context to get started.</div>
    )
  }

  if (status.kind === 'pinging') {
    return <div className="text-sm text-muted-foreground">Connecting to {selected}…</div>
  }

  if (status.kind === 'error') {
    return (
      <div className="max-w-xl text-center">
        <div className="text-sm font-medium text-destructive">Cannot reach {selected}</div>
        <div className="mt-2 break-words font-mono text-xs text-muted-foreground">{status.message}</div>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">Connected</div>
      <div className="mt-1 text-base font-semibold">{selected}</div>
      <div className="mt-2 text-xs text-muted-foreground">
        Kubernetes {status.version.gitVersion} · {status.version.platform}
      </div>
    </div>
  )
}
