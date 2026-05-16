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
import { api, type PodInfo } from '@/lib/api'
import { onKubeChange } from '@/lib/events'
import { formatAge } from '@/lib/time'
import { useResources } from '@/store/resources'
import { useUIStore } from '@/store/ui'

const columnHelper = createColumnHelper<PodInfo>()

const HEALTHY_STATUS = new Set(['Running', 'Completed'])
const PROGRESSING_STATUS = new Set([
  'Pending',
  'ContainerCreating',
  'PodInitializing',
  'Terminating',
])
const FAILURE_STATUS = new Set([
  'CrashLoopBackOff',
  'ImagePullBackOff',
  'ErrImagePull',
  'CreateContainerConfigError',
  'CreateContainerError',
  'InvalidImageName',
  'Error',
  'OOMKilled',
  'Failed',
  'Evicted',
  'DeadlineExceeded',
])

function statusClass(status: string): string {
  if (HEALTHY_STATUS.has(status)) return 'text-emerald-600 dark:text-emerald-400'
  if (status === 'Succeeded') return 'text-muted-foreground'
  if (PROGRESSING_STATUS.has(status) || status.startsWith('Init:')) {
    return 'text-amber-600 dark:text-amber-400'
  }
  if (FAILURE_STATUS.has(status) || status.startsWith('Signal:') || status.startsWith('ExitCode:')) {
    return 'text-destructive'
  }
  return 'text-foreground'
}

export function PodsView() {
  const selectedContext = useUIStore((s) => s.selectedContext)
  const selectedNamespace = useUIStore((s) => s.selectedNamespace)
  const pods = useResources((s) => s.pods)
  const setPods = useResources((s) => s.setPods)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }])
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!selectedContext) {
      setPods([])
      return
    }
    let cancelled = false
    const reload = () => {
      api.listPods(selectedContext, selectedNamespace ?? '').then((list) => {
        if (!cancelled) setPods(list ?? [])
      })
    }
    reload()
    const unsub = onKubeChange('Pod', (ctx) => {
      if (ctx === selectedContext) reload()
    })
    return () => {
      cancelled = true
      unsub()
    }
  }, [selectedContext, selectedNamespace, setPods])

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10_000)
    return () => clearInterval(id)
  }, [])

  const columns = useMemo(
    () => [
      columnHelper.accessor('namespace', { header: 'Namespace' }),
      columnHelper.accessor('name', { header: 'Name' }),
      columnHelper.accessor('ready', { header: 'Ready' }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => <span className={statusClass(info.getValue())}>{info.getValue()}</span>,
      }),
      columnHelper.accessor('restarts', { header: 'Restarts' }),
      columnHelper.accessor('node', { header: 'Node' }),
      columnHelper.accessor('podIP', { header: 'IP' }),
      columnHelper.accessor('createdAt', {
        header: 'Age',
        cell: (info) => formatAge(info.getValue()),
        sortingFn: 'datetime',
      }),
    ],
    [],
  )

  const table = useReactTable({
    data: pods,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (!selectedContext) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Select a kubeconfig context to see pods.
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-2 text-xs text-muted-foreground">
        <span>
          {pods.length} pod{pods.length === 1 ? '' : 's'}
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
                  No pods{selectedNamespace ? ` in ${selectedNamespace}` : ''}.
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
