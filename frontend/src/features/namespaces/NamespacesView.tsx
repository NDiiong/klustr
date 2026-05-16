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
import { type NamespaceInfo } from '@/lib/api'
import { formatAge } from '@/lib/time'
import { useResources } from '@/store/resources'
import { useUIStore } from '@/store/ui'

const columnHelper = createColumnHelper<NamespaceInfo>()

function phaseClass(phase: string): string {
  if (phase === 'Active') return 'text-emerald-600 dark:text-emerald-400'
  if (phase === 'Terminating') return 'text-amber-600 dark:text-amber-400'
  return 'text-muted-foreground'
}

export function NamespacesView() {
  const selectedContext = useUIStore((s) => s.selectedContext)
  const namespaces = useResources((s) => s.namespaces)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }])
  const [, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10_000)
    return () => clearInterval(id)
  }, [])

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', { header: 'Name' }),
      columnHelper.accessor('phase', {
        header: 'Status',
        cell: (info) => <span className={phaseClass(info.getValue())}>{info.getValue()}</span>,
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
    data: namespaces,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (!selectedContext) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Select a kubeconfig context to see namespaces.
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-2 text-xs text-muted-foreground">
        <span>
          {namespaces.length} namespace{namespaces.length === 1 ? '' : 's'}
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
                  No namespaces.
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
