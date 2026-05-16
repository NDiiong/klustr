import { useEffect } from 'react'
import { api } from '@/lib/api'
import { useMetrics } from '@/store/metrics'

const POLL_MS = 15_000

export function usePodMetricsPoll(contextName: string | null, namespace: string) {
  const setPodMetrics = useMetrics((s) => s.setPodMetrics)
  const setUnavailable = useMetrics((s) => s.setUnavailable)

  useEffect(() => {
    if (!contextName) {
      setUnavailable()
      return
    }
    let cancelled = false

    const tick = async () => {
      try {
        const list = await api.listPodMetrics(contextName, namespace)
        if (cancelled) return
        setPodMetrics(list)
      } catch {
        if (cancelled) return
        setUnavailable()
      }
    }

    tick()
    const id = window.setInterval(tick, POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [contextName, namespace, setPodMetrics, setUnavailable])
}
