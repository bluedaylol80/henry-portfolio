import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, ScrollTrigger } from '../lib/scrollTriggerBridge'
import { prefersReducedMotion } from '../lib/quality'
import { EASE } from '../lib/motion'
import { phases, timeline } from '../content/journey'
import { useT } from '../lib/i18n'

/**
 * E3 — the editorial 19-year timeline (/career signature, LOCKED §5.2/§6 E3).
 * One strata row per phase over a proportional 2006→2026 axis, so overlapping
 * chapters (business-pm ↔ planning ↔ ai-system) read as parallel layers. Bars
 * are schematic; the factual claim stays the verbatim `period` string. Colours
 * live in the era hard-zone ramp (never amber). GSAP owns the reveal (page
 * engine), one row at a time; reduced-motion renders static and visible.
 */

// Phase-spine ramp (num 01→05), warm→cool — hard-zoned away from the amber accent.
const PHASE_SPINE = ['#E67E22', '#C58C50', '#6FA79A', '#54C3BE', '#4FD1C5'] as const

const RANGE = timeline.end - timeline.start
const pct = (year: number) => ((year - timeline.start) / RANGE) * 100

export default function CareerTimeline() {
  const t = useT()
  const root = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        gsap.set(['.ct-head', '.ct-row', '.ct-axis'], { autoAlpha: 1, y: 0 })
        return
      }
      gsap.set(['.ct-head', '.ct-axis'], { autoAlpha: 0, y: 14 })
      gsap.set('.ct-row', { autoAlpha: 0, y: 18 })
      ScrollTrigger.batch('.ct-head, .ct-row, .ct-axis', {
        start: 'top 88%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.16, ease: EASE.out, overwrite: true }),
      })
    },
    { scope: root },
  )

  return (
    <div ref={root} aria-label={t(timeline.eyebrow)}>
      <p className="ct-head font-mono text-[11px] uppercase tracking-[0.24em] text-ink-dim">{t(timeline.eyebrow)}</p>

      <div className="mt-6 space-y-5">
        {phases.map((p) => {
          const hex = PHASE_SPINE[Number(p.num) - 1] ?? PHASE_SPINE[0]
          const spans = timeline.spans.filter((s) => s.slug === p.slug)
          return (
            <div key={p.slug} className="ct-row grid grid-cols-[7.5rem_1fr] items-center gap-4 md:grid-cols-[11rem_1fr] md:gap-6">
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="u-fig text-[11px] text-ink-dim">{p.num}</span>
                  <span className="u-display truncate text-sm font-semibold text-ink md:text-base">{t(p.name)}</span>
                </div>
                <div className="mt-0.5 break-keep font-mono text-[10px] text-ink-dim md:text-[11px]">{p.period}</div>
              </div>
              <div className="relative h-5">
                {/* baseline */}
                <span aria-hidden className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line/60" />
                {spans.map((s, i) => (
                  <span
                    key={i}
                    aria-hidden
                    className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full"
                    style={{
                      left: `${pct(s.from)}%`,
                      width: `${Math.max(pct(s.to) - pct(s.from), 1.5)}%`,
                      background: s.now ? `linear-gradient(90deg, ${hex} 55%, transparent)` : hex,
                      opacity: 0.9,
                    }}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* year axis — aligned with the bar column */}
      <div className="ct-axis mt-4 grid grid-cols-[7.5rem_1fr] gap-4 md:grid-cols-[11rem_1fr] md:gap-6">
        <span aria-hidden />
        <div className="relative h-5 border-t border-line/60">
          {timeline.ticks.map((y) => (
            <span
              key={y}
              className="u-fig absolute top-1.5 -translate-x-1/2 text-[10px] text-ink-dim"
              style={{ left: `${pct(y)}%` }}
            >
              {y}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
