import './style.css'
import {
  createIcons,
  Copy,
  Download,
  ArrowDown,
  Check,
  ShieldCheck,
  Zap,
  KeyRound,
  Layers,
  Maximize2,
  ScanSearch,
  Boxes,
  Puzzle,
  Ship,
  GitMerge,
  Waypoints,
  ScrollText,
  FileCode2,
  Hammer,
  Rocket,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide'
import { siApple, siArchlinux, siUbuntu, siLinux } from 'simple-icons'

const REPO = 'SametKUM/klustr'
const BASE = import.meta.env.BASE_URL

type Shot = { file: string; title: string; theme: string }

const SHOTS: Shot[] = [
  { file: '03-cluster-overview-nord.png', title: 'Cluster overview', theme: 'Nord' },
  { file: '02-pods-aggregated-dracula.png', title: 'Aggregated pods', theme: 'Dracula' },
  { file: '05-argo-sync-one-dark.png', title: 'Argo CD applications', theme: 'One Dark' },
  { file: '04-helm-upgrade-tokyo-night-day.png', title: 'Helm upgrade', theme: 'Tokyo Night Day' },
  { file: '06-gateway-httproutes-monokai.png', title: 'Gateway API · HTTPRoutes', theme: 'Monokai' },
  { file: '07-logs-audit-stream-default-dark.png', title: 'Multi-pod log stream', theme: 'Default Dark' },
  { file: '08-pod-detail-tokyo-night.png', title: 'Pod detail', theme: 'Tokyo Night' },
  { file: '09-yaml-diff-monokai-light.png', title: 'YAML edit with diff', theme: 'Monokai Light' },
  { file: '01-welcome-default-dark.png', title: 'Connections', theme: 'Default Dark' },
  { file: '10-port-forward-dracula-light.png', title: 'Port-forwarding', theme: 'Dracula Light' },
]

// ── Screenshots gallery ──────────────────────────────────────────────
const gallery = document.querySelector<HTMLElement>('[data-gallery]')
if (gallery) {
  SHOTS.forEach((s, i) => {
    const fig = document.createElement('figure')
    fig.className = 'shot reveal'
    fig.style.animationDelay = `${(i % 3) * 80}ms`
    fig.dataset.index = String(i)
    fig.innerHTML = `
      <img loading="lazy" src="${BASE}screenshots/${s.file}" alt="${s.title} — ${s.theme} theme" />
      <figcaption class="flex items-center justify-between gap-2 px-4 py-3 text-sm">
        <span class="font-medium">${s.title}</span>
        <span class="font-mono text-xs text-muted-foreground">${s.theme}</span>
      </figcaption>`
    fig.addEventListener('click', () => openLightbox(i))
    gallery.appendChild(fig)
  })
}

// ── Lightbox ─────────────────────────────────────────────────────────
const lb = document.getElementById('lightbox')
const lbImg = lb?.querySelector<HTMLImageElement>('[data-lb-img]')
const lbCap = lb?.querySelector<HTMLElement>('[data-lb-caption]')
let lbIndex = 0

function renderLightbox() {
  if (!lbImg || !lbCap) return
  const s = SHOTS[lbIndex]
  lbImg.src = `${BASE}screenshots/${s.file}`
  lbImg.alt = `${s.title} — ${s.theme} theme`
  lbCap.textContent = `${s.title} · ${s.theme} theme`
}

function openLightbox(i: number) {
  if (!lb) return
  lbIndex = i
  renderLightbox()
  lb.classList.remove('hidden')
  lb.classList.add('flex')
  lb.setAttribute('aria-hidden', 'false')
  document.body.style.overflow = 'hidden'
}

function closeLightbox() {
  if (!lb) return
  lb.classList.add('hidden')
  lb.classList.remove('flex')
  lb.setAttribute('aria-hidden', 'true')
  document.body.style.overflow = ''
}

function stepLightbox(delta: number) {
  lbIndex = (lbIndex + delta + SHOTS.length) % SHOTS.length
  renderLightbox()
}

if (lb) {
  lb.querySelector('[data-lb-close]')?.addEventListener('click', closeLightbox)
  lb.querySelector('[data-lb-prev]')?.addEventListener('click', () => stepLightbox(-1))
  lb.querySelector('[data-lb-next]')?.addEventListener('click', () => stepLightbox(1))
  lb.addEventListener('click', (e) => {
    if (e.target === lb) closeLightbox()
  })
  document.addEventListener('keydown', (e) => {
    if (lb.classList.contains('hidden')) return
    if (e.key === 'Escape') closeLightbox()
    else if (e.key === 'ArrowLeft') stepLightbox(-1)
    else if (e.key === 'ArrowRight') stepLightbox(1)
  })
}

// ── Tabs ─────────────────────────────────────────────────────────────
function selectTab(group: HTMLElement, name: string) {
  group.querySelectorAll<HTMLElement>('[data-tab]').forEach((t) => {
    t.setAttribute('aria-selected', String(t.dataset.tab === name))
  })
  group.querySelectorAll<HTMLElement>('[data-panel]').forEach((p) => {
    p.hidden = p.dataset.panel !== name
  })
}

document.querySelectorAll<HTMLElement>('[data-tabs]').forEach((group) => {
  group.querySelectorAll<HTMLElement>('[data-tab]').forEach((tab) => {
    tab.addEventListener('click', () => selectTab(group, tab.dataset.tab ?? ''))
  })
})

// Pre-select the install tab that matches the visitor's OS.
function detectTab(): string {
  const ua = navigator.userAgent
  if (/Macintosh|Mac OS X/.test(ua)) return 'mac'
  if (/Windows/.test(ua)) return 'build'
  if (/Linux|X11|CrOS/.test(ua)) return 'deb'
  return 'mac'
}
const heroTabs = document.querySelector<HTMLElement>('[data-tabs="hero"]')
if (heroTabs) selectTab(heroTabs, detectTab())

// ── Copy-to-clipboard ────────────────────────────────────────────────
// Inject a copy button into each standalone command block.
document.querySelectorAll<HTMLElement>('[data-block]').forEach((block) => {
  const btn = document.createElement('button')
  btn.setAttribute('data-copy', '')
  btn.setAttribute('aria-label', 'Copy command')
  btn.className =
    'absolute right-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-md border border-border-strong bg-[oklch(1_0_0/0.04)] px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground'
  btn.innerHTML = '<i data-lucide="copy"></i><span data-copy-label>Copy</span>'
  block.appendChild(btn)
})

function commandText(pre: HTMLElement): string {
  return pre.innerText
    .split('\n')
    .map((line) => line.replace(/^\$\s/, ''))
    .join('\n')
    .trim()
}

document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const container = btn.parentElement
    const pre =
      container?.querySelector<HTMLElement>('.panel:not([hidden]) pre.cmd') ??
      container?.querySelector<HTMLElement>('pre.cmd')
    if (!pre) return
    try {
      await navigator.clipboard.writeText(commandText(pre))
    } catch {
      return
    }
    const label = btn.querySelector<HTMLElement>('[data-copy-label]')
    btn.classList.add('copied')
    if (label) label.textContent = 'Copied'
    window.setTimeout(() => {
      btn.classList.remove('copied')
      if (label) label.textContent = 'Copy'
    }, 1600)
  })
})

