# SPEC — Henry Lim 3D Interactive Portfolio

> This is the single source of truth for design + implementation.
> Concept: **"기획자의 진화 (The Evolution of a Planner)"** — 17 years of game business planning → AI automation systems architect.
> One continuous scroll journey. A single persistent 3D particle world morphs through "eras" as the user scrolls, while DOM content sections scroll over it.

---

## 0. Non-negotiable conventions

- Vite + React 19 + TypeScript **strict**. Tailwind CSS 3.4 for styling (+ utilities defined in `src/index.css`). No new npm dependencies.
- **All copy comes from `src/content/profile.ts` via `useT()`** (`src/lib/i18n.tsx`). Never hardcode user-facing strings (except purely decorative latin labels already in profile).
- Bilingual: `ko` (default) / `en`. Every visible string is a `Bi` object.
- **Reduced motion**: every GSAP/Framer animation must be guarded. If `prefersReducedMotion()` (`src/lib/quality.ts`) is true → set final states instantly (gsap.set / no animation). The 3D canvas is never mounted in that case (App handles it), but section code must still guard its own tweens.
- GSAP ScrollTrigger is already registered globally by `src/lib/scroll.ts`. Import gsap normally (`import gsap from 'gsap'`, `import { ScrollTrigger } from 'gsap/ScrollTrigger'`).
- Clean up: every ScrollTrigger/tween created in a component must be killed on unmount (`useGSAP` from `@gsap/react` with `scope`, or manual cleanup). Prefer `useGSAP`.
- Section components register scroll progress by wrapping content in `<SectionShell id="...">` (contract below).
- Z-layers: canvas/fallback bg = `z-0` (fixed), main content = `z-10`, nav = `z-40`, preloader = `z-[60]`, cursor = `z-[70]`.
- Design language: dark, cinematic, glassmorphism, glow, gradient accents. Generous whitespace. NEVER cramped. Typography does the heavy lifting.
- Every interactive element: visible `:focus-visible` state (provided globally), `aria-label` on icon-only links, semantic HTML (`section`, `h2` per section, one `h1` in hero).
- File ownership is strict (see §7). Do not edit files owned by others; do not edit `App.tsx`, `index.css`, `profile.ts`, `lib/*` (read them, use them).

## 1. Narrative & scene arc

Color/story arc across the page (scroll progress 0 → 1):

| Phase | Section | Era | Particle formation | Accent |
|---|---|---|---|---|
| 0 | hero | Game era begins | Galaxy swarm sphere + floating polyhedra artifacts | amber `#FFB454` |
| 1 | about | Identity | Loose vortex / torus funnel | warm `#FF9A62` |
| 2 | career | 17-year journey | Winding helix path (a road through time) | violet-warm `#A78BFA` |
| 3 | work | Results | Rising columns (bar-chart metaphor) | violet `#8B5CF6` |
| 4 | ai | Evolution | 3-layer network lattice + pulsing connection lines | cyan `#22D3EE` |
| 5 | contact | Open door | Calm wide starfield, slow upward drift | sky `#38BDF8` |

`skills` section shares phase 4→5 (no own keyframe).

## 2. Visual tokens

### Colors (Tailwind extended — already configured)
- `bg-base` `#06070C` (page bg), `bg-elev` `#0B0D16` (cards)
- `ink` `#F4F5F7` (primary text), `ink-dim` `#A3ABB8` (secondary), `ink-mute` `#5C6470`
- `era-amber` `#FFB454`, `era-coral` `#FF9A62`, `era-violet` `#8B5CF6`, `era-cyan` `#22D3EE`, `era-sky` `#38BDF8`
- Card border: `white/10`, glass fill: `white/[0.04]`

### Type
- Body/KO: `font-sans` → Pretendard Variable
- Display / latin headings / numerals: `font-display` → Space Grotesk Variable
- Eyebrow labels: `font-display text-xs md:text-sm uppercase tracking-[0.35em] text-ink-mute` — format: `01 · ABOUT`
- Hero display: `clamp(3.5rem, 10vw, 9rem)`, section titles: `clamp(2rem, 5vw, 3.75rem)`, tight leading (0.95–1.1), `font-semibold`/`font-bold`
- Korean headings: `break-keep`

### Utilities available in `index.css`
- `.text-gradient` — amber→violet→cyan gradient text
- `.text-gradient-cyan` — violet→cyan gradient text
- `.glass` — glass card (bg white/4%, border white/10, backdrop-blur, rounded-2xl)
- `.glow-cyan`, `.glow-violet` — box-shadow glows
- `.noise-overlay` — fixed film-grain overlay (already rendered by App)
- `.eyebrow` — eyebrow label styles as above
- `.section-pad` — standard section padding (`py-32 md:py-44` equivalent + container padding)
- `.container-std` — max-w-[1200px] mx-auto px-6 md:px-10

### Spacing & layout
- Sections: `min-h-screen` where content warrants; standard vertical rhythm via `.section-pad`
- Content container: `.container-std`

## 3. Shared contracts (already implemented — READ these files)

```ts
// src/lib/i18n.tsx
type Lang = 'ko' | 'en'
type Bi = { ko: string; en: string }
useLang(): { lang: Lang; setLang: (l: Lang) => void }
useT(): (b: Bi) => string

// src/lib/quality.ts
type QualityTier = 'full' | 'lite' | 'fallback'
detectTier(): QualityTier
prefersReducedMotion(): boolean

// src/lib/scroll.ts
scrollState: { progress: number; velocity: number; sections: Record<string, number> }
  // sections[id]: 0→1 while section crosses viewport (top-enters-bottom → bottom-leaves-top)
initSmoothScroll(enabled: boolean): () => void   // App only
registerSection(id: string, el: HTMLElement): () => void
getLenis(): Lenis | null   // for programmatic scrollTo in Nav

// src/lib/appState.ts
onReady(cb: () => void): () => void   // fires after preloader completes (or immediately if already ready)
setReady(): void                       // Preloader calls this exactly once
isReady(): boolean

// src/lib/motion.ts — shared eases/durations/framer variants (EASE, DUR, fadeUp, staggerContainer)

// src/components/SectionShell.tsx (owned by chrome agent)
<SectionShell id="about" className="...">{children}</SectionShell>
// renders <section id={id} className={`relative ${className}`}> and calls registerSection(id, el)
```

