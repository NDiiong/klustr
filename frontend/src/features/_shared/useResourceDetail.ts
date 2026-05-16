import { useEffect, useState } from 'react'
import { onKubeChange } from '@/lib/events'

export function useResourceDetail<T>(
  contextName: string | null,
  kind: string,
  load: (ctx: string) => Promise<T>,
) {
  const [detail, setDetail] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!contextName) {
      setDetail(null)
      setError(null)
      return
    }
    let cancelled = false
    const reload = () => {
      load(contextName)
        .then((d) => {
          if (cancelled) return
          setDetail(d)
          setError(null)
        })
        .catch((e: unknown) => {
          if (cancelled) return
          setError(String(e))
          setDetail(null)
        })
    }
    reload()
    const unsub = onKubeChange(kind, (ctx) => {
      if (ctx === contextName) reload()
    })
    return () => {
      cancelled = true
      unsub()
    }
  }, [contextName, kind, load])

  return { detail, error }
}
