import { useEffect, useMemo, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { EventsOff, EventsOn } from '@/lib/wails/wailsjs/runtime/runtime'
import { api, type PodDetail } from '@/lib/api'
import { useThemeMode } from '@/features/_shared/useThemeMode'
import { xtermThemeFor } from '@/features/_shared/xtermTheme'
import { useUIStore } from '@/store/ui'

const TAIL_LINES = 200

type Props = {
  detail: PodDetail
}

export function PodLogsTab({ detail }: Props) {
  const selectedContext = useUIStore((s) => s.selectedContext)
  const themeMode = useThemeMode()
  const containerNames = useMemo(
    () => [...detail.initContainers.map((c) => c.name), ...detail.containers.map((c) => c.name)],
    [detail.initContainers, detail.containers],
  )
  const defaultContainer = detail.containers[0]?.name ?? detail.initContainers[0]?.name ?? ''
  const [container, setContainer] = useState(defaultContainer)
  const [error, setError] = useState<string | null>(null)
  const [streaming, setStreaming] = useState(false)
  const termHostRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const fitRef = useRef<FitAddon | null>(null)

  useEffect(() => {
    if (!termHostRef.current) return
    const term = new Terminal({
      convertEol: true,
      fontFamily:
        '"JetBrains Mono", "Geist Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: 12,
      scrollback: 10_000,
      theme: xtermThemeFor(themeMode),
    })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(termHostRef.current)
    fit.fit()
    termRef.current = term
    fitRef.current = fit

    const observer = new ResizeObserver(() => {
      try {
        fit.fit()
      } catch {
        // ignore: terminal may not be ready
      }
    })
    observer.observe(termHostRef.current)

    return () => {
      observer.disconnect()
      term.dispose()
      termRef.current = null
      fitRef.current = null
    }
    // intentionally not depending on themeMode: see effect below for live updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (termRef.current) {
      termRef.current.options.theme = xtermThemeFor(themeMode)
    }
  }, [themeMode])

  useEffect(() => {
    if (!selectedContext || !container) return
    const term = termRef.current
    if (!term) return

    term.clear()
    term.writeln(`\x1b[2m# streaming ${container} (last ${TAIL_LINES} lines)\x1b[0m`)

    let cancelled = false
    let sessionId: string | null = null
    let unsubLine: (() => void) | null = null
    let unsubClose: (() => void) | null = null

    api
      .startPodLogs(selectedContext, detail.namespace, detail.name, container, true, TAIL_LINES)
      .then((id) => {
        if (cancelled) {
          api.stopPodLogs(id).catch(() => {})
          return
        }
        sessionId = id
        setStreaming(true)
        unsubLine = EventsOn(`pod:logs:line:${id}`, (line: string) => {
          term.writeln(line)
        })
        unsubClose = EventsOn(`pod:logs:close:${id}`, (msg: string) => {
          setStreaming(false)
          if (msg) {
            term.writeln(`\x1b[31m# stream closed: ${msg}\x1b[0m`)
          } else {
            term.writeln(`\x1b[2m# stream ended\x1b[0m`)
          }
        })
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(String(e))
        setStreaming(false)
      })

    return () => {
      cancelled = true
      unsubLine?.()
      unsubClose?.()
      if (sessionId) {
        api.stopPodLogs(sessionId).catch(() => {})
        EventsOff(`pod:logs:line:${sessionId}`, `pod:logs:close:${sessionId}`)
      }
    }
  }, [selectedContext, detail.namespace, detail.name, container])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-2 text-xs">
        <label className="text-muted-foreground">Container</label>
        <select
          value={container}
          onChange={(e) => setContainer(e.target.value)}
          className="rounded border border-border bg-background px-2 py-0.5 text-xs"
        >
          {containerNames.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span className={['ml-auto', streaming ? 'text-emerald-500' : 'text-muted-foreground'].join(' ')}>
          {streaming ? '● live' : '○ idle'}
        </span>
      </div>
      {error && (
        <div className="border-b border-destructive/40 bg-destructive/10 px-4 py-2 text-xs font-mono text-destructive break-words">
          {error}
        </div>
      )}
      <div ref={termHostRef} className="min-h-0 flex-1 bg-background px-2 py-1" />
    </div>
  )
}
