import { create } from 'zustand'
import type { PodMetrics } from '@/lib/api'

type MetricsState = {
  available: boolean
  byPod: Record<string, PodMetrics>
  setPodMetrics: (list: PodMetrics[]) => void
  setUnavailable: () => void
  reset: () => void
}

export function podKey(namespace: string, name: string): string {
  return namespace + '/' + name
}

export const useMetrics = create<MetricsState>((set) => ({
  available: false,
  byPod: {},
  setPodMetrics: (list) => {
    if (list.length === 0) {
      set({ available: false, byPod: {} })
      return
    }
    const byPod: Record<string, PodMetrics> = {}
    for (const m of list) byPod[podKey(m.namespace, m.name)] = m
    set({ available: true, byPod })
  },
  setUnavailable: () => set({ available: false, byPod: {} }),
  reset: () => set({ available: false, byPod: {} }),
}))
