import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import SectionShell from '../components/SectionShell'
import { useT } from '../lib/i18n'
import { prefersReducedMotion } from '../lib/quality'
import { DUR, EASE, STAGGER } from '../lib/motion'
import { skills } from '../content/profile'

function NewBadge() {
  return (
    <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border border-era-cyan/40 bg-era-cyan/10 px-2.5 py-1 font-display text-[10px] font-semibold uppercase tracking-[0.22em] text-era-cyan">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-era-cyan opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-era-cyan" />
      </span>
      NEW
    </span>
  )
}

export default function Skills() {
  const t = useT()
  const root = useRef<HTMLDivElement>(null)
  const hardRef = useRef<HTMLUListElement>(null)
  const softRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return

      gsap.from('[data-eyebrow]', {
        autoAlpha: 0,
        y: 20,
        duration: DUR.m,
        ease: EASE.out,
        scrollTrigger: { trigger: root.current, start: 'top 78%', once: true },
      })

      gsap.from('[data-title-line]', {
        yPercent: 115,
        duration: DUR.l,
        ease: EASE.out,
        scrollTrigger: { trigger: root.current, start: 'top 78%', once: true },
      })

      gsap.from('[data-hard-item]', {
        autoAlpha: 0,
        y: 26,
        duration: DUR.m,
        ease: EASE.out,
        stagger: STAGGER,
        scrollTrigger: { trigger: hardRef.current, start: 'top 82%', once: true },
      })

      gsap.from('[data-soft-item]', {
        autoAlpha: 0,
        y: 26,
        duration: DUR.m,
        ease: EASE.out,
        stagger: STAGGER,
        scrollTrigger: { trigger: softRef.current, start: 'top 82%', once: true },
      })
    },
    { scope: root },
  )

  return (
    <SectionShell id="skills" className="section-pad">
      {/* soft scrim: the AI-era network behind this section is dense — keep the rows readable */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_80%_at_50%_50%,rgba(10,25,49,0.78),rgba(10,25,49,0.25)_70%,transparent)]"
      />
      <div ref={root} className="container-std relative">
        <p data-eyebrow className="eyebrow">
          {t(skills.label)}
        </p>
        <h2 className="mt-5 max-w-3xl font-display text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.05]">
          <span className="block overflow-hidden pb-[0.12em]">
            <span data-title-line className="block break-keep">
              {t(skills.title)}
            </span>
          </span>
        </h2>

        <div className="mt-14 grid gap-12 md:mt-20 lg:grid-cols-2 lg:gap-16">
          {/* ── Hard skills ─────────────────────────────── */}
          <div>
            <h3
              data-hard-item
              className="mb-2 font-display text-sm uppercase tracking-[0.28em] text-ink-dim"
            >
              {t(skills.hardTitle)}
            </h3>
            <ul ref={hardRef} className="border-t border-white/5">
              {skills.hard.map((skill, i) => (
                <li
                  key={i}
                  data-hard-item
                  className="group relative flex items-center gap-4 border-b border-white/5 py-5 md:gap-6 md:py-6"
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg"
                  >
                    <span className="absolute inset-y-0 left-0 w-full -translate-x-full bg-gradient-to-r from-transparent via-era-cyan/[0.09] to-transparent transition-transform duration-[900ms] ease-out group-hover:translate-x-full" />
                  </span>
                  <span className="relative w-8 shrink-0 font-display text-sm tabular-nums text-ink-dim transition-colors duration-300 group-hover:text-era-cyan md:text-base">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="relative break-keep text-xl font-medium text-ink transition-transform duration-300 ease-out group-hover:translate-x-2 md:text-2xl">
                    {t(skill.name)}
                  </span>
                  {skill.isNew ? <NewBadge /> : null}
                </li>
              ))}
            </ul>
          </div>

          {/* ── Soft skills ─────────────────────────────── */}
          <div ref={softRef}>
            <h3
              data-soft-item
              className="mb-8 font-display text-sm uppercase tracking-[0.28em] text-ink-dim"
            >
              {t(skills.softTitle)}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {skills.soft.map((item, i) => (
                <p
                  key={i}
                  data-soft-item
                  className="glass break-keep p-5 text-base leading-relaxed text-ink-dim transition-colors duration-300 hover:border-white/20 hover:text-ink"
                >
                  {t(item)}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  )
}
