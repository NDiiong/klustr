import { useMemo } from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import { api, type PodInfo } from '@/lib/api'
import { formatAge } from '@/lib/time'
import { ResourceTable } from '@/features/_shared/ResourceTable'
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
  const pods = useResources((s) => s.pods)
  const setPods = useResources((s) => s.setPods)
  const setSelectedResource = useUIStore((s) => s.setSelectedResource)

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

  return (
    <ResourceTable
      kind="Pod"
      noun={{ singular: 'pod', plural: 'pods' }}
      scope="namespaced"
      data={pods}
      setData={setPods}
      fetch={api.listPods}
      columns={columns}
      onRowClick={(row) =>
        setSelectedResource({ kind: 'Pod', namespace: row.namespace, name: row.name })
      }
    />
  )
}
