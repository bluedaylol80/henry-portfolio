import { useRef } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import WorkGallery from '../components/WorkGallery'
import { useT } from '../lib/i18n'
import { prefersReducedMotion } from '../lib/quality'
import { EASE } from '../lib/motion'
import { phases, sectionLabels, type JourneyPhase } from '../content/journey'
import { contact } from '../content/profile'

/**
 * /career/:slug — one career phase deep-dive (LOCKED §5.2), re-skinned to the v20
 * CONTROL ROOM system. No gradient text (banned §3.4-6); solid KO-900 display, a
 * warm→cool phase-spine ramp held in the era hard-zone (never amber), line/elev
 * surfaces. GSAP owns the scroll reveal (one engine, §3.3); reduced-motion safe.
 */

// Phase-spine ramp (num 01→05), warm→cool — hard-zoned away from the amber accent.
const PHASE_SPINE = ['#E67E22', '#C58C50', '#6FA79A', '#54C3BE', '#4FD1C5'] as const
const spineHex = (num: string) => PHASE_SPINE[Number(num) - 1] ?? PHASE_SPINE[0]

function ArrowRight({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`h-5 w-5 shrink-0 ${className}`}
    >
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  )
}

/** Prev/next navigation card. `dir` sets arrow side + label alignment. */
function NavCard({ to, label, num, name, dir, hex }: { to: string; label: string; num: string; name: string; dir: 'prev' | 'next'; hex: string }) {
  const isNext = dir === 'next'
  return (
    <Link
      to={to}
      className="phase-nav group block flex-1 rounded-2xl border border-line bg-elev/40 transition-all duration-500 ease-lux hover:-translate-y-0.5 hover:border-ink/25 active:scale-[0.99]"
    >
      <div className={`flex items-center gap-4 p-5 md:p-6 ${isNext ? 'flex-row-reverse text-right' : 'text-left'}`}>
        <span style={{ color: hex }}>
          <ArrowRight className={`transition-transform duration-300 ease-out4 ${isNext ? 'group-hover:translate-x-1' : '-scale-x-100 group-hover:-translate-x-1'}`} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-mono text-[11px] uppercase tracking-[0.2em] text-ink-dim">{label}</span>
          <span className="mt-1.5 block break-keep text-base font-semibold text-ink md:text-lg">
            <span className="u-fig text-ink-dim">{num}</span> {name}
          </span>
        </span>
      </div>
    </Link>
  )
}