// ── Live data from GitHub (version + stars), best-effort ─────────────
async function hydrateFromGitHub() {
  try {
    const [release, repo] = await Promise.allSettled([
      fetch(`https://api.github.com/repos/${REPO}/releases/latest`).then((r) =>
        r.ok ? r.json() : Promise.reject(),
      ),
      fetch(`https://api.github.com/repos/${REPO}`).then((r) =>
        r.ok ? r.json() : Promise.reject(),
      ),
    ])

    if (release.status === 'fulfilled' && release.value?.tag_name) {
      const tag = String(release.value.tag_name)
      document.querySelectorAll('[data-version]').forEach((el) => (el.textContent = tag))
      document.querySelectorAll('[data-version-inline]').forEach((el) => (el.textContent = tag))
    }
    if (repo.status === 'fulfilled' && typeof repo.value?.stargazers_count === 'number') {
      const stars = repo.value.stargazers_count as number
      const text = stars >= 1000 ? `${(stars / 1000).toFixed(1)}k` : String(stars)
      document.querySelectorAll('[data-stars]').forEach((el) => (el.textContent = text))
    }
  } catch {
    /* offline or rate-limited — defaults stay in place */
  }
}

// ── Scroll reveal ────────────────────────────────────────────────────
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
if (reduceMotion) {
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'))
} else {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in')
          io.unobserve(entry.target)
        }
      })
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  )
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el))
}

// ── Sticky nav state ─────────────────────────────────────────────────
const nav = document.getElementById('nav')
if (nav) {
  const onScroll = () => nav.classList.toggle('nav-scrolled', window.scrollY > 8)
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
}

// ── Brand (OS) logos via simple-icons ────────────────────────────────
const BRANDS: Record<string, { path: string; color: string }> = {
  apple: { path: siApple.path, color: 'currentColor' },
  archlinux: { path: siArchlinux.path, color: `#${siArchlinux.hex}` },
  ubuntu: { path: siUbuntu.path, color: `#${siUbuntu.hex}` },
  linux: { path: siLinux.path, color: 'currentColor' },
}
document.querySelectorAll<HTMLElement>('[data-brand]').forEach((el) => {
  const brand = BRANDS[el.dataset.brand ?? '']
  if (!brand) return
  const size = el.dataset.brandSize ?? '1em'
  el.innerHTML = `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="${brand.color}" aria-hidden="true"><path d="${brand.path}"/></svg>`
})

// ── Fullscreen the hero clip ─────────────────────────────────────────
const heroVideo = document.querySelector<HTMLVideoElement>('video')
document.querySelector<HTMLButtonElement>('[data-fs]')?.addEventListener('click', () => {
  if (!heroVideo) return
  const v = heroVideo as HTMLVideoElement & { webkitEnterFullscreen?: () => void }
  if (v.requestFullscreen) void v.requestFullscreen()
  else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen()
})

// ── Icons (run last so injected nodes are covered) ───────────────────
createIcons({
  icons: {
    Copy,
    Download,
    ArrowDown,
    Check,
    ShieldCheck,
    Zap,
    KeyRound,
    Layers,
    Maximize2,
    ScanSearch,
    Boxes,
    Puzzle,
    Ship,
    GitMerge,
    Waypoints,
    ScrollText,
    FileCode2,
    Hammer,
    Rocket,
    X,
    ChevronLeft,
    ChevronRight,
  },
})

void hydrateFromGitHub()
