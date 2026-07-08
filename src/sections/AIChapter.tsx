import { useRef } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import SectionShell from '../components/SectionShell'
import { ai } from '../content/profile'
import { useT } from '../lib/i18n'
import { prefersReducedMotion } from '../lib/quality'
import { DUR, EASE, fadeUp, staggerContainer } from '../lib/motion'

type IconName = 'orchestration' | 'finance' | 'content' | 'vibecoding'

/** Connection lines in a 0–100 percentage space (matches chip anchor positions). */
const LINES = [
  { x1: 50, y1: 12, x2: 20, y2: 50 },
  { x1: 50, y1: 12, x2: 50, y2: 50 },
  { x1: 50, y1: 12, x2: 80, y2: 50 },
  { x1: 20, y1: 50, x2: 50, y2: 88 },
  { x1: 50, y1: 50, x2: 50, y2: 88 },
  { x1: 80, y1: 50, x2: 50, y2: 88 },
] as const

function CardIcon({ name }: { name: IconName }) {
  const p = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: 'h-9 w-9',
    'aria-hidden': true,
  }
  switch (name) {
    case 'orchestration':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="2.6" />
          <circle cx="5" cy="6" r="1.7" />
          <circle cx="19" cy="6" r="1.7" />
          <circle cx="12" cy="20.5" r="1.7" />
          <path d="M10.3 10.4 6.3 7.3M13.7 10.4 17.7 7.3M12 14.6v4" />
        </svg>
      )
    case 'finance':
      return (
        <svg {...p}>
          <path d="M4 4v16h16" />
          <path d="M7.5 15l3-3.6 3 2.4L20 6.5" />
          <circle cx="20" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'content':
      return (
        <svg {...p}>
          <path d="M6.5 3h6.5l5 5v10.5a1.5 1.5 0 0 1-1.5 1.5H6.5A1.5 1.5 0 0 1 5 18.5v-14A1.5 1.5 0 0 1 6.5 3Z" />
          <path d="M13 3v5h5" />
          <path d="M8.5 13h7M8.5 16.5h4.5" />
        </svg>
      )
    case 'vibecoding':
      return (
        <svg {...p}>
          <rect x="3" y="4.5" width="18" height="15" rx="2" />
          <path d="M7 10l2.6 2L7 14" />
          <path d="M12.5 14.5H16" />
          <path d="M18.6 3l.55 1.35L20.5 4.9l-1.35.55L18.6 6.8l-.55-1.35L16.7 4.9l1.35-.55z" />
        </svg>
      )
    default:
      return null
  }
}

