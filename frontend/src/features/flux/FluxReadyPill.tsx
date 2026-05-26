// FluxReadyPill renders the Status field of the Ready condition that
// every Flux CR carries. We collapse the three Flux states (True / False /
// Unknown) down to a coloured chip so users can scan a long list and spot
// the broken rows at a glance.

type Props = {
  value: string
  suspended?: boolean
}

export function FluxReadyPill({ value, suspended }: Props) {
  if (suspended) {
    return (
      <span className="rounded-sm bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
        Suspended
      </span>
    )
  }
  if (value === 'True') {
    return (
      <span className="rounded-sm bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
        Ready
      </span>
    )
  }
  if (value === 'False') {
    return (
      <span className="rounded-sm bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
        Failed
      </span>
    )
  }
  if (value === 'Unknown') {
    return (
      <span className="rounded-sm bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        Reconciling
      </span>
    )
  }
  return <span className="text-muted-foreground">—</span>
}
