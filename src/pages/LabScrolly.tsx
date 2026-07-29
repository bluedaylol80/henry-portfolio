import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, ScrollTrigger } from '../lib/scrollTriggerBridge'
import { useT, useLang, type Bi } from '../lib/i18n'
import { prefersReducedMotion } from '../lib/quality'
import { EASE } from '../lib/motion'
import { timeline, phases } from '../content/journey'
import { home } from '../content/profile'

/**
 * /lab/scrolly — HIDDEN v21 P1 PoC (SDD §6 Phase 1). Not linked from anywhere;
 * proves the scrollytelling spine before P2 supplies real copy. Two acts:
 *   Act 1 (calm)   — native-scroll year readout (2006→2024, scrubbed, sticky, NO
 *                    pin) while the company wall lights up in chronological order.
 *   Act 2 (burst)  — the ONE pin+scrub section: a business-PM case unfolds in
 *                    three beats (problem → decision → result) with a scroll-driven
 *                    count-up on the headline number.
 *
 * Engine rule (SDD §5): gsap/ScrollTrigger come ONLY through scrollTriggerBridge,
 * and this whole page is React.lazy (App.tsx) so gsap never enters the eager
 * bundle. Design rule: amber is the single accent; the warm→cool era ramp is used
 * ONLY on phase markers; all tokens/fonts are the existing v20 system.
 *
 * Content rule: every narrative string is verbatim existing content —
 *   Act 1 wall  = profile.home.companiesWall + journey.timeline + journey.phases
 *   Act 2 case  = journey.phases['business-pm'] (problems[0], oneLiner, outputs[0]).
 * The only strings authored here are the STRUCTURAL beat labels (문제/결정/결과),
 * which are PoC scaffolding from the SDD §3 Act-2 spec — real copy arrives in P2.
 */

// Phase-spine ramp (num 01→05), warm→cool — hard-zoned away from the amber accent.
const PHASE_SPINE = ['#E67E22', '#C58C50', '#6FA79A', '#54C3BE', '#4FD1C5'] as const

// Structural scaffolding only (not narrative copy) — the three-beat skeleton the
// SDD §3 Act 2 prescribes. Replaced by designer-supplied copy in P2.
const BEAT_LABELS: Bi[] = [
  { ko: '문제', en: 'PROBLEM' },
  { ko: '결정', en: 'DECISION' },
  { ko: '결과', en: 'RESULT' },
]
const LAB_EYEBROW: Bi = { ko: '스크롤텔링 · P1 프로토타입', en: 'SCROLLYTELLING · P1 POC' }

const ACT1_START_YEAR = 2006
const ACT1_END_YEAR = 2026
/**
 * The year readout must have reached ACT1_END_YEAR by the time the scrollbar is
 * ~40% down the page (본부장 2026-07-30). So the scrub is anchored to a fraction
 * of the WHOLE page scroll — not to Act 1's own height, which drifts whenever
 * copy or the Act 2 pin distance changes.
 */
const YEAR_DONE_AT = 0.4

/** Split a display number like '183억' or '₩18.3B' into count-up parts (verbatim value). */
function parseStat(s: string): { prefix: string; value: number; suffix: string; decimals: number } {
  const m = s.match(/^([^\d.]*)([\d.]+)(.*)$/)
  if (!m) return { prefix: '', value: 0, suffix: s, decimals: 0 }
  const [, prefix, num, suffix] = m
  const decimals = num.includes('.') ? (num.split('.')[1]?.length ?? 0) : 0
  return { prefix, value: parseFloat(num), suffix, decimals }
}

