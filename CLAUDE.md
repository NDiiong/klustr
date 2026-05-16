# Klustr

Cross-platform Kubernetes desktop client. Multi-context cluster management with live resource updates, log streaming, exec, and port-forwarding. **Nothing is installed in the cluster** — Klustr is a pure client that drives the standard Kubernetes API using the user's `~/.kube/config`.

## Tech Stack

| Layer | Choice |
|---|---|
| Desktop framework | Wails v2 (Go backend + native webview) |
| Backend | Go 1.26 + `client-go` |
| Frontend | React 19 + TypeScript + Vite |
| UI | Tailwind CSS + shadcn/ui |
| Routing | TanStack Router |
| Real-time state | Zustand |
| Mutations | TanStack Query (mutations only — no query cache) |
| Tables | TanStack Table |
| Terminal (logs + exec) | xterm.js |
| Code editor (YAML) | Monaco |
| Forms | React Hook Form + Zod |
| Toolchain | mise (pins Go, Node, Wails CLI versions) |
| CI release builds | Docker (Linux) + GitHub Actions matrix (macOS, Windows) |

Decision rationale lives in the project chat history; this file is the contract going forward.

## Project Structure

```
klustr/
├── .mise.toml             tool versions (Go, Node, Wails CLI)
├── wails.json             Wails project config
├── main.go                application entry point
├── internal/              pure Go business logic (no Wails imports)
│   └── kube/
│       ├── config.go       kubeconfig parsing, context discovery
│       ├── manager.go      ClientManager: clientset cache per context
│       ├── mutate.go       generic apply/delete/scale via dynamic client + kindToGVR map
│       ├── informers.go    watch-based live resource cache + per-kind list types
│       ├── details.go      per-kind detail structs and Get() builders
│       ├── events.go       core/v1 Events list filtered by involvedObject
│       ├── metrics.go      metrics.k8s.io pod CPU/memory usage
│       ├── logs.go         streaming log sessions
│       ├── exec.go         SPDY exec sessions
│       └── portforward.go  port-forward registry & lifecycle
├── app/                   Wails binding adapter (thin layer)
├── frontend/
│   └── src/
│       ├── features/      contexts, resources, logs, exec, portforward
│       ├── components/    shared components + shadcn/ui primitives
│       ├── store/         Zustand stores (resources, ui)
│       ├── lib/wails/     auto-generated Go bindings — DO NOT EDIT
│       ├── lib/api.ts     ergonomic wrappers over wails bindings
│       └── routes/        TanStack Router definitions
├── build/                 Wails build artifacts (icons, Info.plist)
├── docker/ci.Dockerfile   CI-only image for Linux release builds
└── .github/workflows/     CI release matrix
```

The `internal/` ↔ `app/` split is intentional:
- `internal/kube` is Wails-agnostic and stays testable with plain `go test`.
- `app/` is the thin Wails binding adapter — if we ever ship a CLI or web mode, only `app/` is rewritten.

## Architecture Patterns

### Live data flow — Informer pattern

We never poll the Kubernetes API. Resource lists are kept live by `client-go` Informers running in the Go backend:

```
K8s API ──watch──> Informer ──cache+events──> Wails event ──> Zustand store ──> React UI
```

- **Cluster-scoped informers:** `Node`, `Namespace`, `PersistentVolume`, `StorageClass`, `IngressClass`, `PriorityClass`, `RuntimeClass`, `MutatingWebhookConfiguration`, `ValidatingWebhookConfiguration` (one per active context).
- **Namespace-scoped informers:** `Pod`, `Deployment`, `ReplicaSet`, `ReplicationController`, `StatefulSet`, `DaemonSet`, `Job`, `CronJob`, `Service`, `Endpoints`, `EndpointSlice`, `Ingress`, `NetworkPolicy`, `ConfigMap`, `Secret`, `PersistentVolumeClaim`, `ResourceQuota`, `LimitRange`, `HorizontalPodAutoscaler`, `PodDisruptionBudget`, `Lease`. Restarted when the user switches namespace.
- Informer lifecycle is owned by `ClientManager`; cancellation propagates via `context.Context`.
- The backend debounces event bursts (~100ms window) before emitting to the frontend to avoid flooding React.
- Pod metrics are not informers — `metrics.k8s.io` only supports List. The frontend polls every 15 s and hides the column if the API is unavailable.

