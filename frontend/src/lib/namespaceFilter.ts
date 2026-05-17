export type NamespaceQuery = {
  apiNamespace: string
  matches: (namespace: string) => boolean
}

export function namespaceQuery(selected: readonly string[]): NamespaceQuery {
  if (selected.length === 0) {
    return { apiNamespace: '', matches: () => true }
  }
  if (selected.length === 1) {
    const only = selected[0]
    return { apiNamespace: only, matches: (ns) => ns === only }
  }
  const set = new Set(selected)
  return { apiNamespace: '', matches: (ns) => set.has(ns) }
}

export function namespaceLabel(selected: readonly string[]): string {
  if (selected.length === 0) return 'All namespaces'
  if (selected.length === 1) return selected[0]
  return `${selected.length} namespaces`
}
