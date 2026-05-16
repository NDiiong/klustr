import { useCallback, useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api, type PodDetail } from '@/lib/api'
import { useUIStore, type SelectedResource } from '@/store/ui'
import { useResourceDetail } from './useResourceDetail'
import { ErrorBox } from './DetailPrimitives'
import { ResourceYAMLTab } from './ResourceYAMLTab'
import { MultiPodLogsTab } from './MultiPodLogsTab'
import { EventsTab } from './EventsTab'
import { DeleteResourceButton } from './DeleteResourceButton'
import { ScaleResourceButton, isScalable } from './ScaleResourceButton'
import { PortForwardButton } from '@/features/portforward/PortForwardButton'
import type { ResourceKind } from '@/store/ui'
import { PodOverviewBody } from '@/features/pods/PodOverviewBody'
import { PodLogsTab } from '@/features/pods/PodLogsTab'
import { PodExecTab } from '@/features/pods/PodExecTab'
import { DeploymentDetailBody } from '@/features/deployments/DeploymentDetailBody'
import { StatefulSetDetailBody } from '@/features/statefulsets/StatefulSetDetailBody'
import { DaemonSetDetailBody } from '@/features/daemonsets/DaemonSetDetailBody'
import { ReplicaSetDetailBody } from '@/features/replicasets/ReplicaSetDetailBody'
import { PersistentVolumeClaimDetailBody } from '@/features/pvcs/PersistentVolumeClaimDetailBody'
import { PersistentVolumeDetailBody } from '@/features/pvs/PersistentVolumeDetailBody'
import { StorageClassDetailBody } from '@/features/storageclasses/StorageClassDetailBody'
import { NetworkPolicyDetailBody } from '@/features/networkpolicies/NetworkPolicyDetailBody'
import { HorizontalPodAutoscalerDetailBody } from '@/features/hpas/HorizontalPodAutoscalerDetailBody'
import { PodDisruptionBudgetDetailBody } from '@/features/pdbs/PodDisruptionBudgetDetailBody'
import { EndpointSliceDetailBody } from '@/features/endpointslices/EndpointSliceDetailBody'
import { ResourceQuotaDetailBody } from '@/features/resourcequotas/ResourceQuotaDetailBody'
import { LimitRangeDetailBody } from '@/features/limitranges/LimitRangeDetailBody'
import { IngressClassDetailBody } from '@/features/ingressclasses/IngressClassDetailBody'
import { PriorityClassDetailBody } from '@/features/priorityclasses/PriorityClassDetailBody'
import { RuntimeClassDetailBody } from '@/features/runtimeclasses/RuntimeClassDetailBody'
import { LeaseDetailBody } from '@/features/leases/LeaseDetailBody'
import { WebhookConfigurationDetailBody } from '@/features/webhooks/WebhookConfigurationDetailBody'
import { EndpointsDetailBody } from '@/features/endpoints/EndpointsDetailBody'
import { JobDetailBody } from '@/features/jobs/JobDetailBody'
import { CronJobDetailBody } from '@/features/cronjobs/CronJobDetailBody'
import { ServiceDetailBody } from '@/features/services/ServiceDetailBody'
import { ConfigMapDetailBody } from '@/features/configmaps/ConfigMapDetailBody'
import { SecretDetailBody } from '@/features/secrets/SecretDetailBody'
import { IngressDetailBody } from '@/features/ingresses/IngressDetailBody'
import { NodeDetailBody } from '@/features/nodes/NodeDetailBody'
import { NamespaceDetailBody } from '@/features/namespaces/NamespaceDetailBody'

type Props = {
  contextName: string | null
  resource: SelectedResource | null
}

