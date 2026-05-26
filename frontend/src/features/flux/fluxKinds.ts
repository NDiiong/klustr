import type { FluxKind } from '@/lib/api'
import type { SelectedResource } from '@/store/ui'

// Group + resource of the three Flux CRs PR1 supports. The frontend uses
// these to call api.ensureCustomResourceWatch + look up CRDs in the cache,
// and the rest of Klustr (sidebar detection, dispatch) sticks to the
// FluxKind string identifiers.
export const FLUX_KUSTOMIZATION_GROUP = 'kustomize.toolkit.fluxcd.io'
export const FLUX_HELMRELEASE_GROUP = 'helm.toolkit.fluxcd.io'
export const FLUX_SOURCE_GROUP = 'source.toolkit.fluxcd.io'

export const FLUX_KUSTOMIZATION_RESOURCE = 'kustomizations'
export const FLUX_HELMRELEASE_RESOURCE = 'helmreleases'
export const FLUX_GITREPOSITORY_RESOURCE = 'gitrepositories'

// fluxKind label used in the detail dialog header, distinct from the
// Klustr-internal "FluxKustomization" identifier so the UI reads naturally.
export const FLUX_KIND_LABEL: Record<FluxKind, string> = {
  FluxKustomization: 'Kustomization',
  FluxHelmRelease: 'HelmRelease',
  FluxGitRepository: 'GitRepository',
}

const FLUX_KINDS = new Set<string>(['FluxKustomization', 'FluxHelmRelease', 'FluxGitRepository'])

export function isFluxResource(resource: SelectedResource | null): resource is SelectedResource & { kind: FluxKind } {
  return resource !== null && FLUX_KINDS.has(resource.kind as string)
}

// stripFluxKindPrefix maps the Klustr-side kind ("FluxKustomization") to
// the bare CR kind ("Kustomization"). The EventsTab needs the bare form
// because core/v1 Events store .involvedObject.kind as the actual CR kind.
export function stripFluxKindPrefix(kind: string): string {
  return kind.startsWith('Flux') ? kind.slice(4) : kind
}
