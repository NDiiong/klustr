import { Check, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { THEMES, type ThemeDefinition } from './themes'
import { useUIStore } from '@/store/ui'

function Swatch({ theme }: { theme: ThemeDefinition }) {
  return (
    <div
      className="flex h-4 w-7 overflow-hidden rounded-sm border border-border/60"
      aria-hidden
    >
      <div className="flex-1" style={{ backgroundColor: theme.swatch.background }} />
      <div className="flex-1" style={{ backgroundColor: theme.swatch.primary }} />
      <div className="flex-1" style={{ backgroundColor: theme.swatch.accent }} />
    </div>
  )
}

function ThemeRow({
  theme,
  active,
  onSelect,
}: {
  theme: ThemeDefinition
  active: boolean
  onSelect: () => void
}) {
  return (
    <DropdownMenuItem onSelect={onSelect} className="gap-2">
      <Swatch theme={theme} />
      <span className="flex-1 truncate text-sm">{theme.label}</span>
      {active && <Check className="size-3.5 text-muted-foreground" />}
    </DropdownMenuItem>
  )
}

export function ThemePicker() {
  const themeId = useUIStore((s) => s.themeId)
  const setTheme = useUIStore((s) => s.setTheme)

  const lightThemes = THEMES.filter((t) => t.mode === 'light')
  const darkThemes = THEMES.filter((t) => t.mode === 'dark')

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Pick color theme">
              <Palette />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Color theme</TooltipContent>
      </Tooltip>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Light
        </DropdownMenuLabel>
        {lightThemes.map((t) => (
          <ThemeRow key={t.id} theme={t} active={themeId === t.id} onSelect={() => setTheme(t.id)} />
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Dark
        </DropdownMenuLabel>
        {darkThemes.map((t) => (
          <ThemeRow key={t.id} theme={t} active={themeId === t.id} onSelect={() => setTheme(t.id)} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
