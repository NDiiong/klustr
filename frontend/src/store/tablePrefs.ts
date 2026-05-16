import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ColumnPrefs = {
  order: string[]
  hidden: string[]
  sizing: Record<string, number>
}

type State = {
  byKind: Record<string, ColumnPrefs>
  setOrder: (kind: string, order: string[]) => void
  setHidden: (kind: string, hidden: string[]) => void
  setSizing: (kind: string, sizing: Record<string, number>) => void
  reset: (kind: string) => void
}

export const useTablePrefs = create<State>()(
  persist(
    (set) => ({
      byKind: {},
      setOrder: (kind, order) =>
        set((s) => ({ byKind: { ...s.byKind, [kind]: { ...prefsFor(s, kind), order } } })),
      setHidden: (kind, hidden) =>
        set((s) => ({ byKind: { ...s.byKind, [kind]: { ...prefsFor(s, kind), hidden } } })),
      setSizing: (kind, sizing) =>
        set((s) => ({ byKind: { ...s.byKind, [kind]: { ...prefsFor(s, kind), sizing } } })),
      reset: (kind) =>
        set((s) => {
          const next = { ...s.byKind }
          delete next[kind]
          return { byKind: next }
        }),
    }),
    { name: 'klustr.tablePrefs' },
  ),
)

function prefsFor(s: State, kind: string): ColumnPrefs {
  return s.byKind[kind] ?? { order: [], hidden: [], sizing: {} }
}

export function selectPrefs(kind: string) {
  return (s: State): ColumnPrefs => s.byKind[kind] ?? { order: [], hidden: [], sizing: {} }
}
