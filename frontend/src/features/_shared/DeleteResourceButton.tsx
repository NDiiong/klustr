import { useMutation } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { useUIStore, type SelectedResource } from '@/store/ui'

type Props = {
  contextName: string | null
  resource: SelectedResource
}

export function DeleteResourceButton({ contextName, resource }: Props) {
  const setSelectedResource = useUIStore((s) => s.setSelectedResource)

  const del = useMutation({
    mutationFn: async () => {
      if (!contextName) throw new Error('no context')
      await api.deleteResource(contextName, resource.kind, resource.namespace, resource.name)
    },
    onSuccess: () => {
      toast.success(`Deleted ${resource.kind.toLowerCase()}/${resource.name}`)
      setSelectedResource(null)
    },
  })

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="xs" variant="outline" className="text-destructive hover:text-destructive">
          <Trash2 />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {resource.kind}?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                This will issue <code className="font-mono text-xs">DELETE</code> against{' '}
                <span className="font-mono text-xs">{resource.kind.toLowerCase()}/{resource.name}</span>
                {resource.namespace ? (
                  <> in namespace <span className="font-mono text-xs">{resource.namespace}</span></>
                ) : null}
                . The cluster's default propagation policy applies.
              </p>
              {del.error && (
                <p className="rounded border border-destructive/40 bg-destructive/10 p-2 font-mono text-xs text-destructive break-words">
                  {String(del.error)}
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={del.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={del.isPending}
            onClick={(e) => {
              e.preventDefault()
              del.mutate()
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {del.isPending ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
