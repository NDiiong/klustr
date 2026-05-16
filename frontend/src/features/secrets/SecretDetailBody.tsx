import { useCallback } from 'react'
import { api, type SecretDetail } from '@/lib/api'
import { formatAge } from '@/lib/time'
import { Chips, ErrorBox, Field, MaybeSection, Section, Td, Th } from '@/features/_shared/DetailPrimitives'
import { useResourceDetail } from '@/features/_shared/useResourceDetail'

function shortenSecretType(t: string): string {
  const slash = t.indexOf('/')
  return slash >= 0 ? t.slice(slash + 1) : t
}

export function SecretDetailBody({
  contextName,
  namespace,
  name,
}: {
  contextName: string | null
  namespace: string
  name: string
}) {
  const load = useCallback((ctx: string) => api.getSecret(ctx, namespace, name), [namespace, name])
  const { detail, error } = useResourceDetail<SecretDetail>(contextName, 'Secret', load)
  if (error) return <ErrorBox>{error}</ErrorBox>
  if (!detail) return null
  return (
    <div className="space-y-6">
      <Section title="Metadata">
        <Field label="Type" mono>{shortenSecretType(detail.type)}</Field>
        <Field label="Keys">{detail.keys.length}</Field>
        <Field label="Age">{formatAge(detail.createdAt)}</Field>
      </Section>
      {detail.keys.length > 0 && (
        <Section title="Data">
          <div className="overflow-hidden rounded border border-border">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <Th>Key</Th>
                  <Th>Size</Th>
                </tr>
              </thead>
              <tbody>
                {detail.keys.map((k) => (
                  <tr key={k.key} className="border-t border-border">
                    <Td className="font-mono">{k.key}</Td>
                    <Td>{`${k.size} bytes`}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-[10px] text-muted-foreground">
            Secret values are never read from the cluster — only key names and byte sizes.
          </div>
        </Section>
      )}
      <MaybeSection title="Labels" items={detail.labels} render={() => <Chips items={detail.labels} />} />
      <MaybeSection title="Annotations" items={detail.annotations} render={() => <Chips items={detail.annotations} />} />
    </div>
  )
}
