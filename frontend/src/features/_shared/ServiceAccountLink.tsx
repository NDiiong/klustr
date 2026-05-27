import { useUIStore } from '@/store/ui'

export function ServiceAccountLink({ namespace, name }: { namespace: string; name: string }) {
  const openResource = useUIStore((s) => s.openResource)
  if (!name) return <span className="text-muted-foreground">—</span>
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        openResource({ kind: 'ServiceAccount', namespace, name })
      }}
      className="cursor-pointer text-left hover:underline"
    >
      {name}
    </button>
  )
}