Component contracts (default exports, exact signatures):

```ts
// three/Experience.tsx
export default function Experience({ tier }: { tier: 'full' | 'lite' }): JSX.Element
// components
Preloader(): JSX.Element                          // self-contained, calls setReady()
Nav(): JSX.Element
Cursor({ enabled }: { enabled: boolean }): JSX.Element | null
Footer(): JSX.Element
FallbackBg(): JSX.Element
SectionShell({ id, className, children }): JSX.Element
// sections — all default export, no props:
Hero, About, Career, Achievements, AIChapter, Skills, Contact
```

Section ids (must match exactly — Nav anchors & scene phases depend on them):
`hero`, `about`, `career`, `work` (=Achievements), `ai`, `skills`, `contact`.

## 4. 3D scene spec (`src/three/**` — Scene agent)

### Canvas
- Rendered by `Experience`: `<Canvas>` inside a `<div className="fixed inset-0 z-0 pointer-events-none" aria-hidden>`.
- Camera: fov 45, position `[0, 0, 11]`. `gl={{ antialias: false, powerPreference: 'high-performance', alpha: true }}`, transparent clear (CSS bg shows through).
- `dpr`: full `[1, 1.75]`, lite `[1, 1.25]`. `frameloop="always"`.

### ParticleField (the core)
- `THREE.Points`, count: full **6000**, lite **2200**. Custom `ShaderMaterial`, additive blending, depthWrite false, soft round sprite (radial alpha falloff in fragment shader).
- Six keyframe position sets (Float32 attributes `aPos0`…`aPos5`) generated once with a **seeded RNG** (mulberry32) per §1 table:
  - K0 galaxy swarm: sphere shell r≈4 + two tilted orbital rings
  - K1 vortex: torus/funnel, r≈3.5, gentle
  - K2 helix path: winding helix along x∈[-6,6], 2.5 turns
  - K3 columns: 5–6 columns on a grid, varied heights (1.5→5), slight scatter
  - K4 lattice: 3 horizontal layer planes (y = 2.2 / 0 / −2.2) of jittered grid nodes
  - K5 starfield: wide flat box (x±8, y±5, z −2..2), sparse
- Vertex shader: `uPhase` (0..5 continuous). Blend between `floor(uPhase)` and next keyframe with `smoothstep`, plus per-particle stagger: offset local progress by `seed * 0.25` (clamped) so morphs feel organic, not uniform. Add small time-based wobble `sin(uTime * f + seed * τ) * 0.06`. Point size: base 0.045 world-scaled, ×(0.7 + seed*0.6), size attenuation.
- Color: uniform-driven, lerp along stops `[#FFB454, #FF9A62, #A78BFA, #8B5CF6, #22D3EE, #38BDF8]` by `uPhase`, ±10% per-particle brightness variation. Opacity ~0.85 core falloff.
- Per frame: read `scrollState.sections`, compute `targetPhase = Σ over [about,career,work,ai,contact] of smoothstep(0.12, 0.62, sections[id] ?? 0)` (range 0..5), then damp: `phase += (target − phase) * min(1, delta * 3)`.

### Artifacts (full tier only)
- ~24 instanced low-poly shapes (icosahedron + octahedron mix), scattered r 2.8–5 around origin, slow individual rotation, subtle float (drei `Float` acceptable per-group or manual).
- Material: `MeshStandardMaterial`, color near-white, `metalness 0.9 roughness 0.25`, some instances wireframe amber-tinted. Emissive slight.
- Visibility: scale → 0 as phase passes 0.9 (they belong to the hero era). Reappear never.
- Mouse parallax: whole group lerps rotation ±0.08 rad toward pointer.

### NetworkLines (AI era)
- Precompute ~280 line segments connecting nearby K4 lattice nodes (within radius, layer-to-adjacent-layer preferred).
- `LineSegments` + additive ShaderMaterial; global opacity = `smoothstep(3.4, 4.0, phase) * (1 − smoothstep(4.6, 5.2, phase))`; per-segment pulse traveling along lines via `uTime`.
- Color cyan `#22D3EE`.

### CameraRig
- Group wrapping camera. Per-phase offsets (lerped continuously from a keyframe array): z dolly 11 → 10 → 12 → 10.5 → 9.5 → 11.5; slight y drift (+0.5 → −0.5); rotation.z ±0.02 for cinematic tilt.
- Mouse parallax (full tier): target rotation ±0.05 rad, lerp factor 2.5*delta. Lite: none.

### Lights & PostFX
- `ambientLight` 0.5 + one `directionalLight` (2, 4, 5) intensity 1.2 + one cyan `pointLight` accent for artifacts.
- Full tier only: `EffectComposer` + `Bloom` (`mipmapBlur`, intensity 0.55, luminanceThreshold 0.25). Import from `@react-three/postprocessing`. Lite: none.

### Perf budget
- Full-tier desktop target 60fps, ≤ ~350k shader-processed verts, 1 postfx pass. No per-frame allocations (reuse vectors), no React state in the frame loop.
- `document.visibilitychange` → pause/resume via `useFrame` guard or `invalidate` strategy (keep simple: skip work when hidden).

## 5. Chrome spec (`src/components/**` — Chrome agent)

