import type { FluxCondition } from '@/lib/api'
import { formatAge } from '@/lib/time'
import { Section, Td, Th } from '@/features/_shared/DetailPrimitives'

// FluxConditionsTable renders the full .status.conditions[] block in the
// metav1.Condition shape every Flux CR uses. The Ready condition is the
// headline summary in the list view; the rest (Reconciling, Stalled,
// Healthy …) provide the context an operator needs when a reconcile fails.
export function FluxConditionsTable({ conditions }: { conditions: FluxCondition[] }) {
  if (!conditions || conditions.length === 0) {
    return (
      <Section title="Conditions">
        <div className="text-xs text-muted-foreground">
          No conditions reported yet — controller has not reconciled.
        </div>
      </Section>
    )
  }
  return (
    <Section title={`Conditions (${conditions.length})`}>
      <div className="overflow-hidden rounded border border-border">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <Th>Type</Th>
              <Th>Status</Th>
              <Th>Reason</Th>
              <Th>Age</Th>
              <Th>Message</Th>
            </tr>
          </thead>
          <tbody>
            {conditions.map((c) => (
              <tr key={c.type} className="border-t border-border align-top">
                <Td className="font-mono">{c.type}</Td>
                <Td>
                  <span className={statusClass(c.status)}>{c.status}</span>
                </Td>
                <Td className="font-mono">{c.reason || '—'}</Td>
                <Td className="whitespace-nowrap text-muted-foreground">
                  {c.lastTransitionTime ? formatAge(c.lastTransitionTime) : '—'}
                </Td>
                <Td className="max-w-[28rem] whitespace-pre-wrap break-words">
                  {c.message || '—'}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  )
}

function statusClass(status: string): string {
  if (status === 'True') return 'text-emerald-600 dark:text-emerald-400 font-medium'
  if (status === 'False') return 'text-destructive font-medium'
  return 'text-muted-foreground'
}
