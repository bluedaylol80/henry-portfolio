import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, useInView, useReducedMotion, useScroll, useSpring } from 'framer-motion'
import { home, work, skills, contact } from '../content/profile'
import { phases, hub } from '../content/journey'
import { useLang, useT } from '../lib/i18n'
import { getLenis } from '../lib/scroll'
import { onReady } from '../lib/appState'
import ArchDiagram from '../components/ArchDiagram'

/**
 * v20 front door (LOCKED §5.1) — a content-first authoring long-form. The old
 * `/story` seven-section scene is replaced: above-fold is the 6-second money
 * (semantic H1 + checkable proof strip + single Contact CTA + Now), the narrative
 * scrolls beneath, and THE signature (the live 3-tier diagram) sits in section 3.
 * The static room is demoted to an opt-in `/room` (App.tsx). All copy comes from
 * the content files; nothing is hard-coded here.
 */

type StatN = { value: number; prefix?: string; suffix?: string; decimals?: number }

function fmt(s: StatN): string {
  const v = s.decimals ? s.value.toFixed(s.decimals) : String(s.value)
  return `${s.prefix ?? ''}${v}${s.suffix ?? ''}`
}

/** amber count-up on checkable numbers — instant under reduced motion (⑤). */
function CountUp({ value, decimals = 0, prefix = '', suffix = '' }: StatN) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const [n, setN] = useState(reduce ? value : 0)
  useEffect(() => {
    if (reduce) return setN(value)
    if (!inView) return
    let raf = 0
    const dur = 1100
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur)
      setN(value * (1 - Math.pow(1 - p, 4)))
      if (p < 1) raf = requestAnimationFrame(tick)
      else setN(value)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, reduce])
  const shown = decimals > 0 ? n.toFixed(decimals) : String(Math.round(n))
  return (
    <span ref={ref} className="u-fig">
      {prefix}
      {shown}
      {suffix}
    </span>
  )
}

function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 1 } : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: reduce ? 0 : 0.6, ease: [0.22, 1, 0.36, 1], delay: reduce ? 0 : delay }}
    >
      {children}
    </motion.div>
  )
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.2 })
  return <motion.div style={{ scaleX }} className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-amber/70" aria-hidden />
}

/** Phase-spine ramp — warm→cool, held inside the era hard-zone (never amber). */
const PHASE_SPINE = ['#E67E22', '#C58C50', '#6FA79A', '#54C3BE', '#4FD1C5'] as const

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-amber">{children}</p>
}