### Preloader
- Fixed overlay `z-[60]`, bg `#06070C`. Center: wordmark **HENRY LIM** (font-display, letters stagger-in) + percentage counter 0→100 (font-display, tabular) + thin progress bar.
- Progress: animate to ~90 over ~1.4s (gsap), jump to 100 when `document.fonts.ready` AND window `load` resolve (Promise.race with a 3.5s failsafe timeout). Then: counter fades, overlay lifts away (`yPercent: -100`, `power4.inOut`, 0.9s), call **`setReady()`**, then unmount itself (local state).
- Reduced motion: simple 0.3s fade, still calls `setReady()`. Failsafe: `setReady()` must ALWAYS fire ≤ 4s.
- While visible, prevent scroll (`getLenis()?.stop()` then `.start()`, plus `document.body.style.overflow` fallback).

### Nav
- Fixed top `z-40`, `.container-std` row: wordmark left — `H.` (gradient) + `Henry Lim` (hide name on mobile). Right: desktop links (About/Career/Work/AI/Skills/Contact from `profile.nav`), lang toggle.
- Transparent at top; after scrollY > 40: glass bar (bg-base/70 + backdrop-blur + border-b white/5) — toggle via ScrollTrigger or scroll listener.
- Link click: `e.preventDefault()`, `getLenis()?.scrollTo('#id', { offset: 0, duration: 1.4 })`; fallback `element.scrollIntoView({behavior:'smooth'})` when lenis is null.
- Lang toggle: pill with KO / EN, active highlighted (era-cyan), `aria-pressed`.
- Mobile (< md): hamburger (animated 2-line → X) → fullscreen overlay (AnimatePresence, bg-base/95 blur, links stagger in, big type). Lock scroll while open (`getLenis()?.stop()`).
- Entrance: nav fades/slides down via `onReady`.

### Cursor (full tier only; App passes `enabled`)
- If `!enabled` or touch device (`matchMedia('(pointer: coarse)')`) → return null.
- Dot (6px, ink) follows instantly; ring (36px, border white/40) trails with lerp. `mix-blend-difference`. Scale ring ×1.8 + fill white/10 when hovering `a, button, [data-cursor]`. Hide when pointer leaves window. `pointer-events-none z-[70]`. rAF loop, no React state per frame.
- Hide OS cursor only on `full` tier via body class `cursor-custom` (defined in index.css as `cursor: none` on interactive-safe elements) — keep it simple: apply `cursor-none` styles from the component by toggling class on `document.body`.

### Footer
- Slim: `.container-std` flex row (wrap on mobile): `© 2026 Henry Lim — {tagline}` left; right: mini links (Email/Instagram/Calendly) + `profile.footer.credit` ("Vibe-coded with AI · React Three Fiber…").
- `border-t white/5`, `py-10`, text-ink-mute text-sm.

### FallbackBg
- Fixed inset-0 z-0: layered radial gradients (amber top-left 8%, violet center 10%, cyan bottom-right 8% opacity) over bg-base, very slow drift animation (60s, CSS keyframe `bg-drift` — defined in index.css); static under reduced motion (media query already handles it). Plus subtle vignette.

### SectionShell
```tsx
export default function SectionShell({ id, className = '', children }:
  { id: string; className?: string; children: React.ReactNode })
```
- `<section id={id} ref={ref} className={`relative ${className}`}>` — on mount `registerSection(id, el)`, cleanup on unmount.

## 6. Section specs (Sections agents)

Common: each section starts with an eyebrow label (`.eyebrow`, e.g. `01 · ABOUT` — from `profile.<section>.label`) and an `h2` title. Reveal pattern: eyebrow fades in, title reveals with per-line/word mask (translate-y 110% → 0 inside `overflow-hidden` wrappers, stagger 0.08, `power3.out`, ScrollTrigger `start: 'top 75%'`, once). Guard reduced motion.

### Hero (`sections/Hero.tsx`) — id `hero`
- `min-h-[100svh]` flex column justify-center. Content: eyebrow `profile.hero.eyebrow` (latin, both langs) → `h1` two lines from `profile.hero.title` (`\n` split): line 1 plain ink, line 2 `.text-gradient`. Font-display for EN; KO uses sans bold — just use one style: `font-display` handles latin; Korean glyphs fall back to Pretendard automatically (font stack). Size `text-[clamp(3.5rem,10vw,9rem)] leading-[0.95] font-bold`.
- Under title: subtitle (`text-ink-dim text-lg md:text-2xl max-w-xl`), then name chip: small glass pill `임현택 · Henry Lim`.
- Bottom area: left — quote (`profile.hero.quote`, italic, text-ink-mute, max-w-md, border-l-2 border-era-amber pl-4, `\n` → two lines); center-bottom — scroll cue: "SCROLL" mono tracking + animated vertical line (scaleY loop). Hide scroll cue after user scrolls (opacity 0 when `scrollState.sections.hero > 0.6` or simple ScrollTrigger fade).
- Intro: all elements hidden initially; on `onReady` play master timeline (eyebrow → title lines mask-reveal stagger → subtitle/name → quote/cue). Reduced motion: gsap.set visible.
- The 3D canvas behind provides the visual; keep center-left text with breathing room (content max-w ~ 60% on desktop).
- Also render a subtle parallax on the whole text block: translateY up 10–15% as hero scrolls out (ScrollTrigger scrub).

### About (`sections/About.tsx`) — id `about`
- `.section-pad .container-std`. Grid lg:2-col (7/5).
- Left: eyebrow `01 · ABOUT`, h2 = `profile.about.title` (break-keep), body paragraph `profile.about.body` (text-ink-dim leading-relaxed, word-stagger reveal: split into word `<span>`s, opacity 0.15→1 scrubbed by scroll — "reading highlight" effect; reduced motion: full opacity).
- Right column (sticky lg:top-32): **career arc widget** — 4 steps from `profile.about.arc` (운영→FUN QA→사업→기획) vertical list; each: index, name, connecting line that draws on scroll (scaleY origin top, scrub), phase-colored dots (amber→coral→violet→cyan); after last, a 5th glowing chip `+ AI` (`profile.about.arcNext`) pulsing cyan. Below: 3 mini-stats from `profile.about.stats` (value + suffix countup on inView once, label) in a row. Then attitude line `profile.about.attitude` (italic, era-cyan, small).

