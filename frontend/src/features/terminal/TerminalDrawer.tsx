import { useCallback, useEffect, useRef } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTerminalStore } from '@/store/terminals'
import {
  useActiveContexts,
  useUIStore,
  type ContextTag,
  type CustomTagDef,
} from '@/store/ui'
import { resolveTagMeta } from '@/features/contexts/contextTagMeta'
import { TerminalTab } from './TerminalTab'

export function TerminalDrawer() {
  const drawerOpen = useTerminalStore((s) => s.drawerOpen)
  const drawerHeight = useTerminalStore((s) => s.drawerHeight)
  const setDrawerHeight = useTerminalStore((s) => s.setDrawerHeight)
  const setDrawerOpen = useTerminalStore((s) => s.setDrawerOpen)
  const tabs = useTerminalStore((s) => s.tabs)
  const activeTabId = useTerminalStore((s) => s.activeTabId)
  const openTab = useTerminalStore((s) => s.openTab)
  const closeTab = useTerminalStore((s) => s.closeTab)
  const setActiveTab = useTerminalStore((s) => s.setActiveTab)

  const activeContexts = useActiveContexts()
  const selectedContext = useUIStore((s) => s.selectedContext)
  const contextTags = useUIStore((s) => s.contextTags)
  const customTags = useUIStore((s) => s.customTags)

  const draggingRef = useRef(false)
  const onMouseDownResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      draggingRef.current = true
      const startY = e.clientY
      const startHeight = drawerHeight
      const onMove = (ev: MouseEvent) => {
        if (!draggingRef.current) return
        const delta = startY - ev.clientY
        setDrawerHeight(startHeight + delta)
      }
      const onUp = () => {
        draggingRef.current = false
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [drawerHeight, setDrawerHeight],
  )

  // Auto-create the first tab when the drawer is opened with the active
  // single context — saves a needless click on the empty state.
  useEffect(() => {
    if (!drawerOpen) return
    if (tabs.length > 0) return
    if (activeContexts.length === 1) {
      openTab(activeContexts[0])
    }
  }, [drawerOpen, tabs.length, activeContexts, openTab])

  if (!drawerOpen) return null

  const addPickerContexts = activeContexts.length > 0 ? activeContexts : selectedContext ? [selectedContext] : []

  const handleAdd = () => {
    if (addPickerContexts.length === 1) {
      openTab(addPickerContexts[0])
    }
  }

  return (
    <div
      className="flex shrink-0 flex-col border-t border-border bg-card"
      style={{ height: drawerHeight }}
    >
      <div
        role="separator"
        aria-orientation="horizontal"
        title="Drag to resize"
        onMouseDown={onMouseDownResize}
        className="-mt-px h-1 cursor-row-resize bg-transparent hover:bg-primary/40"
      />
      <div className="flex h-9 shrink-0 items-center gap-1 border-b border-border px-1">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <TabPill
              key={tab.tabId}
              contextName={tab.contextName}
              active={tab.tabId === activeTabId}
              tags={contextTags[tab.contextName] ?? []}
              customTags={customTags}
              onSelect={() => setActiveTab(tab.tabId)}
              onClose={() => closeTab(tab.tabId)}
            />
          ))}
          {addPickerContexts.length > 1 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  className="ml-1 shrink-0"
                  aria-label="New terminal"
                  title="New terminal"
                >
                  <Plus />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {addPickerContexts.map((ctx) => (
                  <DropdownMenuItem key={ctx} onSelect={() => openTab(ctx)}>
                    <span className="font-mono text-xs">{ctx}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              className="ml-1 shrink-0"
              aria-label="New terminal"
              title="New terminal"
              onClick={handleAdd}
              disabled={addPickerContexts.length === 0}
            >
              <Plus />
            </Button>
          )}
        </div>
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          aria-label="Close terminal panel"
          title="Hide terminal panel (Cmd/Ctrl+`)"
          onClick={() => setDrawerOpen(false)}
        >
          <X />
        </Button>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        {tabs.length === 0 ? (
          <EmptyState
            contexts={addPickerContexts}
            onPick={(ctx) => openTab(ctx)}
          />
        ) : (
          tabs.map((tab) => (
            <TerminalTab
              key={tab.tabId}
              tabId={tab.tabId}
              contextName={tab.contextName}
              active={tab.tabId === activeTabId}
            />
          ))
        )}
      </div>
    </div>
  )
}

type PillProps = {
  contextName: string
  active: boolean
  tags: ContextTag[]
  customTags: Record<string, CustomTagDef>
  onSelect: () => void
  onClose: () => void
}

function TabPill({ contextName, active, tags, customTags, onSelect, onClose }: PillProps) {
  const primary = tags[0]
  const meta = primary ? resolveTagMeta(primary, customTags) : null
  const dotClass = meta?.dotClass ?? null
  return (
    <div
      className={`group flex h-7 items-center gap-1.5 rounded border px-2 text-xs transition ${
        active
          ? 'border-border bg-background text-foreground shadow-sm'
          : 'border-transparent text-muted-foreground hover:bg-muted/50'
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 items-center gap-1.5 outline-none"
      >
        {dotClass && <span className={`size-2 shrink-0 rounded-full ${dotClass}`} aria-hidden />}
        <span className="max-w-[200px] truncate font-mono">{contextName}</span>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        aria-label="Close tab"
        title="Close tab"
        className="ml-0.5 flex size-4 shrink-0 items-center justify-center rounded text-muted-foreground opacity-60 transition hover:bg-muted hover:text-foreground hover:opacity-100"
      >
        <X className="size-3" />
      </button>
    </div>
  )
}

function EmptyState({ contexts, onPick }: { contexts: string[]; onPick: (ctx: string) => void }) {
  return (
    <div className="flex h-full items-center justify-center px-4 text-center text-xs text-muted-foreground">
      {contexts.length === 0 ? (
        <span>Connect to a context to open a terminal.</span>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <span>Open a terminal pinned to a context:</span>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {contexts.map((ctx) => (
              <button
                key={ctx}
                type="button"
                onClick={() => onPick(ctx)}
                className="rounded border border-border bg-background px-2 py-1 font-mono text-xs text-foreground transition hover:bg-muted"
              >
                {ctx}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
