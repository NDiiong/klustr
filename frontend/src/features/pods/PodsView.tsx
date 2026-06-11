import { useMemo, useState } from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import { RefreshCw } from 'lucide-react'
import { api, type PodInfo } from '@/lib/api'
import { formatAge } from '@/lib/time'
import { namespaceQuery } from '@/lib/namespaceFilter'
import { ResourceTable } from '@/features/_shared/ResourceTable'
import { COL_MD, COL_SM, COL_XS } from '@/features/_shared/columnSizes'
import { useResources } from '@/store/resources'
import { useActiveContexts, useUIStore } from '@/store/ui'
import { podKey, selectPodMetric, useMetrics } from '@/store/metrics'
import { Button } from '@/components/ui/button'
import {
  DEFAULT_POD_METRICS_REFRESH_MS,
  POD_METRICS_REFRESH_INTERVALS,
  usePodMetricsPoll,
} from './usePodMetricsPoll'
import { PodResourceBars } from './PodResourceBars'
import { PodContainerSquares } from './PodContainerSquares'


const columnHelper = createColumnHelper<PodInfo & { __klustrCtx?: string }>()
type PodRow = PodInfo & { __klustrCtx?: string }

const HEALTHY_STATUS = new Set(['Running'])
const TERMINAL_STATUS = new Set(['Completed', 'Succeeded'])
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

function PodUsageCell({ pod, ctx }: { pod: PodInfo; ctx: string }) {
  const m = useMetrics(selectPodMetric(ctx, pod.namespace, pod.name))
  return (
    <PodResourceBars
      cpuUsageMC={m?.cpuMC ?? 0}
      cpuRequestMC={pod.cpuRequestMC}
      cpuLimitMC={pod.cpuLimitMC}
      memUsageB={m?.memB ?? 0}
      memRequestB={pod.memRequestB}
      memLimitB={pod.memLimitB}
      volUsageB={m?.volumeUsageB ?? 0}
      volRequestB={pod.volumeRequestB || pod.pvcRequestB || 0}
      volLimitB={m?.volumeLimitB || pod.volumeLimitB || 0}
      volStatsAvailable={m?.volumeStatsAvailable ?? false}
    />
  )
}

function RestartBadge({ value }: { value: number }) {
  let cls = 'text-muted-foreground'
  if (value > 0) cls = 'text-destructive font-medium'
  return <span className={cls}>{value}</span>
}

function statusClass(status: string): string {
  if (HEALTHY_STATUS.has(status)) return 'text-emerald-600 dark:text-emerald-400'
  if (TERMINAL_STATUS.has(status)) return 'text-muted-foreground'
  if (PROGRESSING_STATUS.has(status) || status.startsWith('Init:')) {
    return 'text-amber-600 dark:text-amber-400'
  }
  if (FAILURE_STATUS.has(status) || status.startsWith('Signal:') || status.startsWith('ExitCode:')) {
    return 'text-destructive'
  }
  return 'text-foreground'
}

function formatCPU(mc: number): string {
  if (mc <= 0) return '—'
  if (mc < 1000) return mc + 'm'
  return (mc / 1000).toFixed(mc % 1000 === 0 ? 0 : 2)
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '—'
  const units = ['B', 'Ki', 'Mi', 'Gi', 'Ti']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return value.toFixed(value >= 100 || unit === 0 ? 0 : 1) + units[unit]
}

function formatPercent(value: number): string {
  if (!Number.isFinite(value) || value < 0) return '—'
  return value.toFixed(1) + '%'
}

function usageClass(percent: number): string {
  if (percent > 95) return 'text-destructive font-medium'
  if (percent > 80) return 'text-amber-600 dark:text-amber-400 font-medium'
  return ''
}

function NumericCell({
  value,
  format,
  className = '',
}: {
  value: number
  format: (value: number) => string
  className?: string
}) {
  return <span className={['tabular-nums', className].filter(Boolean).join(' ')}>{format(value)}</span>
}

function TextCell({ value }: { value: string }) {
  return <span title={value}>{value || '—'}</span>
}

function formatRefreshInterval(ms: number): string {
  return ms < 60_000 ? `${ms / 1000}s` : `${ms / 60_000}m`
}