### Career (`sections/Career.tsx`) — id `career`
- `.section-pad .container-std`. Eyebrow `02 · CAREER`, h2 `profile.career.title`, sub `profile.career.subtitle`.
- Vertical timeline: left rail (desktop: rail at left ~200px column with period; mobile: rail far-left). A continuous 2px gradient line (amber→violet→cyan top-to-bottom) inside rail that **draws** (scaleY 0→1, origin top, ScrollTrigger scrub across the whole list). 9 entries from `profile.career.entries` (chronological order as given).
- Entry row: period (font-display, text-ink-mute, tabular), phase dot (colored by `entry.phase`: ops=era-amber, qa=era-coral, biz=era-violet, plan=era-cyan) on the rail with glow, card: company (text-xl md:text-2xl font-semibold), role (text-ink-dim), titles (text-sm text-ink-mute, if present). Card: transparent by default, on hover → `.glass` + slight x-shift (desktop). Reveal: each row fades/slides up staggered (`once`).
- End cap: after last entry, a distinct row → `profile.career.arcNote` ("운영 → FUN QA → 사업 → 기획" journey summary) in gradient text.

### Achievements (`sections/Achievements.tsx`) — id `work`
- `.section-pad .container-std`. Eyebrow `03 · SELECTED WORK`, h2 `profile.work.title`, sub `profile.work.subtitle`.
- Bento grid: `grid md:grid-cols-6 gap-4 md:gap-5`. Card spans: Lyn `md:col-span-4`, Chaos `md:col-span-2`, Five Stars `md:col-span-2`, Super People `md:col-span-2`, Shadow of Death `md:col-span-2` (rows auto). All `.glass p-7 md:p-9 rounded-3xl` hover: border-white/25 + `.glow-violet` (or framer `whileHover={{ y: -6 }}`).
- Card content: top row — game title (font-semibold text-lg) + company tag (text-xs mono uppercase text-ink-mute); center — **big stat**: `useT`-selected `Stat` (value/prefix/suffix/decimals) rendered `font-display font-bold text-[clamp(2.75rem,6vw,4.5rem)]` with **count-up** (gsap `to` on plain object, `snap`, format `toLocaleString` respecting decimals; trigger once at `top 80%`; re-format instantly on lang switch — recompute displayed final value via effect, no replay); stat label under it (text-ink-dim); sub note (text-sm text-ink-mute).
- Stat number color: `.text-gradient-cyan` on the two biggest (Lyn, Chaos), ink on others.

### AIChapter (`sections/AIChapter.tsx`) — id `ai`
- `.section-pad .container-std`. Eyebrow `04 · NEW CHAPTER (2024 — )`, h2 `profile.ai.title` (use `.text-gradient-cyan` on key phrase — title provided as two `Bi` parts: `titleA` plain + `titleB` gradient), lede `profile.ai.lede` (text-xl md:text-2xl text-ink-dim max-w-3xl).
- **Orchestration diagram** (pure SVG/DOM, this is a signature moment): 3 tiers from `profile.ai.diagram`: top node `Orchestrator/오케스트레이터` (1), middle `Executors/실행자` (3 nodes), bottom `Verifier/검증자` (1). Glass node chips with cyan borders; SVG lines connecting; **pulse animation**: small glowing dots travel along the connection lines (SVG `<circle>` animated via gsap along line coordinates, loop, staggered) + badge `24/7 CLOUD` (`profile.ai.badge`) pinned top-right of diagram with pulsing dot. Reduced motion: static lines, no travel pulses.
- Below: 4 capability cards from `profile.ai.cards` — grid md:grid-cols-2 gap-5: `.glass p-7`, icon (simple inline SVG geometric icons: orbit/nodes, chart-flow, doc-pipeline, terminal-sparkle — draw them inline, `stroke="currentColor"` era-cyan), title (font-semibold), body (text-ink-dim text-sm leading-relaxed). Vibe-coding card gets extra footnote `profile.ai.cards[3].note` (era-cyan, small) — "이 사이트도…".
- Section ambience: this is where the palette flips to cyan — allowed: subtle radial cyan glow div behind diagram.

### Skills (`sections/Skills.tsx`) — id `skills`
- `.section-pad .container-std`. Eyebrow `05 · SKILLS`, h2 `profile.skills.title`.
- Layout lg:grid-cols-2 gap-12: **Hard** — numbered list rows (`01`–`07`): row = index (font-display text-ink-mute) + skill name (text-xl md:text-2xl font-medium) + hover: name slides slightly & gradient flash; last row (`AI 오케스트레이션·바이브코딩`) gets `NEW` badge (era-cyan pill, pulse). Border-b white/5 between rows; rows reveal staggered.
- **Soft** — heading `profile.skills.softTitle` + 4 `.glass` compact cards (p-5, text-base) from `profile.skills.soft`.

### Contact (`sections/Contact.tsx`) — id `contact`
- `min-h-[90svh]` flex center, `.container-std` centered text. Eyebrow `06 · CONTACT`.
- Huge statement `h2` = `profile.contact.title` `.text-gradient` `text-[clamp(2.75rem,8vw,6.5rem)] font-bold` (mask reveal on view). Lede `profile.contact.lede` (the attitude line).
- Email as giant interactive link: `bluedaylol80@gmail.com` — font-display text-xl md:text-3xl, underline slide-in on hover, `data-cursor`.
- Row of 3 actions (gap-4, wrap): **Calendly** primary button (`.glass` + glow-cyan + arrow-up-right icon, opens `_blank`, `rel="noreferrer"`, label `profile.contact.calendlyLabel`); **Instagram** ghost button (`_blank`); **KakaoTalk** ghost button — click copies `bluedaylol` (`navigator.clipboard.writeText`) and shows inline "Copied ✓ " state 2s (`profile.contact.copied`).
- Small print under: response promise line `profile.contact.note`.

