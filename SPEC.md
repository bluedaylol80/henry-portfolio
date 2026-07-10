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

## 13. v6 — Room-first restructure + baked-look material pass (2026-07-08)

Owner directives: (1) the ROOM is the ENTRY — `/` shows the room; only the §11 object
menus are exposed there; everything else lives behind a top-right hamburger (reference:
folio-2019 panel style). (2) Match my-room-in-3d's **질감** as closely as real-time
allows. (3) Perfect page structure & readability — this URL will be shared for review.

### 13.1 IA / routing restructure
- `/` → RoomPage (the entry). `/story` → the former Landing (unchanged content: hero → contact scroll). `/career`, `/career/:slug`, `*` unchanged.
- **Back-compat**: in RouteEffects, if pathname is `/` (or basename root) AND `location.hash` is a known section id → `navigate('/story' + hash, { replace: true })`. Old shared links keep working.
- Room object action targets change: about/work/ai/contact → `/story#<id>` (career → `/career`, intro/sound unchanged). Update RoomPage.runAction.
- 3D budget guard: the particle Experience mounts only on `/story`; the room canvas only on `/`. Never both.
- document.title: `/` = profile meta title (the room IS the site now); `/story` = `Story — Henry Lim`; others unchanged.
- Intro video: unchanged behavior (auto-opens once on first visit over whatever route; desk object + '소개' menu reopen it).

### 13.2 Chrome split
- **Room chrome (on `/` only)**: wordmark `H.` top-left (Link `/story`? NO — wordmark → stays, opens hamburger? keep simple: wordmark is decorative-home, links to `/`), top-right **hamburger button** (glass round, `room.menu.open/close` aria) → full-screen/side overlay panel (folio-2019 vibe, glass navy, readable):
  - `room.menu.title` header + close X
  - Primary list (big type): 전체 스토리 (`room.menu.storyLabel` + `storyHint` → `/story`), then profile.nav items (소개/커리어/대표 성과/AI/스킬/연락처 → `/story#id`; the '커리어' item may go to `/career` — use journey for 여정: list 여정(`journey.navLabel` → `/career`) after the section items), 상세 이력 ↗ (`contact.notionNavLabel` → contact.notion), 커피챗 CTA (`contact.navCta` → calendly).
  - Utility row: KO/EN toggle + sound toggle (reuse shared lib/sound).
  - The standard `<Nav/>` does NOT render on `/`. Implement via conditional in App (like ShellFooter) + a new `components/RoomMenu.tsx`. Scroll lock while open; ESC closes; stagger reveal; reduced-motion instant.
- **Content pages (`/story`, `/career*`)**: keep the existing full Nav exactly as-is (readability). Nav's '룸' link now points `/` (it may already—verify); Nav anchors on `/story` scroll in place (Nav's onLanding check must treat `/story` as the section page now — update pathname check), from `/career*` they navigate `/story#id`.
- Footer: hidden on `/` (room) — already conditional; ensure it now keys on `/`.

