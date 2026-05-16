import { EventsOn } from '@/lib/wails/wailsjs/runtime/runtime'

type Handler = (contextName: string) => void

const handlers = new Map<string, Set<Handler>>()
let installed = false

function install() {
  if (installed) return
  installed = true
  EventsOn('kube:change', (contextName: string, kind: string) => {
    handlers.get(kind)?.forEach((h) => h(contextName))
  })
}

export function onKubeChange(kind: string, handler: Handler): () => void {
  install()
  let set = handlers.get(kind)
  if (!set) {
    set = new Set()
    handlers.set(kind, set)
  }
  set.add(handler)
  return () => {
    set.delete(handler)
  }
}

const pfHandlers = new Set<() => void>()
let pfInstalled = false

function installPF() {
  if (pfInstalled) return
  pfInstalled = true
  EventsOn('pf:update', () => {
    pfHandlers.forEach((h) => h())
  })
}

export function onPFUpdate(handler: () => void): () => void {
  installPF()
  pfHandlers.add(handler)
  return () => {
    pfHandlers.delete(handler)
  }
}
