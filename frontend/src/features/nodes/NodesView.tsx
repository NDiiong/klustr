import { useMemo } from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import { api, type NodeInfo } from '@/lib/api'
import { formatAge } from '@/lib/time'
import { ResourceTable } from '@/features/_shared/ResourceTable'
import { COL_MD, COL_SM } from '@/features/_shared/columnSizes'
import { useResources } from '@/store/resources'
import { useUIStore } from '@/store/ui'

const columnHelper = createColumnHelper<NodeInfo>()

function nodeStatusClass(status: string): string {
  if (status.startsWith('Ready')) {
    return status.includes('SchedulingDisabled')
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-emerald-600 dark:text-emerald-400'
  }
  if (status.startsWith('NotReady')) return 'text-destructive'
  return 'text-muted-foreground'
}

const EMPTY_CELL = <span className="text-muted-foreground">—</span>

export function NodesView() {
  const nodes = useResources((s) => s.nodes)
  const setNodes = useResources((s) => s.setNodes)
  const setSelectedResource = useUIStore((s) => s.setSelectedResource)

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', { header: 'Name' }),
      columnHelper.accessor('status', {
        header: 'Status',
        size: COL_SM,
        cell: (info) => <span className={nodeStatusClass(info.getValue())}>{info.getValue()}</span>,
      }),
      columnHelper.accessor('roles', { header: 'Roles', size: COL_MD }),
      columnHelper.accessor('version', { header: 'Version', size: COL_SM }),
      columnHelper.accessor('osImage', { header: 'OS Image' }),
      columnHelper.accessor('internalIP', {
        header: 'Internal IP',
        size: COL_MD,
        cell: (info) => <span className="font-mono text-xs">{info.getValue()}</span>,
      }),
      columnHelper.accessor('instanceType', {
        header: 'Instance',
        size: COL_MD,
        cell: (info) => {
          const v = info.getValue()
          return v ? <span className="font-mono text-xs">{v}</span> : EMPTY_CELL
        },
      }),
      columnHelper.accessor('capacityType', {
        header: 'Capacity',
        size: COL_SM,
        cell: (info) => {
          const v = info.getValue()
          if (!v) return EMPTY_CELL
          const cls =
            v === 'spot'
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-emerald-600 dark:text-emerald-400'
          return <span className={cls}>{v}</span>
        },
      }),
      columnHelper.accessor('nodePool', {
        header: 'NodePool',
        size: COL_MD,
        cell: (info) => info.getValue() || EMPTY_CELL,
      }),
      columnHelper.accessor('createdAt', {
        header: 'Age',
        size: COL_SM,
        cell: (info) => formatAge(info.getValue()),
        sortingFn: 'datetime',
      }),
    ],
    [],
  )

  return (
    <ResourceTable
      kind="Node"
      noun={{ singular: 'node', plural: 'nodes' }}
      scope="cluster"
      data={nodes}
      setData={setNodes}
      fetch={(ctx) => api.listNodes(ctx)}
      columns={columns}
      onRowClick={(row, ctx) => setSelectedResource({ kind: 'Node', namespace: '', name: row.name, context: ctx })}
    />
  )
}
