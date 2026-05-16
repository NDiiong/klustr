import { ListContexts, PingContext } from '@/lib/wails/wailsjs/go/app/App'
import { kube } from '@/lib/wails/wailsjs/go/models'

export type ContextInfo = kube.ContextInfo
export type Kubeconfig = kube.Kubeconfig
export type ServerVersion = kube.ServerVersion

export const api = {
  listContexts: (): Promise<Kubeconfig> => ListContexts(),
  pingContext: (name: string): Promise<ServerVersion> => PingContext(name),
}
