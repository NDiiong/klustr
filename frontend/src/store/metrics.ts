import { create } from 'zustand'
import type { NodeMetrics, PodMetrics } from '@/lib/api'

export type MetricsByPod = Record<string, PodMetrics>
export type MetricsByNode = Record<string, NodeMetrics>

type MetricsState = {
  available: Record<string, boolean>
  byPodByContext: Record<string, MetricsByPod>
  byNodeByContext: Record<string, MetricsByNode>
  setPodMetrics: (ctx: string, list: PodMetrics[]) => void
  setNodeMetrics: (ctx: string, list: NodeMetrics[]) => void
  setUnavailable: (ctx: string) => void
  clearContext: (ctx: string) => void
  reset: () => void
}

export function podKey(namespace: string, name: string): string {
  return namespace + '/' + name
}

export const useMetrics = create<MetricsState>((set) => ({
  available: {},
  byPodByContext: {},
  byNodeByContext: {},
  setNodeMetrics: (ctx, list) =>
    set((s) => {
      const byNode: MetricsByNode = {}
      for (const m of list) byNode[m.name] = m
      return {
        // metrics-server availability is shared with pods; only flip it true
        // here (a node poll returning empty shouldn't claim metrics are down
        // while pods still report).
        available: list.length > 0 ? { ...s.available, [ctx]: true } : s.available,
        byNodeByContext: { ...s.byNodeByContext, [ctx]: byNode },
      }
    }),
  setPodMetrics: (ctx, list) =>
    set((s) => {
      if (list.length === 0) {
        return {
          available: { ...s.available, [ctx]: false },
          byPodByContext: { ...s.byPodByContext, [ctx]: {} },
        }
      }
      const byPod: MetricsByPod = {}
      for (const m of list) byPod[podKey(m.namespace, m.name)] = m
      return {
        available: { ...s.available, [ctx]: true },
        byPodByContext: { ...s.byPodByContext, [ctx]: byPod },
      }
    }),
  setUnavailable: (ctx) =>
    set((s) => ({
      available: { ...s.available, [ctx]: false },
      byPodByContext: { ...s.byPodByContext, [ctx]: {} },
    })),
  clearContext: (ctx) =>
    set((s) => {
      const nextAvail = { ...s.available }
      delete nextAvail[ctx]
      const nextBy = { ...s.byPodByContext }
      delete nextBy[ctx]
      const nextByNode = { ...s.byNodeByContext }
      delete nextByNode[ctx]
      return { available: nextAvail, byPodByContext: nextBy, byNodeByContext: nextByNode }
    }),
  reset: () => set({ available: {}, byPodByContext: {}, byNodeByContext: {} }),
}))

export function selectNodeMetric(ctx: string | null | undefined, name: string) {
  return (s: MetricsState): NodeMetrics | undefined => {
    if (!ctx) return undefined
    return s.byNodeByContext[ctx]?.[name]
  }
}

export function selectPodMetric(ctx: string | null | undefined, namespace: string, name: string) {
  return (s: MetricsState): PodMetrics | undefined => {
    if (!ctx) return undefined
    return s.byPodByContext[ctx]?.[podKey(namespace, name)]
  }
}

export function selectMetricsAvailable(contexts: readonly string[]) {
  return (s: MetricsState): boolean => {
    if (contexts.length === 0) return false
    for (const c of contexts) {
      if (s.available[c]) return true
    }
    return false
  }
}
