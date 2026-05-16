import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api, type ContainerDetail, type PodDetail } from '@/lib/api'
import { onKubeChange } from '@/lib/events'
import { formatAge } from '@/lib/time'
import { useUIStore, type SelectedResource } from '@/store/ui'
import { PodLogsTab } from './PodLogsTab'
import { PodExecTab } from './PodExecTab'

type Props = {
  contextName: string | null
  resource: SelectedResource | null
}

export function PodDetailPanel({ contextName, resource }: Props) {
  const setSelectedResource = useUIStore((s) => s.setSelectedResource)
  const [detail, setDetail] = useState<PodDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'overview' | 'logs' | 'exec'>('overview')
  const open = resource !== null && resource.kind === 'Pod'

  useEffect(() => {
    if (!open) setTab('overview')
  }, [open, resource?.namespace, resource?.name])

  useEffect(() => {
    if (!open || !contextName || !resource) {
      setDetail(null)
      setError(null)
      return
    }
    let cancelled = false
    const reload = () => {
      api
        .getPod(contextName, resource.namespace, resource.name)
        .then((d) => {
          if (cancelled) return
          setDetail(d)
          setError(null)
        })
        .catch((e: unknown) => {
          if (cancelled) return
          setError(String(e))
          setDetail(null)
        })
    }
    reload()
    const unsub = onKubeChange('Pod', (ctx) => {
      if (ctx === contextName) reload()
    })
    return () => {
      cancelled = true
      unsub()
    }
  }, [open, contextName, resource?.namespace, resource?.name])

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) setSelectedResource(null)
      }}
    >
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-3xl">
        <SheetHeader className="border-b border-border px-6 py-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Pod</div>
          <SheetTitle className="truncate text-base">{resource?.name}</SheetTitle>
          <div className="text-xs text-muted-foreground">{resource?.namespace}</div>
        </SheetHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'overview' | 'logs' | 'exec')} className="flex min-h-0 flex-1 flex-col">
          <TabsList className="mx-6 mt-3 w-fit">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="logs" disabled={!detail}>Logs</TabsTrigger>
            <TabsTrigger value="exec" disabled={!detail || detail.containers.length === 0}>Exec</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            {error && (
              <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive break-words font-mono">
                {error}
              </div>
            )}
            {detail && <PodOverview detail={detail} />}
          </TabsContent>

          <TabsContent value="logs" className="min-h-0 flex-1 p-0">
            {detail && <PodLogsTab detail={detail} />}
          </TabsContent>

          <TabsContent value="exec" className="min-h-0 flex-1 p-0">
            {detail && <PodExecTab detail={detail} />}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}

function PodOverview({ detail }: { detail: PodDetail }) {
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

      {detail.initContainers.length > 0 && (
        <ContainersSection title="Init Containers" containers={detail.initContainers} />
      )}
      <ContainersSection title="Containers" containers={detail.containers} />

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
                    <Td className={c.status === 'True' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>{c.status}</Td>
                    <Td>{c.reason || '—'}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {Object.keys(detail.labels ?? {}).length > 0 && (
        <Section title="Labels">
          <Chips items={detail.labels} />
        </Section>
      )}

      {Object.keys(detail.annotations ?? {}).length > 0 && (
        <Section title="Annotations">
          <Chips items={detail.annotations} />
        </Section>
      )}
    </div>
  )
}

function ContainersSection({ title, containers }: { title: string; containers: ContainerDetail[] }) {
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
                  {c.stateReason && (
                    <div className="text-[10px] text-muted-foreground">{c.stateReason}</div>
                  )}
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </section>
  )
}

function Field({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline gap-3 text-sm">
      <div className="w-32 shrink-0 text-xs text-muted-foreground">{label}</div>
      <div className={['min-w-0 flex-1 break-words', mono ? 'font-mono text-xs' : ''].join(' ')}>{children}</div>
    </div>
  )
}

function Chips({ items }: { items: Record<string, string> }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Object.entries(items).map(([k, v]) => (
        <span
          key={k}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground"
        >
          {k}={v}
        </span>
      ))}
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-2 py-1.5 text-left font-medium uppercase tracking-wide">{children}</th>
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={['px-2 py-1.5 align-top', className].filter(Boolean).join(' ')}>{children}</td>
}