export function ResourceDetailPanel({ contextName, resource }: Props) {
  const setSelectedResource = useUIStore((s) => s.setSelectedResource)
  const open = resource !== null

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setSelectedResource(null)
      }}
    >
      <DialogContent className="flex h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl">
        <DialogHeader className="flex flex-row items-start justify-between gap-4 border-b border-border px-6 py-4 pr-12">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{resource?.kind}</div>
            <DialogTitle className="truncate text-base">{resource?.name}</DialogTitle>
            {resource?.namespace && (
              <div className="text-xs text-muted-foreground">{resource.namespace}</div>
            )}
          </div>
          {resource && (
            <div className="flex shrink-0 items-center gap-2 pt-1">
              {resource.kind === 'Pod' && (
                <PortForwardButton contextName={contextName} resource={resource} />
              )}
              {isScalable(resource.kind) && (
                <ScaleResourceButton contextName={contextName} resource={resource} />
              )}
              <DeleteResourceButton contextName={contextName} resource={resource} />
            </div>
          )}
        </DialogHeader>
        {resource && (
          <DetailContent
            key={`${resource.kind}/${resource.namespace}/${resource.name}`}
            contextName={contextName}
            resource={resource}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

const WORKLOAD_LOG_KINDS: ResourceKind[] = ['Deployment', 'StatefulSet', 'DaemonSet']

function DetailContent({ contextName, resource }: { contextName: string | null; resource: SelectedResource }) {
  if (resource.kind === 'Pod') {
    return <PodTabs contextName={contextName} namespace={resource.namespace} name={resource.name} />
  }
  const hasAggregatedLogs = (WORKLOAD_LOG_KINDS as readonly string[]).includes(resource.kind)
  return (
    <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col">
      <TabsList className="mx-6 mt-3 w-fit">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        {hasAggregatedLogs && <TabsTrigger value="logs">Logs</TabsTrigger>}
        <TabsTrigger value="events">Events</TabsTrigger>
        <TabsTrigger value="yaml">YAML</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
        <OverviewByKind contextName={contextName} resource={resource} />
      </TabsContent>
      {hasAggregatedLogs && (
        <TabsContent value="logs" className="min-h-0 flex-1 p-0">
          <WorkloadLogs contextName={contextName} resource={resource} />
        </TabsContent>
      )}
      <TabsContent value="events" className="min-h-0 flex-1 p-0">
        <EventsTab
          contextName={contextName}
          namespace={resource.namespace}
          kind={resource.kind}
          name={resource.name}
        />
      </TabsContent>
      <TabsContent value="yaml" className="min-h-0 flex-1 p-0">
        <ResourceYAMLTab
          contextName={contextName}
          kind={resource.kind}
          namespace={resource.namespace}
          name={resource.name}
        />
      </TabsContent>
    </Tabs>
  )
}

function WorkloadLogs({ contextName, resource }: { contextName: string | null; resource: SelectedResource }) {
  const [selector, setSelector] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!contextName) return
    let cancelled = false
    const fetcher =
      resource.kind === 'Deployment'
        ? api.getDeployment
        : resource.kind === 'StatefulSet'
          ? api.getStatefulSet
          : api.getDaemonSet
    fetcher(contextName, resource.namespace, resource.name)
      .then((d) => {
        if (cancelled) return
        setSelector(d.selector ?? {})
      })
      .catch(() => {
        if (cancelled) return
        setSelector({})
      })
    return () => {
      cancelled = true
    }
  }, [contextName, resource.kind, resource.namespace, resource.name])

  if (Object.keys(selector).length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        Resolving pod selector…
      </div>
    )
  }
  return (
    <MultiPodLogsTab
      contextName={contextName}
      namespace={resource.namespace}
      selector={selector}
      title={resource.name}
    />
  )
}

function PodTabs({
  contextName,
  namespace,
  name,
}: {
  contextName: string | null
  namespace: string
  name: string
}) {
  const load = useCallback((ctx: string) => api.getPod(ctx, namespace, name), [namespace, name])
  const { detail, error } = useResourceDetail<PodDetail>(contextName, 'Pod', load)
  const [tab, setTab] = useState<'overview' | 'logs' | 'exec' | 'events' | 'yaml'>('overview')

  useEffect(() => {
    setTab('overview')
  }, [namespace, name])

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="flex min-h-0 flex-1 flex-col">
      <TabsList className="mx-6 mt-3 w-fit">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="logs" disabled={!detail}>Logs</TabsTrigger>
        <TabsTrigger value="exec" disabled={!detail || detail.containers.length === 0}>Exec</TabsTrigger>
        <TabsTrigger value="events">Events</TabsTrigger>
        <TabsTrigger value="yaml">YAML</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
        {error && <ErrorBox>{error}</ErrorBox>}
        {detail && <PodOverviewBody detail={detail} />}
      </TabsContent>
      <TabsContent value="logs" className="min-h-0 flex-1 p-0">
        {detail && <PodLogsTab detail={detail} />}
      </TabsContent>
      <TabsContent value="exec" className="min-h-0 flex-1 p-0">
        {detail && <PodExecTab detail={detail} />}
      </TabsContent>
      <TabsContent value="events" className="min-h-0 flex-1 p-0">
        <EventsTab contextName={contextName} namespace={namespace} kind="Pod" name={name} />
      </TabsContent>
      <TabsContent value="yaml" className="min-h-0 flex-1 p-0">
        <ResourceYAMLTab contextName={contextName} kind="Pod" namespace={namespace} name={name} />
      </TabsContent>
    </Tabs>
  )
}

