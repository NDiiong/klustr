import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'
import { useMetrics } from '@/store/metrics'

export const POD_METRICS_REFRESH_INTERVALS = [5_000, 15_000, 30_000, 60_000] as const
export const DEFAULT_POD_METRICS_REFRESH_MS = 15_000

export function usePodMetricsPoll(
  contexts: readonly string[],
  namespace: string,
  intervalMs: number = DEFAULT_POD_METRICS_REFRESH_MS,
) {
  const setPodMetrics = useMetrics((s) => s.setPodMetrics)
  const setUnavailable = useMetrics((s) => s.setUnavailable)
  const clearContext = useMetrics((s) => s.clearContext)
  const ctxKey = contexts.join('|')
  const liveContextsRef = useRef<readonly string[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const fetchMetrics = useCallback(
    async (ctx: string, ns: string, isCancelled: () => boolean = () => false) => {
      try {
        const list = await api.listPodMetrics(ctx, ns)
        if (isCancelled()) return
        setPodMetrics(ctx, list)
      } catch {
        if (isCancelled()) return
        setUnavailable(ctx)
      }
    },
    [setPodMetrics, setUnavailable],
  )

  const refresh = useCallback(async () => {
    if (contexts.length === 0) return
    setRefreshing(true)
    try {
      await Promise.all(contexts.map((ctx) => fetchMetrics(ctx, namespace)))
    } finally {
      setRefreshing(false)
    }
  }, [contexts, fetchMetrics, namespace])

  useEffect(() => {
    const previous = liveContextsRef.current
    for (const ctx of previous) {
      if (!contexts.includes(ctx)) clearContext(ctx)
    }
    liveContextsRef.current = contexts
  }, [ctxKey, contexts, clearContext])

  useEffect(() => {
    return () => {
      for (const ctx of liveContextsRef.current) clearContext(ctx)
      liveContextsRef.current = []
    }
  }, [clearContext])

  useEffect(() => {
    if (contexts.length === 0) return
    let cancelled = false

    const intervalIds: number[] = []
    for (const ctx of contexts) {
      fetchMetrics(ctx, namespace, () => cancelled)
      const id = window.setInterval(() => fetchMetrics(ctx, namespace, () => cancelled), intervalMs)
      intervalIds.push(id)
    }
    return () => {
      cancelled = true
      for (const id of intervalIds) window.clearInterval(id)
    }
  }, [ctxKey, contexts, fetchMetrics, intervalMs, namespace])

  return { refresh, refreshing }
}