## 7. File ownership

| Owner | Files |
|---|---|
| CORE (done — read-only) | `App.tsx`, `main.tsx`, `index.css`, `content/*`, `lib/*`, configs, `index.html` |
| Scene agent | `src/three/**` (`Experience.tsx`, + any `src/three/*.ts(x)` submodules/shaders) |
| Chrome agent | `src/components/Preloader.tsx`, `Nav.tsx`, `Cursor.tsx`, `Footer.tsx`, `FallbackBg.tsx`, `SectionShell.tsx` |
| Sections-1 agent | `src/sections/Hero.tsx`, `About.tsx`, `Career.tsx` |
| Sections-2 agent | `src/sections/Achievements.tsx`, `AIChapter.tsx` |
| Sections-3 agent | `src/sections/Skills.tsx`, `Contact.tsx` |

Stubs for all owned files already exist — replace them entirely. You may create additional private submodule files ONLY inside your owned directory scope (three/* subfiles for Scene agent; others keep to their listed files — small internal helpers may live inside the same file).

## 9. v2 — Career Journey deep-dive pages (2026-07-08)

Goal: main landing stays the compressed showcase; qualitative career narrative moves to
deep-dive subpages. Narrative: **main = "이 사람 뭔가 다르다" / journey pages = "왜 다른지 납득된다"**.

### Routing
- `react-router-dom` v7 (installed). `BrowserRouter basename={import.meta.env.BASE_URL}`.
- Routes: `/` → Landing (the existing section stack), `/career` → CareerHub, `/career/:slug` → PhasePage (slugs from `content/journey.ts` phases), `*` → redirect `/`.
- SPA deep links on GitHub Pages: `postbuild` script copies `dist/index.html` → `dist/404.html`.
- On route change: scroll to top instantly (respect Lenis — `getLenis()?.scrollTo(0,{immediate:true})` + `window.scrollTo(0,0)` fallback); set `document.title` (Landing: profile meta title; hub: `Career Journey — Henry Lim`; phase: `Phase {num} · {name en} — Henry Lim`).
- Landing must support `/#section` arrival: after preloader ready, if `location.hash`, scroll to that section.
- 3D `Experience` mounts ONLY on Landing. Journey pages use `JourneyBg` (below). Preloader stays at shell level (plays once). Nav + Footer render on all routes.

### Content source
`src/content/journey.ts` — `hub` (label/title/lede/mission/missionSource/workstyleTitle/workstyle[5]), `phases[5]` (slug/num/color/name/tagline/period/companies/roleLine/title/oneLiner/intro/did[]/problems[]/outputs[]/stories[]/carried), `sectionLabels`, `navLabel`. All `Bi` via `useT()`. Phase colors map to tokens: amber/coral/violet/cyan/sky → `era-*`.

### Nav additions
- Extra "Journey" link (`journey.navLabel`) after the anchor links, visually distinct (era-cyan text + small ↗ or dot) → routes to `/career`. Present in desktop row and mobile overlay.
- On non-`/` routes, anchor links navigate to `/#id` (Landing handles the hash scroll). Wordmark → `/`.

### JourneyBg (components/JourneyBg.tsx)
- `<div className="fixed inset-0 z-0" aria-hidden>`: base bg + one large radial gradient tinted by the current phase color (hub: violet→cyan blend) at 8–12% opacity, very slow drift (reuse `.animate-bg-drift`), vignette. Premium even static (reduced motion freezes via global CSS).

### CareerHub (`/career`)
- `.section-pad .container-std`, eyebrow `hub.label`, h1 `hub.title` (text-gradient), lede.
- **Mission quote block**: large italic quote (`hub.mission`) in a glass panel with gradient left border, source line (`hub.missionSource`) small under.
- **Layer stack**: the 5 phases rendered as stacked strata cards, **Phase 05 on top → 01 at bottom** (geological metaphor; matches newest-first). Each card: left color bar (phase color), `num` (font-display, ink-mute), `name` (bold, large), `tagline`, `period` + `companies` (small mono), arrow → `Link` to `/career/{slug}`. Hover: lift + phase-color glow border. Staggered reveal.
- **Workstyle section**: eyebrow-less sub-h2 `hub.workstyleTitle` + 5 glass cards (grid md:2 lg:3 — 5th spans or centers gracefully): title (font-semibold) + body (text-sm text-ink-dim).
- Footer CTA row: back home link + contact link.

### PhasePage (`/career/:slug`)
Template (all sections use the shared reveal language; reduced-motion guarded):
1. **Hero**: back link (`sectionLabels.backToMap` → `/career`), eyebrow `PHASE {num} · {name}`, h1 `title` (phase-color gradient text: use `text-gradient-cyan` for cyan/sky, or inline-styled gradient from phase color for amber/coral/violet — keep tasteful), lede `oneLiner`, meta strip: 3 glass chips (period / companies / roleLine).
2. **Intro**: large paragraph (`text-lg md:text-xl text-ink-dim max-w-3xl leading-relaxed`).
3. **Did** (`sectionLabels.did`): 2-col md checklist, phase-color small square/dash markers.
4. **Problems** (`sectionLabels.problems`): numbered large statements (font-display index + text-lg), generous spacing — reads like design principles.
5. **Outputs** (`sectionLabels.outputs`): stat cards grid (2 → 4 cols), glass, big `font-display` stat (phase-color or gradient on first), label + sub. No count-up needed (static, reveal only).
6. **Stories** (`sectionLabels.stories`): vertical list of story cards — story index `01…`, title (font-semibold text-lg md:text-xl), body (text-ink-dim). Left border in phase color.
7. **Carried** (`sectionLabels.carried`): closing block — the `carried` paragraph large + prev/next phase navigation: two cards (prev if exists / next if exists) with num+name+arrow; on the LAST phase, replace "next" with a CTA card linking `/#contact` ("다음 기획을 함께" — reuse profile.contact.title via useT).
- Unknown slug → redirect `/career`.

### QA additions for v2
- Direct deep-link (`/henry-portfolio/career/planning`) works locally via `vite preview` (serves 404? — verify with dev server route nav at minimum; postbuild copy covers production).
- Language toggle switches ALL journey copy on hub + phase pages.
- Landing regression: sections/3D/nav anchors unaffected; `/#about` hash arrival scrolls correctly.
- Mobile 390px: hub stack + phase template clean, no overflow.

## 10. v3 — Conversion & immersion round (2026-07-08)

Directives from the owner (no-approval mandate): conversion-first structure (clear nav /
3-second value / trust / next-action CTA), Bruno-Simon-grade playfulness WITHOUT game
controls, stability & information delivery over novelty, and: **after the initial effect
has played, push the background to the rear layer and darken it — fonts unchanged.**

### 10.1 IntroVideo overlay (`components/IntroVideo.tsx`)
- Asset: `public/intro.mp4` (2.4MB). Content block: `profile.intro`.
- Fullscreen overlay `z-[55]` (under preloader). `<video>` autoplay muted playsInline, object-fit cover (letterbox bg-base). Controls: skip button (top-right, `intro.skip`), sound toggle (bottom-right, `intro.soundOn/Off` — unmutes video). ESC = skip. Scroll locked while open (lenis stop + body overflow).
- Auto-show ONCE on first visit: after `onReady()` fires, if `localStorage['henry.introSeen'] !== '1'` AND tier !== 'fallback' AND !prefersReducedMotion() → open, set the flag when closed.
- Manual open: subscribe `onIntroRequest` from `src/lib/introBus.ts`. Nav's '소개' link calls `openIntro()` instead of scrolling (all routes; on non-`/` routes navigate home first, then open).
- End sequence per owner spec: on video `ended` (or skip) → overlay dims to black (bg opacity → 1, 0.6s) → whole overlay fades out (0.8s) revealing the page → if opened via nav, then smooth-scroll to `#about`.
- `role="dialog" aria-modal aria-label={intro.ariaLabel}`.

### 10.2 Background dim system (owner: "배경이 너무 밝다")
- New fixed div `z-[5]` (above canvas z-0, below content z-10), `bg-base pointer-events-none`, opacity 0.
- Landing: ScrollTrigger on the hero section — as hero progress passes ~0.55, tween scrim opacity → **0.45** (and back when scrolling up). The hero "첫 이펙트" stays bright; everything after is darkened. Rendered in `Landing.tsx`.
- Journey pages: static scrim 0.35 (part of JourneyBg) + reduce JourneyBg gradient opacities (0.11→0.07, 0.08→0.05) and strengthen vignette (0.65→0.8).
- Fonts/colors untouched. Reduced motion: scrim set instantly by scroll position (no tween).

### 10.3 Nav upgrades (conversion + orientation)
- **Scrollspy**: on Landing, highlight the active section's link (era-cyan text + small dot). IntersectionObserver over section ids; cleanup on unmount/route change.
- **CTA pill**: right cluster (before lang toggle): glass pill `contact.navCta` ("커피챗") → `contact.calendly` `_blank rel=noreferrer`, subtle glow-cyan. Also in mobile overlay (bottom, full-width primary).
- '소개' link now triggers the intro video (10.1). Other anchors unchanged.

### 10.4 Career timeline → journey links
- Each timeline entry gets a small trailing link `profile.career.moreLabel` ("자세히 →") routing to its phase page. phase→slug: ops→`ops`, qa→`fun-qa`, biz→`business-pm`, plan→`planning`. Visible affordance (era-cyan on hover), doesn't break row reveal/hover.

### 10.5 WorkGallery (screenshot slots) (`components/WorkGallery.tsx`)
- PhasePage block between Stories and Carried, labeled `sectionLabels.gallery` ("작업 화면").
- Data: `phase.gallery?: GalleryItem[]` (src relative to BASE_URL, e.g. `work/planning/dashboard.png`; files live in `public/work/<slug>/`). **Renders nothing when empty** (all are empty today — the owner will drop screenshots in later; document the how-to in README).
- Grid 2 → 3 cols, `figure` + lazy `img` (rounded-xl border-white/10) + caption. Click → lightbox (fixed z-50 overlay, image max-h-[90vh], caption below, close on click/ESC, scroll locked).

### 10.6 Whisper guestbook (`components/Whisper.tsx` + `src/lib/whisperClient.ts`)
- Rendered inside Contact section (below action buttons, above note). Copy: `profile.whisper`.
- Rules (per reference): 30 chars max, one message per visitor (localStorage `henry.whispered` + server-side dedupe), country flag select (12 emoji flags incl. 🇰🇷🇺🇸🇯🇵🇨🇳), client-side profanity mini-filter, newest first, server keeps last N (backend's job).
- `whisperClient.ts`: `const WHISPER_URL = ''` (owner fills in later). API: `GET {url}` → `{ messages: [{ f: '🇰🇷', m: 'text', t: 169... }] }`; `POST {url}` body `{ f, m }`. When `WHISPER_URL` is empty or fetch fails → panel shows `whisper.offline` state with disabled input (per reference: offline → feature disabled).
- Provide `scripts/whisper-backend.gs` — a Google Apps Script template (doGet/doPost onto a Sheet, 30-char cap, per-IP-hash dedupe, keep last 100) + README section "Whisper 서버 켜는 법".

### 10.7 Sound toggle (BGM)
- Asset: `public/music/baguira.mp3` (5.9MB, Kounine, CC0 — credit `footer.music` appended to Footer credit line). Lazy: audio created only on first enable.
- Nav right cluster: icon button (speaker, off by default, aria-label `soundOn/soundOff` reuse from `profile.intro`), toggles looped playback volume 0 → 0.3 fade (gsap or rAF). Never autoplays. Pause on `visibilitychange` hidden.
- Implement as `components/SoundToggle.tsx`, rendered by Nav.

### 10.8 `#debug` mode (nod to bruno-simon.com/#debug)
- If `location.hash === '#debug'`: render a small fixed panel (bottom-left, z-50, mono text): FPS (rAF-counted), quality tier, `sceneState.phase` (landing only), scrim opacity, toggle buttons for scrim on/off. Dev/tuning aid; invisible otherwise. `components/DebugPanel.tsx`, mounted in App.

### v3 QA additions
- Intro: first-visit autoplay, skip works, end-dim sequence, nav '소개' reopen, no scroll bleed, localStorage flag set, reduced-motion/fallback never auto-opens.
- Dim: hero stays bright until ~55% progress, then content sections show darkened bg (screenshot skills/career to confirm text pops), journey pages darker than before.
- Gallery hidden when empty; whisper shows offline state cleanly (not broken-looking); sound toggle plays/stops; career '자세히' links navigate; scrollspy tracks; CTA pill visible desktop+mobile.

## 11. v4 — The Room (objects-as-menu 3D navigator) (2026-07-08, design locked)

Top reference: https://my-room-in-3d.vercel.app/ (repo brunosimon/my-room-in-3d, inspected).
**How the reference works** (verified from repo): one `roomModel.glb` + three fully-baked
texture sets (day/neutral/night) blended by a custom shader, with `lightMap.jpg` RGB
channels masking individual glow zones (TV/desk/monitor) — zero real-time lights at 60fps.
Life comes from tiny separate modules: swiveling chair top, coffee-steam shader, LED
strips, and **video textures on the screens**. Camera = restricted drag-orbit (can't get
lost). ⚠️ The repo has NO license file → assets are not reusable. We take the technique,
not the assets: our room is built from scratch with R3F primitives in our own neon
palette (baked-look via emissive accents + vertex-tinted darks, not Blender bakes).

### Route & entry
- `/room` route (Landing stays intact — stability first). Nav gets a distinct '룸' item
  (`room.navLabel`); hero gets a secondary link under the subtitle ("방에서 둘러보기 →").
- Fallback tier: render a simple menu grid page (same 7 destinations as cards) instead of 3D.
  Lite tier: room without postfx, dpr ≤1.25.

### The room (all custom geometry — src/room/**)
Isometric corner diorama (2 walls + floor, dark `#0B0D16` matte), camera at ~(4.5, 3.5, 4.5)
lookAt room center, **restricted drag-orbit** (azimuth ±0.35rad, polar clamp, no zoom,
smooth damping) — drag only; NO keyboard/gamepad controls (owner directive).

Objects = menu (7 hotspots, each a small module):
| Object | Visual | Action |
|---|---|---|
| 데스크+듀얼 모니터 | emissive screens, one plays `intro.mp4` as a video texture (muted) | → 소개 영상 오버레이(openIntro) |
| 아케이드 캐비닛 | joystick+buttons, marquee glow (era-amber) | → `/#work` (대표 성과) |
| 책장 5권 | 5 book spines in the five phase colors | → `/career` |
| 서버 랙 | 3 blinking LED nodes (GPT·Claude·Codex 계열색), cable glow | → `/#ai` |
| 김 나는 커피잔 | steam = animated alpha shader plane (Bruno-style) | → `/#contact` (커피챗!) |
| 스피커 | pulsing ring when BGM on | toggles BGM (same audio as SoundToggle) |
| 벽 액자 | "기획자의 진화" wordmark, era gradient | → `/#about` |

### Interaction & UX (information-delivery first — owner directive)
- Hover (raycast): emissive boost + slight scale (1.04) + floating label chip (DOM tooltip
  near cursor or drei Html): object name + destination (e.g. "커피 한 잔 → 커피챗").
- Click: gsap camera dolly toward the object (0.7s, power2.inOut) → then perform action
  (router navigate / overlay / toggle). ESC or empty-space click resets camera.
- **Legend bar** (bottom, DOM, always visible): 7 chips mirroring the hotspots — hovering a
  chip highlights its object, clicking triggers the same action. This guarantees menu
  discoverability without exploration (owner: "메뉴가 어디 있는지 인지가 최우선").
- First-visit coach line: "물건을 클릭해 보세요 · 드래그로 둘러보기" (fades after 5s).
- Custom cursor grows on hotspots (`data-cursor` equivalent via body class).

### Tech & perf budget
- src/room/RoomExperience.tsx (Canvas, camera rig, raycast manager) + one module per object.
- ≤ 60 meshes, no real-time shadows (drei ContactShadows once, or a static radial gradient
  plane), materials: MeshStandardMaterial darks + emissive accents; Bloom only on full tier.
- Video texture: reuse `/intro.mp4` (2.4MB, already shipped); `muted playsInline loop`.
- Room content strings in `src/content/room.ts` (Bi, useT) — labels, legend, coach line.
- document.title: `The Room — Henry Lim`. JourneyBg NOT used (room canvas owns the bg).

### QA
- Drag orbit clamped (cannot look outside the room); hotspot hover/click on desktop; legend
  chips work on mobile (raycast hover unreliable on touch → legend is the primary mobile nav,
  tap on objects still works); 0 console errors; 60fps-ish on full tier (frame budget check
  via #debug FPS); fallback grid renders all 7 destinations; EN/KO labels; reduced-motion →
  fallback grid (no auto camera motion).

## 12. v5 — "Smart Office" rebrand (2026-07-08, owner tone & manner directive)

Owner's T&M: **Professional yet Approachable** (정교한 데이터 시각화 × 웹툰 일러스트),
**Modern Tech & Smart Office** (그리드 + 네온 + glassmorphism), **Dynamic & Inspiring**
(호버/스크롤 시 반짝이는 모션). New palette (owner-provided):
Primary Deep Corporate Blue `#1A2B4C`/`#0A1931` · Secondary Burnt Orange & Gold
`#E67E22`/`#F39C12` · Accent Neon Mint & Cyan `#00F2FE`/`#4FACFE` · Neutral `#F8F9FA`.

### 12.1 Token remap — VALUES change, token NAMES stay (zero refactor of class names)
`tailwind.config.js`:
| Token | Old | New |
|---|---|---|
| base | #06070C | **#0A1931** |
| elev | #0B0D16 | **#1A2B4C** |
| ink | #F4F5F7 | **#F8F9FA** |
| ink-dim | #A3ABB8 | **#AAB8D0** |
| ink-mute | #5C6470 | **#5F7195** |
| era.amber | #FFB454 | **#F5B041** (light gold) |
| era.coral | #FF9A62 | **#F39C12** (gold) |
| era.violet | #8B5CF6 | **#E67E22** (burnt orange) |
| era.cyan | #22D3EE | **#4FACFE** (cyan-blue) |
| era.sky | #38BDF8 | **#00F2FE** (neon mint) |

Career-arc story becomes: 게임 시대(골드→오렌지) → AI 시대(시안블루→네온민트).

`index.css`: `.text-gradient` → `#F5B041 → #E67E22 → #4FACFE`; `.text-gradient-cyan` →
`#4FACFE → #00F2FE`; `.glow-cyan` → rgba(0,242,254,.35); `.glow-violet` →
rgba(230,126,34,.35); body::before radials → orange(#E67E22 .07)/blue(#4FACFE .08)/
mint(#00F2FE .06) over `#0A1931`; selection rgba(79,172,254,.45); focus outline `#00F2FE`;
scrollbar navy (#0A1931 track / #24365C thumb / #33497A hover); skip-link bg `#1A2B4C`.
`index.html`: theme-color `#0A1931`.

### 12.2 Hardcoded-hex sweep (MANDATORY grep — old hexes must reach 0 matches in src/ + public/favicon.svg)
Grep `#FFB454|#FF9A62|#8B5CF6|#22D3EE|#38BDF8|#06070C|#0B0D16|#A78BFA|#C4B5FD|#A5F3FC|#BAE6FD|#FFD9A0|#FFC7A8` and remap:
- `src/three/**`: 6 particle color stops → `['#F5B041','#F39C12','#E67E22','#4FACFE','#00F2FE','#4FACFE']`; cyan pointLight → `#4FACFE`; NetworkLines color → `#00F2FE`.
- Local `ERA_HEX` maps in `JourneyBg.tsx`, `PhasePage.tsx`, `CareerHub.tsx` (+`ERA_HEX_LIGHT`: amber `#FCE3B8`, coral `#FBD38D`, violet `#F5C09A`, cyan `#BBDFFF`, sky `#B3FCFF`).
- CareerHub mission-quote gradient bar → `linear-gradient(180deg,#E67E22,#4FACFE,#00F2FE)`.
- `FallbackBg.tsx` rgba layers → new palette equivalents; any inline hexes in sections (About arc dots etc.).
- `public/favicon.svg` gradient stops → `#F39C12 / #E67E22 / #00F2FE`; regenerate `og.png` after restyle.
- IntroVideo/Preloader/lightbox backdrops using base color follow the token automatically if they use `bg-base` — convert any literal `#06070C` to the token.

### 12.3 Webtoon character integration (Approachable axis)
- Assets (shipped): `public/character.jpg` (16:9, 캐릭터+홀로그램 데이터 — 대표), `public/character-alt.jpg`.
- About section, right column top (above the career-arc widget): character card — `rounded-3xl overflow-hidden` glass frame, `border-era-sky/30` + soft mint glow, `img src={BASE_URL+'character.jpg'}` w-full h-auto, thin caption strip (`임현택 · Henry` / same latin both langs — use profile.hero.name), joins the column's reveal. `alt` = profile.hero.name. Mobile: appears after body text, before arc.
- README note: replace `public/character.jpg` anytime to swap the illustration.

### 12.4 Motion garnish (Dynamic & Inspiring — cheap, CSS-first)
- `.glass` cards: subtle diagonal shine sweep on hover (a ::after gradient bar translating across, CSS transition, GPU-only) — add as `.glass-shine` utility in index.css and apply to Achievements/AI/workstyle/strata cards.
- AIChapter card icons: hover glow pulse (scale 1.06 + drop-shadow mint, CSS).
- All garnish disabled by the global reduced-motion rule automatically (CSS-only).

### 12.5 QA
- Grep sweep = 0 old-palette matches in src/, public/favicon.svg.
- Full screenshot sweep (desktop/mobile × KO/EN × landing/career-hub/phase/room-later): navy bg everywhere, gold/orange warmth on game-era, mint/blue accents on stats+CTA, character card renders in About.
- Contrast: body text `#AAB8D0` on `#0A1931` ≥ 4.5:1 (it is ~7:1); stat gradients legible.
- Regenerate og.png (1200×630) after restyle; favicon renders.

## 8. QA checklist (each agent self-checks before finishing)

- `npx tsc --noEmit -p tsconfig.app.json` → zero errors **in your files** (ignore errors from others' stubs if any remain).
- No hardcoded copy; all strings via `useT(profile...)`.
- Reduced-motion guard on every animation.
- No console errors/warnings introduced (no missing keys, no invalid DOM nesting).
- Mobile-first: verify layout classes at `sm`, `md`, `lg` breakpoints make sense; no horizontal overflow (`overflow-x` guards; long words `break-keep`/`break-words`).
- Cleanup on unmount for listeners/tweens/rAF.
