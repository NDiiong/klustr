import { useCallback } from 'react'
import { api, type HorizontalPodAutoscalerDetail } from '@/lib/api'
import { formatAge } from '@/lib/time'
import { Chips, ErrorBox, Field, MaybeSection, Section, Td, Th } from '@/features/_shared/DetailPrimitives'
import { useResourceDetail } from '@/features/_shared/useResourceDetail'

export function HorizontalPodAutoscalerDetailBody({
  contextName,
  namespace,
  name,
}: {
  contextName: string | null
  namespace: string
  name: string
}) {
  const load = useCallback(
    (ctx: string) => api.getHorizontalPodAutoscaler(ctx, namespace, name),
    [namespace, name],
  )
  const { detail, error } = useResourceDetail<HorizontalPodAutoscalerDetail>(contextName, 'HorizontalPodAutoscaler', load)
  if (error) return <ErrorBox>{error}</ErrorBox>
  if (!detail) return null
  return (
    <div className="space-y-6">
      <Section title="Status">
        <Field label="Reference">{detail.reference}</Field>
        <Field label="Min Replicas">{detail.minReplicas}</Field>
        <Field label="Max Replicas">{detail.maxReplicas}</Field>
        <Field label="Current Replicas">{detail.currentReplicas}</Field>
        <Field label="Desired Replicas">{detail.desiredReplicas}</Field>
        <Field label="Age">{formatAge(detail.createdAt)}</Field>
      </Section>
      {detail.metrics.length > 0 && (
        <Section title="Metrics">
          <div className="space-y-1 font-mono text-xs">
            {detail.metrics.map((m, i) => (
              <div key={i} className="break-all">{m}</div>
            ))}
          </div>
        </Section>
      )}
      {detail.conditions.length > 0 && (
        <Section title="Conditions">
          <div className="overflow-hidden rounded border border-border">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <Th>Type</Th>
                  <Th>Status</Th>
                  <Th>Reason</Th>
                </tr>
              </thead>
              <tbody>
                {detail.conditions.map((c, i) => (
                  <tr key={i} className="border-t border-border">
                    <Td>{c.type}</Td>
                    <Td>{c.status}</Td>
                    <Td>{c.reason || '—'}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}
      <MaybeSection title="Labels" items={detail.labels} render={() => <Chips items={detail.labels} />} />
      <MaybeSection title="Annotations" items={detail.annotations} render={() => <Chips items={detail.annotations} />} />
    </div>
  )
}
