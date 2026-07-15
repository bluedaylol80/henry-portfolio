import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useGSAP } from '@gsap/react'
import { gsap, ScrollTrigger } from '../lib/scrollTriggerBridge'
import { useT } from '../lib/i18n'
import { prefersReducedMotion } from '../lib/quality'
import { EASE } from '../lib/motion'
import { hub, phases, sectionLabels } from '../content/journey'
import { contact } from '../content/profile'

/**
 * /career — the hub for the five-layer career deep-dive (LOCKED §5.2). Re-skinned
 * to the v20 CONTROL ROOM system. The phase spine holds its OWN colour zone — a
 * warm→cool ramp (era-orange → era-cyan), never the amber accent (§3.4-3). GSAP
 * owns the scroll reveal here (one role, one engine, §3.3); reduced-motion safe.
 */

// Phase spine ramp (num 01→05), warm→cool. Hard-zoned away from amber.
const PHASE_SPINE = ['#E67E22', '#C58C50', '#6FA79A', '#54C3BE', '#4FD1C5'] as const

function revealInView(selector: string, stagger: number) {
  const inView = gsap.utils.toArray<HTMLElement>(selector).filter((el) => {
    const r = el.getBoundingClientRect()
    return r.top < window.innerHeight && r.bottom > 0
  })
  if (inView.length) {
    gsap.to(inView, { autoAlpha: 1, y: 0, duration: 0.7, stagger, ease: EASE.out, overwrite: true })
  }
}

function ArrowRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-5 w-5 shrink-0 transition-transform duration-300 ease-out4 group-hover:translate-x-1"
    >
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  )
}

