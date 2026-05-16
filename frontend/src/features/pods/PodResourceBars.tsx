import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type Props = {
  cpuUsageMC: number
  cpuRequestMC: number
  cpuLimitMC: number
  memUsageB: number
  memRequestB: number
  memLimitB: number
}

export function PodResourceBars({
  cpuUsageMC,
  cpuRequestMC,
  cpuLimitMC,
  memUsageB,
  memRequestB,
  memLimitB,
}: Props) {
  const cpu = computeBar(cpuUsageMC, cpuRequestMC, cpuLimitMC)
  const mem = computeBar(memUsageB, memRequestB, memLimitB)

  if (!cpu && !mem) {
    return <span className="text-muted-foreground">—</span>
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex w-28 flex-col gap-1">
          <MiniBar label="C" value={cpu} usageColorClass={usageColor(cpu)} />
          <MiniBar label="M" value={mem} usageColorClass={usageColor(mem)} />
        </div>
      </TooltipTrigger>
      <TooltipContent className="font-mono text-[11px]">
        <div className="mb-1 text-muted-foreground">CPU</div>
        <div>usage&nbsp;&nbsp;{formatCPU(cpuUsageMC)}</div>
        <div>request&nbsp;{cpuRequestMC > 0 ? formatCPU(cpuRequestMC) : '—'}</div>
        <div>limit&nbsp;&nbsp;&nbsp;{cpuLimitMC > 0 ? formatCPU(cpuLimitMC) : '—'}</div>
        <div className="mt-2 mb-1 text-muted-foreground">Memory</div>
        <div>usage&nbsp;&nbsp;{formatMem(memUsageB)}</div>
        <div>request&nbsp;{memRequestB > 0 ? formatMem(memRequestB) : '—'}</div>
        <div>limit&nbsp;&nbsp;&nbsp;{memLimitB > 0 ? formatMem(memLimitB) : '—'}</div>
      </TooltipContent>
    </Tooltip>
  )
}

type Bar = {
  usagePct: number
  requestPct: number
  hasRequest: boolean
  hasLimit: boolean
}

function computeBar(usage: number, request: number, limit: number): Bar | null {
  const scale = limit > 0 ? limit : request > 0 ? request * 2 : usage > 0 ? usage * 2 : 0
  if (scale <= 0) return null
  return {
    usagePct: clampPct((usage / scale) * 100),
    requestPct: request > 0 ? clampPct((request / scale) * 100) : 0,
    hasRequest: request > 0,
    hasLimit: limit > 0,
  }
}

function MiniBar({ label, value, usageColorClass }: { label: string; value: Bar | null; usageColorClass: string }) {
  if (!value) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="w-3 text-[9px] text-muted-foreground">{label}</span>
        <div className="h-2 flex-1 rounded-sm bg-muted/40" />
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-3 text-[9px] text-muted-foreground">{label}</span>
      <div className="relative h-2 flex-1 overflow-hidden rounded-sm bg-muted/40">
        <div
          className={`absolute inset-y-0 left-0 ${usageColorClass}`}
          style={{ width: value.usagePct + '%' }}
        />
        {value.hasRequest && (
          <div
            className="absolute inset-y-0 w-px bg-foreground/60"
            style={{ left: value.requestPct + '%' }}
          />
        )}
      </div>
    </div>
  )
}

function usageColor(bar: Bar | null): string {
  if (!bar) return 'bg-muted'
  if (bar.usagePct >= 90) return 'bg-destructive'
  if (bar.usagePct >= 70) return 'bg-amber-500'
  return 'bg-emerald-500'
}

function clampPct(v: number): number {
  if (v < 0) return 0
  if (v > 100) return 100
  return v
}

function formatCPU(mc: number): string {
  if (mc <= 0) return '0'
  if (mc < 1000) return mc + 'm'
  return (mc / 1000).toFixed(mc % 1000 === 0 ? 0 : 2) + ' cores'
}

function formatMem(bytes: number): string {
  if (bytes <= 0) return '0'
  const units = ['B', 'Ki', 'Mi', 'Gi', 'Ti']
  let v = bytes
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return v.toFixed(v >= 100 || i === 0 ? 0 : 1) + units[i]
}
