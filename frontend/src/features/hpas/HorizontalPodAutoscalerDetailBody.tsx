import { useCallback } from 'react'
import { api, type HPAMetricTarget, type HorizontalPodAutoscalerDetail } from '@/lib/api'
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
          <div className="space-y-2">
            {detail.metrics.map((m, i) => (
              <MetricBar key={`${m.name}-${i}`} metric={m} />
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

function MetricBar({ metric }: { metric: HPAMetricTarget }) {
  if (metric.target <= 0 || metric.current < 0) {
    return (
      <div className="flex items-center justify-between gap-3 rounded border border-border bg-muted/20 px-3 py-2 text-xs">
        <span className="font-mono uppercase tracking-wide text-muted-foreground">{metric.name}</span>
        <span className="font-mono">{metric.text || '—'}</span>
      </div>
    )
  }
  const fillPct = Math.min(100, Math.max(0, (metric.current / metric.target) * 100))
  return (
    <div className="rounded border border-border bg-muted/20 px-3 py-2">
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-mono uppercase tracking-wide text-muted-foreground">{metric.name}</span>
        <span className="font-mono tabular-nums">
          {metric.current}% <span className="text-muted-foreground">/ target {metric.target}%</span>
        </span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-sm bg-muted/40">
        <div
          className={`absolute inset-y-0 left-0 ${usageColor(fillPct)}`}
          style={{ width: fillPct + '%' }}
        />
      </div>
    </div>
  )
}

function usageColor(pct: number): string {
  if (pct >= 90) return 'bg-destructive'
  if (pct >= 70) return 'bg-amber-500'
  return 'bg-emerald-500'
}
