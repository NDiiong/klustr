import { DeleteResourceDialog } from './DeleteResourceButton'
import { PortForwardDialog } from '@/features/portforward/PortForwardButton'
import { useUIStore } from '@/store/ui'

export function RowActionDialogs() {
  const contextName = useUIStore((s) => s.selectedContext)
  const pendingAction = useUIStore((s) => s.pendingAction)
  const setPendingAction = useUIStore((s) => s.setPendingAction)

  if (!pendingAction) return null

  const close = () => setPendingAction(null)

  if (pendingAction.kind === 'delete') {
    return (
      <DeleteResourceDialog
        contextName={contextName}
        resource={pendingAction.resource}
        open
        onOpenChange={(o) => {
          if (!o) close()
        }}
      />
    )
  }

  return (
    <PortForwardDialog
      contextName={contextName}
      resource={pendingAction.resource}
      open
      onOpenChange={(o) => {
        if (!o) close()
      }}
    />
  )
}