### 13.3 Material/quality pass on the room (질감 — get close to the baked reference)
Real-time recipe (we cannot Blender-bake; approximate it):
- **Tone mapping**: remove `flat`; use ACESFilmicToneMapping, `outputColorSpace` default, exposure ~1.1. Slightly raise fog density; navy fog.
- **Shadows ON**: renderer `shadows`, ONE directional "window" light (cool blue-white, from the open side, castShadow, 1024 map, radius/soft via PCFSoft) + warm gold point/spot over the desk (castShadow 512) + mint accent (no shadow). Meshes cast/receive. Lite tier: shadows off, keep ContactShadows.
- **AO**: `@react-three/postprocessing` SSAO (or N8AO if available in installed version — it is not; use SSAO) on FULL tier only, subtle (radius ~0.3, intensity tuned); plus keep Bloom (lower intensity 0.35).
- **Floor**: procedural wood — CanvasTexture plank pattern (warm walnut tones #6B4A2F..#8B6242 with per-plank variation + seam lines), used as map + subtle roughnessMap; planks run diagonally like the reference. Add a soft **rug** (rounded plane, deep navy fabric tone) under the seating/desk zone.
- **Walls**: slightly warmer dark navy with big soft **colored rim glows** like the reference (TV red glow → our arcade gold glow halo behind the cabinet; desk warm pool; window-shaped cool light patch on one wall with venetian-slat streaks like the reference's window light).
- **Geometry richness**: RoundedBox everywhere edges show; add non-menu props for life (NOT hotspots): a plant (simple sphere-cluster leaves), floor cushion/sofa block, wall shelf, small rug, cable strip. Keep ≤85 meshes total.
- **Materials**: MeshStandardMaterial with per-object roughness variation (wood 0.65, plastic 0.4, metal 0.3, fabric 0.9); emissives only where lights exist (screens/LEDs/marquee) with halo glow planes (additive sprite) behind them like the reference's TV.
- **Camera/composition**: match the reference's higher isometric — start ~(5.6, 4.6, 5.6) lookAt (0, 0.9, 0), fov 38; floor prominently visible; the whole diorama framed with margin (fits 390px width too). Orbit clamps re-tuned to the new pose.
- Keep 60fps on full tier (measure via #debug); lite: no SSAO/shadow maps.

### 13.4 QA
- `/` renders the room with ONLY: wordmark, hamburger, coach line, legend, tooltip, back-link removed (root has no back). Hamburger panel lists everything and works (KO/EN + sound inside).
- Old links `/#about` etc. redirect to `/story#about` and scroll. `/story` scrollspy/nav/hash all work. Landing regression suite green on `/story`.
- Object clicks land on `/story#...` sections. Deep-link `/story#work` fresh load scrolls.
- Visual: side-by-side eyeball vs the reference screenshot (soft shadows visible, wood floor, warm/cool light pools, AO in corners) — iterate until the room reads "따뜻하고 구워진" not "flat neon". Screenshot proof at 1440 + 390.
- 0 console errors; build + typecheck 0; og.png regenerate from the ROOM hero view (it's the new entry).

## 14. v7 — reference composition, wheel zoom, object remap, legend header (2026-07-08)

Owner directives (proceed without approval):

### 14.1 Wheel zoom (NEW feature — overrides the earlier no-zoom rule)
- RoomCamera: mouse wheel zooms in/out — scale the orbit RADIUS, clamp [0.72, 1.45] of base, damped lerp (smooth), `preventDefault` on the canvas wheel only (page has no scroll on `/` anyway). Dolly-to-object and reset still work (zoom factor composes with anchors: apply zoom to the orbit radius, reset returns to 1.0). No keyboard. Touch pinch optional — skip unless trivial.

### 14.2 Composition — mimic the my-room-in-3d screenshot layout (OUR palette)
Rearrange the diorama to read like the reference:
- **Left wall**: tall bookshelf (hotspot `bookshelf`, label now '책장') with books/boxes + a guitar prop leaning beside it; **TV (hotspot `tv`, replaces the arcade)** mounted/standing NEXT TO the bookshelf on the left side — flat screen + low media console, warm gold glow halo behind the screen (like the reference TV's red glow), screen shows subtle emissive content (scanlines/wordmark).
- **Back wall (center-left)**: desk with monitor (intro.mp4 video texture) + laptop + warm lamp; **a chair in front of the desk** (prop, simple gaming-chair silhouette: seat, backrest, star base — NOT a hotspot).
- **Back wall (right)**: window with cool blue slat light (existing gobo, repositioned) + plant prop.
- **Right wall**: the big **액자/frame (hotspot `frame` → now 대표 성과)** where the reference's TV wall is, with a warm glow wash on that wall.
- **Center**: sofa facing the frame/TV side + low coffee table; the **coffee mug hotspot sits ON the coffee table** (steam intact) + a tiny gamepad prop on the table.
- **server** rack: right-back corner near the window; **speaker**: beside the TV/media console.
- Keep ≤95 meshes, 60fps, all §13.3 material quality (shadows/SSAO/wood floor/rug).
- Retune roomState ANCHORS + orbit clamps + legend order stays content-driven.

### 14.3 Hotspot remap (content/room.ts ALREADY updated — follow it)
- `desk` label '컴퓨터': action `intro` — click opens the intro overlay AND after it closes navigates to `/story#about`. Implemented via `openIntro({ afterNavigate: '/story#about' })` (introBus now passes options; IntroVideo must honor `afterNavigate` on ANY close path, using navigate()).
- `tv` (id renamed from `arcade`): action `notion` → `window.open(contact.notion, '_blank', 'noopener,noreferrer')`.
- `frame`: action `work` → `/story#work`. `bookshelf` label '책장'. Others unchanged.
- RoomPage.runAction: add `notion` case; `intro` case passes afterNavigate.

### 14.4 Legend header replaces Nav on content pages
- NEW `components/LegendHeader.tsx`: fixed top bar (z-40, glass on scroll like old nav) rendered on `/story` and `/career*` INSTEAD of `<Nav/>` (App conditional): wordmark `H.` (Link `/`) + the SAME chips as the room legend (labels from room.hotspots, same actions: section chips scroll in place on `/story` / navigate `/story#id` elsewhere; 책장→`/career`; TV→notion external; 컴퓨터→intro(afterNavigate '/story#about'); 스피커→sound with live on/off state) + compact KO/EN toggle at the right. Chips horizontally scrollable on mobile (no overflow). Active-section highlight on `/story` (reuse observer pattern) for the section-mapped chips (frame/work, server/ai, coffee/contact).
- `<Nav/>` no longer renders anywhere (kept in repo but unmounted) — the room keeps wordmark+RoomMenu hamburger; content pages get LegendHeader. RoomMenu hamburger ALSO renders on content pages (top-right, after the lang toggle) so the full menu (전체 스토리/여정/상세 이력/커피챗) stays reachable — readability first.
- Footer unchanged on content pages.

### 14.5 QA
- Wheel zoom clamps both ways; dolly/reset unaffected; mobile unaffected.
- Layout screenshot vs reference: bookshelf+TV left, desk+chair back, window right-back, frame right wall, sofa+table center. Premium, 60fps.
- 컴퓨터 click → intro plays → close → lands `/story#about`(scrolled). TV → new tab Notion. 액자 → `/story#work`. 책장 → `/career`.
- LegendHeader on `/story`+`/career*`: all chips work, EN/KO flips, sound chip live state, hamburger present, mobile scrollable, no old Nav anywhere.
- Full regression (`/story` shoot suite, career pages, back-compat redirects) green; build+typecheck 0; og re-shot if composition changed noticeably.

## 15. v8 — Codex feedback round + owner fixes (2026-07-09)

Owner-approved changes from the Codex feedback report (score 7.5/10) + two owner additions.

### 15.1 Menu naming: destination-first (owner: "가구명 메뉴는 문제")
`content/room.ts` hotspots ALREADY relabeled — label = destination (소개 영상/상세 이력/커리어 여정/AI 챕터/커피챗/배경 음악/대표 성과), hint = furniture. Legend, LegendHeader, Tooltip, FallbackGrid are content-driven and update automatically — VERIFY rendering still fits (chips got longer; mobile scroll must stay clean). Tooltip format stays `label → hint` (now reads "대표 성과 → 액자" — correct semantics).

### 15.2 Intro policy — compromise (Codex 🔴1 × owner's original directive)
- IntroVideo: REMOVE the first-visit auto-open entirely (keep all manual paths + afterNavigate).
- RoomPage: if `localStorage['henry.introSeen'] !== '1'` show a pulsing glass badge `room.introBadge` ("▶ 소개 영상 보기") center-bottom above the coach line ~2.5s after mount; click → `openIntro({ afterNavigate: '/story#about' })`; badge hides once intro has been seen (any close sets the flag) or on dismiss ×. Reduced-motion/fallback: badge static, no pulse; on fallback grid the 소개 영상 card already covers it (badge optional there — skip).

### 15.3 Identity strip (Codex 🔴2)
- RoomPage bottom-left (above Legend on desktop; on mobile a compact one-liner above the legend): `room.identity` — name (font-display semibold) + line (text-ink-dim) + 3 quick links (대표 성과 → /story#work, 커리어 → /career, 연락 → /story#contact) as small underlined-on-hover links. Glass chip container, unobtrusive, fades in with the coach. aria: plain links.

### 15.4 "3분 요약" page (owner-renamed recruiter brief)
- NEW route `/brief` → `pages/BriefPage.tsx`; content from `src/content/brief.ts` (done). Layout: JourneyBg (violet/cyan hub variant is fine), LegendHeader shown, `.container-std` narrow (max-w-3xl): eyebrow label → h1 title → lede → identity block (name/line/arc) → 4-stat row (glass chips, value font-display) → workTitle + 4 bullets → aiTitle + 3 bullets → howTitle + one-liner quote style → CTA row (coffee=calendly primary glow, email=mailto, notion ↗, story → /story, career → /career). Typography-first, ~3-minute read, fully bilingual, one h1, reveal animations light and guarded. document.title '3분 요약 — Henry Lim' (RouteEffects).
- RoomMenu: add "3분 요약" as the FIRST primary item (room.menu.brief + briefHint) → /brief.

### 15.5 Codex 🟡 fixes
1. **DOM menu latency**: Legend chips + LegendHeader chips act IMMEDIATELY (no 720ms dolly wait). 3D object clicks keep the dolly. Implement via an `immediate` flag on the activate path (InteractionManager/roomState bus) or by having Legend call the action directly.
2. **IA leftovers**: Hero '방에서 둘러보기 →' Link → '/' (not /room); CareerHub contact CTA → '/story#contact' direct.
3. **Fallback cleanup**: FallbackGrid — remove the self home-link on root; move 'THE ROOM' heading + labels to content (`room.fallbackChrome`); add a '전체 스토리 보기 →' CTA (fallbackChrome.storyCta → /story).
4. **Achievements footnotes** (content DONE in profile.ts): render `item.footnote` as a small muted line at the card bottom (text-[11px] text-ink-mute border-t white/5 pt-2 mt-3); `item.linkTo` makes the WHOLE card a click target (cursor pointer, navigate; keep hover lift) — only the 60% card has it (→ /story#ai).
5. **Perf/lint**: Hotspot.tsx — cache boost-target materials in a ref on mount instead of per-frame traverse. Fix the `src/three/Artifacts.tsx` hook-dep lint warning properly; silence the two i18n fast-refresh warnings with a scoped eslint-disable comment + reason (splitting the file is NOT worth it).

### 15.6 Owner bug: hitbox visible BEFORE hover, disappears ON hover
Symptom: each furniture's hitbox (invisible interaction proxy) is VISIBLE at rest and vanishes on mouse-over. Investigate src/room/Hotspot.tsx + object modules: likely an enlarged hit-proxy mesh rendering with a non-invisible material (or debug material), toggled by the hover path. Fix: hit proxies must be `material.transparent=true, opacity=0, depthWrite=false, colorWrite=false` (NOT `visible=false` — that skips raycast) OR use `raycast`-only meshes via `visible=true` + fully transparent. Verify at rest + hover + after ESC reset, desktop and mobile, no visual artifacts, raycast still hits.

### 15.7 QA
- Naming: legend/header/tooltip/fallback show destination-first labels KO+EN, mobile rows scroll clean.
- First visit: room visible immediately (no auto video), badge appears + works, seen-flag hides it afterward.
- Identity strip visible 1440+390, links work, doesn't collide with legend/coach.
- /brief renders bilingual, all CTAs work, linked from RoomMenu top.
- Legend/header chips navigate instantly; object clicks still dolly.
- Achievements: footnotes on all 6 cards, 60% card navigates to /story#ai.
- Hitbox artifact gone (screenshot at rest shows no ghost boxes).
- Full regression (/story shoot ×3 profiles, /career, redirects, reduced-motion) + build/typecheck 0 + og.png re-shot (identity strip now visible on '/').

## 16. v9 — First-visit label tour (Codex 🔵 leftover: mobile discoverability) (2026-07-09)

Goal: for ~5s after the room loads, sequentially "light up" each object with a tiny destination-label chip near it, so touch users (who have no hover) discover that the objects ARE the menu. Afterwards the existing tooltip/legend take over. One-shot per browser session.

### 16.1 Behaviour
- Runs on `/` 3D room only (full + lite tiers). Fallback grid already shows labels; reduced-motion never reaches 3D.
- Gate: `sessionStorage['henry.roomTour'] === '1'` → skip entirely. The flag is set when the tour ENDS **or is CANCELLED** — never on plain unmount (StrictMode double-mount and SPA nav-away must not mark it done unless it actually ran to an end/cancel).
- Timeline: start 900ms after mount; step through ALL 7 hotspots in `content/room.ts` array order (= legend order), 650ms per step (~5.4s total).
- Each step: set `roomState.hoverId = id` (reuses the existing hover visuals — scale 1.04 + emissive boost via Hotspot) AND show ONE small DOM label chip near the object (16.3).
- End of tour: clear `hoverId` (only if it still equals the tour's own id), publish `{id:null}`, set the session flag.
- CANCEL immediately (hide chip, clear tour-owned hoverId, set flag) on ANY of: `window` pointerdown, `window` wheel, `window` keydown, or pointermove over `gl.domElement`. Rationale: desktop mouse movement fights the raycast-hover writes (InteractionManager writes hoverId at ~25Hz on move); any interaction means the user is already engaged. On touch nothing fires until the first tap, so the tour plays out — that is the target audience.

### 16.2 Architecture (mirror the tooltip bus — NO React state in frame loops)
- `roomState.ts`: add a tour bus — `TourLabelState = { id: string | null, x: number, y: number }`, `setTourLabel(s)` / `onTourLabel(cb)` (same subscriber pattern as the tooltip bus).
- NEW `src/room/TourDriver.tsx` — INSIDE the Canvas (needs `camera` + `gl`); renders null. Owns: session-flag check, all timers (cleared on unmount), cancel listeners, per-step `roomState.hoverId` writes, and label projection: `v.copy(ANCHORS[id].target).project(camera)` → CSS px via the canvas rect, published with `setTourLabel`. Publish on each step change; a light per-frame refresh throttled to ~40ms is fine (tooltip precedent) but must bail when the id is null. MUST NOT touch i18n/React context (R3F renderer boundary — publish the id only, never text).
- NEW `src/room/LabelTour.tsx` — DOM overlay mounted in RoomPage (NOT inside the canvas — §13.3 convention: DOM overlays live above the canvas). Subscribes via `onTourLabel`, resolves label text with `useT` from `hotspots`, renders ONE tiny chip: `fixed z-30 pointer-events-none` + `aria-hidden`, positioned `translate(-50%, -110%)` above the projected point, clamped ≥8px from viewport edges. Add `data-tour-label={id}` for the QA harness.
- `RoomExperience.tsx`: mount `<TourDriver />` after `<InteractionManager />`.
- `RoomPage.tsx`: mount `<LabelTour />` beside `<Tooltip />` (3D branch only).

### 16.3 Visual
- Chip: glass rounded-full `px-2.5 py-1 text-[11px] font-medium text-ink`, leading dot `h-1.5 w-1.5 rounded-full bg-era-cyan`. Text = `hotspot.label` (destination) ONLY — no hint (Codex: "아주 작은" labels).
- Motion: soft ~200ms opacity + 4px rise per step. No pulse/bounce. Coach line / identity strip / intro badge keep their existing timings — the chip sits near objects mid-screen and must not join the bottom stack.

### 16.4 QA
- Fresh session: load `/` → chip appears ~1s, cycles 7 labels in legend order, gone ≤6.5s, `sessionStorage['henry.roomTour']==='1'`; `[data-tour-label]` present in DOM during the window (headless-checkable even on SwiftShader — it's DOM, not GL).
- Cancel paths: pointerdown / wheel / keydown / mouse-move-over-canvas at any point → chip gone immediately, no stray hover glow, flag set.
- Unmount mid-tour (SPA nav away): timers cleared, bus nulled, flag NOT set; StrictMode dev double-mount starts exactly one tour.
- Same-session return to `/` → NO tour.
- Existing interactions unchanged: raycast hover/tooltip, legend hover/click, drag orbit, wheel zoom, ESC reset, object-click dolly.
- typecheck/lint/build 0 · /story shoot 3-profile regression 0/0.

## 17. v10-A — Reference-grade room lighting + finite diorama shell (2026-07-09)

Owner directive: "my-room-in-3d 본따서 룸 3D 퀄리티를 높여줘". Evidence: `shots-ref/reference-default.png` vs `shots-ref/ours-live-room.png` — the reference reads as a BRIGHT, colour-separated miniature where every object is legible; ours is an underexposed silhouette where only emissives read. Root causes (diagnosed, fix all four):

### 17.1 Albedo lift (palette.ts — biggest lever)
Dark albedo × ACES = crushed blacks no light can rescue. Lift the diorama's albedos ~40–60% in lightness, SAME hues (navy family stays — owner hates light/washed backgrounds; the page backdrop stays #0A1931):
- `wall '#22314d' → '#3A4E74'` · `wallB '#16233d' → '#2A3A5C'` · `baseboard '#0C1830' → '#1B2A4A'`
- wood: `woodDark '#5A3D26'→'#6E4C30'` · `woodMid '#6B4A2F'→'#8A6240'` · `woodLight '#8B6242'→'#B08050'` · `woodGrain '#4A301D'→'#5C3E26'`
- `rugTone '#132844'→'#1E3A5F'` · `rugEdge '#1C3A63'→'#2C5488'`
- `sofa '#20304E'→'#35507A'` · `sofaCushion '#28527A'→'#3E6FA3'` · `plantPot '#3A2A1E'→'#4E3A2A'` · `leaf '#2C4A3A'→'#3A6350'` · `leafLight '#3E6552'→'#4F8A6E'`
- Object modules that hardcode PAL.base/elev/baseboard for furniture bodies may stay (they are accents) — but check each hotspot object reads at the new exposure; lift any body colour that still silhouettes.

### 17.2 Baked-look light gradients (textures.ts)
The reference's "expensive" feel is BAKED bounce light. Add procedural bakes:
- `buildWallTexture(warm: boolean)`: per-wall canvas map (replace flat wall colours) — vertical gradient (top 25% darker toward ceiling → mid lit → slight floor-bounce warmth at the bottom), plus one soft radial light pool per wall (back wall: warm gold pool centred behind the desk zone + cool blue pool near the window end; left wall: warm pool behind the TV). Corner AO: darken the outermost 8% of the canvas on the edge that meets the other wall. Subtle paper-grain noise like buildRug. SRGB, built once, disposed in disposeRoomTextures.
- `buildWood()`: after the plank pass, bake lighting INTO the floor — a large soft radial brighten (screen/overlay composite) centred room-middle (+30% at centre → 0 at edges), a warm gold pool under the desk area and a cool mint hint at the server corner. Then REDUCE the additive floor glow planes in RoomShell (deskWarm pool opacity 0.4 → 0.18, mint pool 0.2 → 0.1) — additive haze over dark wood was reading as fog, baked pools read as light.

### 17.3 Finite diorama shell (RoomShell.tsx — silhouette)
The reference is a crisp floating box; our 10×10 planes fade into fog as murk. Rebuild the shell FINITE:
- Floor: `RoundedBox ~[5.2, 0.26, 5.2]` slab (radius 0.05), top face at y=0 (centre y=−0.13), wood-mapped top; sides in a dark plinth tone (`#0B1526`, roughness 0.9). The rug/pools/ContactShadows sit on top unchanged.
- Walls: boxes with thickness — back wall `[5.2, 3.3, 0.14]` at z=−2.47, left wall `[0.14, 3.3, 5.2]` at x=−2.47 (so inner faces stay at −2.4 exactly — object positions must NOT move). Outer faces + top edges get a slightly LIGHTER lit tone via a thin rim strip (box `0.05` tall, colour `#4A6191`, roughness 0.6) along each wall's top — the "model kit" edge highlight.
- Walls receive shadows; inner faces use the §17.2 wall maps (map on box is fine — the gradient reads on the inner face; outer faces covered by the rim/dark tone material via material array OR a second thin plane 0.001 inset on the inner face carrying the map — implementer's choice, no z-fighting).
- Fog stays for the backdrop; the slab must end crisply BEFORE fog eats it (fog near 10 → 12 so the diorama is fully clear of it).

### 17.4 Lighting & post (RoomShell + RoomExperience)
- ambient 0.66 → 0.92 (same colour) · hemisphere 0.78 → 1.05, ground colour warmer `'#3a2c20'`
- window directional 2.6 → 3.2 · desk spot 34 → 40 · camera-side warm fill 11 → 16 (distance 13 → 15)
- `toneMappingExposure 1.28 → 1.40`
- EffectComposer (full tier): **SSAO REMOVED (v10 amendment, A/B-proven)** — the unblurred SSAO pass dithers the dark walls with salt-and-pepper speckle (lite tier without the composer renders clean: `shots-v10/ab-full-crop.png` vs `ab-lite-crop.png`). Baked AO (§17.2) + ContactShadows cover its role; removal also eliminates the §15.6 phone-artifact suspect (enableNormalPass × glow sprites) and the most expensive GPU pass. Composer keeps: Bloom (threshold 0.45 → 0.55 so lifted albedos don't bloom, intensity 0.35 stays) + `<Vignette offset={0.3} darkness={0.3} />` — cinematic edge falloff like the reference.
- Lite tier: no post — verify the albedo/light lift alone makes lite readable.

### 17.5 QA (objective gate — headless-measurable)
- Screenshot `/` at 1600×1000 after 10s: central 50%-crop average luminance MUST be in [46, 92] (0–255; live baseline measured DARK ~mid-teens). Measure via canvas in-page (drawImage the screenshot or sample the live canvas via `preserveDrawingBuffer`-free readback → use the screenshot-file route: load PNG into an <img> in a blank page and average a central crop).
- Every hotspot object legible in the screenshot (no black-on-black silhouettes): manual check of the capture by the gate agent.
- Object positions/hotspot hit proxies/camera anchors UNCHANGED (§14.2 composition locked; inner wall faces stay at ±2.4/−2.4).
- 60fps budget respected: no new shadow-casting lights (still exactly 2), no new post passes beyond Vignette, texture builds stay ≤2048px canvases, draw-call count within ±10 of current.
- typecheck/lint/build 0 · `/story` unaffected (its own canvas/PostFX untouched).

## 18. v10-B — High-end DOM pass (Ethereal-Glass refinement, owner-safe) (2026-07-09)

Owner directive: "싸구려 느낌 안 나게 고급스럽게" via the high-end-visual-design skill. Constraints that OVERRIDE the skill where they conflict: owner hates light backgrounds; information-delivery & stability > flash; existing brand tokens (navy/gold/cyan, Pretendard + Space Grotesk) are owner-approved — KEEP them. Chosen archetype: Ethereal Glass (site's existing DNA, executed properly). NO layout upheaval except the one bento noted below.

### 18.1 New utilities (index.css + tailwind.config.js)
- `.bezel` (outer shell): `rounded-[1.6rem] border border-white/[0.08] bg-white/[0.03] p-1.5` + very soft diffused shadow `shadow-[0_20px_60px_-20px_rgba(2,6,16,0.8)]`.
- `.bezel-core` (inner): `rounded-[calc(1.6rem-0.375rem)] bg-elev/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.10)]` + hairline `ring-1 ring-white/[0.06]`.
- tailwind `transitionTimingFunction: { lux: 'cubic-bezier(0.32,0.72,0,1)', out4: 'cubic-bezier(0.22,1,0.36,1)' }`; sweep remaining `ease-in-out`/default transitions in touched components to `ease-lux`.
- `.noise-overlay` opacity 0.05 → 0.03; RoomPage (`/` 3D branch) must NOT render under it — hide the overlay on the room route (App-level route check) so grain never sits on the 3D scene (it read as sensor dirt on the dark render).
- `.btn-island`: primary CTA pattern — `rounded-full` pill, nested trailing icon in its own `h-8 w-8 rounded-full bg-white/10 flex items-center justify-center` circle flush right, `active:scale-[0.98]`, icon `group-hover:translate-x-0.5 group-hover:-translate-y-px transition-transform ease-lux duration-500`.

### 18.2 Component upgrades (visual only — copy/ids/routes untouched)
- **Achievements (/story#work)**: cards → double-bezel (`.bezel` > `.bezel-core`); grid → asymmetric bento: the 60% flagship card `md:col-span-2` featured cell (it already has linkTo/footnote), remaining cards single cells; `grid-cols-1` stack on mobile with `gap-6`. Count-up + footnote + card-link behaviour unchanged.
- **BriefPage**: stat chips + identity card → double-bezel; CTA row primary (커피챗) → `.btn-island`; secondary CTAs stay quiet pills.
- **PhasePage/CareerHub**: the big quote block + phase cards → double-bezel; hover = existing lift + `ease-lux`, `active:scale-[0.98]`.
- **Contact (/story#contact)**: primary CTA → `.btn-island`.
- **Hero (/story)**: lede/paragraph readability over the particle field — wrap hero copy block in a subtle scrim (`bg-base/30 backdrop-blur-[2px] rounded-3xl px-6 py-5` or a radial gradient behind text; pick the least visible that fixes contrast).
- **RoomMenu**: panel items get a staggered mask reveal on open (`translate-y-3 opacity-0 → 0/100`, 60ms stagger, ease-out4, guarded by reduced-motion); hamburger lines morph to an X (rotate ±45° + translate, 300ms ease-lux). Panel container → double-bezel.
- **Room overlays (RoomPage)**: identity strip + legend chips + tooltip get the inner top-highlight (`shadow-[inset_0_1px_1px_rgba(255,255,255,0.10)]`) — subtle machined feel, nothing moves.
- Do NOT touch: LabelTour/TourDriver (v9), section copy, navigation structure, /story section order, fonts.

### 18.3 QA
- Reduced-motion: every new transition/stagger inert (global reduce rule already kills them — verify no opacity-0 orphans: elements must END visible).
- Mobile 390px: bento collapses to 1-col, no horizontal overflow, tap targets ≥40px.
- Contrast: hero lede ≥ 4.5:1 against its scrim; bezel cards keep text contrast (bg got lighter — check ink-dim on elev/60).
- typecheck/lint/build 0 · shoot 3-profile /story + /brief + /career: console errors 0, overflow 0.
- Before/after screenshots: story-work, brief, career at 1600×1000 saved to shots-v10/.

## 19. v11 — Owner feedback round: start gate, natural layout, interaction & contrast (2026-07-09)

Owner directives (verbatim intent, 2026-07-09): ① a bruno-simon-style handwritten "CLICK TO …" start gate; ② hover motion feels awkward — replace the sustained scale with a brief grow-then-shrink pulse; ③ after clicking the speaker you can't get the full room back; ④ TV and frame positions are swapped vs the reference — match `shots-ref/owner-ref-myroom.png` exactly; ⑤ low-contrast text (e.g. /brief arc line, bottom CTA buttons); ⑥ NEOWIZ system-planning content is wrong (not "8건"). Reference images: `shots-ref/owner-ref-myroom.png` (layout truth), `shots-ref/owner-ref-clicktostart.png` (start-gate look).

### 19.1 Start gate overlay — "CLICK TO MENU" (owner ①)
- NEW `src/components/RoomStart.tsx` (DOM, mounted in RoomPage's 3D branch only, z-40 above all room overlays). Full-viewport scrim (`bg-base/70`, a fixed element so backdrop-blur-[2px] is allowed) over the live canvas — the dimmed room teases through, like the reference's spotlight.
- Content, centred: big handwritten headline `CLICK TO MENU` (font-hand, white, slight −2° rotate, gentle pulse — reduced-motion: static) + a hand-drawn curved SVG arrow pointing down toward the room + KO subline in 필기체: `이 방의 모든 사물이 메뉴입니다` (font-hand-ko). Whole overlay is one big button (`role="button"`, aria-label bilingual); click ANYWHERE → 600ms ease-lux fade → unmount.
- Fonts: `@fontsource/permanent-marker` (EN marker caps ≈ the reference's hand lettering) + `@fontsource/nanum-pen-script` (KO 필기체). Import in main.tsx; tailwind `fontFamily: { hand: ['"Permanent Marker"','cursive'], 'hand-ko': ['"Nanum Pen Script"','cursive'] }`.
- Gating: sessionStorage `henry.roomEntered`. Seen → no overlay, `roomState.entered=true` at mount. Unseen → overlay; on click set flag + `enterRoom()` (bus already in roomState.ts §19-prewired). SPA back-nav within the session never re-shows it. Fallback tier: NO overlay (grid is already a menu).
- RoomPage: the bottom stack (identity strip / coach / intro badge / Legend) renders only AFTER entered (their timers start from entry, not mount) — the start screen stays minimal like the reference.
- TourDriver: label tour begins its 900ms delay from `entered` (roomState.entered at mount, else `onRoomEnter`), NOT from mount. Attach the tour's cancel listeners only when the tour actually begins so the entry click itself can never cancel it.

### 19.2 Layout naturalness pass — match the reference photo (owner ④ + "배치가 자연스럽지 않아")
Truth = `shots-ref/owner-ref-myroom.png`: corner desk zone on the LEFT-wall/back-wall junction · back wall reads (left→right) desk corner → window → wall-mounted TV with warm backlight + low console → plant/server corner · sofa in the centre FACING the TV · frame art hangs on the LEFT wall (where our TV was) · bookshelf mid-left wall with the guitar leaning beside it. Changes (all coordinates are starting points — iterate against screenshots until the arrangement reads natural; §14.2 position locks are SUPERSEDED here for the listed objects):
- **TV ↔ Frame swap (exact ask)**: TV module → back wall right (wall-mount at ≈ x 0.85, screen faces +Z, console below on the floor, warm burnt-orange halo `PAL.burnt` behind it like the reference's glow — move the old gold TV halo sprite here). Frame module → left wall at the TV's old spot (≈ z 1.05, faces +X). ANCHORS.tv / ANCHORS.frame get new targets + dolly poses (frame each object with margin, verify by screenshot).
- Desk slides INTO the corner (x −1.35 → ≈ −1.7); chair tucks toward the desk, back to the viewer (rotation ≈ 0.1, less pulled-out). Desk-area floor pool + wall-texture warm pool follow the lamp (textures.ts pool centres track the new desk/TV/window spots — pools follow their light sources).
- Window slat patch moves between desk and TV (x 2.2 → ≈ −0.3; narrow the patch if it crowds the TV). Cool wall-texture pool follows.
- Bookshelf forward to mid-left wall (z −1.15 → ≈ −0.45); guitar leans between bookshelf and desk corner (z ≈ −1.35). ANCHORS.bookshelf updates.
- Sofa + coffee table + rug shift right to face the TV axis (x 0.2 → ≈ 0.5); CableStrip start follows the desk (−1.3 → ≈ −1.65). Server + plant stay in the back-right corner (matches reference's plant-right).
- Hit proxies ride inside each Hotspot group — they move automatically; VERIFY raycast hits on every moved object after the move.

### 19.3 Hover pulse — no sustained scale (owner ②)
- Hotspot.tsx: REMOVE the sustained active scale (1.04-while-hovered reads as furniture shifting). New behaviour: on the RISING edge of active (`hoverId===id || focusId===id`), play one ~420ms pulse — scale 1 → 1.07 → 1 with a smooth sin envelope in useFrame (time-based, no React state; re-arms only on a new rising edge). While active with no pulse running, scale stays exactly 1.
- Emissive boost stays sustained while active (glow doesn't move geometry — it's the "lit" feedback, and the v9 label tour relies on it).

### 19.4 Camera auto-return for in-room actions (owner ③)
- InteractionManager: actions that do NOT leave the room must hand the camera back. `sound`: dolly → toggle → auto `cameraHandle.reset()` ~400ms after the action fires (total ≈1.1s round trip). `notion` (new tab): perform, then reset immediately — returning users find the full room. Route actions (intro/about/career/work/ai/contact) unchanged. Applies to both the dolly path and the Legend `immediate` path.

### 19.5 Contrast pass (owner ⑤)
- tailwind token `ink.mute` `#5F7195` → `#7C90B8` (≈4.9:1 on base — systemic lift; it was ~3.2:1, invisible on navy).
- BriefPage: identity `arc` line (`운영 → FUN QA → …`) `text-ink-mute` → `text-ink-dim`; stat-chip labels likewise. Bottom CTA row: secondary pill labels `text-ink-dim` → `text-ink`, borders `border-white/15` → `border-white/25`.
- Sweep `text-ink-mute` across pages/sections: any content-bearing copy (not decorative footnotes/eyebrows) → `text-ink-dim`. Re-verify the room Legend hint chips + LegendHeader with the new mute value.

### 19.6 Content correction — NEOWIZ system planning (owner ⑥, owner text is authoritative)
Replace every "시스템 기획(서) 8건" claim (brief.ts:51 · journey.ts intro/did/outputs · profile.ts:115) with the corrected record:
- 신규 시스템 기획 10건 — 공지 · 랭킹 · 길드 · 우편 · 친구 · 도움말 · 서버 및 채널 · 팝업 · 시즌패스 · 월드맵
- 기존 시스템 개편 10건 — 가챠 연출 · 로비 · 퀘스트/업적 · 장비/캐릭터 육성 · 프로필 · 탐험 · 채팅 · 상점
- 밸런스 기획 — 알파/베타 재화 · 경험치 · 스테이지 · 육성
journey.ts outputs stat: `8건` → `20건` (label 시스템 기획·개편, sub 신규 10 · 개편 10 + 밸런스). Craft natural EN pairs for every edit. Do NOT touch journey.ts:546 (`8건 S등급` — unrelated blind-grading stat). Keep each card's line-count similar (layout budget).

### 19.7 QA
- Fresh session `/`: overlay shows with the marker/pen fonts actually rendering (screenshot — no fallback sans), click → fade, bottom stack appears, label tour chip `[data-tour-label]` appears ≈0.9s AFTER the entry click (the click must not cancel the tour), sessionStorage `henry.roomEntered='1'`; same-session reload → no overlay, room immediate.
- Layout screenshot vs `owner-ref-myroom.png`: desk corner / window then TV (warm backlight) on the back wall / plant+server right / sofa facing the TV / frame + speaker on the left wall / bookshelf mid-left with guitar. Every hotspot raycast-hits after the moves (programmatic click on each object's screen position triggers its action or dolly).
- Speaker click → camera back at the resting wide view within ~2s (compare framing). Notion click → camera resets.
- Hover pulse: code-reviewed envelope (no sustained scale) + a hover screenshot at +600ms shows scale back at 1.
- Luma gate: central 50%-crop ∈ [46, 92] at 1600×1000/10s. typecheck/lint/build 0. /story /brief /career regression 0/0. Brief arc line computed colour = #AAB8D0; ink-mute computes #7C90B8.
- og.png NOT in scope for the agents (reshot post-merge by the orchestrator).

## 20. v12 — Owner feedback: color-system root fix + room prop fidelity (2026-07-09)

Owner directives: ① every page must use contrasted font colours — the offending colour should stop being used at all, and ALL gradient text goes; ② room prop fidelity — desk PC/laptop read broken, chair reads like a stool, a blue line shows left of the server rack, the plant sits inside the TV console. Evidence: owner's live screenshot `shots-ref/owner-ref-v11-live.png`.

### 20.1 Color-system root fix (Track B)
- **Rename the color token `base` → `abyss`** in tailwind.config.js. Root cause: a color named `base` makes Tailwind emit a COLOR `.text-base`/`.md:text-base` that collides with the SIZE utility of the same name — this is why the room identity name (`RoomPage.tsx:200 … text-ink md:text-base`) renders navy-on-navy on live. Renaming kills the entire bug class. Sweep every usage: `bg-base` (incl. `/NN` opacity forms), `border-base`, `from/via/to-base`, `text-base`-as-colour (none intended — verify each hit is size-intent and leave those as the SIZE class). index.css `@apply bg-base` in body updates too. `.text-base`/`md:text-base` SIZE usages stay untouched.
- **Gradient text removal (owner: 그라데이션 표현 제거)**: replace every `.text-gradient` usage with solid `text-era-amber`, every `.text-gradient-cyan` with solid `text-era-cyan` (15 usages: RoomPage wordmark ×2, LegendHeader, Nav, Hero line2, Contact title, Career chapter titles, CareerHub hub-title, BriefPage h1 + stat values, PhasePage ph-title, AIChapter titleB, Achievements emphasis). Then DELETE both utilities from index.css so they cannot come back.
- **ink-mute retirement from user-facing text (owner: 해당 폰트색 아예 쓰지 말자)**: sweep every `text-ink-mute` in rendered UI → `text-ink-dim` — includes the ROOM page (Legend hint chips, Tooltip arrow, RoomMenu labels, intro-badge ×), `.eyebrow` utility, Footer, CareerHub, PhasePage, About, Career, Achievements (tags + footnotes), Hero cue, Whisper, Skills, Preloader %, Nav/LegendHeader lang toggles, `placeholder:text-ink-mute`. EXCEPTION: DebugPanel (dev-only) may keep it. The `ink.mute` token itself stays defined (borders/decoration) but must not colour text.
- **Contrast crawl (verification)**: on /, /story, /brief, /career, /career/planning collect every visible text node's computed color; FAIL if any computes to `#0A1931` (navy-on-navy class collision), `#5F7195` (old mute), or `#7C90B8` (retired mute) — and no element may have `background-clip: text` (gradient leftovers).

### 20.2 Room prop fidelity (Track A — judge each against `owner-ref-v11-live.png` + `owner-ref-myroom.png`)
1. **CableStrip: DELETE** (RoomShell) — the metallic floor tube catches the cool light and reads as a stray blue line left of the server rack. The reference has no floor cable. Remove component + usage.
2. **Plant relocation** (RoomShell) — it currently sits at x=1.05 INSIDE the TV console's footprint (console spans x≈0.1–1.6): leaves poke through the console top. Move to the clear wall gap between the window and the TV console (≈ `[-0.35, 0, -2.02]`), verify zero intersection from the resting camera AND from a slightly-orbited view (owner's screenshot angle).
3. **Chair fix** (RoomShell) — the backrest sits on local −Z (toward the desk) so it buries inside the desk slab and the chair reads as a stool. Flip the backrest to the viewer side (local +Z, tilt −0.16), raise it to gaming-chair proportions (height ≈0.8, top ≈y1.15), pull the chair slightly out (z −1.35 → ≈−1.25). From the resting camera you should see a proper chair BACK like the reference.
4. **Desk gear** (Desk.tsx) — (a) monitor: the intro-video plane at `emissiveIntensity 0.9 + toneMapped:false` blows out to a white slab on bright frames — drop to ≈0.45 (userData.baseEmissive follows) and verify a bright video frame no longer reads as a blank white board; (b) laptop: it currently shows its BACK to the camera — re-orient (rotation ≈ +0.4~0.6) so the lid + mint dashboard face the viewer (+X/+Z side); keep the bars inside the lid bounds; (c) keep the lamp.
5. **TV screen calm-down** (Tv.tsx) — the gold scanline shader fills the panel edge-to-edge and reads as an orange heater grill (owner screenshot). Redesign toward the reference: MOSTLY DARK panel (deep navy base, overall alpha low) with a subtle slow-moving glow and ONE small bright element (thin drifting wordmark band ≤15% of the panel), warm burnt accent only. The burnt back-halo carries the warmth — the screen itself stays quiet. (An owner-supplied `screens/tv.png` texture will replace this later — keep the shader self-contained for an easy swap.)
6. **Window slat gobo height** (RoomShell) — the patch floats near the wall top; lower its centre to ≈y2.3 (reads as a mid-wall window like the reference), keep clear of the TV panel (TV top ≈y2.11 at x0.85; the patch sits at x≈−0.25 so only height needs care).
7. Every change: iterate with 1600×1000 screenshots (resting view AND an orbited view like the owner's screenshot: drag right ~200px equivalent), luma gate [46,92] holds, all 7 hotspots still raycast-hit, typecheck/lint/build 0.

### 20.3 QA
- Room screenshot: no floor line artifact, plant clear of the console, chair reads as a chair, monitor shows the video without blowing out, laptop lid faces the viewer, TV mostly dark with a small bright element, slats mid-wall.
- Identity strip name "임현택 · Henry Lim"/"Henry Lim" VISIBLE at md+ (the .text-base collision is dead by construction — no color named base exists).
- Contrast crawl passes on all 5 routes (20.1). No `background-clip:text` anywhere.
- Wordmark/titles show SOLID amber/cyan (no gradients) and read ≥4.5:1.
- typecheck/lint/build 0 · /story shoot 3-profile 0/0 · luma [46,92].

## 21. v13 — Owner-delivered image asset wiring (2026-07-10)

Owner produced the §20-proposed assets. All 6 are ALREADY in the repo (sizes verified):

| file | px | goes to |
| --- | --- | --- |
| `public/screens/tv.png` | 1280×720 | TV panel (replaces the §20.2-5 shader) |
| `public/screens/monitor.png` | 1280×800 | desk monitor (replaces the intro.mp4 VideoTexture) |
| `public/screens/laptop.png` | 1280×800 | laptop lid (replaces the animated mint bars) |
| `public/art/frame.png` | 850×1078 (portrait ≈0.79) | wall frame artwork (replaces the canvas wordmark) |
| `public/textures/rug.png` | 1024×1024 | NEW rug mesh under sofa/coffee table |
| `public/textures/books.png` | 2048×256 (8:1 strip) | bookshelf lower-shelf book row |

### 21.1 Loading rules (all textures)
- URL = `import.meta.env.BASE_URL + 'screens/tv.png'` etc. — NEVER a root-absolute path (Pages serves under `/henry-portfolio/`).
- `useLoader(THREE.TextureLoader, url)` (R3F cache). `colorSpace = SRGBColorSpace`, `anisotropy = 8`. If the room tree has no `<Suspense>` boundary above these components, add `<Suspense fallback={null}>` where needed — a suspending object must NOT blank the whole canvas.
- Screens are `map` + `emissiveMap` + `emissive #ffffff` + `toneMapped:false` + `userData.baseEmissive` mirroring the chosen `emissiveIntensity` (Hotspot hover-boost contract, §20.2-4a).

### 21.2 Tv.tsx — texture swap (the §20.2-5 shader retires)
- DELETE the ShaderMaterial + SCREEN_VERT/SCREEN_FRAG + its useFrame tick. Screen plane becomes `1.44 × 0.81` (16:9 to match 1280×720; was 0.84) with `screens/tv.png`, `emissiveIntensity 0.5`.
- Keep: panel body, burnt back-halo sprite, console, bracket, hit proxy. The image is mostly dark (owner followed the spec) — verify the god-ray region doesn't blow out.

### 21.3 Desk.tsx — monitor
- DELETE the `<video>` element creation + play/teardown effect + VideoTexture (decode cost gone; a static owner dashboard replaces it). `intro.mp4` itself STAYS — the DOM IntroOverlay ('소개 영상' action) still uses it.
- Image aspect is 1.6 (1280×800): bezel RoundedBox `1.06×0.64` → `1.06×0.70`, screen plane `0.98 × 0.6125`, `emissiveIntensity 0.45` (§20.2-4a value carries over).

### 21.4 Desk.tsx — laptop
- DELETE barsRef + the bars useFrame animation + the two bar meshes + the flat `#06121f` inner plane. Screen plane `0.5 × 0.3125` (aspect 1.6) with `screens/laptop.png`, `emissiveIntensity 0.55`. Keep lid/deck geometry and the +0.5 rotation (§20.2-4b).

### 21.5 Frame.tsx — portrait artwork
- DELETE the canvas wordmark texture + TEXT + the useLang dependency (artwork is language-agnostic).
- Geometry goes PORTRAIT: border RoundedBox `[1.16, 1.42, 0.06]`, art plane `[1.02, 1.29]` (≈0.79 = 850/1078) at z `0.035`. Centre stays y 1.5 (top ≈2.21 < wall 2.4 — clear). `emissiveIntensity 0.42` — the poster title area is bright; verify "기획자의 진화" is legible but NOT blown out in the frame-focus shot.
- Hit proxy → `size [0.16, 1.5, 1.2]` (portrait), same centre. Keep both glow sprites; retune scales to the portrait silhouette (≈`[3.2, 3.4]` wash / `[2.0, 2.4]` halo).

### 21.6 RoomShell — NEW rug (reference has one under the sofa zone)
- Plane `2.3(x) × 2.7(z)`, rotation `-π/2`, centred `[0.5, 0.006, 0.45]` — spans the coffee table ([0.5,0,-0.12]) and sofa front ([0.5,0,1.15]). `map = textures/rug.png`, roughness 0.95, metalness 0, `receiveShadow`, no emissive. `userData.noPick` so it can never shadow a hotspot raycast. Verify zero z-fighting with the wood floor (y offset; add polygonOffset only if a shot shows shimmer).
- ⚠ The rug is dark navy in the frame centre → **re-measure the luma gate [46,92]** (was 77.02). If it dips below ~55, lift ambient by ≤0.06 — nothing else.

### 21.7 Bookshelf.tsx — spine strip on the lower shelf
- REPLACE the lower-shelf storage box with a books block: box `[0.24, 0.5, 1.4]` at `[0, 0.925, 0]` (sits on the y0.65 plank).
- 6-material array — ONLY the +X (room-facing) face gets `textures/books.png`; the other 5 faces flat dark (`#16233E`-ish). The face is 1.4×0.5 (2.8:1) vs the 8:1 strip → use a horizontal window: `repeat.x ≈ 0.35`, `offset.x ≈ 0.3` so spines keep their true proportions. VERIFY IN THE SHOT that spines stand upright — if the box UV renders them sideways/mirrored, fix via texture rotation/offset, judged visually.
- KEEP the 5 phase-colour chapter books on the upper shelf — they are semantic (career phases), not decoration.

### 21.8 QA (v13 gate)
- typecheck/lint/build 0 · console errors 0 on /.
- Shots (1600×1000, overlay/tour bypassed): resting view + focus shots for tv/desk/frame/bookshelf + one orbited view. Judge: TV shows the PLANNER EVOLVED still calmly (no blowout), monitor+laptop show the dashboards (no white slab), frame shows the poster upright (portrait, not stretched), rug lies flat under the coffee table (no shimmer), spines upright on the lower shelf.
- Luma gate [46,92] re-measured AFTER the rug lands.
- All 7 hotspots still raycast-hit (§19.7 proxy contract untouched).
- `public/og.png` reshoot REQUIRED (room look changed: rug + real screens).

## 8. QA checklist (each agent self-checks before finishing)

- `npx tsc --noEmit -p tsconfig.app.json` → zero errors **in your files** (ignore errors from others' stubs if any remain).
- No hardcoded copy; all strings via `useT(profile...)`.
- Reduced-motion guard on every animation.
- No console errors/warnings introduced (no missing keys, no invalid DOM nesting).
- Mobile-first: verify layout classes at `sm`, `md`, `lg` breakpoints make sense; no horizontal overflow (`overflow-x` guards; long words `break-keep`/`break-words`).
- Cleanup on unmount for listeners/tweens/rAF.
