import { useEffect, useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Network } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { api, type ContainerPort, type PodDetail } from '@/lib/api'
import type { SelectedResource } from '@/store/ui'

type Props = {
  contextName: string | null
  resource: SelectedResource
}

type PortOption = ContainerPort & { containerName: string }

export function PortForwardButton({ contextName, resource }: Props) {
  const [open, setOpen] = useState(false)
  const [remotePort, setRemotePort] = useState<number>(80)
  const [localPort, setLocalPort] = useState<number>(0)
  const [detail, setDetail] = useState<PodDetail | null>(null)

  useEffect(() => {
    if (!open || !contextName) return
    let cancelled = false
    api
      .getPod(contextName, resource.namespace, resource.name)
      .then((d) => {
        if (!cancelled) setDetail(d)
      })
      .catch(() => {
        /* fall back to manual entry */
      })
    return () => {
      cancelled = true
    }
  }, [open, contextName, resource.namespace, resource.name])

  const suggestions = useMemo<PortOption[]>(() => {
    if (!detail) return []
    const all: PortOption[] = []
    for (const c of detail.containers) {
      for (const p of c.ports ?? []) {
        all.push({ ...p, containerName: c.name })
      }
    }
    return all
  }, [detail])

  useEffect(() => {
    if (suggestions.length > 0) {
      setRemotePort(suggestions[0].containerPort)
    }
  }, [suggestions])

  const start = useMutation({
    mutationFn: async () => {
      if (!contextName) throw new Error('no context')
      return api.startPortForward(contextName, resource.namespace, resource.name, localPort, remotePort)
    },
    onSuccess: (info) => {
      toast.success(`Forwarding localhost:${info.localPort} → ${resource.name}:${info.remotePort}`)
      setOpen(false)
    },
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (o) start.reset()
        else setDetail(null)
      }}
    >
      <DialogTrigger asChild>
        <Button size="xs" variant="outline">
          <Network />
          Forward
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Port-forward</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2">
              <p>
                Forward a container port from{' '}
                <span className="font-mono text-xs">pod/{resource.name}</span> in{' '}
                <span className="font-mono text-xs">{resource.namespace}</span> to your machine.
                Set the local port to <span className="font-mono text-xs">0</span> to let the OS
                pick a free one.
              </p>
              {start.error && (
                <p className="rounded border border-destructive/40 bg-destructive/10 p-2 font-mono text-xs text-destructive break-words">
                  {String(start.error)}
                </p>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        {suggestions.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Container ports</div>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((p, i) => {
                const active = remotePort === p.containerPort
                return (
                  <button
                    key={`${p.containerName}-${p.containerPort}-${i}`}
                    type="button"
                    onClick={() => setRemotePort(p.containerPort)}
                    className={[
                      'rounded border px-2 py-0.5 font-mono text-xs',
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-foreground hover:bg-muted',
                    ].join(' ')}
                  >
                    {p.name ? `${p.name} ` : ''}
                    {p.containerPort}/{p.protocol}
                    <span className="ml-1 text-[10px] opacity-70">{p.containerName}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <label className="w-28 text-sm text-muted-foreground">Local port</label>
          <input
            type="number"
            min={0}
            max={65535}
            value={localPort}
            onChange={(e) => setLocalPort(Math.max(0, Number.parseInt(e.target.value, 10) || 0))}
            className="w-28 rounded border border-border bg-background px-2 py-1 text-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="w-28 text-sm text-muted-foreground">Remote port</label>
          <input
            type="number"
            min={1}
            max={65535}
            value={remotePort}
            onChange={(e) => setRemotePort(Math.max(1, Number.parseInt(e.target.value, 10) || 1))}
            className="w-28 rounded border border-border bg-background px-2 py-1 text-sm"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={start.isPending}>
            Cancel
          </Button>
          <Button onClick={() => start.mutate()} disabled={start.isPending}>
            {start.isPending ? 'Starting…' : 'Start'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
