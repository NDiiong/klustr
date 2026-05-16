import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Sliders } from 'lucide-react'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { api } from '@/lib/api'
import type { ResourceKind, SelectedResource } from '@/store/ui'

const SCALABLE_KINDS: ResourceKind[] = ['Deployment', 'StatefulSet']

export function isScalable(kind: ResourceKind): boolean {
  return (SCALABLE_KINDS as readonly string[]).includes(kind)
}

type Props = {
  contextName: string | null
  resource: SelectedResource
  currentReplicas?: number
}

export function ScaleResourceButton({ contextName, resource, currentReplicas }: Props) {
  const [open, setOpen] = useState(false)
  const [replicas, setReplicas] = useState<number>(currentReplicas ?? 1)

  const scale = useMutation({
    mutationFn: async () => {
      if (!contextName) throw new Error('no context')
      await api.scaleResource(contextName, resource.kind, resource.namespace, resource.name, replicas)
    },
    onSuccess: () => {
      toast.success(`Scaled ${resource.kind.toLowerCase()}/${resource.name} to ${replicas}`)
      setOpen(false)
    },
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (o) {
          setReplicas(currentReplicas ?? 1)
          scale.reset()
        }
      }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button size="xs" variant="outline">
              <Sliders />
              Scale
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Change replica count via the scale subresource</TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scale {resource.kind}</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2">
              <p>
                Replicas for{' '}
                <span className="font-mono text-xs">
                  {resource.kind.toLowerCase()}/{resource.name}
                </span>{' '}
                in <span className="font-mono text-xs">{resource.namespace}</span>.
              </p>
              {scale.error && (
                <p className="rounded border border-destructive/40 bg-destructive/10 p-2 font-mono text-xs text-destructive break-words">
                  {String(scale.error)}
                </p>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-3">
          <label className="text-sm text-muted-foreground">Replicas</label>
          <input
            type="number"
            min={0}
            max={1000}
            value={replicas}
            onChange={(e) => setReplicas(Math.max(0, Number.parseInt(e.target.value, 10) || 0))}
            className="w-24 rounded border border-border bg-background px-2 py-1 text-sm"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={scale.isPending}>
            Cancel
          </Button>
          <Button onClick={() => scale.mutate()} disabled={scale.isPending}>
            {scale.isPending ? 'Scaling…' : 'Apply'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
