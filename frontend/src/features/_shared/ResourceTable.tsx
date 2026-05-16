import { useEffect, useRef, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ChevronsUpDown, Search, X } from 'lucide-react'
import { onKubeChange } from '@/lib/events'
import { useUIStore } from '@/store/ui'

type RowIdentity = { namespace?: string; name?: string }

type Scope = 'namespaced' | 'cluster'

type Noun = { singular: string; plural: string }

export type ResourceTableProps<T> = {
  kind: string
  noun: Noun
  scope: Scope
  data: T[]
  setData: (list: T[]) => void
  fetch: (contextName: string, namespace: string) => Promise<T[]>
  columns: ColumnDef<T, any>[]
  defaultSort?: SortingState
  onRowClick?: (row: T) => void
}

function identityKey(r: RowIdentity): string {
  return `${r.namespace ?? ''}/${r.name ?? ''}`
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

export function ResourceTable<T>({
  kind,
  noun,
  scope,
  data,
  setData,
  fetch,
  columns,
  defaultSort,
  onRowClick,
}: ResourceTableProps<T>) {
  const selectedContext = useUIStore((s) => s.selectedContext)
  const selectedNamespace = useUIStore((s) => s.selectedNamespace)
  const selectedResource = useUIStore((s) => s.selectedResource)
  const lastSelectedResource = useUIStore((s) => s.lastSelectedResource)
  const namespaceArg = scope === 'namespaced' ? selectedNamespace : null
  const [sorting, setSorting] = useState<SortingState>(defaultSort ?? [{ id: 'name', desc: false }])
  const [filter, setFilter] = useState('')
  const [, setTick] = useState(0)
  const filterRef = useRef<HTMLInputElement>(null)
  const [flashKey, setFlashKey] = useState<string | null>(null)

  // When the detail panel closes we flash the row that was just open.
  useEffect(() => {
    if (selectedResource) return
    if (!lastSelectedResource) return
    const key = identityKey(lastSelectedResource)
    setFlashKey(key)
    const id = window.setTimeout(() => setFlashKey(null), 1_200)
    return () => window.clearTimeout(id)
  }, [selectedResource, lastSelectedResource])

  // Drop filter input when the table contents drop to 0 on context/namespace change
  useEffect(() => {
    if (data.length === 0) setFilter('')
  }, [data.length])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
      if (isEditableTarget(e.target)) return
      e.preventDefault()
      filterRef.current?.focus()
      filterRef.current?.select()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!selectedContext) {
      setData([])
      return
    }
    let cancelled = false
    const reload = () => {
      fetch(selectedContext, namespaceArg ?? '').then((list) => {
        if (!cancelled) setData(list ?? [])
      })
    }
    reload()
    const unsub = onKubeChange(kind, (ctx) => {
      if (ctx === selectedContext) reload()
    })
    return () => {
      cancelled = true
      unsub()
    }
  }, [selectedContext, namespaceArg, kind, fetch, setData])

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10_000)
    return () => clearInterval(id)
  }, [])

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter: filter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  if (!selectedContext) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Select a kubeconfig context to see {noun.plural}.
      </div>
    )
  }

  const filteredCount = table.getRowModel().rows.length
  const total = data.length
  const countLabel = filter
    ? `${filteredCount} of ${total} ${total === 1 ? noun.singular : noun.plural}`
    : `${total} ${total === 1 ? noun.singular : noun.plural}`
  const scopeLabel =
    scope === 'namespaced'
      ? namespaceArg
        ? ` in ${namespaceArg}`
        : ' across all namespaces'
      : ''

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b border-border px-4 py-2 text-xs text-muted-foreground">
        <span className="min-w-0">
          {countLabel}
          {scopeLabel}
        </span>
        <div className="relative ml-auto w-64 max-w-full">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/70" />
          <input
            ref={filterRef}
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                if (filter) setFilter('')
                else filterRef.current?.blur()
              }
            }}
            placeholder={`Filter ${noun.plural}   ⌨ /`}
            className="h-7 w-full rounded border border-border bg-background pl-7 pr-7 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {filter && (
            <button
              type="button"
              aria-label="Clear filter"
              onClick={() => setFilter('')}
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-background">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-border">
                {hg.headers.map((h) => {
                  const sorted = h.column.getIsSorted()
                  return (
                    <th
                      key={h.id}
                      className="cursor-pointer px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground"
                      onClick={h.column.getToggleSortingHandler()}
                    >
                      <span className="inline-flex items-center gap-1">
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {sorted === 'asc' ? (
                          <ArrowUp className="size-3" />
                        ) : sorted === 'desc' ? (
                          <ArrowDown className="size-3" />
                        ) : (
                          <ChevronsUpDown className="size-3 opacity-30" />
                        )}
                      </span>
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-8 text-center text-sm text-muted-foreground"
                >
                  {filter
                    ? `No ${noun.plural} matching "${filter}".`
                    : `No ${noun.plural}${scope === 'namespaced' && namespaceArg ? ` in ${namespaceArg}` : ''}.`}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => {
                const identity = row.original as RowIdentity
                const flashing = flashKey !== null && flashKey === identityKey(identity)
                return (
                  <tr
                    key={row.id}
                    className={[
                      'border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors',
                      onRowClick ? 'cursor-pointer' : '',
                      flashing ? 'bg-emerald-100/60 dark:bg-emerald-400/15' : '',
                    ].join(' ')}
                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="whitespace-nowrap px-3 py-1.5 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