export default function Home() {
  const t = useT()
  const { lang } = useLang()
  const { hash } = useLocation()

  // Hash arrival (/#work, /#contact) — scroll once the preloader settles.
  useEffect(() => {
    if (!hash) return
    const id = hash.replace(/^#/, '')
    if (!id) return
    const unsub = onReady(() => {
      let tries = 0
      const tick = () => {
        const el = document.getElementById(id)
        if (el) {
          const lenis = getLenis()
          if (lenis) {
            lenis.start()
            lenis.resize()
            lenis.scrollTo(el, { offset: 0, duration: 1.1 })
          } else el.scrollIntoView({ behavior: 'smooth' })
          return
        }
        if (tries++ < 40) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    return unsub
  }, [hash])

  return (
    <>
      <ScrollProgress />
      <main id="main" className="relative z-10">
        {/* ── 1 · HERO (above-fold 6-second money) ─────────────── */}
        <section className="relative flex min-h-[92vh] items-center overflow-hidden">
          <div className="container-std w-full py-24">
            <Reveal>
              <Eyebrow>{t(home.eyebrow)}</Eyebrow>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="u-display mt-5 max-w-4xl whitespace-pre-line break-keep text-4xl font-semibold leading-[1.12] text-ink sm:text-5xl md:text-6xl">
                {t(home.h1)}
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-6 max-w-2xl break-keep text-base leading-relaxed text-ink-soft md:text-lg">{t(home.sub)}</p>
            </Reveal>

            {/* proof strip — checkable numbers only */}
            <Reveal delay={0.15}>
              <div className="mt-9 flex flex-wrap gap-x-10 gap-y-5">
                {home.proof.map((p, i) => {
                  const s = p[lang]
                  return (
                    <div key={i} className="min-w-[7rem]">
                      <div className="text-3xl font-semibold leading-none text-amber md:text-4xl">
                        <CountUp value={s.value} decimals={s.decimals} prefix={s.prefix} suffix={s.suffix} />
                      </div>
                      <div className="mt-2 max-w-[11rem] break-keep font-mono text-[11px] uppercase tracking-[0.12em] text-ink-dim">
                        {t(p.label)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-5 max-w-2xl break-keep text-sm text-ink-dim">{t(home.proofReceipt)}</p>
            </Reveal>

            {/* CTA row + Now */}
            <Reveal delay={0.25}>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <a
                  href={`mailto:${contact.email}`}
                  className="inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 font-mono text-sm font-semibold uppercase tracking-[0.1em] text-night transition-colors duration-200 hover:bg-amber-deep"
                >
                  {t(home.ctaPrimary)}
                </a>
                <Link to="/brief" className="font-mono text-sm uppercase tracking-[0.1em] text-ink-soft transition-colors hover:text-amber">
                  {t(home.ctaBrief)}
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.3}>
              <p className="mt-8 flex items-center gap-2.5 break-keep text-sm text-ink-soft">
                <span aria-hidden className="h-1.5 w-1.5 animate-pulse-slow rounded-full bg-era-cyan" />
                {t(home.now)}
              </p>
            </Reveal>
          </div>
        </section>

        {/* ── 2 · MANIFESTO + bridge table ─────────────────────── */}
        <section className="relative border-t border-line bg-night/40">
          <div className="container-std py-20 md:py-28">
            <Reveal>
              <Eyebrow>{t(home.manifesto.eyebrow)}</Eyebrow>
              <h2 className="u-display mt-4 max-w-3xl break-keep text-3xl font-semibold leading-tight text-ink md:text-4xl">
                {t(home.manifesto.title)}
              </h2>
              <p className="mt-5 max-w-2xl break-keep text-base leading-relaxed text-ink-soft">{t(home.manifesto.body)}</p>
            </Reveal>

            <Reveal delay={0.1} className="mt-12">
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-ink-dim">{t(home.manifesto.bridgeTitle)}</p>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {home.manifesto.bridge.map((b, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-2xl border border-line bg-elev/40 px-4 py-3.5">
                    <span className="font-mono text-sm text-ink-soft">{t(b.from)}</span>
                    <span aria-hidden className="text-amber">→</span>
                    <span className="min-w-0 flex-1 break-keep text-sm text-ink">{t(b.to)}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        {/* ── 3 · AI-OS teaser → THE signature diagram ─────────── */}
        <section className="relative border-t border-line">
          <div className="container-std grid gap-10 py-20 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:py-28">
            <Reveal className="md:pt-6">
              <Eyebrow>{t(home.aiTeaser.eyebrow)}</Eyebrow>
              <h2 className="u-display mt-4 break-keep text-3xl font-semibold leading-tight text-ink md:text-4xl">
                {t(home.aiTeaser.title)}
              </h2>
              <p className="mt-5 max-w-md break-keep text-base leading-relaxed text-ink-soft">{t(home.aiTeaser.body)}</p>
              <Link
                to="/career/ai-system"
                className="mt-7 inline-flex items-center gap-2 rounded-full border border-amber/50 px-5 py-2.5 font-mono text-sm uppercase tracking-[0.1em] text-amber transition-colors hover:bg-amber/10"
              >
                {t(home.aiTeaser.cta)}
                <span aria-hidden>→</span>
              </Link>
            </Reveal>
            <div>
              <ArchDiagram variant="teaser" />
            </div>
          </div>
        </section>

        {/* ── 4 · WORK — 6 money cards ─────────────────────────── */}
        <section id="work" className="relative scroll-mt-24 border-t border-line bg-night/40">
          <div className="container-std py-20 md:py-28">
            <Reveal>
              <Eyebrow>{t(home.workIntro.eyebrow)}</Eyebrow>
              <h2 className="u-display mt-4 break-keep text-3xl font-semibold leading-tight text-ink md:text-4xl">
                {t(home.workIntro.title)}
              </h2>
              <p className="mt-4 max-w-2xl break-keep text-base text-ink-soft">{t(home.workIntro.sub)}</p>
            </Reveal>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {work.items.map((it, i) => (
                <Reveal key={i} delay={(i % 3) * 0.05}>
                  <article
                    className={`flex h-full flex-col rounded-2xl border bg-elev/40 p-5 transition-colors duration-300 hover:border-amber/40 ${
                      it.emphasis ? 'border-amber/25' : 'border-line'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-dim">{it.tag}</span>
                      {it.emphasis && <span className="h-1.5 w-1.5 rounded-full bg-amber" aria-hidden />}
                    </div>
                    <div className="mt-4 text-3xl font-semibold leading-none text-amber">{fmt(it.stat[lang])}</div>
                    <div className="mt-2 break-keep text-sm font-medium text-ink">{t(it.label)}</div>
                    <div className="mt-2 break-keep text-sm text-ink-soft">{t(it.title)}</div>
                    {it.sub && <div className="mt-2 break-keep text-[13px] text-ink-dim">{t(it.sub)}</div>}
                    {it.footnote && (
                      <div className="mt-auto pt-4 break-keep font-mono text-[10px] leading-relaxed text-ink-dim">{t(it.footnote)}</div>
                    )}
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5 · FOUNDATION — 19-year, five layers ────────────── */}
        <section className="relative border-t border-line">
          <div className="container-std py-20 md:py-28">
            <Reveal>
              <Eyebrow>{t(home.foundationIntro.eyebrow)}</Eyebrow>
              <h2 className="u-display mt-4 break-keep text-3xl font-semibold leading-tight text-ink md:text-4xl">
                {t(home.foundationIntro.title)}
              </h2>
            </Reveal>
            <ol className="mt-10 space-y-3">
              {phases.map((p, i) => (
                <Reveal key={p.slug} delay={i * 0.04}>
                  <li>
                    <Link
                      to={`/career/${p.slug}`}
                      className="group flex items-center gap-4 rounded-2xl border border-line bg-elev/30 px-5 py-4 transition-colors duration-300 hover:border-ink/25"
                    >
                      <span className="u-fig text-xs text-ink-dim">{p.num}</span>
                      <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: PHASE_SPINE[i] }} />
                      <span className="w-24 shrink-0 break-keep font-mono text-[11px] uppercase tracking-[0.12em] text-ink-dim">{p.period}</span>
                      <span className="min-w-0 flex-1">
                        <span className="u-display text-base font-semibold text-ink group-hover:text-amber sm:text-lg">{t(p.name)}</span>
                        <span className="ml-3 break-keep text-sm text-ink-soft">{t(p.tagline)}</span>
                      </span>
                      <span aria-hidden className="hidden shrink-0 text-ink-dim transition-transform group-hover:translate-x-1 sm:block">→</span>
                    </Link>
                  </li>
                </Reveal>
              ))}
            </ol>
            <Reveal delay={0.1} className="mt-8">
              <Link to="/career" className="inline-flex items-center gap-2 font-mono text-sm uppercase tracking-[0.1em] text-amber transition-colors hover:text-amber-deep">
                {t(home.foundationIntro.cta)}
                <span aria-hidden>→</span>
              </Link>
            </Reveal>
          </div>
        </section>

        {/* ── 6 · WORKSTYLE constants ──────────────────────────── */}
        <section className="relative border-t border-line bg-night/40">
          <div className="container-std py-20 md:py-28">
            <Reveal>
              <Eyebrow>{t(home.workstyleIntro.eyebrow)}</Eyebrow>
              <h2 className="u-display mt-4 break-keep text-3xl font-semibold leading-tight text-ink md:text-4xl">
                {t(home.workstyleIntro.title)}
              </h2>
            </Reveal>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {hub.workstyle.map((w, i) => (
                <Reveal key={i} delay={(i % 3) * 0.05}>
                  <div className="flex h-full flex-col rounded-2xl border border-line bg-elev/30 p-5">
                    <span className="u-fig text-xs text-ink-dim">0{i + 1}</span>
                    <h3 className="u-display mt-2 break-keep text-lg font-semibold text-ink">{t(w.title)}</h3>
                    <p className="mt-2 break-keep text-sm leading-relaxed text-ink-soft">{t(w.body)}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={0.1} className="mt-8 flex flex-wrap gap-2">
              {skills.hard.map((h, i) => (
                <span
                  key={i}
                  className={`rounded-full border px-3 py-1 font-mono text-[11px] tracking-wide ${
                    h.isNew ? 'border-amber/40 text-amber' : 'border-line text-ink-dim'
                  }`}
                >
                  {t(h.name)}
                </span>
              ))}
            </Reveal>
          </div>
        </section>

        {/* ── 7 · NOW / CONTACT ────────────────────────────────── */}
        <section id="contact" className="relative scroll-mt-24 border-t border-line">
          <div className="container-std py-20 md:py-28">
            <Reveal>
              <Eyebrow>{t(home.contactIntro.eyebrow)}</Eyebrow>
              <h2 className="u-display mt-4 break-keep text-4xl font-semibold leading-tight text-ink md:text-5xl">
                {t(home.contactIntro.title)}
              </h2>
              <p className="mt-5 max-w-xl break-keep text-base leading-relaxed text-ink-soft">{t(home.contactIntro.body)}</p>
            </Reveal>
            <Reveal delay={0.1} className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href={`mailto:${contact.email}`}
                className="inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 font-mono text-sm font-semibold uppercase tracking-[0.1em] text-night transition-colors hover:bg-amber-deep"
              >
                {t(home.ctaPrimary)}
              </a>
              <a
                href={contact.calendly}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 font-mono text-sm uppercase tracking-[0.1em] text-ink-soft transition-colors hover:border-amber/50 hover:text-amber"
              >
                {t(contact.calendlyLabel)}
              </a>
              <Link
                to="/brief"
                className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 font-mono text-sm uppercase tracking-[0.1em] text-ink-soft transition-colors hover:border-amber/50 hover:text-amber"
              >
                {t(contact.notionNavLabel)}
              </Link>
            </Reveal>
            <Reveal delay={0.15} className="mt-6 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[12px] text-ink-dim">
              <span>{contact.email}</span>
              <span>KakaoTalk · {contact.kakao}</span>
              <span>{t(contact.note)}</span>
            </Reveal>
          </div>
        </section>
      </main>
    </>
  )
}
