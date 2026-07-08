import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import SectionShell from '../components/SectionShell'
import { useT, useLang } from '../lib/i18n'
import { about, hero } from '../content/profile'
import { prefersReducedMotion } from '../lib/quality'
import { EASE } from '../lib/motion'

/** ops → qa → biz → plan accents for the career-arc widget. */
const PHASE_COLORS = ['#F5B041', '#F39C12', '#E67E22', '#4FACFE']

/** Count-up mini stat: gsap object tween, triggers once, writes text imperatively. */
function CountUpStat({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const decimals = value % 1 !== 0 ? 1 : 0

  useGSAP(
    () => {
      const el = ref.current
      if (!el) return
      const fmt = (n: number) =>
        n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix

      if (prefersReducedMotion()) {
        el.textContent = fmt(value)
        return
      }
      el.textContent = fmt(0)
      const obj = { n: 0 }
      gsap.to(obj, {
        n: value,
        duration: 1.6,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        onUpdate: () => {
          el.textContent = fmt(obj.n)
        },
        onComplete: () => {
          el.textContent = fmt(value)
        },
      })
    },
    { scope: ref },
  )

  return <span ref={ref} className="tabular-nums" />
}

export default function About() {
  const t = useT()
  const { lang } = useLang()
  const rootRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLParagraphElement>(null)

  const bodyWords = t(about.body).split(' ')

  // Header + arc-widget reveals (copy updates in place across languages → no lang dep).
  useGSAP(
    () => {
      const reduce = prefersReducedMotion()
      if (reduce) {
        gsap.set(
          ['.about-eyebrow', '.about-title', '.about-character', '.about-arc-item', '.about-stat', '.about-attitude'],
          {
            autoAlpha: 1,
            y: 0,
            yPercent: 0,
          },
        )
        gsap.set('.about-arc-line', { scaleY: 1 })
        gsap.set('.about-ai-pulse', { autoAlpha: 0 })
        return
      }

      gsap.set('.about-title', { yPercent: 115 })

      const tl = gsap.timeline({ scrollTrigger: { trigger: rootRef.current, start: 'top 72%', once: true } })
      tl.from('.about-eyebrow', { autoAlpha: 0, y: 16, duration: 0.7, ease: EASE.out })
        .to('.about-title', { yPercent: 0, duration: 0.9, ease: EASE.out }, '-=0.35')
        .from('.about-character', { autoAlpha: 0, y: 24, duration: 0.7, ease: EASE.out }, '-=0.4')
        .from('.about-arc-item', { autoAlpha: 0, y: 20, duration: 0.6, stagger: 0.1, ease: EASE.out }, '-=0.3')
        .from('.about-stat', { autoAlpha: 0, y: 16, duration: 0.55, stagger: 0.1, ease: EASE.out }, '-=0.2')
        .from('.about-attitude', { autoAlpha: 0, y: 12, duration: 0.55, ease: EASE.out }, '-=0.2')

      // Connector line draws as the section scrolls past.
      gsap.fromTo(
        '.about-arc-line',
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: { trigger: rootRef.current, start: 'top 65%', end: 'bottom 85%', scrub: true },
        },
      )

      // Pulsing "+ AI" chip halo.
      gsap.set('.about-ai-pulse', { autoAlpha: 0.5, scale: 1 })
      gsap.to('.about-ai-pulse', { scale: 2, autoAlpha: 0, duration: 1.8, ease: 'power2.out', repeat: -1 })
    },
    { scope: rootRef },
  )

  // Body "reading highlight" — scrubbed word-stagger; rebuilt on language change (word count differs).
  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        gsap.set('.about-body-word', { opacity: 1 })
        return
      }
      gsap.fromTo(
        '.about-body-word',
        { opacity: 0.16 },
        {
          opacity: 1,
          ease: 'none',
          stagger: 0.4,
          duration: 0.3,
          scrollTrigger: { trigger: bodyRef.current, start: 'top 78%', end: 'bottom 55%', scrub: true },
        },
      )
    },
    { scope: bodyRef, dependencies: [lang] },
  )

  return (
    <SectionShell id="about" className="section-pad">
      <div ref={rootRef} className="container-std">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          {/* Left: identity */}
          <div className="lg:col-span-7">
            <p className="about-eyebrow eyebrow">{t(about.label)}</p>
            <h2 className="mt-6 max-w-xl break-keep font-display text-[clamp(2rem,5vw,3.75rem)] font-bold leading-[1.08]">
              <span className="block overflow-hidden pb-[0.08em]">
                <span className="about-title block">{t(about.title)}</span>
              </span>
            </h2>
            <p
              ref={bodyRef}
              className="mt-8 max-w-xl break-keep text-lg leading-relaxed text-ink-dim md:mt-10 md:text-xl"
            >
              {bodyWords.map((w, i) => (
                <span key={i} className="about-body-word">
                  {w + ' '}
                </span>
              ))}
            </p>
          </div>

          {/* Right: webtoon character card + career-arc widget + stats */}
          <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-32">
              {/* Webtoon character — Approachable axis (§12.3). Joins the column reveal. */}
              <figure className="about-character glass glow-cyan mb-6 overflow-hidden rounded-3xl border border-era-sky/30 p-0">
                <img
                  src={import.meta.env.BASE_URL + 'character.jpg'}
                  alt={t(hero.name)}
                  width={1600}
                  height={900}
                  loading="lazy"
                  className="block h-auto w-full"
                />
                <figcaption className="border-t border-white/10 px-5 py-3 text-center font-display text-sm font-medium tracking-wide text-ink-dim">
                  {t(hero.name)}
                </figcaption>
              </figure>
              <div className="glass rounded-2xl p-6 md:p-7">
                <ol className="relative">
                  <span
                    aria-hidden
                    className="about-arc-line absolute bottom-12 left-[7px] top-2 w-px origin-top -translate-x-1/2 bg-gradient-to-b from-era-amber via-era-violet to-era-cyan"
                  />
                  {about.arc.map((step, i) => (
                    <li key={i} className="about-arc-item relative flex items-start gap-4 pb-7">
                      <span
                        className="relative z-10 mt-1 block h-3.5 w-3.5 shrink-0 rounded-full ring-4 ring-elev"
                        style={{ background: PHASE_COLORS[i], boxShadow: `0 0 12px ${PHASE_COLORS[i]}` }}
                      />
                      <div>
                        <span className="block font-display text-[0.7rem] tracking-widest text-ink-mute">
                          0{i + 1}
                        </span>
                        <span className="block text-lg font-medium text-ink">{t(step)}</span>
                      </div>
                    </li>
                  ))}
                  <li className="about-arc-item relative flex items-center gap-4">
                    <span className="relative z-10 flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                      <span className="about-ai-pulse absolute inset-0 rounded-full bg-era-cyan" />
                      <span
                        className="relative h-3.5 w-3.5 rounded-full bg-era-cyan ring-4 ring-elev"
                        style={{ boxShadow: '0 0 14px #4FACFE' }}
                      />
                    </span>
                    <span className="rounded-full border border-era-cyan/40 bg-era-cyan/10 px-3 py-1 text-sm font-medium text-era-cyan">
                      {t(about.arcNext)}
                    </span>
                  </li>
                </ol>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/5 pt-7">
                {about.stats.map((s, i) => (
                  <div key={i} className="about-stat">
                    <div className="font-display text-3xl font-bold text-ink md:text-4xl">
                      <CountUpStat value={s.value} suffix={s.suffix} />
                    </div>
                    <div className="mt-1.5 text-xs leading-snug text-ink-dim">{t(s.label)}</div>
                  </div>
                ))}
              </div>

              <p className="about-attitude mt-7 text-sm italic text-era-cyan">{t(about.attitude)}</p>
            </div>
          </aside>
        </div>
      </div>
    </SectionShell>
  )
}
