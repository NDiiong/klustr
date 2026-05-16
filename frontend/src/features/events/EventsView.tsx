import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { api, type EventInfo } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { formatAge } from '@/lib/time'
import { ErrorBox, Th, Td } from '@/features/_shared/DetailPrimitives'
import { useUIStore } from '@/store/ui'

export function EventsView() {
  const selectedContext = useUIStore((s) => s.selectedContext)
  const selectedNamespace = useUIStore((s) => s.selectedNamespace)
  const setSelectedResource = useUIStore((s) => s.setSelectedResource)
  const [events, setEvents] = useState<EventInfo[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!selectedContext) return
    setLoading(true)
    setError(null)
    try {
      const list = await api.listEvents(selectedContext, selectedNamespace ?? '', '', '')
      setEvents(list)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }, [selectedContext, selectedNamespace])

  useEffect(() => {
    refresh()
  }, [refresh])

  if (!selectedContext) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Select a kubeconfig context to see events.
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b border-border px-4 py-2 text-xs text-muted-foreground">
        <span>
          {loading ? 'Loading…' : `${events.length} event${events.length === 1 ? '' : 's'}`}
          {selectedNamespace ? ` in ${selectedNamespace}` : ' across all namespaces'}
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={refresh}
          disabled={loading}
          className="ml-auto h-7 gap-1.5 text-xs"
        >
          <RefreshCw className={`size-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      <div className="flex-1 overflow-auto px-4 py-3">
        {error && <ErrorBox>{error}</ErrorBox>}
        {!error && events.length === 0 && !loading && (
          <div className="py-8 text-center text-xs text-muted-foreground">No events.</div>
        )}
        {events.length > 0 && (
          <div className="overflow-hidden rounded border border-border">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <Th>Type</Th>
                  <Th>Reason</Th>
                  <Th>Age</Th>
                  <Th>Namespace</Th>
                  <Th>Object</Th>
                  <Th>From</Th>
                  <Th>Count</Th>
                  <Th>Message</Th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr
                    key={e.namespace + '/' + e.name}
                    className="cursor-pointer border-t border-border align-top hover:bg-muted/40"
                    onClick={() => {
                      if (!e.objectKind || !e.objectName) return
                      setSelectedResource({
                        kind: e.objectKind as any,
                        namespace: e.namespace,
                        name: e.objectName,
                      })
                    }}
                  >
                    <Td><span className={typeClass(e.type)}>{e.type}</span></Td>
                    <Td className="font-mono">{e.reason}</Td>
                    <Td className="whitespace-nowrap text-muted-foreground">{formatAge(e.lastSeen)}</Td>
                    <Td>{e.namespace || '—'}</Td>
                    <Td className="font-mono text-xs">{e.objectKind}/{e.objectName}</Td>
                    <Td className="text-muted-foreground">{e.source || '—'}</Td>
                    <Td className="font-mono">{e.count}</Td>
                    <Td className="max-w-[28rem] whitespace-pre-wrap break-words">{e.message}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function typeClass(type: string): string {
  if (type === 'Warning') return 'text-amber-600 dark:text-amber-400 font-medium'
  if (type === 'Error') return 'text-destructive font-medium'
  return 'text-muted-foreground'
}