function OverviewByKind({ contextName, resource }: { contextName: string | null; resource: SelectedResource }) {
  switch (resource.kind) {
    case 'Deployment':
      return <DeploymentDetailBody contextName={contextName} namespace={resource.namespace} name={resource.name} />
    case 'StatefulSet':
      return <StatefulSetDetailBody contextName={contextName} namespace={resource.namespace} name={resource.name} />
    case 'DaemonSet':
      return <DaemonSetDetailBody contextName={contextName} namespace={resource.namespace} name={resource.name} />
    case 'ReplicaSet':
      return <ReplicaSetDetailBody contextName={contextName} namespace={resource.namespace} name={resource.name} />
    case 'PersistentVolumeClaim':
      return <PersistentVolumeClaimDetailBody contextName={contextName} namespace={resource.namespace} name={resource.name} />
    case 'PersistentVolume':
      return <PersistentVolumeDetailBody contextName={contextName} name={resource.name} />
    case 'StorageClass':
      return <StorageClassDetailBody contextName={contextName} name={resource.name} />
    case 'NetworkPolicy':
      return <NetworkPolicyDetailBody contextName={contextName} namespace={resource.namespace} name={resource.name} />
    case 'HorizontalPodAutoscaler':
      return <HorizontalPodAutoscalerDetailBody contextName={contextName} namespace={resource.namespace} name={resource.name} />
    case 'PodDisruptionBudget':
      return <PodDisruptionBudgetDetailBody contextName={contextName} namespace={resource.namespace} name={resource.name} />
    case 'EndpointSlice':
      return <EndpointSliceDetailBody contextName={contextName} namespace={resource.namespace} name={resource.name} />
    case 'ResourceQuota':
      return <ResourceQuotaDetailBody contextName={contextName} namespace={resource.namespace} name={resource.name} />
    case 'LimitRange':
      return <LimitRangeDetailBody contextName={contextName} namespace={resource.namespace} name={resource.name} />
    case 'IngressClass':
      return <IngressClassDetailBody contextName={contextName} name={resource.name} />
    case 'PriorityClass':
      return <PriorityClassDetailBody contextName={contextName} name={resource.name} />
    case 'RuntimeClass':
      return <RuntimeClassDetailBody contextName={contextName} name={resource.name} />
    case 'Lease':
      return <LeaseDetailBody contextName={contextName} namespace={resource.namespace} name={resource.name} />
    case 'MutatingWebhookConfiguration':
      return (
        <WebhookConfigurationDetailBody
          contextName={contextName}
          name={resource.name}
          kind="MutatingWebhookConfiguration"
          loader={(ctx) => api.getMutatingWebhookConfiguration(ctx, resource.name)}
        />
      )
    case 'ValidatingWebhookConfiguration':
      return (
        <WebhookConfigurationDetailBody
          contextName={contextName}
          name={resource.name}
          kind="ValidatingWebhookConfiguration"
          loader={(ctx) => api.getValidatingWebhookConfiguration(ctx, resource.name)}
        />
      )
    case 'Endpoints':
      return <EndpointsDetailBody contextName={contextName} namespace={resource.namespace} name={resource.name} />
    case 'Job':
      return <JobDetailBody contextName={contextName} namespace={resource.namespace} name={resource.name} />
    case 'CronJob':
      return <CronJobDetailBody contextName={contextName} namespace={resource.namespace} name={resource.name} />
    case 'Service':
      return <ServiceDetailBody contextName={contextName} namespace={resource.namespace} name={resource.name} />
    case 'ConfigMap':
      return <ConfigMapDetailBody contextName={contextName} namespace={resource.namespace} name={resource.name} />
    case 'Secret':
      return <SecretDetailBody contextName={contextName} namespace={resource.namespace} name={resource.name} />
    case 'Ingress':
      return <IngressDetailBody contextName={contextName} namespace={resource.namespace} name={resource.name} />
    case 'Node':
      return <NodeDetailBody contextName={contextName} name={resource.name} />
    case 'Namespace':
      return <NamespaceDetailBody contextName={contextName} name={resource.name} />
    default:
      return null
  }
}
