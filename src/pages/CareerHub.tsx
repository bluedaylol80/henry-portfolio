import { useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import JourneyBg from '../components/JourneyBg'
import { useT } from '../lib/i18n'
import { prefersReducedMotion } from '../lib/quality'
import { EASE } from '../lib/motion'
import { hub, phases, sectionLabels, type PhaseColor } from '../content/journey'
import { contact } from '../content/profile'

// Phase color tokens → era hexes (mirrors tailwind.config `era.*`).
const ERA_HEX: Record<PhaseColor, string> = {
  amber: '#FFB454',
  coral: '#FF9A62',
  violet: '#8B5CF6',
  cyan: '#22D3EE',
  sky: '#38BDF8',
}

/**
 * Immediately reveal any matching elements already inside the viewport.
 * Safeguards against ScrollTrigger.batch not firing onEnter for elements
 * already past its start line at creation (which leaves autoAlpha:0 links
 * visibility:hidden and unclickable on a route that mounts without a scroll).
 */
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
      className="h-5 w-5 shrink-0 transition-transform duration-300 ease-out group-hover:translate-x-1"
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

      // Strata cards reveal as they enter, staggered per batch.
      ScrollTrigger.batch('.hub-strata', {
        start: 'top 88%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.1, ease: EASE.out, overwrite: true }),
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
        onEnter: (batch) =>
          gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.08, ease: EASE.out, overwrite: true }),
      })
      gsap.from('.hub-cta', {
        autoAlpha: 0,
        y: 18,
        duration: 0.7,
        ease: EASE.out,
        scrollTrigger: { trigger: '.hub-cta', start: 'top 90%', once: true },
      })

      // This page mounts after the preloader is already done (no scroll delay),
      // so recompute trigger positions once layout settles. Then guarantee that
      // anything already inside the viewport is revealed — ScrollTrigger.batch
      // does not reliably fire onEnter for elements already past its start line
      // at creation, which would otherwise leave in-view strata *links* stuck at
      // visibility:hidden (autoAlpha) and therefore unclickable.
      ScrollTrigger.refresh()
      revealInView('.hub-strata', 0.1)
      revealInView('.hub-work-card', 0.08)
    },
    { scope: root },
  )

  return (
    <>
      <JourneyBg />
      <main id="main" className="relative z-10">
        <div ref={root} className="section-pad container-std">
          {/* Header */}
          <header className="max-w-3xl">
            <p className="hub-eyebrow eyebrow">{t(hub.label)}</p>
            <h1 className="mt-6 break-keep font-display text-[clamp(2.5rem,7vw,5rem)] font-bold leading-[1.02]">
              <span className="block overflow-hidden pb-[0.1em]">
                <span className="hub-title text-gradient block">{t(hub.title)}</span>
              </span>
            </h1>
            <p className="hub-lede mt-8 break-keep text-lg leading-relaxed text-ink-dim md:text-xl">
              {t(hub.lede)}
            </p>
          </header>

          {/* Mission quote */}
          <figure className="hub-mission glass relative mt-14 overflow-hidden rounded-2xl p-8 md:mt-20 md:p-11">
            <span
              aria-hidden
              className="absolute inset-y-0 left-0 w-1 rounded-l-2xl"
              style={{ background: 'linear-gradient(180deg,#8B5CF6,#22D3EE,#38BDF8)' }}
            />
            <blockquote className="break-keep pl-4 font-display text-xl font-medium italic leading-relaxed text-ink md:pl-6 md:text-[1.7rem] md:leading-[1.45]">
              {t(hub.mission)}
            </blockquote>
            <figcaption className="mt-5 break-keep pl-4 text-sm text-ink-mute md:pl-6">
              {t(hub.missionSource)}
            </figcaption>
          </figure>

          {/* Layer stack — Phase 05 on top → 01 at bottom */}
          <section aria-label={t(hub.label)} className="mt-16 flex flex-col gap-4 md:mt-24 md:gap-5">
            {strata.map((p) => {
              const hex = ERA_HEX[p.color]
              return (
                <Link
                  key={p.slug}
                  to={`/career/${p.slug}`}
                  className="hub-strata group glass relative flex items-center gap-5 overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/25 md:gap-8 md:p-8"
                  style={{ ['--phase' as string]: hex }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = `0 0 44px -10px ${hex}`
                    e.currentTarget.style.borderColor = `${hex}66`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = ''
                    e.currentTarget.style.borderColor = ''
                  }}
                >
                  {/* Left color bar */}
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-0 w-1"
                    style={{ background: hex, boxShadow: `0 0 20px ${hex}` }}
                  />
                  <span
                    aria-hidden
                    className="font-display text-2xl font-bold tabular-nums text-ink-mute transition-colors duration-300 md:text-3xl"
                    style={{ minWidth: '2.5rem' }}
                  >
                    {p.num}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="break-keep text-xl font-bold text-ink md:text-2xl">{t(p.name)}</h2>
                    <p className="mt-1 break-keep text-sm text-ink-dim md:text-base">{t(p.tagline)}</p>
                    <p className="mt-2.5 break-keep font-display text-xs tabular-nums text-ink-mute md:text-sm">
                      {p.period} · {t(p.companies)}
                    </p>
                  </div>
                  <span style={{ color: hex }}>
                    <ArrowRight />
                  </span>
                </Link>
              )
            })}
          </section>

          {/* Workstyle */}
          <section className="mt-24 md:mt-32">
            <h2 className="hub-work-head max-w-2xl break-keep font-display text-[clamp(1.6rem,4vw,2.75rem)] font-bold leading-[1.12]">
              {t(hub.workstyleTitle)}
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
              {hub.workstyle.map((w, i) => (
                <div key={i} className="hub-work-card glass rounded-2xl p-6 md:p-7">
                  <h3 className="break-keep text-base font-semibold text-ink md:text-lg">{t(w.title)}</h3>
                  <p className="mt-3 break-keep text-sm leading-relaxed text-ink-dim">{t(w.body)}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Closing CTA row */}
          <div className="hub-cta mt-20 flex flex-wrap items-center gap-4 border-t border-white/5 pt-10 md:mt-28">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3.5 text-sm font-medium text-ink-dim transition-all duration-300 hover:-translate-y-0.5 hover:border-white/35 hover:text-ink md:text-base"
            >
              <span aria-hidden>←</span>
              {t(sectionLabels.backToHome)}
            </Link>
            <Link
              to="/#contact"
              className="glass glow-cyan group inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-ink transition-all duration-300 hover:-translate-y-0.5 hover:border-era-cyan/40 md:text-base"
            >
              {t(contact.title)}
              <ArrowRight />
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
