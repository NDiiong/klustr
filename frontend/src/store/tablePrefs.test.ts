import { beforeEach, describe, expect, it } from 'vitest'
import { selectPrefs, useTablePrefs } from './tablePrefs'

const emptyPrefs = { order: [], hidden: [], sizing: {} }

function reset() {
  localStorage.clear()
  useTablePrefs.setState({ byKind: {} })
}

describe('useTablePrefs', () => {
  beforeEach(reset)

  it('returns empty defaults via selectPrefs for unknown kinds', () => {
    const prefs = selectPrefs('Pod')(useTablePrefs.getState())
    expect(prefs).toEqual(emptyPrefs)
  })

  it('persists order, hidden and sizing per kind', () => {
    const { setOrder, setHidden, setSizing } = useTablePrefs.getState()
    setOrder('Pod', ['name', 'status'])
    setHidden('Pod', ['age'])
    setSizing('Pod', { name: 200 })

    const prefs = selectPrefs('Pod')(useTablePrefs.getState())
    expect(prefs.order).toEqual(['name', 'status'])
    expect(prefs.hidden).toEqual(['age'])
    expect(prefs.sizing).toEqual({ name: 200 })
  })

  it('keeps kinds isolated from each other', () => {
    useTablePrefs.getState().setOrder('Pod', ['a', 'b'])
    useTablePrefs.getState().setOrder('Service', ['x'])

    expect(selectPrefs('Pod')(useTablePrefs.getState()).order).toEqual(['a', 'b'])
    expect(selectPrefs('Service')(useTablePrefs.getState()).order).toEqual(['x'])
  })

  it('reset removes prefs for a single kind only', () => {
    useTablePrefs.getState().setOrder('Pod', ['a'])
    useTablePrefs.getState().setOrder('Service', ['x'])

    useTablePrefs.getState().reset('Pod')

    expect(selectPrefs('Pod')(useTablePrefs.getState())).toEqual(emptyPrefs)
    expect(selectPrefs('Service')(useTablePrefs.getState()).order).toEqual(['x'])
  })

  it('writes through zustand/persist to localStorage', () => {
    useTablePrefs.getState().setOrder('Pod', ['name'])
    const raw = localStorage.getItem('klustr.tablePrefs')
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw ?? '{}') as { state: { byKind: Record<string, unknown> } }
    expect(parsed.state.byKind.Pod).toMatchObject({ order: ['name'] })
  })
})
