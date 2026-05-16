import type { ITheme } from '@xterm/xterm'

export const lightXtermTheme: ITheme = {
  background: '#ffffff',
  foreground: '#0f172a',
  cursor: '#0f172a',
  cursorAccent: '#ffffff',
  selectionBackground: '#cbd5e1',
  black: '#1f2937',
  red: '#dc2626',
  green: '#059669',
  yellow: '#b45309',
  blue: '#2563eb',
  magenta: '#9333ea',
  cyan: '#0891b2',
  white: '#e5e7eb',
  brightBlack: '#475569',
  brightRed: '#ef4444',
  brightGreen: '#10b981',
  brightYellow: '#d97706',
  brightBlue: '#3b82f6',
  brightMagenta: '#a855f7',
  brightCyan: '#06b6d4',
  brightWhite: '#f8fafc',
}

export const darkXtermTheme: ITheme = {
  background: '#0a0a0a',
  foreground: '#e5e7eb',
  cursor: '#e5e7eb',
  cursorAccent: '#0a0a0a',
  selectionBackground: '#3f3f46',
  black: '#1f2937',
  red: '#f87171',
  green: '#34d399',
  yellow: '#fbbf24',
  blue: '#60a5fa',
  magenta: '#c084fc',
  cyan: '#22d3ee',
  white: '#e5e7eb',
  brightBlack: '#52525b',
  brightRed: '#fca5a5',
  brightGreen: '#6ee7b7',
  brightYellow: '#fcd34d',
  brightBlue: '#93c5fd',
  brightMagenta: '#d8b4fe',
  brightCyan: '#67e8f9',
  brightWhite: '#fafafa',
}

export function xtermThemeFor(mode: 'light' | 'dark'): ITheme {
  return mode === 'dark' ? darkXtermTheme : lightXtermTheme
}