export default function PhasePage() {
  const { slug } = useParams<{ slug: string }>()
  const t = useT()
  const root = useRef<HTMLDivElement>(null)

  const index = phases.findIndex((p) => p.slug === slug)
  const phase: JourneyPhase | undefined = index >= 0 ? phases[index] : undefined

  useGSAP(
    () => {
      if (!phase) return
      const reduce = prefersReducedMotion()
      if (reduce) {
        gsap.set(['.ph-back', '.ph-eyebrow', '.ph-title', '.ph-oneliner', '.ph-meta', '.ph-block'], { autoAlpha: 1, y: 0, yPercent: 0 })
        return
      }

      gsap.set('.ph-title', { yPercent: 115 })

      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top 82%', once: true } })
      tl.from('.ph-back', { autoAlpha: 0, y: 12, duration: 0.5, ease: EASE.out })
        .from('.ph-eyebrow', { autoAlpha: 0, y: 16, duration: 0.6, ease: EASE.out }, '-=0.2')
        .to('.ph-title', { yPercent: 0, duration: 0.9, ease: EASE.out }, '-=0.25')
        .from('.ph-oneliner', { autoAlpha: 0, y: 18, duration: 0.7, ease: EASE.out }, '-=0.4')
        .from('.ph-meta > *', { autoAlpha: 0, y: 14, duration: 0.55, stagger: 0.08, ease: EASE.out }, '-=0.35')

      gsap.utils.toArray<HTMLElement>('.ph-block').forEach((el) => {
        gsap.set(el, { autoAlpha: 0, y: 28 })
        ScrollTrigger.create({
          trigger: el,
          start: 'top 85%',
          once: true,
          onEnter: () => gsap.to(el, { autoAlpha: 1, y: 0, duration: 0.7, ease: EASE.out, overwrite: true }),
        })
      })

      ScrollTrigger.refresh()
      gsap.utils
        .toArray<HTMLElement>('.ph-block')
        .filter((el) => {
          const r = el.getBoundingClientRect()
          return r.top < window.innerHeight && r.bottom > 0
        })
        .forEach((el) => gsap.to(el, { autoAlpha: 1, y: 0, duration: 0.7, ease: EASE.out, overwrite: true }))
    },
    { scope: root, dependencies: [slug] },
  )

  if (!phase) return <Navigate to="/career" replace />

  const hex = spineHex(phase.num)
  const prev = index > 0 ? phases[index - 1] : undefined
  const next = index < phases.length - 1 ? phases[index + 1] : undefined

  return (
    <main id="main" className="relative z-10">
      <article ref={root} className="container-std py-24 md:py-28">
        {/* 1 · Hero */}
        <Link to="/career" className="ph-back group inline-flex items-center gap-2 text-sm text-ink-dim transition-colors duration-300 hover:text-ink">
          <ArrowRight className="-scale-x-100 h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
          {t(sectionLabels.backToMap)}
        </Link>

        <p className="ph-eyebrow mt-8 font-mono text-[11px] uppercase tracking-[0.3em]" style={{ color: hex }}>
          PHASE {phase.num} · {t(phase.name)}
        </p>

        <h1 className="mt-6 max-w-4xl break-keep text-[clamp(2.25rem,6vw,4.5rem)] font-semibold leading-[1.05]">
          <span className="block overflow-hidden pb-[0.1em]">
            <span className="ph-title u-display block text-ink">{t(phase.title)}</span>
          </span>
        </h1>

        <p className="ph-oneliner mt-6 max-w-2xl break-keep text-lg leading-relaxed text-ink-soft md:text-xl">{t(phase.oneLiner)}</p>

        <div className="ph-meta mt-8 flex flex-wrap gap-3">
          {[phase.period, t(phase.companies), t(phase.roleLine)].map((chip, i) => (
            <span key={i} className="break-keep rounded-full border border-line bg-elev/40 px-4 py-2 font-mono text-[11px] text-ink-dim md:text-xs">
              {chip}
            </span>
          ))}
        </div>

        {/* 2 · Intro */}
        <p className="ph-block mt-16 max-w-3xl break-keep text-lg leading-relaxed text-ink-soft md:mt-20 md:text-xl">{t(phase.intro)}</p>

        {/* 3 · Did */}
        <section className="ph-block mt-20 md:mt-28">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.3em]" style={{ color: hex }}>{t(sectionLabels.did)}</h2>
          <ul className="mt-8 grid gap-x-10 gap-y-4 md:grid-cols-2">
            {phase.did.map((d, i) => (
              <li key={i} className="flex items-start gap-3.5">
                <span aria-hidden className="mt-2 block h-1.5 w-4 shrink-0 rounded-full" style={{ backgroundColor: hex }} />
                <span className="break-keep text-base leading-relaxed text-ink-soft md:text-lg">{t(d)}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 4 · Problems */}
        <section className="ph-block mt-20 md:mt-28">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.3em]" style={{ color: hex }}>{t(sectionLabels.problems)}</h2>
          <ol className="mt-10 space-y-10">
            {phase.problems.map((p, i) => (
              <li key={i} className="flex items-start gap-5 md:gap-8">
                <span aria-hidden className="u-fig text-3xl font-semibold leading-none md:text-5xl" style={{ color: hex, opacity: 0.55 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="max-w-3xl break-keep text-lg font-medium leading-relaxed text-ink md:text-2xl">{t(p)}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* 5 · Outputs */}
        <section className="ph-block mt-20 md:mt-28">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.3em]" style={{ color: hex }}>{t(sectionLabels.outputs)}</h2>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {phase.outputs.map((o, i) => (
              <div key={i} className="rounded-2xl border bg-elev/40 p-5 md:p-6" style={i === 0 ? { borderColor: `${hex}55` } : { borderColor: '#22345C' }}>
                <div className="u-fig text-[clamp(1.75rem,4.5vw,2.6rem)] font-semibold leading-none" style={{ color: i === 0 ? hex : '#F8F9FA' }}>
                  {t(o.stat)}
                </div>
                <div className="mt-3 break-keep text-sm font-medium leading-snug text-ink">{t(o.label)}</div>
                {o.sub && <div className="mt-1.5 break-keep text-xs leading-snug text-ink-dim">{t(o.sub)}</div>}
              </div>
            ))}
          </div>
        </section>

        {/* 6 · Stories */}
        <section className="ph-block mt-20 md:mt-28">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.3em]" style={{ color: hex }}>{t(sectionLabels.stories)}</h2>
          <ol className="mt-10 space-y-5">
            {phase.stories.map((s, i) => (
              <li key={i} className="rounded-2xl border border-line bg-elev/40">
                <div className="border-l-2 p-6 md:p-8" style={{ borderLeftColor: hex }}>
                  <div className="flex items-baseline gap-4">
                    <span className="u-fig text-sm text-ink-dim">{String(i + 1).padStart(2, '0')}</span>
                    <h3 className="u-display break-keep text-lg font-semibold text-ink md:text-xl">{t(s.title)}</h3>
                  </div>
                  <p className="mt-3 break-keep leading-relaxed text-ink-soft md:pl-9">{t(s.body)}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* 6.5 · Work gallery (only when screenshots exist) */}
        {(phase.gallery?.length ?? 0) > 0 && (
          <section className="ph-block mt-20 md:mt-28">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.3em]" style={{ color: hex }}>{t(sectionLabels.gallery)}</h2>
            <div className="mt-8">
              <WorkGallery items={phase.gallery ?? []} label={t(sectionLabels.gallery)} />
            </div>
          </section>
        )}

        {/* 7 · Carried + prev/next nav */}
        <section className="ph-block mt-24 border-t border-line pt-14 md:mt-32">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.3em]" style={{ color: hex }}>{t(sectionLabels.carried)}</h2>
          <p className="mt-6 max-w-3xl break-keep text-xl leading-relaxed text-ink md:text-2xl">{t(phase.carried)}</p>

          <div className="mt-14 flex flex-col gap-4 md:flex-row">
            {prev ? (
              <NavCard to={`/career/${prev.slug}`} label={t(sectionLabels.prev)} num={prev.num} name={t(prev.name)} dir="prev" hex={spineHex(prev.num)} />
            ) : (
              <span className="hidden flex-1 md:block" aria-hidden />
            )}

            {next ? (
              <NavCard to={`/career/${next.slug}`} label={t(sectionLabels.next)} num={next.num} name={t(next.name)} dir="next" hex={spineHex(next.num)} />
            ) : (
              <Link to="/#contact" className="phase-nav group block flex-1 rounded-2xl bg-amber transition-transform duration-500 ease-lux hover:-translate-y-0.5 active:scale-[0.99]">
                <div className="flex flex-row-reverse items-center gap-4 p-5 text-right md:p-6">
                  <span className="text-night">
                    <ArrowRight className="transition-transform duration-300 ease-out4 group-hover:translate-x-1" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-[11px] uppercase tracking-[0.2em] text-night/70">{t(sectionLabels.next)}</span>
                    <span className="mt-1.5 block break-keep text-base font-semibold text-night md:text-lg">{t(contact.title)}</span>
                  </span>
                </div>
              </Link>
            )}
          </div>
        </section>
      </article>
    </main>
  )
}
