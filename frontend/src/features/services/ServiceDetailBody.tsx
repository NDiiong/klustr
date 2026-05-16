import { useCallback } from 'react'
import { api, type ServiceDetail } from '@/lib/api'
import { formatAge } from '@/lib/time'
import { Chips, ErrorBox, Field, MaybeSection, Section, Td, Th } from '@/features/_shared/DetailPrimitives'
import { useResourceDetail } from '@/features/_shared/useResourceDetail'

export function ServiceDetailBody({
  contextName,
  namespace,
  name,
}: {
  contextName: string | null
  namespace: string
  name: string
}) {
  const load = useCallback((ctx: string) => api.getService(ctx, namespace, name), [namespace, name])
  const { detail, error } = useResourceDetail<ServiceDetail>(contextName, 'Service', load)
  if (error) return <ErrorBox>{error}</ErrorBox>
  if (!detail) return null
  return (
    <div className="space-y-6">
      <Section title="Service">
        <Field label="Type">{detail.type}</Field>
        <Field label="Cluster IPs" mono>{detail.clusterIPs.join(', ') || '—'}</Field>
        <Field label="External IPs" mono>{detail.externalIPs.length > 0 ? detail.externalIPs.join(', ') : '—'}</Field>
        <Field label="Session Affinity">{detail.sessionAffinity || 'None'}</Field>
        <Field label="Age">{formatAge(detail.createdAt)}</Field>
      </Section>
      {detail.ports.length > 0 && (
        <Section title="Ports">
          <div className="overflow-hidden rounded border border-border">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <Th>Name</Th>
                  <Th>Protocol</Th>
                  <Th>Port</Th>
                  <Th>Target</Th>
                  <Th>NodePort</Th>
                </tr>
              </thead>
              <tbody>
                {detail.ports.map((p, i) => (
                  <tr key={i} className="border-t border-border">
                    <Td>{p.name || '—'}</Td>
                    <Td>{p.protocol}</Td>
                    <Td className="font-mono">{p.port}</Td>
                    <Td className="font-mono">{p.targetPort}</Td>
                    <Td className="font-mono">{p.nodePort || '—'}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}
      <MaybeSection title="Selector" items={detail.selector} render={() => <Chips items={detail.selector} />} />
      <MaybeSection title="Labels" items={detail.labels} render={() => <Chips items={detail.labels} />} />
      <MaybeSection title="Annotations" items={detail.annotations} render={() => <Chips items={detail.annotations} />} />
    </div>
  )
}
