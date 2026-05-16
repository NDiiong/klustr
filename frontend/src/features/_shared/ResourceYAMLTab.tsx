import { lazy, Suspense, useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

const Editor = lazy(() => import('@monaco-editor/react').then((m) => ({ default: m.Editor })))

import { useThemeMode } from './useThemeMode'

type Props = {
  contextName: string | null
  kind: string
  namespace: string
  name: string
}

export function ResourceYAMLTab({ contextName, kind, namespace, name }: Props) {
  const theme = useThemeMode()
  const [source, setSource] = useState<string>('')
  const [draft, setDraft] = useState<string>('')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!contextName) return
    let cancelled = false
    setLoaded(false)
    setLoadError(null)
    api
      .getResourceYAML(contextName, kind, namespace, name)
      .then((y) => {
        if (cancelled) return
        setSource(y)
        setDraft(y)
        setLoaded(true)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setLoadError(String(e))
        setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [contextName, kind, namespace, name])

  const apply = useMutation({
    mutationFn: async () => {
      if (!contextName) throw new Error('no context')
      await api.applyResourceYAML(contextName, draft)
    },
    onSuccess: () => {
      toast.success(`Applied ${kind.toLowerCase()}/${name}`)
      setSource(draft)
      setEditing(false)
    },
  })

  const dirty = draft !== source

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2 text-xs">
        <span className="text-muted-foreground">YAML</span>
        {editing ? (
          <>
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={() => {
                setDraft(source)
                setEditing(false)
                apply.reset()
              }}
              disabled={apply.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="xs"
              onClick={() => apply.mutate()}
              disabled={!dirty || apply.isPending}
            >
              {apply.isPending ? 'Applying…' : 'Apply'}
            </Button>
          </>
        ) : (
          <Button
            type="button"
            size="xs"
            variant="outline"
            onClick={() => setEditing(true)}
            disabled={!loaded || !!loadError}
          >
            Edit
          </Button>
        )}
        <span className="ml-auto text-muted-foreground">
          {editing && dirty ? '● unsaved changes' : null}
        </span>
      </div>
      {loadError && (
        <div className="border-b border-destructive/40 bg-destructive/10 px-4 py-2 text-xs font-mono text-destructive break-words">
          {loadError}
        </div>
      )}
      {apply.error && (
        <div className="border-b border-destructive/40 bg-destructive/10 px-4 py-2 text-xs font-mono text-destructive break-words">
          {String(apply.error)}
        </div>
      )}
      <div className="min-h-0 flex-1">
        <Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-muted-foreground">Loading editor…</div>}>
          {loaded && !loadError && (
            <Editor
              height="100%"
              language="yaml"
              value={editing ? draft : source}
              onChange={(v) => setDraft(v ?? '')}
              theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
              options={{
                readOnly: !editing,
                minimap: { enabled: false },
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                fontSize: 12,
                fontFamily:
                  '"JetBrains Mono", "Geist Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                tabSize: 2,
                automaticLayout: true,
              }}
            />
          )}
        </Suspense>
      </div>
    </div>
  )
}
