import { useEffect, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { onKubeChange } from '@/lib/events'
import { useUIStore } from '@/store/ui'

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
}: ResourceTableProps<T>) {
  const selectedContext = useUIStore((s) => s.selectedContext)
  const selectedNamespace = useUIStore((s) => s.selectedNamespace)
  const namespaceArg = scope === 'namespaced' ? selectedNamespace : null
  const [sorting, setSorting] = useState<SortingState>(defaultSort ?? [{ id: 'name', desc: false }])
  const [, setTick] = useState(0)

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
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (!selectedContext) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Select a kubeconfig context to see {noun.plural}.
      </div>
    )
  }

  const count = `${data.length} ${data.length === 1 ? noun.singular : noun.plural}`
  const scopeLabel =
    scope === 'namespaced'
      ? namespaceArg
        ? ` in ${namespaceArg}`
        : ' across all namespaces'
      : ''

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-2 text-xs text-muted-foreground">
        <span>
          {count}
          {scopeLabel}
        </span>
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
                  No {noun.plural}
                  {scope === 'namespaced' && namespaceArg ? ` in ${namespaceArg}` : ''}.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-b-0 hover:bg-muted/50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="whitespace-nowrap px-3 py-1.5 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