export default function LabScrolly() {
  const t = useT()
  const { lang } = useLang()
  const root = useRef<HTMLDivElement>(null)
  const yearRef = useRef<HTMLSpanElement>(null)
  const act1Ref = useRef<HTMLDivElement>(null)
  const act2Ref = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const numRef = useRef<HTMLSpanElement>(null)
  const beatRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)]

  const reduce = prefersReducedMotion()
  const companies = home.companiesWall.items
  const bizPm = phases.find((p) => p.slug === 'business-pm')!
  const result = bizPm.outputs[0]
  const stat = parseStat(result.stat[lang])
  const fmtNum = (v: number) => `${stat.prefix}${stat.decimals > 0 ? v.toFixed(stat.decimals) : Math.round(v)}${stat.suffix}`

  // Beats overlay (crossfade) only when motion is on; under reduced motion they
  // fall back to normal document flow so all three read at once (static state).
  const overlay = reduce ? '' : 'md:absolute md:inset-0'
  // Vertical gap between stacked beats: always present in flow, but removed on
  // desktop ONLY when they overlay (absolute) so the reset doesn't cramp the
  // reduced-motion desktop stack.
  const beatGap = reduce ? 'mt-12' : 'mt-12 md:mt-0'

  useGSAP(
    () => {
      const beats = beatRefs.map((r) => r.current!).filter(Boolean)

      // ── Reduced motion: everything static & complete (SDD §5). ──────────────
      if (reduce) {
        if (yearRef.current) yearRef.current.textContent = String(ACT1_END_YEAR)
        gsap.set('.sc-company', { autoAlpha: 1 })
        gsap.set('.sc-dot', { backgroundColor: '#F5B041', scale: 1 })
        gsap.set(beats, { autoAlpha: 1, y: 0 })
        if (numRef.current) numRef.current.textContent = fmtNum(stat.value)
        return
      }

      // ── Act 1 (calm): company wall lights up in order (no pin). ─────────────
      gsap.set('.sc-company', { autoAlpha: 0.28, y: 14 })
      gsap.set('.sc-dot', { backgroundColor: '#22345C', scale: 1 })
      ScrollTrigger.batch('.sc-company', {
        start: 'top 85%',
        once: true,
        onEnter: (batch) => {
          gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.12, ease: EASE.out, overwrite: true })
          gsap.to(
            batch.map((el) => el.querySelector('.sc-dot')),
            { backgroundColor: '#F5B041', scale: 1.15, duration: 0.5, stagger: 0.12, ease: EASE.out, overwrite: true },
          )
        },
      })

      // ── Act 2 (burst): the ONE pin+scrub section, desktop vs mobile fallback. ─
      const mm = gsap.matchMedia()

      // Desktop: pin the panel over a SHORT range and switch beats at progress
      // thresholds (not scrub) so a beat is never frozen half-faded at a scrub
      // midpoint, and the pin needs only a few notches to traverse. The result
      // count-up is a self-completing time-based tween fired the instant the
      // result beat activates — one wheel reaches MAX, even if the user stops
      // scrolling (본부장 2026-07-23 피드백). Re-entering the beat replays once;
      // a re-trigger while counting is ignored. (No ScrollTrigger snap: it fights
      // Lenis's programmatic scroll on the live site; thresholds already avoid
      // awkward mid-transition freezes.)
      mm.add('(min-width: 769px)', () => {
        const writeNum = (v: number) => {
          if (numRef.current) numRef.current.textContent = fmtNum(v)
        }
        gsap.set(beats[0], { autoAlpha: 1, y: 0 })
        gsap.set([beats[1], beats[2]], { autoAlpha: 0, y: 24 })
        writeNum(0)

        const counter = { n: 0 }
        let countTween: gsap.core.Tween | null = null
        let counting = false
        const startCount = () => {
          if (counting) return
          counting = true
          counter.n = 0
          writeNum(0)
          countTween = gsap.to(counter, {
            n: stat.value,
            duration: 1.2,
            ease: 'power2.out',
            onUpdate: () => writeNum(counter.n),
            onComplete: () => {
              counting = false
            },
          })
        }
        const resetCount = () => {
          countTween?.kill()
          counting = false
          counter.n = 0
          writeNum(0)
        }

        let curIdx = 0
        const showBeat = (idx: number) => {
          if (idx === curIdx) return
          curIdx = idx
          beats.forEach((b, i) => {
            gsap.to(b, { autoAlpha: i === idx ? 1 : 0, y: i === idx ? 0 : 24, duration: 0.45, ease: EASE.out, overwrite: true })
          })
          if (idx === 2) startCount()
          else resetCount()
        }

        ScrollTrigger.create({
          trigger: act2Ref.current,
          start: 'top top',
          end: () => '+=' + Math.round(Math.min(1100, window.innerHeight * 1.15)),
          pin: panelRef.current,
          anticipatePin: 1,
          onUpdate: (self) => showBeat(self.progress < 0.34 ? 0 : self.progress < 0.67 ? 1 : 2),
          onLeaveBack: () => showBeat(0),
        })
      })

      // Mobile (≤768px): NO pin — beats stack in flow, reveal + count-up on enter.
      mm.add('(max-width: 768px)', () => {
        gsap.set(beats, { autoAlpha: 0, y: 22 })
        if (numRef.current) numRef.current.textContent = fmtNum(stat.value)
        beats.forEach((el) => {
          ScrollTrigger.create({
            trigger: el,
            start: 'top 82%',
            once: true,
            onEnter: () => gsap.to(el, { autoAlpha: 1, y: 0, duration: 0.6, ease: EASE.out, overwrite: true }),
          })
        })
        // Count-up when the result beat scrolls into view.
        const counter = { n: 0 }
        if (numRef.current) numRef.current.textContent = fmtNum(0)
        ScrollTrigger.create({
          trigger: beats[2],
          start: 'top 78%',
          once: true,
          onEnter: () =>
            gsap.to(counter, {
              n: stat.value,
              duration: 1.1,
              ease: EASE.out,
              onUpdate: () => {
                if (numRef.current) numRef.current.textContent = fmtNum(counter.n)
              },
            }),
        })
      })

      // ── Act 1: year readout climbs 2006→2026, scrubbed to scroll (no pin). ──
      // Ends at YEAR_DONE_AT of TOTAL page scroll. Declared after the Act 2 pin
      // and given refreshPriority -1 so it recalculates LAST: maxScroll must
      // already include the pin spacer, which only exists once the pin refreshes.
      const yearObj = { v: ACT1_START_YEAR }
      gsap.to(yearObj, {
        v: ACT1_END_YEAR,
        ease: 'none',
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: () => '+=' + Math.max(1, Math.round(ScrollTrigger.maxScroll(window) * YEAR_DONE_AT)),
          scrub: 0.6,
          invalidateOnRefresh: true,
          refreshPriority: -1,
        },
        onUpdate: () => {
          if (yearRef.current) yearRef.current.textContent = String(Math.round(yearObj.v))
        },
      })

      ScrollTrigger.refresh()
      // Light up any company rows already in view on load (batch fires on enter only).
      gsap.utils
        .toArray<HTMLElement>('.sc-company')
        .filter((el) => {
          const r = el.getBoundingClientRect()
          return r.top < window.innerHeight && r.bottom > 0
        })
        .forEach((el, i) => {
          gsap.to(el, { autoAlpha: 1, y: 0, duration: 0.6, delay: i * 0.1, ease: EASE.out, overwrite: true })
          gsap.to(el.querySelector('.sc-dot'), {
            backgroundColor: '#F5B041',
            scale: 1.15,
            duration: 0.5,
            delay: i * 0.1,
            ease: EASE.out,
            overwrite: true,
          })
        })

      return () => mm.revert()
    },
    { scope: root, dependencies: [lang, reduce] },
  )

  return (
    <main id="main" ref={root} className="relative z-10">
      {/* ── Header (dev scaffolding label) ─────────────────────────────── */}
      <section className="container-std pt-28 pb-4 md:pt-32">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-amber">{t(LAB_EYEBROW)}</p>
      </section>

      {/* ── ACT 1 · calm: year climbs, company wall lights up ──────────── */}
      <section ref={act1Ref} className="relative border-t border-line">
        {/* Act 1 runs long on purpose: the `sticky` year column is confined to
            its GRID ROW, whose height comes from the company wall — so the wall
            (not padding) is what keeps the readout on screen at YEAR_DONE_AT
            when it lands on ACT1_END_YEAR (본부장 2026-07-30). Measured: bottom
            padding only lengthens the page, which pushes the 40% mark later and
            makes it worse. Verify with scripts/measure-year-anchor.mjs. */}
        <div className="container-std grid gap-12 py-20 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:py-28">
          {/* left — sticky year readout (CSS sticky, native scroll; NOT a pin) */}
          <div className="md:sticky md:top-28 md:self-start">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-ink-dim">{t(timeline.eyebrow)}</p>
            <div className="mt-4 leading-none">
              <span ref={yearRef} className="u-fig text-7xl font-semibold text-amber md:text-8xl">
                {ACT1_START_YEAR}
              </span>
            </div>
            {/* phase era-ramp legend — era ramp is used ONLY on phase markers */}
            <ul className="mt-8 space-y-2.5">
              {phases.map((p, i) => (
                <li key={p.slug} className="flex items-center gap-2.5">
                  <span aria-hidden className="h-1.5 w-5 shrink-0 rounded-full" style={{ backgroundColor: PHASE_SPINE[i] }} />
                  <span className="break-keep font-mono text-[11px] text-ink-dim">
                    {p.period} · {t(p.name)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* right — company wall (chronological, lights up on scroll) */}
          <ul className="space-y-6 md:space-y-[8.5rem]">
            {companies.map((c, i) => (
              <li key={i} className="sc-company flex items-center gap-4">
                <span aria-hidden className="sc-dot h-2.5 w-2.5 shrink-0 rounded-full" />
                <span className="u-display break-keep text-2xl font-semibold tracking-wide text-ink md:text-4xl">{t(c)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── ACT 2 · burst: the ONE pin+scrub case (problem → decision → result) ── */}
      <section ref={act2Ref} className="relative border-t border-line bg-night/40">
        <div ref={panelRef} className="w-full md:flex md:min-h-screen md:items-center">
          <div className="container-std w-full py-16 md:py-20">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-amber">{t(bizPm.name)}</p>
            <h2 className="u-display mt-3 max-w-2xl break-keep text-2xl font-semibold leading-tight text-ink md:text-3xl">
              {t(bizPm.tagline)}
            </h2>

            <div className="relative mt-10 md:mt-14 md:min-h-[20rem]">
              {/* Beat 1 · problem */}
              <div ref={beatRefs[0]} className={`sc-beat ${overlay}`}>
                <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-ink-dim">{t(BEAT_LABELS[0])}</span>
                <p className="mt-4 max-w-2xl break-keep text-2xl font-medium leading-relaxed text-ink md:text-4xl md:leading-[1.3]">
                  {t(bizPm.problems[0])}
                </p>
              </div>

              {/* Beat 2 · decision */}
              <div ref={beatRefs[1]} className={`sc-beat ${beatGap} ${overlay}`}>
                <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-ink-dim">{t(BEAT_LABELS[1])}</span>
                <p className="mt-4 max-w-2xl break-keep text-2xl font-medium leading-relaxed text-ink md:text-4xl md:leading-[1.3]">
                  {t(bizPm.oneLiner)}
                </p>
              </div>

              {/* Beat 3 · result (count-up) */}
              <div ref={beatRefs[2]} className={`sc-beat ${beatGap} ${overlay}`}>
                <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-ink-dim">{t(BEAT_LABELS[2])}</span>
                <div className="mt-4 flex flex-wrap items-baseline gap-x-5 gap-y-2">
                  <span ref={numRef} className="u-fig text-6xl font-semibold leading-none text-amber md:text-8xl">
                    {result.stat[lang]}
                  </span>
                  <span className="break-keep text-lg font-medium text-ink md:text-2xl">{t(result.label)}</span>
                </div>
                {result.sub && <p className="mt-4 break-keep text-sm text-ink-dim md:text-base">{t(result.sub)}</p>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* tail — lets the pinned section release before the footer */}
      <section className="container-std py-24 md:py-32">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-ink-dim">— END OF POC —</p>
      </section>
    </main>
  )
}