export default function CareerHub() {
  const t = useT()
  const root = useRef<HTMLDivElement>(null)

  // Layer stack renders newest-first (Phase 05 on top → 01 at bottom).
  const strata = [...phases].reverse()

  useGSAP(
    () => {
      const reduce = prefersReducedMotion()
      if (reduce) {
        gsap.set(
          ['.hub-eyebrow', '.hub-title', '.hub-lede', '.hub-mission', '.hub-work-head', '.hub-work-card', '.hub-cta'],
          { autoAlpha: 1, y: 0, yPercent: 0 },
        )
        gsap.set('.hub-strata', { autoAlpha: 1, y: 0 })
        return
      }

      gsap.set('.hub-title', { yPercent: 115 })
      gsap.set('.hub-strata', { autoAlpha: 0, y: 34 })
      gsap.set('.hub-work-card', { autoAlpha: 0, y: 26 })

      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top 78%', once: true } })
      tl.from('.hub-eyebrow', { autoAlpha: 0, y: 16, duration: 0.7, ease: EASE.out })
        .to('.hub-title', { yPercent: 0, duration: 0.9, ease: EASE.out }, '-=0.35')
        .from('.hub-lede', { autoAlpha: 0, y: 18, duration: 0.7, ease: EASE.out }, '-=0.4')
        .from('.hub-mission', { autoAlpha: 0, y: 22, duration: 0.8, ease: EASE.out }, '-=0.35')

      ScrollTrigger.batch('.hub-strata', {
        start: 'top 88%',
        once: true,
        onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.1, ease: EASE.out, overwrite: true }),
      })

      gsap.from('.hub-work-head', {
        autoAlpha: 0,
        y: 20,
        duration: 0.7,
        ease: EASE.out,
        scrollTrigger: { trigger: '.hub-work-head', start: 'top 85%', once: true },
      })
      ScrollTrigger.batch('.hub-work-card', {
        start: 'top 88%',
        once: true,
        onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.08, ease: EASE.out, overwrite: true }),
      })
      gsap.from('.hub-cta', {
        autoAlpha: 0,
        y: 18,
        duration: 0.7,
        ease: EASE.out,
        scrollTrigger: { trigger: '.hub-cta', start: 'top 90%', once: true },
      })

      ScrollTrigger.refresh()
      revealInView('.hub-strata', 0.1)
      revealInView('.hub-work-card', 0.08)
    },
    { scope: root },
  )

  return (
    <main id="main" className="relative z-10">
      <div ref={root} className="container-std py-24 md:py-28">
        {/* Header */}
        <header className="max-w-3xl">
          <p className="hub-eyebrow font-mono text-[11px] uppercase tracking-[0.3em] text-amber">{t(hub.label)}</p>
          <h1 className="mt-6 break-keep text-[clamp(2.5rem,7vw,4.5rem)] font-semibold leading-[1.04]">
            <span className="block overflow-hidden pb-[0.1em]">
              <span className="hub-title u-display block text-ink">{t(hub.title)}</span>
            </span>
          </h1>
          <p className="hub-lede mt-8 break-keep text-lg leading-relaxed text-ink-soft md:text-xl">{t(hub.lede)}</p>
        </header>

        {/* Mission quote */}
        <figure className="hub-mission mt-14 overflow-hidden rounded-2xl border border-line bg-elev/40 md:mt-20">
          <div className="relative p-8 md:p-11">
            <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-amber" />
            <blockquote className="u-display break-keep pl-4 text-xl font-medium italic leading-relaxed text-ink md:pl-6 md:text-[1.6rem] md:leading-[1.45]">
              {t(hub.mission)}
            </blockquote>
            <figcaption className="mt-5 break-keep pl-4 text-sm text-ink-dim md:pl-6">{t(hub.missionSource)}</figcaption>
          </div>
        </figure>

        {/* Layer stack — Phase 05 on top → 01 at bottom */}
        <section aria-label={t(hub.label)} className="mt-16 flex flex-col gap-4 md:mt-24">
          {strata.map((p) => {
            const hex = PHASE_SPINE[Number(p.num) - 1] ?? PHASE_SPINE[0]
            return (
              <Link
                key={p.slug}
                to={`/career/${p.slug}`}
                className="hub-strata group block rounded-2xl border border-line bg-elev/40 transition-all duration-500 ease-lux hover:-translate-y-0.5 hover:border-ink/25 active:scale-[0.99]"
              >
                <div className="relative flex items-center gap-5 overflow-hidden rounded-2xl p-6 md:gap-8 md:p-8">
                  <span aria-hidden className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: hex }} />
                  <span className="u-fig text-2xl font-semibold text-ink-dim md:text-3xl" style={{ minWidth: '2.5rem' }}>
                    {p.num}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="u-display break-keep text-xl font-semibold text-ink md:text-2xl">{t(p.name)}</h2>
                    <p className="mt-1 break-keep text-sm text-ink-soft md:text-base">{t(p.tagline)}</p>
                    <p className="mt-2.5 break-keep font-mono text-xs text-ink-dim md:text-sm">
                      {p.period} · {t(p.companies)}
                    </p>
                  </div>
                  <span style={{ color: hex }}>
                    <ArrowRight />
                  </span>
                </div>
              </Link>
            )
          })}
        </section>

        {/* Workstyle */}
        <section className="mt-24 md:mt-32">
          <h2 className="hub-work-head u-display max-w-2xl break-keep text-[clamp(1.6rem,4vw,2.5rem)] font-semibold leading-tight text-ink">
            {t(hub.workstyleTitle)}
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {hub.workstyle.map((w, i) => (
              <div key={i} className="hub-work-card rounded-2xl border border-line bg-elev/30 p-6 md:p-7">
                <h3 className="u-display break-keep text-base font-semibold text-ink md:text-lg">{t(w.title)}</h3>
                <p className="mt-3 break-keep text-sm leading-relaxed text-ink-soft">{t(w.body)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Closing CTA row */}
        <div className="hub-cta mt-20 flex flex-wrap items-center gap-4 border-t border-line pt-10 md:mt-28">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3.5 font-mono text-sm uppercase tracking-[0.1em] text-ink-dim transition-colors hover:border-ink/30 hover:text-ink"
          >
            <span aria-hidden>←</span>
            {t(sectionLabels.backToHome)}
          </Link>
          <Link
            to="/#contact"
            className="group inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3.5 font-mono text-sm font-semibold uppercase tracking-[0.1em] text-night transition-colors hover:bg-amber-deep"
          >
            {t(contact.title)}
            <ArrowRight />
          </Link>
        </div>
      </div>
    </main>
  )
}
