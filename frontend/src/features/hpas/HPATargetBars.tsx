import type { HPAMetricTarget } from '@/lib/api'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type Props = {
  metrics: HPAMetricTarget[]
}

export function HPATargetBars({ metrics }: Props) {
  if (!metrics || metrics.length === 0) {
    return <span className="text-muted-foreground">—</span>
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex w-32 flex-col gap-1">
          {metrics.map((m) => (
            <MiniBar key={m.name} metric={m} />
          ))}
        </div>
      </TooltipTrigger>
      <TooltipContent className="flex flex-col gap-1 p-3 font-mono text-[11px]">
        {metrics.map((m) => (
          <div key={m.name} className="flex items-center justify-between gap-3">
            <span className="opacity-60">{m.name}</span>
            <span>{describeMetric(m)}</span>
          </div>
        ))}
      </TooltipContent>
    </Tooltip>
  )
}

function MiniBar({ metric }: { metric: HPAMetricTarget }) {
  const label = shortLabel(metric.name)
  if (metric.target <= 0 || metric.current < 0) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="w-3 text-[9px] text-muted-foreground">{label}</span>
        <span className="flex-1 truncate text-[11px] text-muted-foreground">
          {metric.text || '—'}
        </span>
      </div>
    )
  }
  const fillPct = clampPct((metric.current / metric.target) * 100)
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-3 text-[9px] text-muted-foreground">{label}</span>
      <div className="relative h-2 flex-1 overflow-hidden rounded-sm bg-muted/40">
        <div
          className={`absolute inset-y-0 left-0 ${usageColor(fillPct)}`}
          style={{ width: fillPct + '%' }}
        />
      </div>
      <span className="w-12 text-right text-[10px] tabular-nums text-muted-foreground">
        {metric.current}%/{metric.target}%
      </span>
    </div>
  )
}

function shortLabel(name: string): string {
  if (name === 'cpu') return 'C'
  if (name === 'memory') return 'M'
  return name.charAt(0).toUpperCase()
}

function describeMetric(m: HPAMetricTarget): string {
  if (m.text) return m.text
  if (m.target <= 0 || m.current < 0) return '—'
  return `${m.current}% / ${m.target}%`
}

function usageColor(pct: number): string {
  if (pct >= 90) return 'bg-destructive'
  if (pct >= 70) return 'bg-amber-500'
  return 'bg-emerald-500'
}

function clampPct(v: number): number {
  if (v < 0) return 0
  if (v > 100) return 100
  return v
}
