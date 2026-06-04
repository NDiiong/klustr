import { useCallback } from 'react'
import { api, type CertManagerOrderDetail } from '@/lib/api'
import { formatAge, formatTimestamp } from '@/lib/time'
import { ErrorBox, Field, Section } from '@/features/_shared/DetailPrimitives'
import { useResourceDetail } from '@/features/_shared/useResourceDetail'
import { CertManagerStatePill } from './CertManagerStatePill'

type Props = {
  contextName: string | null
  namespace: string
  name: string
}

export function OrderDetailBody({ contextName, namespace, name }: Props) {
  const load = useCallback(
    (ctx: string) => api.getCertManagerOrder(ctx, namespace, name),
    [namespace, name],
  )
  const { detail, error } = useResourceDetail<CertManagerOrderDetail>(contextName, 'Order', load)
  if (error) return <ErrorBox>{error}</ErrorBox>
  if (!detail) return null

  return (
    <div className="space-y-6">
      <Section title="Order">
        <Field label="State">
          <CertManagerStatePill state={detail.state} />
        </Field>
        <Field label="Reason">{detail.reason || '—'}</Field>
        <Field label="Common name">{detail.commonName || '—'}</Field>
        <Field label="DNS names">
          {detail.dnsNameList.length > 0 ? (
            <span className="font-mono text-xs">{detail.dnsNameList.join(', ')}</span>
          ) : (
            '—'
          )}
        </Field>
        <Field label="Authorizations">{detail.authorizations || 0}</Field>
        {detail.failureTime && (
          <Field label="Failure time">
            <span title={detail.failureTime}>{formatTimestamp(detail.failureTime)}</span>
          </Field>
        )}
        <Field label="Age">{formatAge(detail.createdAt)}</Field>
      </Section>

      <Section title="ACME">
        <Field label="Order URL">
          {detail.url ? <span className="font-mono text-xs break-all">{detail.url}</span> : '—'}
        </Field>
        <Field label="Finalize URL">
          {detail.finalizeURL ? (
            <span className="font-mono text-xs break-all">{detail.finalizeURL}</span>
          ) : (
            '—'
          )}
        </Field>
      </Section>
    </div>
  )
}
