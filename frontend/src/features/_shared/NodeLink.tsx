import { useUIStore } from '@/store/ui'

export function NodeLink({ name }: { name: string }) {
  const openResource = useUIStore((s) => s.openResource)
  if (!name) return <span className="text-muted-foreground">—</span>
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        openResource({ kind: 'Node', namespace: '', name })
      }}
      className="cursor-pointer text-left hover:underline"
    >
      {name}
    </button>
  )
}
