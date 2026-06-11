import { Copy, FileCode2, FileText, Network, Pause, RotateCcw, Scaling, ScanEye, ScrollText, Sliders, Terminal, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { useUIStore, type DetailTab, type ResourceKind, type SelectedResource } from '@/store/ui'

const POD_KINDS: ReadonlySet<ResourceKind> = new Set<ResourceKind>(['Pod'])

const WORKLOAD_LOG_KINDS: ReadonlySet<ResourceKind> = new Set<ResourceKind>([
  'Pod',
  'Deployment',
  'StatefulSet',
  'DaemonSet',
])

const RESTARTABLE_KINDS: ReadonlySet<ResourceKind> = new Set<ResourceKind>([
  'Deployment',
  'StatefulSet',
  'DaemonSet',
])

const EVENT_BEARING_KINDS: ReadonlySet<ResourceKind> = new Set<ResourceKind>([
  'Pod',
  'Deployment',
  'StatefulSet',
  'DaemonSet',
  'ReplicaSet',
  'ReplicationController',
  'Job',
  'CronJob',
  'HorizontalPodAutoscaler',
  'PodDisruptionBudget',
  'PersistentVolumeClaim',
  'PersistentVolume',
  'Node',
  'Service',
  'Ingress',
])

type Props = {
  kind: ResourceKind
  contextName: string
  namespace: string
  name: string
  canPortForward?: boolean
  podDeployment?: string
  children: React.ReactNode
}

export function RowContextMenu({
  kind,
  contextName,
  namespace,
  name,
  canPortForward,
  podDeployment,
  children,
}: Props) {
  const openResource = useUIStore((s) => s.openResource)
  const setPendingAction = useUIStore((s) => s.setPendingAction)
  const readOnly = useUIStore((s) => s.globalReadOnly)

  const resource: SelectedResource = { kind, namespace, name, context: contextName }
  const podDeploymentResource: SelectedResource | null = podDeployment
    ? { kind: 'Deployment', namespace, name: podDeployment, context: contextName }
    : null
  const isPod = POD_KINDS.has(kind)
  const hasLogs = WORKLOAD_LOG_KINDS.has(kind)
  const hasEvents = EVENT_BEARING_KINDS.has(kind)
  const isRestartable = RESTARTABLE_KINDS.has(kind)

  const open = (tab?: DetailTab) => openResource(resource, tab)

  const copy = (value: string, label: string) => {
    if (!value) return
    navigator.clipboard
      .writeText(value)
      .then(() => toast.success(`Copied ${label}`))
      .catch(() => toast.error(`Could not copy ${label}`))
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={() => open()}>
          <ScanEye />
          <span>Open details</span>
        </ContextMenuItem>
        {hasLogs && (
          <ContextMenuItem onSelect={() => open('logs')}>
            <ScrollText />
            <span>View logs</span>
          </ContextMenuItem>
        )}
        {isPod && (
          <ContextMenuItem onSelect={() => open('exec')}>
            <Terminal />
            <span>Exec shell</span>
          </ContextMenuItem>
        )}
        {isPod && canPortForward && (
          <ContextMenuItem onSelect={() => setPendingAction({ kind: 'portforward', resource })}>
            <Network />
            <span>Port-forward</span>
          </ContextMenuItem>
        )}
        {!readOnly && isPod && (
          <ContextMenuItem onSelect={() => setPendingAction({ kind: 'resize-pod', resource })}>
            <Scaling />
            <span>Resize</span>
          </ContextMenuItem>
        )}
        {!readOnly && isPod && podDeploymentResource && (
          <>
            <ContextMenuItem onSelect={() => setPendingAction({ kind: 'pause', resource: podDeploymentResource })}>
              <Pause />
              <span>Pause</span>
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => setPendingAction({ kind: 'restart', resource: podDeploymentResource })}>
              <RotateCcw />
              <span>Restart</span>
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => setPendingAction({ kind: 'scale', resource: podDeploymentResource })}>
              <Sliders />
              <span>Scale</span>
            </ContextMenuItem>
          </>
        )}
        {hasEvents && (
          <ContextMenuItem onSelect={() => open('events')}>
            <FileText />
            <span>View events</span>
          </ContextMenuItem>
        )}
        <ContextMenuItem onSelect={() => open('yaml')}>
          <FileCode2 />
          <span>Edit YAML</span>
        </ContextMenuItem>
        {!readOnly && !isPod && isRestartable && (
          <ContextMenuItem onSelect={() => setPendingAction({ kind: 'restart', resource })}>
            <RotateCcw />
            <span>Restart</span>
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => copy(name, 'name')}>
          <Copy />
          <span>Copy name</span>
        </ContextMenuItem>
        {namespace && (
          <ContextMenuItem onSelect={() => copy(namespace, 'namespace')}>
            <Copy />
            <span>Copy namespace</span>
          </ContextMenuItem>
        )}
        {!readOnly && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              variant="destructive"
              onSelect={() => setPendingAction({ kind: 'delete', resource })}
            >
              <Trash2 />
              <span>Delete</span>
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}
