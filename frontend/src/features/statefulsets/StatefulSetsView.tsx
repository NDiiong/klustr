import { useEffect, useMemo, useState } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { api, type StatefulSetInfo } from '@/lib/api'
import { onKubeChange } from '@/lib/events'
import { formatAge } from '@/lib/time'
import { useResources } from '@/store/resources'
import { useUIStore } from '@/store/ui'

const columnHelper = createColumnHelper<StatefulSetInfo>()

function readyClass(ready: string): string {
  const [got, want] = ready.split('/').map((n) => Number.parseInt(n, 10))
  if (Number.isNaN(got) || Number.isNaN(want)) return 'text-foreground'
  if (want === 0) return 'text-muted-foreground'
  if (got >= want) return 'text-emerald-600 dark:text-emerald-400'
  if (got === 0) return 'text-destructive'
  return 'text-amber-600 dark:text-amber-400'
}

export function StatefulSetsView() {
  const selectedContext = useUIStore((s) => s.selectedContext)
  const selectedNamespace = useUIStore((s) => s.selectedNamespace)
  const statefulSets = useResources((s) => s.statefulSets)
  const setStatefulSets = useResources((s) => s.setStatefulSets)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }])
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!selectedContext) {
      setStatefulSets([])
      return
    }
    let cancelled = false
    const reload = () => {
      api.listStatefulSets(selectedContext, selectedNamespace ?? '').then((list) => {
        if (!cancelled) setStatefulSets(list ?? [])
      })
    }
    reload()
    const unsub = onKubeChange('StatefulSet', (ctx) => {
      if (ctx === selectedContext) reload()
    })
    return () => {
      cancelled = true
      unsub()
    }
  }, [selectedContext, selectedNamespace, setStatefulSets])

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10_000)
    return () => clearInterval(id)
  }, [])

  const columns = useMemo(
    () => [
      columnHelper.accessor('namespace', { header: 'Namespace' }),
      columnHelper.accessor('name', { header: 'Name' }),
      columnHelper.accessor('ready', {
        header: 'Ready',
        cell: (info) => <span className={readyClass(info.getValue())}>{info.getValue()}</span>,
      }),
      columnHelper.accessor('service', { header: 'Service' }),
      columnHelper.accessor('images', {
        header: 'Images',
        cell: (info) => <span className="font-mono text-xs">{info.getValue()}</span>,
      }),
      columnHelper.accessor('createdAt', {
        header: 'Age',
        cell: (info) => formatAge(info.getValue()),
        sortingFn: 'datetime',
      }),
    ],
    [],
  )

  const table = useReactTable({
    data: statefulSets,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (!selectedContext) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Select a kubeconfig context to see statefulsets.
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-2 text-xs text-muted-foreground">
        <span>
          {statefulSets.length} statefulset{statefulSets.length === 1 ? '' : 's'}
          {selectedNamespace ? ` in ${selectedNamespace}` : ' across all namespaces'}
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
                  No statefulsets{selectedNamespace ? ` in ${selectedNamespace}` : ''}.
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
