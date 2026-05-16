import { useMemo } from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import { api, type ConfigMapInfo } from '@/lib/api'
import { formatAge } from '@/lib/time'
import { ResourceTable } from '@/features/_shared/ResourceTable'
import { useResources } from '@/store/resources'

const columnHelper = createColumnHelper<ConfigMapInfo>()

export function ConfigMapsView() {
  const configMaps = useResources((s) => s.configMaps)
  const setConfigMaps = useResources((s) => s.setConfigMaps)

  const columns = useMemo(
    () => [
      columnHelper.accessor('namespace', { header: 'Namespace' }),
      columnHelper.accessor('name', { header: 'Name' }),
      columnHelper.accessor('keys', { header: 'Keys' }),
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
      kind="ConfigMap"
      noun={{ singular: 'configmap', plural: 'configmaps' }}
      scope="namespaced"
      data={configMaps}
      setData={setConfigMaps}
      fetch={api.listConfigMaps}
      columns={columns}
    />
  )
}
