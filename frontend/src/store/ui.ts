import { create } from 'zustand'

type UIState = {
  selectedContext: string | null
  setSelectedContext: (name: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  selectedContext: null,
  setSelectedContext: (name) => set({ selectedContext: name }),
}))
