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
import { api, type CronJobInfo } from '@/lib/api'
import { onKubeChange } from '@/lib/events'
import { formatAge } from '@/lib/time'
import { useResources } from '@/store/resources'
import { useUIStore } from '@/store/ui'

const columnHelper = createColumnHelper<CronJobInfo>()

export function CronJobsView() {
  const selectedContext = useUIStore((s) => s.selectedContext)
  const selectedNamespace = useUIStore((s) => s.selectedNamespace)
  const cronJobs = useResources((s) => s.cronJobs)
  const setCronJobs = useResources((s) => s.setCronJobs)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }])
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!selectedContext) {
      setCronJobs([])
      return
    }
    let cancelled = false
    const reload = () => {
      api.listCronJobs(selectedContext, selectedNamespace ?? '').then((list) => {
        if (!cancelled) setCronJobs(list ?? [])
      })
    }
    reload()
    const unsub = onKubeChange('CronJob', (ctx) => {
      if (ctx === selectedContext) reload()
    })
    return () => {
      cancelled = true
      unsub()
    }
  }, [selectedContext, selectedNamespace, setCronJobs])

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10_000)
    return () => clearInterval(id)
  }, [])

  const columns = useMemo(
    () => [
      columnHelper.accessor('namespace', { header: 'Namespace' }),
      columnHelper.accessor('name', { header: 'Name' }),
      columnHelper.accessor('schedule', {
        header: 'Schedule',
        cell: (info) => <span className="font-mono text-xs">{info.getValue()}</span>,
      }),
      columnHelper.accessor('suspend', {
        header: 'Suspend',
        cell: (info) => (info.getValue() ? 'true' : 'false'),
      }),
      columnHelper.accessor('active', { header: 'Active' }),
      columnHelper.accessor('lastSchedule', {
        header: 'Last Schedule',
        cell: (info) => (info.getValue() ? formatAge(info.getValue()) : '—'),
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
    data: cronJobs,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (!selectedContext) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Select a kubeconfig context to see cronjobs.
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-2 text-xs text-muted-foreground">
        <span>
          {cronJobs.length} cronjob{cronJobs.length === 1 ? '' : 's'}
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
                  No cronjobs{selectedNamespace ? ` in ${selectedNamespace}` : ''}.
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