function DiagramChip({
  posClass,
  label,
  index,
  primary,
}: {
  posClass: string
  label: string
  index?: string
  primary?: boolean
}) {
  return (
    <div className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 ${posClass}`}>
      <div
        className={`glass flex items-center gap-2 rounded-2xl border-era-cyan/40 px-3.5 py-2.5 shadow-[0_0_28px_-12px_rgba(79,172,254,0.7)] sm:px-4 ${
          primary ? 'glow-cyan' : ''
        }`}
      >
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-era-cyan" />
        {index && <span className="font-mono text-[11px] text-era-cyan/70">{index}</span>}
        <span className="whitespace-nowrap text-sm font-semibold text-ink sm:text-[15px]">{label}</span>
      </div>
    </div>
  )
}

export default function AIChapter() {
  const t = useT()
  const headRef = useRef<HTMLDivElement>(null)
  const diagramRef = useRef<HTMLDivElement>(null)
  const reduced = prefersReducedMotion()

  // Header mask reveal.
  useGSAP(
    () => {
      const root = headRef.current
      if (!root) return
      const eyebrow = root.querySelector<HTMLElement>('[data-eyebrow]')
      const line = root.querySelector<HTMLElement>('[data-line]')
      const sub = root.querySelector<HTMLElement>('[data-sub]')
      if (!eyebrow || !line) return

      if (prefersReducedMotion()) {
        gsap.set(line, { yPercent: 0 })
        return
      }

      gsap.set(eyebrow, { opacity: 0, y: 14 })
      gsap.set(line, { yPercent: 110 })
      if (sub) gsap.set(sub, { opacity: 0, y: 20 })

      const tl = gsap.timeline({
        scrollTrigger: { trigger: root, start: 'top 75%', once: true },
      })
      tl.to(eyebrow, { opacity: 1, y: 0, duration: DUR.s, ease: EASE.out })
        .to(line, { yPercent: 0, duration: DUR.m, ease: EASE.out }, '-=0.15')
      if (sub) tl.to(sub, { opacity: 1, y: 0, duration: DUR.m, ease: EASE.out }, '-=0.6')
    },
    { scope: headRef },
  )

  // Traveling pulse dots along the connection lines (looped, staggered).
  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const root = diagramRef.current
      if (!root) return
      const dots = root.querySelectorAll<HTMLElement>('[data-dot]')
      dots.forEach((dot, i) => {
        const l = LINES[i]
        const tl = gsap.timeline({ repeat: -1, delay: i * 0.28 })
        tl.set(dot, { left: `${l.x1}%`, top: `${l.y1}%`, xPercent: -50, yPercent: -50, opacity: 0 })
          .to(dot, { left: `${l.x2}%`, top: `${l.y2}%`, duration: 1.5, ease: 'none' }, 0)
          .to(dot, { opacity: 1, duration: 0.3, ease: 'power1.out' }, 0)
          .to(dot, { opacity: 0, duration: 0.35, ease: 'power1.in' }, 1.15)
          .to({}, { duration: 0.5 })
      })
    },
    { scope: diagramRef },
  )

  return (
    <SectionShell id="ai" className="section-pad overflow-hidden">
      <div className="container-std">
        <div ref={headRef}>
          <p data-eyebrow className="eyebrow">
            {t(ai.label)}
          </p>
          <h2 className="mt-5 font-display text-[clamp(2rem,5vw,3.75rem)] font-bold leading-[1.05] tracking-tight break-keep">
            <span className="block overflow-hidden pb-[0.12em]">
              <span data-line className="block">
                <span className="text-ink">{t(ai.titleA)}</span>
                <span className="text-gradient-cyan">{t(ai.titleB)}</span>
              </span>
            </span>
          </h2>
          <p
            data-sub
            className="mt-6 max-w-3xl text-xl leading-relaxed text-ink-dim break-keep md:text-2xl"
          >
            {t(ai.lede)}
          </p>
        </div>

        {/* Orchestration diagram — signature moment */}
        <motion.div
          className="relative mt-16 md:mt-24"
          initial={reduced ? undefined : { opacity: 0, y: 30 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* radial cyan glow behind the diagram */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 h-[110%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(79,172,254,0.18),transparent)] blur-2xl"
          />

          <div
            ref={diagramRef}
            className="relative mx-auto h-[400px] w-full max-w-[720px] sm:h-[460px] md:h-[520px]"
          >
            {/* connection lines */}
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {LINES.map((l, i) => (
                <line
                  key={i}
                  x1={l.x1}
                  y1={l.y1}
                  x2={l.x2}
                  y2={l.y2}
                  stroke="rgba(79,172,254,0.32)"
                  strokeWidth={1}
                  strokeDasharray="3 4"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>

            {/* traveling pulse dots */}
            {!reduced &&
              LINES.map((_, i) => (
                <span
                  key={i}
                  data-dot
                  className="pointer-events-none absolute h-2 w-2 rounded-full bg-era-cyan shadow-[0_0_10px_2px_rgba(79,172,254,0.85)]"
                />
              ))}

            {/* tier chips */}
            <DiagramChip posClass="left-1/2 top-[12%]" label={t(ai.diagram.orchestrator)} primary />
            <DiagramChip posClass="left-[20%] top-1/2" label={t(ai.diagram.executors)} index="01" />
            <DiagramChip posClass="left-1/2 top-1/2" label={t(ai.diagram.executors)} index="02" />
            <DiagramChip posClass="left-[80%] top-1/2" label={t(ai.diagram.executors)} index="03" />
            <DiagramChip posClass="left-1/2 top-[88%]" label={t(ai.diagram.verifier)} />

            {/* 24/7 CLOUD badge */}
            <div className="absolute right-3 top-3 z-20 flex items-center gap-2 rounded-full border border-era-cyan/40 bg-base/60 px-3 py-1.5 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-era-cyan opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-era-cyan" />
              </span>
              <span className="font-mono text-[11px] font-medium tracking-wider text-era-cyan">
                {t(ai.badge)}
              </span>
            </div>
          </div>

          <p className="mx-auto mt-6 max-w-xl text-center text-sm leading-relaxed text-ink-dim break-keep">
            {t(ai.diagram.caption)}
          </p>
        </motion.div>

        {/* field-proven strip — the proof moment, not a footnote */}
        <motion.div
          className="glass mt-14 rounded-3xl border-era-cyan/30 p-7 shadow-[0_0_60px_-20px_rgba(79,172,254,0.5)] md:mt-20 md:p-10"
          initial={reduced ? undefined : { opacity: 0, y: 30 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-era-cyan/50 bg-era-cyan/10 px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-era-cyan">
            <span className="h-1.5 w-1.5 rounded-full bg-era-cyan" />
            {t(ai.field.badge)}
          </span>
          <h3 className="mt-5 font-display text-xl font-semibold text-ink break-keep md:text-2xl">
            {t(ai.field.title)}
          </h3>
          <p className="mt-4 max-w-4xl text-base leading-relaxed text-ink-dim break-keep">
            {t(ai.field.body)}
          </p>
        </motion.div>

        {/* capability cards */}
        <motion.div
          className="mt-16 grid gap-5 md:mt-24 md:grid-cols-2"
          variants={reduced ? undefined : staggerContainer}
          initial={reduced ? undefined : 'hidden'}
          whileInView={reduced ? undefined : 'show'}
          viewport={{ once: true, amount: 0.15 }}
        >
          {ai.cards.map((card) => (
            <motion.article
              key={card.icon}
              className="glass-shine group glass rounded-2xl border-white/10 p-7 transition-[border-color,box-shadow] duration-300 hover:border-era-cyan/30 hover:shadow-[0_0_50px_-12px_rgba(79,172,254,0.4)]"
              variants={reduced ? undefined : fadeUp}
              whileHover={
                reduced ? undefined : { y: -6, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }
              }
            >
              <div className="ai-card-icon text-era-cyan">
                <CardIcon name={card.icon} />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-ink break-keep">{t(card.title)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-dim break-keep">{t(card.body)}</p>
              {card.note && (
                <p className="mt-4 text-sm font-medium text-era-cyan break-keep">{t(card.note)}</p>
              )}
            </motion.article>
          ))}
        </motion.div>
      </div>
    </SectionShell>
  )
}