### Frontend state — three layers, never mixed

| Layer | Tool | Use |
|---|---|---|
| Real-time resource state | Zustand (`resources` store, plus `metrics`, `portForwards`) | Live caches fed by Wails events |
| Server actions | TanStack Query (mutations only) | Delete, apply, scale, start port-forward |
| UI state | Zustand (`ui` store, plus `tablePrefs` persisted) | Selected context/namespace, theme, table column order/size/visibility |

Do not put Informer data into TanStack Query's cache, and do not put mutation state into Zustand. Crossing these layers causes subtle bugs around invalidation and re-renders.

### UI layout

Three-panel layout:
- **Header:** context switcher, namespace selector, port-forward indicator, theme toggle.
- **Sidebar:** resource type navigation grouped Workloads / Config / Network / Storage / Cluster.
- **Main:** resource list (`ResourceTable` generic over `<T>`) → detail Dialog with `Overview / Logs / Exec / Events / YAML` tabs.

### Adding a new built-in resource

Each kind is a thin, repeatable slice. To add one:
1. **Backend types**: `XxxInfo` (list shape) in `internal/kube/informers.go`, `XxxDetail` (detail shape) in `internal/kube/details.go`.
2. **Informer**: register an event handler in `(*contextWatcher).start` that calls `w.touch("Xxx")`, then add `"Xxx"` to the initial-touch kind list.
3. **Listers**: `(*contextWatcher).Xxxs(namespace)` and `(*contextWatcher).Xxx(namespace, name)`.
4. **Manager**: forwarder methods on `*ClientManager`.
5. **App bindings**: `ListXxxs` and `GetXxx` on `*App`.
6. **GVR**: entry in `kindToGVR` so YAML edit/delete/scale work via the dynamic client.
7. Run `wails generate module`.
8. **Frontend**: types in `frontend/src/lib/api.ts`, slot in `frontend/src/store/resources.ts`, kind/view in `frontend/src/store/ui.ts`, `XxxView.tsx` + `XxxDetailBody.tsx` under `frontend/src/features/<plural>/`, dispatch case in `ResourceDetailPanel.tsx`, sidebar entry + `MainView` case in `App.tsx`.

Always init Go slices through `append([]string{}, src...)` so nil never serializes as JSON `null` — the React detail bodies treat these as arrays unconditionally.

## Development Workflow

```bash
mise install     # one-time: installs Go, Node, Wails CLI per .mise.toml
wails dev        # hot-reload dev session; opens native window
```

Docker is **not** required for local development. Docker is used only for reproducible CI Linux builds.

## Coding Conventions

### Comments

- Default to **no comments**. Well-named identifiers are the documentation.
- Add a comment only when the **why** is non-obvious: a hidden constraint, a workaround for a specific bug, a non-trivial invariant, a deliberate deviation from convention.
- Never write "WHAT" comments — the code already says what it does.
- Never reference issues, PRs, callers, or "added for feature X" — that belongs in the commit message and rots in the code.

### General code style

- Don't add error handling for impossible cases. Validate at system boundaries (user input, Kubernetes API responses, file I/O); trust internal callers and framework guarantees.
- Don't introduce abstractions for hypothetical future needs. Three similar lines is better than a premature helper.
- Don't add backwards-compatibility shims, feature flags, or `_unused` placeholder renames unless the project actually needs them.
- Delete dead code immediately. Don't leave `// removed` comments.

### Go

