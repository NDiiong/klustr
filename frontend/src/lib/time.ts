export function formatAge(iso: string): string {
  if (!iso) return '—'
  const created = new Date(iso).getTime()
  if (Number.isNaN(created)) return '—'
  let diff = Math.max(0, Math.floor((Date.now() - created) / 1000))
  const days = Math.floor(diff / 86400)
  diff -= days * 86400
  const hours = Math.floor(diff / 3600)
  diff -= hours * 3600
  const minutes = Math.floor(diff / 60)
  const seconds = diff - minutes * 60
  if (days > 0) return hours > 0 ? `${days}d${hours}h` : `${days}d`
  if (hours > 0) return minutes > 0 ? `${hours}h${minutes}m` : `${hours}h`
  if (minutes > 0) return seconds > 0 ? `${minutes}m${seconds}s` : `${minutes}m`
  return `${seconds}s`
}
