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

## 8. QA checklist (each agent self-checks before finishing)

- `npx tsc --noEmit -p tsconfig.app.json` → zero errors **in your files** (ignore errors from others' stubs if any remain).
- No hardcoded copy; all strings via `useT(profile...)`.
- Reduced-motion guard on every animation.
- No console errors/warnings introduced (no missing keys, no invalid DOM nesting).
- Mobile-first: verify layout classes at `sm`, `md`, `lg` breakpoints make sense; no horizontal overflow (`overflow-x` guards; long words `break-keep`/`break-words`).
- Cleanup on unmount for listeners/tweens/rAF.
