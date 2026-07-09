import { useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import SectionShell from '../components/SectionShell'
import { useT } from '../lib/i18n'
import { career } from '../content/profile'
import type { CareerPhase } from '../content/types'
import { prefersReducedMotion } from '../lib/quality'
import { EASE } from '../lib/motion'

const PHASE_COLOR: Record<CareerPhase, string> = {
  ops: '#F5B041',
  qa: '#F39C12',
  biz: '#E67E22',
  plan: '#4FACFE',
}

/** Timeline phase → journey deep-dive slug (SPEC §10.4). */
const PHASE_SLUG: Record<CareerPhase, string> = {
  ops: 'ops',
  qa: 'fun-qa',
  biz: 'business-pm',
  plan: 'planning',
}

export default function Career() {
  const t = useT()
  const rootRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const reduce = prefersReducedMotion()
      if (reduce) {
        gsap.set(['.career-eyebrow', '.career-title', '.career-sub', '.career-row'], {
          autoAlpha: 1,
          y: 0,
          yPercent: 0,
        })
        gsap.set('.career-rail', { scaleY: 1 })
        return
      }

      gsap.set('.career-title', { yPercent: 115 })
      gsap.set('.career-row', { autoAlpha: 0, y: 32 })

      const tl = gsap.timeline({ scrollTrigger: { trigger: rootRef.current, start: 'top 72%', once: true } })
      tl.from('.career-eyebrow', { autoAlpha: 0, y: 16, duration: 0.7, ease: EASE.out })
        .to('.career-title', { yPercent: 0, duration: 0.9, ease: EASE.out }, '-=0.35')
        .from('.career-sub', { autoAlpha: 0, y: 16, duration: 0.7, ease: EASE.out }, '-=0.4')

      // Continuous gradient rail draws across the whole list.
      gsap.fromTo(
        '.career-rail',
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: { trigger: timelineRef.current, start: 'top 78%', end: 'bottom 78%', scrub: true },
        },
      )

      // Rows reveal as they enter the viewport, staggered per batch.
      ScrollTrigger.batch('.career-row', {
        start: 'top 85%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.09, ease: EASE.out, overwrite: true }),
      })
    },
    { scope: rootRef },
  )

  return (
    <SectionShell id="career" className="section-pad">
      <div ref={rootRef} className="container-std">
        <header className="max-w-2xl">
          <p className="career-eyebrow eyebrow">{t(career.label)}</p>
          <h2 className="mt-6 break-keep font-display text-[clamp(2rem,5vw,3.75rem)] font-bold leading-[1.08]">
            <span className="block overflow-hidden pb-[0.08em]">
              <span className="career-title block">{t(career.title)}</span>
            </span>
          </h2>
          <p className="career-sub mt-6 break-keep text-base leading-relaxed text-ink-dim md:text-lg">
            {t(career.subtitle)}
          </p>
        </header>

        <div ref={timelineRef} className="relative mt-16 md:mt-20">
          {/* Rail track (unfilled) */}
          <span
            aria-hidden
            className="absolute bottom-3 left-[14px] top-3 w-0.5 -translate-x-1/2 rounded bg-white/10 md:left-[182px]"
          />
          {/* Rail gradient (draws with scroll). Entries are newest-first, so the
              rail runs cyan (newest/plan) → violet → amber (oldest/ops) top-to-bottom
              to match the phase dots. */}
          <span
            aria-hidden
            className="career-rail absolute bottom-3 left-[14px] top-3 w-0.5 origin-top -translate-x-1/2 rounded bg-gradient-to-b from-era-cyan via-era-violet to-era-amber md:left-[182px]"
          />

          <ol>
            {career.entries.map((entry, i) => (
              <li
                key={i}
                className="career-row relative grid grid-cols-[28px_1fr] gap-x-5 pb-11 last:pb-0 md:grid-cols-[160px_44px_1fr] md:gap-x-6 md:pb-14"
              >
                <div className="hidden md:block md:pt-1 md:text-right">
                  <span className="font-display text-sm tabular-nums text-ink-mute">{entry.period}</span>
                </div>

                <div className="relative flex justify-center">
                  <span
                    className="relative z-10 mt-1.5 block h-3 w-3 rounded-full ring-4 ring-base"
                    style={{ background: PHASE_COLOR[entry.phase], boxShadow: `0 0 12px ${PHASE_COLOR[entry.phase]}` }}
                  />
                </div>

                <div className="group -ml-4 rounded-2xl border border-white/0 px-4 py-3 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04] hover:backdrop-blur-md md:-ml-5 md:px-5 md:py-4 md:hover:translate-x-1">
                  <span className="mb-1 block font-display text-xs tabular-nums text-ink-mute md:hidden">
                    {entry.period}
                  </span>
                  <h3 className="break-keep text-xl font-semibold text-ink md:text-2xl">{t(entry.company)}</h3>
                  <p className="mt-1 break-keep text-ink-dim">{t(entry.role)}</p>
                  {entry.titles && <p className="mt-2 break-keep text-sm text-ink-dim">{t(entry.titles)}</p>}
                  {entry.highlight && (
                    <p className="mt-2 break-keep border-l-2 border-era-cyan/60 pl-3 text-sm leading-relaxed text-ink-dim">
                      {t(entry.highlight)}
                    </p>
                  )}
                  {/* Deep-dive link → the entry's phase page (SPEC §10.4). */}
                  <Link
                    to={`/career/${PHASE_SLUG[entry.phase]}`}
                    data-cursor
                    className="mt-3 inline-flex items-center gap-1 text-xs text-ink-mute transition-colors duration-200 hover:text-era-cyan"
                  >
                    {t(career.moreLabel)}
                    <span aria-hidden>→</span>
                  </Link>
                </div>
              </li>
            ))}

            {/* End cap */}
            <li className="career-row relative grid grid-cols-[28px_1fr] gap-x-5 pt-2 md:grid-cols-[160px_44px_1fr] md:gap-x-6">
              <div className="hidden md:block" />
              <div className="relative flex justify-center">
                <span
                  className="relative z-10 block h-4 w-4 rounded-full ring-4 ring-base"
                  style={{
                    background: 'linear-gradient(135deg,#F5B041,#E67E22,#4FACFE)',
                    boxShadow: '0 0 16px rgba(230,126,34,0.7)',
                  }}
                />
              </div>
              <p className="text-gradient break-keep font-display text-lg font-semibold md:text-2xl">
                {t(career.arcNote)}
              </p>
            </li>

            {/* Deep-dive CTA — routes to the career journey map. */}
            <li className="career-row relative mt-14 grid grid-cols-[28px_1fr] gap-x-5 md:mt-16 md:grid-cols-[160px_44px_1fr] md:gap-x-6">
              <div className="hidden md:block" />
              <div className="hidden md:block" />
              <div className="flex flex-col items-start gap-5 md:flex-row md:items-center md:justify-between">
                <p className="max-w-md break-keep text-sm leading-relaxed text-ink-dim md:text-base">
                  {t(career.deepDive)}
                </p>
                <Link
                  to="/career"
                  data-cursor
                  className="glass glow-cyan group inline-flex shrink-0 items-center gap-3 rounded-full px-6 py-3.5 text-sm font-medium text-ink transition-colors duration-300 hover:border-white/25 md:text-base"
                >
                  <span className="break-keep">{t(career.deepDiveCta)}</span>
                  <span
                    aria-hidden
                    className="text-era-cyan transition-transform duration-300 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </Link>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </SectionShell>
  )
}
