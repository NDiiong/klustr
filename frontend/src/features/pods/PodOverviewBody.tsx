import type { PodDetail } from '@/lib/api'
import { formatAge } from '@/lib/time'
import { Chips, Field, MaybeSection, Section, Td, Th } from '@/features/_shared/DetailPrimitives'

export function PodOverviewBody({ detail }: { detail: PodDetail }) {
  return (
    <div className="space-y-6">
      <Section title="Status">
        <Field label="Status">{detail.status}</Field>
        <Field label="Phase">{detail.phase}</Field>
        <Field label="QoS Class">{detail.qosClass || '—'}</Field>
        <Field label="Restart Policy">{detail.restartPolicy}</Field>
        <Field label="Age">{formatAge(detail.createdAt)}</Field>
      </Section>

      <Section title="Networking">
        <Field label="Pod IP" mono>{detail.podIP || '—'}</Field>
        <Field label="Host IP" mono>{detail.hostIP || '—'}</Field>
        <Field label="Node">{detail.node || '—'}</Field>
        <Field label="Service Account">{detail.serviceAccount || 'default'}</Field>
        {detail.priorityClassName && <Field label="Priority Class">{detail.priorityClassName}</Field>}
      </Section>

      {detail.owners.length > 0 && (
        <Section title="Controlled By">
          {detail.owners.map((o, i) => (
            <Field key={i} label={o.kind}>{o.name}</Field>
          ))}
        </Section>
      )}

      {detail.initContainers.length > 0 && <PodContainersTable title="Init Containers" containers={detail.initContainers} />}
      <PodContainersTable title="Containers" containers={detail.containers} />

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
                    <Td className={c.status === 'True' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                      {c.status}
                    </Td>
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

function PodContainersTable({
  title,
  containers,
}: {
  title: string
  containers: PodDetail['containers']
}) {
  return (
    <Section title={title}>
      <div className="overflow-hidden rounded border border-border">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <Th>Name</Th>
              <Th>Image</Th>
              <Th>State</Th>
              <Th>Ready</Th>
              <Th>Restarts</Th>
            </tr>
          </thead>
          <tbody>
            {containers.map((c) => (
              <tr key={c.name} className="border-t border-border">
                <Td>{c.name}</Td>
                <Td className="font-mono break-all">{c.image}</Td>
                <Td>
                  <div>{c.state}</div>
                  {c.stateReason && <div className="text-[10px] text-muted-foreground">{c.stateReason}</div>}
                </Td>
                <Td>{c.ready ? '✓' : '·'}</Td>
                <Td>{c.restartCount}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  )
}
