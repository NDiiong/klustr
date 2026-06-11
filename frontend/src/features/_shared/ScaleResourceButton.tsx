import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Minus, Plus, Sliders } from 'lucide-react'
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
import { Spinner } from '@/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { api } from '@/lib/api'
import type { ResourceKind, SelectedResource } from '@/store/ui'

const SCALABLE_KINDS: ResourceKind[] = ['Deployment', 'StatefulSet']
const MIN_REPLICAS = 0
const MAX_REPLICAS = 1000

export function isScalable(kind: string): boolean {
  return (SCALABLE_KINDS as readonly string[]).includes(kind)
}

type Props = {
  contextName: string | null
  resource: SelectedResource
}

type DialogProps = Props & {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ScaleResourceButton({ contextName, resource }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
      <ScaleResourceDialogContent
        contextName={contextName}
        resource={resource}
        open={open}
        onOpenChange={setOpen}
      />
    </Dialog>
  )
}

export function ScaleResourceDialog({ contextName, resource, open, onOpenChange }: DialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ScaleResourceDialogContent
        contextName={contextName}
        resource={resource}
        open={open}
        onOpenChange={onOpenChange}
      />
    </Dialog>
  )
}

function ScaleResourceDialogContent({ contextName, resource, open, onOpenChange }: DialogProps) {
  const [replicas, setReplicas] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !contextName) return
    setLoading(true)
    setLoadError(null)
    const fetcher =
      resource.kind === 'Deployment' ? api.getDeployment : api.getStatefulSet
    fetcher(contextName, resource.namespace, resource.name)
      .then((d) => setReplicas(d.replicas ?? 0))
      .catch((err) => setLoadError(String(err)))
      .finally(() => setLoading(false))
  }, [open, contextName, resource.kind, resource.namespace, resource.name])

  const scale = useMutation({
    mutationFn: async () => {
      if (!contextName) throw new Error('no context')
      await api.scaleResource(contextName, resource.kind, resource.namespace, resource.name, replicas)
    },
    onSuccess: () => {
      toast.success(`Scaled ${resource.kind.toLowerCase()}/${resource.name} to ${replicas}`)
      onOpenChange(false)
    },
  })

  const clamp = (n: number) => Math.min(MAX_REPLICAS, Math.max(MIN_REPLICAS, n))
  const bump = (delta: number) => setReplicas((r) => clamp(r + delta))

  return (
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold tracking-normal">
            Scale {resource.kind}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                Replicas for{' '}
                <span className="allow-select rounded bg-muted px-1.5 py-0.5 font-mono text-[13px] text-foreground">
                  {resource.kind.toLowerCase()}/{resource.name}
                </span>{' '}
                in{' '}
                <span className="allow-select rounded bg-muted px-1.5 py-0.5 font-mono text-[13px] text-foreground">
                  {resource.namespace}
                </span>
                .
              </p>
              {loadError && (
                <p className="rounded border border-destructive/40 bg-destructive/10 p-2 font-mono text-xs leading-5 text-destructive break-words">
                  Failed to read current replicas: {loadError}
                </p>
              )}
              {scale.error && (
                <p className="rounded border border-destructive/40 bg-destructive/10 p-2 font-mono text-xs leading-5 text-destructive break-words">
                  {String(scale.error)}
                </p>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-3">
          <label htmlFor="scale-replicas-input" className="text-sm font-medium text-foreground">
            Replicas
          </label>
          <div className="flex items-center rounded-md border border-border bg-background">
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Decrement replicas"
              onClick={() => bump(-1)}
              disabled={loading || replicas <= MIN_REPLICAS}
              className="rounded-r-none"
            >
              <Minus />
            </Button>
            <input
              id="scale-replicas-input"
              type="number"
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              min={MIN_REPLICAS}
              max={MAX_REPLICAS}
              value={loading ? '' : replicas}
              disabled={loading}
              onChange={(e) =>
                setReplicas(clamp(Number.parseInt(e.target.value, 10) || 0))
              }
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  bump(1)
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  bump(-1)
                }
              }}
              className="h-8 w-20 bg-transparent text-center text-sm font-medium focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Increment replicas"
              onClick={() => bump(1)}
              disabled={loading || replicas >= MAX_REPLICAS}
              className="rounded-l-none"
            >
              <Plus />
            </Button>
          </div>
          {loading && <Spinner size="lg" />}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={scale.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => scale.mutate()}
            disabled={scale.isPending || loading || loadError !== null}
          >
            {scale.isPending ? 'Scaling…' : 'Apply'}
          </Button>
        </DialogFooter>
      </DialogContent>
  )
}
