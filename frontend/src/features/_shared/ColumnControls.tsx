import { ArrowDown, ArrowUp, Columns3, RotateCcw } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import type { Column, Table } from '@tanstack/react-table'

type Props<T> = {
  table: Table<T>
  onReset: () => void
}

export function ColumnControls<T>({ table, onReset }: Props<T>) {
  const orderedColumns = table.getAllLeafColumns()

  const move = (id: string, dir: -1 | 1) => {
    const current = orderedColumns.map((c) => c.id)
    const idx = current.indexOf(id)
    const target = idx + dir
    if (idx < 0 || target < 0 || target >= current.length) return
    const next = current.slice()
    ;[next[idx], next[target]] = [next[target], next[idx]]
    table.setColumnOrder(next)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-xs">
          <Columns3 className="size-3" />
          Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2 text-xs">
          <span className="font-medium">Columns</span>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="size-3" />
            Reset
          </button>
        </div>
        <ul className="max-h-80 overflow-y-auto py-1">
          {orderedColumns.map((col, idx) => {
            const label = labelFor(col)
            return (
              <li
                key={col.id}
                className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-muted/40"
              >
                <input
                  type="checkbox"
                  className="size-3.5 cursor-pointer accent-foreground"
                  checked={col.getIsVisible()}
                  onChange={() => col.toggleVisibility()}
                />
                <span className="flex-1 truncate">{label}</span>
                <button
                  type="button"
                  aria-label="Move up"
                  disabled={idx === 0}
                  onClick={() => move(col.id, -1)}
                  className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ArrowUp className="size-3" />
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  disabled={idx === orderedColumns.length - 1}
                  onClick={() => move(col.id, 1)}
                  className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ArrowDown className="size-3" />
                </button>
              </li>
            )
          })}
        </ul>
      </PopoverContent>
    </Popover>
  )
}

function labelFor<T>(col: Column<T, unknown>): string {
  const h = col.columnDef.header
  if (typeof h === 'string') return h
  return col.id
}
