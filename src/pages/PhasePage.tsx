import { useRef } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import JourneyBg from '../components/JourneyBg'
import WorkGallery from '../components/WorkGallery'
import { useT } from '../lib/i18n'
import { prefersReducedMotion } from '../lib/quality'
import { EASE } from '../lib/motion'
import {
  phases,
  sectionLabels,
  type JourneyPhase,
  type PhaseColor,
} from '../content/journey'
import { contact } from '../content/profile'

// Phase color tokens → era hexes (mirrors tailwind.config `era.*`).
const ERA_HEX: Record<PhaseColor, string> = {
  amber: '#F5B041',
  coral: '#F39C12',
  violet: '#E67E22',
  cyan: '#4FACFE',
  sky: '#00F2FE',
}

// A lighter companion stop per color, for tasteful inline gradient headings.
const ERA_HEX_LIGHT: Record<PhaseColor, string> = {
  amber: '#FCE3B8',
  coral: '#FBD38D',
  violet: '#F5C09A',
  cyan: '#BBDFFF',
  sky: '#B3FCFF',
}

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
function NavCard({
  to,
  label,
  num,
  name,
  dir,
  hex,
}: {
  to: string
  label: string
  num: string
  name: string
  dir: 'prev' | 'next'
  hex: string
}) {
  const isNext = dir === 'next'
  return (
    <Link
      to={to}
      className="phase-nav bezel group block flex-1 transition-transform duration-500 ease-lux hover:-translate-y-1 active:scale-[0.98]"
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 20px 60px -20px rgba(2,6,16,0.8), 0 0 40px -12px ${hex}`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = ''
      }}
    >
      <div
        className={`bezel-core flex items-center gap-4 p-5 md:p-6 ${
          isNext ? 'flex-row-reverse text-right' : 'text-left'
        }`}
      >
        <span style={{ color: hex }}>
          <ArrowRight
            className={`transition-transform duration-300 ease-out4 ${
              isNext ? 'group-hover:translate-x-1' : '-scale-x-100 group-hover:-translate-x-1'
            }`}
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs uppercase tracking-[0.2em] text-ink-mute">{label}</span>
          <span className="mt-1.5 block break-keep text-base font-semibold text-ink md:text-lg">
            <span className="font-display text-ink-mute">{num}</span> {name}
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

  // Reveal timeline — hook must run unconditionally (before the early return).
  useGSAP(
    () => {
      if (!phase) return
      const reduce = prefersReducedMotion()
      if (reduce) {
        gsap.set(
          [
            '.ph-back',
            '.ph-eyebrow',
            '.ph-title',
            '.ph-oneliner',
            '.ph-meta',
            '.ph-block',
          ],
          { autoAlpha: 1, y: 0, yPercent: 0 },
        )
        return
      }

      gsap.set('.ph-title', { yPercent: 115 })

      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top 82%', once: true } })
      tl.from('.ph-back', { autoAlpha: 0, y: 12, duration: 0.5, ease: EASE.out })
        .from('.ph-eyebrow', { autoAlpha: 0, y: 16, duration: 0.6, ease: EASE.out }, '-=0.2')
        .to('.ph-title', { yPercent: 0, duration: 0.9, ease: EASE.out }, '-=0.25')
        .from('.ph-oneliner', { autoAlpha: 0, y: 18, duration: 0.7, ease: EASE.out }, '-=0.4')
        .from('.ph-meta > *', { autoAlpha: 0, y: 14, duration: 0.55, stagger: 0.08, ease: EASE.out }, '-=0.35')

      // Each content block reveals on enter.
      gsap.utils.toArray<HTMLElement>('.ph-block').forEach((el) => {
        gsap.set(el, { autoAlpha: 0, y: 28 })
        ScrollTrigger.create({
          trigger: el,
          start: 'top 85%',
          once: true,
          onEnter: () =>
            gsap.to(el, { autoAlpha: 1, y: 0, duration: 0.7, ease: EASE.out, overwrite: true }),
        })
      })

      // Mounts after the preloader (no scroll delay): recompute positions, then
      // reveal anything already in the viewport so near-fold blocks — including
      // the clickable prev/next nav cards — never stay visibility:hidden.
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

  // Unknown slug → back to the map.
  if (!phase) return <Navigate to="/career" replace />

  const hex = ERA_HEX[phase.color]
  const hexLight = ERA_HEX_LIGHT[phase.color]
  const useGradientCyanClass = phase.color === 'cyan' || phase.color === 'sky'

  const prev = index > 0 ? phases[index - 1] : undefined
  const next = index < phases.length - 1 ? phases[index + 1] : undefined

  return (
    <>
      <JourneyBg color={phase.color} />
      <main id="main" className="relative z-10">
        <article ref={root} className="section-pad container-std">
          {/* 1 · Hero */}
          <Link
            to="/career"
            className="ph-back group inline-flex items-center gap-2 text-sm text-ink-mute transition-colors duration-300 hover:text-ink"
          >
            <ArrowRight className="-scale-x-100 h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
            {t(sectionLabels.backToMap)}
          </Link>

          <p className="ph-eyebrow eyebrow mt-8">
            PHASE {phase.num} · {t(phase.name)}
          </p>

          <h1 className="mt-6 max-w-4xl break-keep font-display text-[clamp(2.25rem,6vw,4.5rem)] font-bold leading-[1.04]">
            <span className="block overflow-hidden pb-[0.1em]">
              {useGradientCyanClass ? (
                <span className="ph-title text-gradient-cyan block">{t(phase.title)}</span>
              ) : (
                <span
                  className="ph-title block"
                  style={{
                    background: `linear-gradient(100deg, ${hex} 0%, ${hexLight} 100%)`,
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    color: 'transparent',
                  }}
                >
                  {t(phase.title)}
                </span>
              )}
            </span>
          </h1>

          <p className="ph-oneliner mt-6 max-w-2xl break-keep text-lg leading-relaxed text-ink-dim md:text-xl">
            {t(phase.oneLiner)}
          </p>

          <div className="ph-meta mt-8 flex flex-wrap gap-3">
            {[phase.period, t(phase.companies), t(phase.roleLine)].map((chip, i) => (
              <span
                key={i}
                className="glass break-keep rounded-full px-4 py-2 font-display text-xs text-ink-dim md:text-sm"
              >
                {chip}
              </span>
            ))}
          </div>

          {/* 2 · Intro */}
          <p className="ph-block mt-16 max-w-3xl break-keep text-lg leading-relaxed text-ink-dim md:mt-20 md:text-xl">
            {t(phase.intro)}
          </p>

          {/* 3 · Did */}
          <section className="ph-block mt-20 md:mt-28">
            <h2 className="eyebrow" style={{ color: hex }}>
              {t(sectionLabels.did)}
            </h2>
            <ul className="mt-8 grid gap-x-10 gap-y-4 md:grid-cols-2">
              {phase.did.map((d, i) => (
                <li key={i} className="flex items-start gap-3.5">
                  <span
                    aria-hidden
                    className="mt-2 block h-1.5 w-4 shrink-0 rounded-full"
                    style={{ background: hex, boxShadow: `0 0 10px ${hex}` }}
                  />
                  <span className="break-keep text-base leading-relaxed text-ink-dim md:text-lg">{t(d)}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 4 · Problems */}
          <section className="ph-block mt-20 md:mt-28">
            <h2 className="eyebrow" style={{ color: hex }}>
              {t(sectionLabels.problems)}
            </h2>
            <ol className="mt-10 space-y-10">
              {phase.problems.map((p, i) => (
                <li key={i} className="flex items-start gap-5 md:gap-8">
                  <span
                    aria-hidden
                    className="font-display text-3xl font-bold leading-none tabular-nums md:text-5xl"
                    style={{ color: hex, opacity: 0.55 }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p className="max-w-3xl break-keep text-lg font-medium leading-relaxed text-ink md:text-2xl">
                    {t(p)}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          {/* 5 · Outputs */}
          <section className="ph-block mt-20 md:mt-28">
            <h2 className="eyebrow" style={{ color: hex }}>
              {t(sectionLabels.outputs)}
            </h2>
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
              {phase.outputs.map((o, i) => (
                <div key={i} className="bezel" style={i === 0 ? { borderColor: `${hex}55` } : undefined}>
                  <div className="bezel-core p-5 md:p-6">
                    <div
                      className="font-display text-[clamp(1.75rem,4.5vw,2.75rem)] font-bold leading-none"
                      style={i === 0 ? { color: hex } : { color: '#F4F5F7' }}
                    >
                      {t(o.stat)}
                    </div>
                    <div className="mt-3 break-keep text-sm font-medium leading-snug text-ink">{t(o.label)}</div>
                    {o.sub && <div className="mt-1.5 break-keep text-xs leading-snug text-ink-mute">{t(o.sub)}</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 6 · Stories */}
          <section className="ph-block mt-20 md:mt-28">
            <h2 className="eyebrow" style={{ color: hex }}>
              {t(sectionLabels.stories)}
            </h2>
            <ol className="mt-10 space-y-5">
              {phase.stories.map((s, i) => (
                <li key={i} className="bezel">
                  <div
                    className="bezel-core border-l-2 p-6 md:p-8"
                    style={{ borderLeftColor: hex }}
                  >
                    <div className="flex items-baseline gap-4">
                      <span className="font-display text-sm tabular-nums text-ink-mute">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <h3 className="break-keep text-lg font-semibold text-ink md:text-xl">{t(s.title)}</h3>
                    </div>
                    <p className="mt-3 break-keep leading-relaxed text-ink-dim md:pl-9">{t(s.body)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* 6.5 · Work gallery (only when screenshots exist for this phase) */}
          {(phase.gallery?.length ?? 0) > 0 && (
            <section className="ph-block mt-20 md:mt-28">
              <h2 className="eyebrow" style={{ color: hex }}>
                {t(sectionLabels.gallery)}
              </h2>
              <div className="mt-8">
                <WorkGallery items={phase.gallery ?? []} label={t(sectionLabels.gallery)} />
              </div>
            </section>
          )}

          {/* 7 · Carried + prev/next nav */}
          <section className="ph-block mt-24 border-t border-white/5 pt-14 md:mt-32">
            <h2 className="eyebrow" style={{ color: hex }}>
              {t(sectionLabels.carried)}
            </h2>
            <p className="mt-6 max-w-3xl break-keep text-xl leading-relaxed text-ink md:text-2xl">
              {t(phase.carried)}
            </p>

            <div className="mt-14 flex flex-col gap-4 md:flex-row md:gap-5">
              {prev ? (
                <NavCard
                  to={`/career/${prev.slug}`}
                  label={t(sectionLabels.prev)}
                  num={prev.num}
                  name={t(prev.name)}
                  dir="prev"
                  hex={ERA_HEX[prev.color]}
                />
              ) : (
                <span className="hidden flex-1 md:block" aria-hidden />
              )}

              {next ? (
                <NavCard
                  to={`/career/${next.slug}`}
                  label={t(sectionLabels.next)}
                  num={next.num}
                  name={t(next.name)}
                  dir="next"
                  hex={ERA_HEX[next.color]}
                />
              ) : (
                <Link
                  to="/#contact"
                  className="phase-nav bezel glow-cyan group block flex-1 transition-transform duration-500 ease-lux hover:-translate-y-1 hover:border-era-cyan/40 active:scale-[0.98]"
                >
                  <div className="bezel-core flex flex-row-reverse items-center gap-4 p-5 text-right md:p-6">
                    <span className="text-era-cyan">
                      <ArrowRight className="transition-transform duration-300 ease-out4 group-hover:translate-x-1" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs uppercase tracking-[0.2em] text-ink-mute">
                        {t(sectionLabels.next)}
                      </span>
                      <span className="mt-1.5 block break-keep text-base font-semibold text-ink md:text-lg">
                        {t(contact.title)}
                      </span>
                    </span>
                  </div>
                </Link>
              )}
            </div>
          </section>
        </article>
      </main>
    </>
  )
}
