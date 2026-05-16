import { useState } from 'react'
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
import { api } from '@/lib/api'
import type { SelectedResource } from '@/store/ui'

type Props = {
  contextName: string | null
  resource: SelectedResource
}

export function PortForwardButton({ contextName, resource }: Props) {
  const [open, setOpen] = useState(false)
  const [remotePort, setRemotePort] = useState<number>(80)
  const [localPort, setLocalPort] = useState<number>(0)

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
                <span className="font-mono text-xs">
                  pod/{resource.name}
                </span>{' '}
                in <span className="font-mono text-xs">{resource.namespace}</span> to your machine.
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
