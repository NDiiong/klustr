import { create } from 'zustand'

type UIState = {
  selectedContext: string | null
  selectedNamespace: string | null
  setSelectedContext: (name: string | null) => void
  setSelectedNamespace: (name: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  selectedContext: null,
  selectedNamespace: null,
  setSelectedContext: (name) =>
    set((s) => (s.selectedContext === name ? s : { selectedContext: name, selectedNamespace: null })),
  setSelectedNamespace: (name) => set({ selectedNamespace: name }),
}))
