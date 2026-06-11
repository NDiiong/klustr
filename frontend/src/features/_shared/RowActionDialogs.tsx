import { DeleteResourceDialog } from './DeleteResourceButton'
import { PauseDeploymentDialog } from './PauseDeploymentButton'
import { RestartWorkloadDialog } from './RestartWorkloadButton'
import { ScaleResourceDialog } from './ScaleResourceButton'
import {
  DeleteArgoApplicationDialog,
  isArgoApplication,
} from '@/features/argocd/DeleteArgoApplicationButton'
import { PortForwardDialog } from '@/features/portforward/PortForwardButton'
import { ResizePodDialog } from '@/features/pods/ResizePodButton'
import { useUIStore } from '@/store/ui'

export function RowActionDialogs() {
  const selectedContext = useUIStore((s) => s.selectedContext)
  const pendingAction = useUIStore((s) => s.pendingAction)
  const setPendingAction = useUIStore((s) => s.setPendingAction)

  if (!pendingAction) return null

  const contextName = pendingAction.resource.context ?? selectedContext

  const close = () => setPendingAction(null)
  const onOpenChange = (o: boolean) => {
    if (!o) close()
  }

  if (pendingAction.kind === 'delete') {
    if (isArgoApplication(pendingAction.resource)) {
      return (
        <DeleteArgoApplicationDialog
          contextName={contextName}
          resource={pendingAction.resource}
          open
          onOpenChange={onOpenChange}
        />
      )
    }
    return (
      <DeleteResourceDialog
        contextName={contextName}
        resource={pendingAction.resource}
        open
        onOpenChange={onOpenChange}
      />
    )
  }

  if (pendingAction.kind === 'restart') {
    return (
      <RestartWorkloadDialog
        contextName={contextName}
        resource={pendingAction.resource}
        open
        onOpenChange={onOpenChange}
      />
    )
  }

  if (pendingAction.kind === 'pause') {
    return (
      <PauseDeploymentDialog
        contextName={contextName}
        resource={pendingAction.resource}
        open
        onOpenChange={onOpenChange}
      />
    )
  }

  if (pendingAction.kind === 'scale') {
    return (
      <ScaleResourceDialog
        contextName={contextName}
        resource={pendingAction.resource}
        open
        onOpenChange={onOpenChange}
      />
    )
  }

  if (pendingAction.kind === 'resize-pod') {
    return (
      <ResizePodDialog
        contextName={contextName}
        namespace={pendingAction.resource.namespace}
        podName={pendingAction.resource.name}
        open
        onOpenChange={onOpenChange}
      />
    )
  }

  return (
    <PortForwardDialog
      contextName={contextName}
      resource={pendingAction.resource}
      open
      onOpenChange={onOpenChange}
    />
  )
}
