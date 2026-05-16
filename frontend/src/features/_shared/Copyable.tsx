import { useState, type ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'

type Props = {
  value: string
  children?: ReactNode
  className?: string
}

export function Copyable({ value, children, className }: Props) {
  const [copied, setCopied] = useState(false)

  const onCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success(`Copied "${truncate(value, 60)}"`)
      window.setTimeout(() => setCopied(false), 1_200)
    } catch (err) {
      toast.error(`Copy failed: ${String(err)}`)
    }
  }

  return (
    <span className={['group inline-flex items-center gap-1', className].filter(Boolean).join(' ')}>
      <span>{children ?? value}</span>
      <button
        type="button"
        onClick={onCopy}
        aria-label="Copy value"
        className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100"
      >
        {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
      </button>
    </span>
  )
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s
  return s.slice(0, n - 1) + '…'
}