export function PodsView() {
  const pods = useResources((s) => s.pods)
  const setPods = useResources((s) => s.setPods)
  const setSelectedResource = useUIStore((s) => s.setSelectedResource)
  const activeContexts = useActiveContexts()
  const selectedNamespaces = useUIStore((s) => s.selectedNamespaces)
  const metricsByContext = useMetrics((s) => s.byPodByContext)
  const [refreshIntervalMs, setRefreshIntervalMs] = useState(DEFAULT_POD_METRICS_REFRESH_MS)
  const metricsNamespace = namespaceQuery(selectedNamespaces).apiNamespace
  const { refresh, refreshing } = usePodMetricsPoll(activeContexts, metricsNamespace, refreshIntervalMs)

  const columns = useMemo(() => {
    const podMetric = (row: PodRow) => {
      const ctx = row.__klustrCtx ?? ''
      return metricsByContext[ctx]?.[podKey(row.namespace, row.name)]
    }
    const cpuUsage = (row: PodRow) => podMetric(row)?.cpuMC ?? 0
    const cpuLimit = (row: PodRow) => row.cpuLimitMC
    const cpuPercent = (row: PodRow) => (cpuLimit(row) > 0 ? (cpuUsage(row) / cpuLimit(row)) * 100 : -1)
    const memUsage = (row: PodRow) => podMetric(row)?.memB ?? 0
    const memLimit = (row: PodRow) => row.memLimitB
    const memPercent = (row: PodRow) => (memLimit(row) > 0 ? (memUsage(row) / memLimit(row)) * 100 : -1)
    const volUsage = (row: PodRow) => {
      const metric = podMetric(row)
      return metric?.volumeStatsAvailable ? metric.volumeUsageB : 0
    }
    const volLimit = (row: PodRow) => {
      const metric = podMetric(row)
      return metric?.volumeStatsAvailable ? metric.volumeLimitB : 0
    }
    const volPercent = (row: PodRow) => (volLimit(row) > 0 ? (volUsage(row) / volLimit(row)) * 100 : -1)
    return [
      columnHelper.accessor('namespace', { header: 'Namespace', size: COL_MD }),
      columnHelper.accessor('name', { header: 'Name' }),
      columnHelper.display({
        id: 'usage',
        header: 'CPU / MEM / VOL',
        cell: (info) => {
          const row = info.row.original
          const ctx = row.__klustrCtx ?? ''
          return <PodUsageCell pod={row} ctx={ctx} />
        },
      }),
      columnHelper.accessor((row) => cpuUsage(row), {
        id: 'cpuUsage',
        header: 'CPU',
        size: COL_XS,
        enableSorting: true,
        cell: (info) => <NumericCell value={info.getValue()} format={formatCPU} className={usageClass(cpuPercent(info.row.original))} />,
        sortingFn: 'basic',
      }),
      columnHelper.accessor((row) => cpuLimit(row), {
        id: 'cpuLimit',
        header: 'CPU-LIMIT',
        size: COL_SM,
        enableSorting: true,
        cell: (info) => <NumericCell value={info.getValue()} format={formatCPU} className={usageClass(cpuPercent(info.row.original))} />,
        sortingFn: 'basic',
      }),
      columnHelper.accessor((row) => cpuPercent(row), {
        id: 'cpuPercent',
        header: '%CPU',
        size: COL_XS,
        enableSorting: true,
        cell: (info) => <NumericCell value={info.getValue()} format={formatPercent} className={usageClass(info.getValue())} />,
        sortingFn: 'basic',
      }),
      columnHelper.accessor((row) => memUsage(row), {
        id: 'memUsage',
        header: 'MEMORY',
        size: COL_SM,
        enableSorting: true,
        cell: (info) => <NumericCell value={info.getValue()} format={formatBytes} className={usageClass(memPercent(info.row.original))} />,
        sortingFn: 'basic',
      }),
      columnHelper.accessor((row) => memLimit(row), {
        id: 'memLimit',
        header: 'MEM-LIMIT',
        size: COL_SM,
        enableSorting: true,
        cell: (info) => <NumericCell value={info.getValue()} format={formatBytes} className={usageClass(memPercent(info.row.original))} />,
        sortingFn: 'basic',
      }),
      columnHelper.accessor((row) => memPercent(row), {
        id: 'memPercent',
        header: '%MEM',
        size: COL_XS,
        enableSorting: true,
        cell: (info) => <NumericCell value={info.getValue()} format={formatPercent} className={usageClass(info.getValue())} />,
        sortingFn: 'basic',
      }),
      columnHelper.accessor((row) => volUsage(row), {
        id: 'volUsage',
        header: 'VOLUMES',
        size: COL_SM,
        enableSorting: true,
        cell: (info) => <NumericCell value={info.getValue()} format={formatBytes} className={usageClass(volPercent(info.row.original))} />,
        sortingFn: 'basic',
      }),
      columnHelper.accessor((row) => volLimit(row), {
        id: 'volLimit',
        header: 'VOL-LIMIT',
        size: COL_SM,
        enableSorting: true,
        cell: (info) => <NumericCell value={info.getValue()} format={formatBytes} className={usageClass(volPercent(info.row.original))} />,
        sortingFn: 'basic',
      }),
      columnHelper.accessor((row) => volPercent(row), {
        id: 'volPercent',
        header: '%VOL',
        size: COL_XS,
        enableSorting: true,
        cell: (info) => <NumericCell value={info.getValue()} format={formatPercent} className={usageClass(info.getValue())} />,
        sortingFn: 'basic',
      }),
      columnHelper.accessor('ready', {
        header: 'Ready',
        size: COL_SM,
        cell: (info) => {
          const row = info.row.original
          return (
            <PodContainerSquares
              containers={row.containers}
              namespace={row.namespace}
              name={row.name}
              context={row.__klustrCtx ?? ''}
            />
          )
        },
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        size: COL_SM,
        cell: (info) => <span className={statusClass(info.getValue())}>{info.getValue()}</span>,
      }),
      columnHelper.accessor('restarts', {
        header: 'Restarts',
        size: COL_XS,
        cell: (info) => <RestartBadge value={info.getValue()} />,
      }),
      columnHelper.accessor('deployment', {
        header: 'Deployment',
        size: COL_MD,
        cell: (info) => <TextCell value={info.getValue()} />,
      }),
      columnHelper.accessor((row) => row.containers.map((container) => container.name).join(', '), {
        id: 'containerNames',
        header: 'Containers',
        size: COL_MD,
        cell: (info) => <TextCell value={info.getValue()} />,
      }),
      columnHelper.accessor('images', {
        header: 'Images',
        size: COL_MD,
        cell: (info) => <TextCell value={info.getValue()} />,
      }),
      columnHelper.accessor('node', { header: 'Node' }),
      columnHelper.accessor('podIP', { header: 'IP', size: COL_SM }),
      columnHelper.accessor((row) => row.createdAt, {
        id: 'createdAtIso',
        header: 'Created',
        size: COL_MD,
        cell: (info) => <span className="tabular-nums">{info.getValue()}</span>,
        sortingFn: 'datetime',
      }),
      columnHelper.accessor('createdAt', {
        header: 'Age',
        size: COL_SM,
        cell: (info) => formatAge(info.getValue()),
        sortingFn: 'datetime',
      }),
    ]
  }, [metricsByContext])

  return (
    <ResourceTable
      kind="Pod"
      noun={{ singular: 'pod', plural: 'pods' }}
      scope="namespaced"
      data={pods}
      setData={setPods}
      fetch={api.listPods}
      columns={columns}
      toolbarActions={(
        <div className="flex items-center gap-1.5">
          <select
            aria-label="Pod metrics refresh interval"
            value={refreshIntervalMs}
            onChange={(e) => setRefreshIntervalMs(Number(e.target.value))}
            className="h-7 rounded border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {POD_METRICS_REFRESH_INTERVALS.map((ms) => (
              <option key={ms} value={ms}>
                {formatRefreshInterval(ms)}
              </option>
            ))}
          </select>
          <Button
            size="icon-sm"
            variant="outline"
            onClick={refresh}
            disabled={refreshing || activeContexts.length === 0}
            title="Refresh pod metrics"
            aria-label="Refresh pod metrics"
          >
            <RefreshCw className={`size-3 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      )}
      onRowClick={(row, ctx) =>
        setSelectedResource({ kind: 'Pod', namespace: row.namespace, name: row.name, context: ctx })
      }
    />
  )
}
