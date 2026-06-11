import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Pause, Play } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { api, type DeploymentDetail } from '@/lib/api'
import { onKubeChange } from '@/lib/events'
import type { SelectedResource } from '@/store/ui'

export function isPausable(kind: string): boolean {
  return kind === 'Deployment'
}

type Props = {
  contextName: string | null
  resource: SelectedResource
}

type DialogProps = Props & {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PauseDeploymentButton({ contextName, resource }: Props) {
  const [paused, setPaused] = useState<boolean | null>(null)

  useEffect(() => {
    if (!contextName) {
      setPaused(null)
      return
    }
    let cancelled = false
    const reload = () => {
      api
        .getDeployment(contextName, resource.namespace, resource.name)
        .then((d: DeploymentDetail) => {
          if (cancelled) return
          setPaused(Boolean(d.paused))
        })
        .catch(() => {
          if (cancelled) return
          setPaused(null)
        })
    }
    reload()
    const unsub = onKubeChange('Deployment', (ctx) => {
      if (ctx === contextName) reload()
    })
    return () => {
      cancelled = true
      unsub()
    }
  }, [contextName, resource.namespace, resource.name])

  const toggle = useMutation({
    mutationFn: async () => {
      if (!contextName || paused === null) throw new Error('not ready')
      await api.patchDeploymentPaused(contextName, resource.namespace, resource.name, !paused)
    },
    onSuccess: () => {
      const verb = paused ? 'Resumed' : 'Paused'
      toast.success(`${verb} deployment/${resource.name}`)
    },
    onError: (e: unknown) => {
      toast.error(`Failed: ${String(e)}`)
    },
  })

  const label = paused ? 'Resume' : 'Pause'
  const Icon = paused ? Play : Pause
  const tooltip = paused
    ? 'Resume rollout — apply queued template changes'
    : 'Pause rollout — block new template changes from rolling out'

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="xs"
          variant="outline"
          onClick={() => toggle.mutate()}
          disabled={paused === null || toggle.isPending}
        >
          {toggle.isPending ? <Spinner size="lg" muted={false} /> : <Icon />}
          {label}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  )
}

export function PauseDeploymentDialog({ contextName, resource, open, onOpenChange }: DialogProps) {
  const [paused, setPaused] = useState<boolean | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !contextName) return
    let cancelled = false
    setPaused(null)
    setLoadError(null)
    api
      .getDeployment(contextName, resource.namespace, resource.name)
      .then((d: DeploymentDetail) => {
        if (cancelled) return
        setPaused(Boolean(d.paused))
      })
      .catch((e) => {
        if (cancelled) return
        setLoadError(String(e))
      })
    return () => {
      cancelled = true
    }
  }, [open, contextName, resource.namespace, resource.name])

  const toggle = useMutation({
    mutationFn: async () => {
      if (!contextName || paused === null) throw new Error('not ready')
      await api.patchDeploymentPaused(contextName, resource.namespace, resource.name, !paused)
    },
    onSuccess: () => {
      const verb = paused ? 'Resumed' : 'Paused'
      toast.success(`${verb} deployment/${resource.name}`)
      onOpenChange(false)
    },
  })

  const label = paused ? 'Resume' : 'Pause'

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) toggle.reset()
        onOpenChange(next)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base font-semibold tracking-normal">
            {label} Deployment?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                {label}{' '}
                <span className="allow-select rounded bg-muted px-1.5 py-0.5 font-mono text-[13px] text-foreground">
                  deployment/{resource.name}
                </span>
                {' '}in{' '}
                <span className="allow-select rounded bg-muted px-1.5 py-0.5 font-mono text-[13px] text-foreground">
                  {resource.namespace}
                </span>
                .
              </p>
              {loadError && (
                <p className="rounded border border-destructive/40 bg-destructive/10 p-2 font-mono text-xs leading-5 text-destructive break-words">
                  Failed to read deployment: {loadError}
                </p>
              )}
              {toggle.error && (
                <p className="rounded border border-destructive/40 bg-destructive/10 p-2 font-mono text-xs leading-5 text-destructive break-words">
                  {String(toggle.error)}
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={toggle.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={toggle.isPending || paused === null || loadError !== null}
            onClick={(e) => {
              e.preventDefault()
              toggle.mutate()
            }}
          >
            {toggle.isPending ? `${label}…` : label}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