- Idiomatic Go: small interfaces, value semantics where appropriate, errors as values.
- `context.Context` is the first parameter for any function that may block, spawn goroutines, or talk to the network.
- Return errors; don't panic in library code.
- Long-running goroutines (informers, log streams, exec sessions, port-forwards) **must** accept a `context.Context` and stop cleanly on cancel.
- Never log or expose user credentials, tokens, or kubeconfig contents, even at debug level.

### TypeScript / React

- `strict: true`. No `any` unless at a true boundary, and only with a comment explaining why.
- Prefer narrow types over broad ones. Discriminated unions over optional flags.
- Wails bindings under `frontend/src/lib/wails/` are auto-generated. Never edit by hand. Wrap them in `frontend/src/lib/api.ts` for ergonomic helpers.
- Real-time data is read from Zustand selectors only — never call Go directly in a render path.
- Wrap heavy components (Monaco, xterm.js) in Suspense so they don't block initial render.
- Use shadcn/ui primitives as the base; do not pull in a second component library.

### Kubernetes interactions

- Use the typed `client-go` clientset for built-in resources.
- Use the dynamic client + discovery client for custom resources.
- Never use `kubectl` as a subprocess from inside the app. Talk to the API directly.

## Phase Roadmap

| Phase | Deliverable | Status |
|---|---|---|
| 0. Setup | mise config + `wails init` + Tailwind/shadcn scaffolding + first window renders | done |
| 1. Contexts | kubeconfig discovery, context switcher UI, ClientManager backend | done |
| 2. Resource browser | Informer infrastructure + core resources + YAML detail view | done |
| 3. Logs | xterm.js streaming log viewer (single pod + Stern-style aggregated workload logs with ANSI highlighting) | done |
| 4. Exec | xterm.js + SPDY exec sessions | done |
| 5. Mutations | Monaco YAML editor + diff dialog before apply, delete, scale | done |
| 6. Port-forward | PF manager UI + status bar indicator | done |
| 7. Polish | app icons, command palette, status bar, filter shortcut, log save/regex, code-split bundles, dark theme, copy buttons, restart-count badge, CPU/Mem usage bars, table column resize/reorder/visibility (persisted), drag-to-reorder columns, app-wide `user-select: none` on chrome | done |
| 8. Resource breadth | Every built-in resource kind: Pods, Deployments, ReplicaSets, ReplicationControllers, StatefulSets, DaemonSets, Jobs, CronJobs, HPAs, PDBs, Services, Endpoints, EndpointSlices, Ingresses, IngressClasses, NetworkPolicies, ConfigMaps, Secrets, ResourceQuotas, LimitRanges, Leases, Mutating/ValidatingWebhookConfigurations, PVCs, PVs, StorageClasses, Nodes, Namespaces, PriorityClasses, RuntimeClasses, Events (cluster-wide + per-resource) | done |
| 9. Release | GitHub Actions build matrix, first release | todo |

## Things to Avoid

- Polling the Kubernetes API instead of using Informers (metrics.k8s.io is the only exception — it has no watch).
- Installing anything inside the cluster — Klustr is a pure client.
- Importing Wails-specific packages into `internal/kube/...`.
- Returning nil slices from Go: the JSON encoder emits `null` and React `.length` access blows up. Use `append([]string{}, src...)`.
- Passing a fresh object literal into TanStack `state.columnSizing` (or similar controlled props) every render — TanStack fires the change handler and the controlled store ping-pongs into an infinite loop.
- Adding global stores beyond the documented layers (`resources`, `metrics`, `portForwards`, `ui`, `tablePrefs`).
- Generating boilerplate docs (CHANGELOG, CONTRIBUTING, CODE_OF_CONDUCT) before they're needed.
- Marketing-style copy or emoji in UI strings unless explicitly requested.
- Editing auto-generated Wails bindings.

## Verification Before Reporting Done

- Go: `go test ./internal/...` passes.
- Frontend: `npm test` (Vitest) inside `frontend/` passes.
- Manual: `wails dev` runs and the changed feature actually works in the native window. Type checks alone are not sufficient for UI work.
