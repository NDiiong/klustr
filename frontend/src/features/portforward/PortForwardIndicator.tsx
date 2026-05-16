import { useMutation } from '@tanstack/react-query'
import { Network, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { api } from '@/lib/api'
import { usePortForwards } from '@/store/portForwards'

export function PortForwardIndicator() {
  const list = usePortForwards((s) => s.list)
  const stop = useMutation({
    mutationFn: async (id: string) => {
      await api.stopPortForward(id)
    },
  })

  if (list.length === 0) return null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm">
          <Network className="text-emerald-500" />
          <span className="text-xs">
            {list.length} forward{list.length === 1 ? '' : 's'}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="border-b border-border px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Active port-forwards
        </div>
        <ul className="max-h-80 overflow-auto">
          {list.map((pf) => (
            <li key={pf.id} className="flex items-center gap-2 border-b border-border px-3 py-2 text-xs last:border-b-0">
              <div className="min-w-0 flex-1">
                <div className="truncate font-mono">
                  localhost:{pf.localPort} → {pf.podName}:{pf.remotePort}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {pf.namespace} · {pf.context}
                </div>
              </div>
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label="Stop port-forward"
                disabled={stop.isPending}
                onClick={() => stop.mutate(pf.id)}
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
