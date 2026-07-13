import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { workAiOs, contact, home } from '../content/profile'
import { useT } from '../lib/i18n'
import ArchDiagram from '../components/ArchDiagram'

/**
 * /work/ai-os — the flagship case (LOCKED §5.4). A 5-act narrative (WALL → BET →
 * BUILD → RESULT → LESSON) with THE signature (the full architecture diagram)
 * living right after "THE BUILD". 100% owner IP; the title is a checkable result.
 * All copy lives in content/profile.ts (workAiOs).
 */

function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 1 } : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: reduce ? 0 : 0.6, ease: [0.22, 1, 0.36, 1], delay: reduce ? 0 : delay }}
    >
      {children}
    </motion.div>
  )
}

const SCALE = [
  { v: '20', k: { ko: '에이전트', en: 'agents' } },
  { v: '65', k: { ko: '스킬', en: 'skills' } },
  { v: '31', k: { ko: '규칙', en: 'rules' } },
]

export default function WorkAiOs() {
  const t = useT()

  const Act = ({ n, act }: { n: number; act: (typeof workAiOs.acts)[number] }) => (
    <Reveal className="relative flex gap-5 md:gap-8">
      <div className="flex flex-col items-center">
        <span className="u-fig text-lg font-semibold text-amber md:text-xl">{String(n).padStart(2, '0')}</span>
        <span aria-hidden className="mt-2 w-px flex-1 bg-gradient-to-b from-line to-transparent" />
      </div>
      <div className="min-w-0 flex-1 pb-14 md:pb-20">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-brass">{t(act.label)}</p>
        <h2 className="u-display mt-2 break-keep text-2xl font-semibold leading-tight text-ink md:text-3xl">{t(act.title)}</h2>
        <p className="mt-4 max-w-2xl break-keep text-base leading-relaxed text-ink-soft md:text-lg">{t(act.body)}</p>
      </div>
    </Reveal>
  )

  return (
    <main id="main" className="relative z-10">
      {/* Hero */}
      <section className="container-std pt-24 md:pt-28">
        <Reveal>
          <Link to="/#work" className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-dim transition-colors hover:text-ink">
            <span aria-hidden>←</span> {t({ ko: '성과로', en: 'Back to work' })}
          </Link>
          <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.3em] text-amber">{t(workAiOs.eyebrow)}</p>
          <h1 className="u-display mt-5 max-w-4xl whitespace-pre-line break-keep text-4xl font-semibold leading-[1.08] text-ink sm:text-5xl md:text-6xl">
            {t(workAiOs.title)}
          </h1>
          <p className="mt-6 max-w-2xl break-keep text-lg leading-relaxed text-ink-soft">{t(workAiOs.lede)}</p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            {SCALE.map((s) => (
              <span key={s.v} className="flex items-baseline gap-1.5">
                <span className="u-fig text-2xl font-semibold text-ink">{s.v}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-cobalt">{t(s.k)}</span>
              </span>
            ))}
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-dim">· 100% 본인 IP</span>
          </div>
        </Reveal>
      </section>

      {/* Acts 1–3 → diagram → acts 4–5 */}
      <section className="container-std mt-16 md:mt-20">
        {workAiOs.acts.slice(0, 3).map((act, i) => (
          <Act key={act.key} n={i + 1} act={act} />
        ))}

        <Reveal className="mb-14 md:mb-20">
          <ArchDiagram variant="full" />
          <p className="mt-3 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-ink-dim">{t(workAiOs.diagramCaption)}</p>
        </Reveal>

        {workAiOs.acts.slice(3).map((act, i) => (
          <Act key={act.key} n={i + 4} act={act} />
        ))}
      </section>

      {/* FIELD-PROVEN */}
      <section className="container-std">
        <Reveal className="rounded-[20px] border border-brass/25 bg-brass/[0.05] p-6 md:p-9">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-brass">{t(workAiOs.field.badge)}</p>
          <p className="mt-3 max-w-2xl break-keep text-base leading-relaxed text-ink-soft md:text-lg">{t(workAiOs.field.lede)}</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {workAiOs.field.items.map((it, i) => (
              <li key={i} className="flex items-start gap-3">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
                <span className="break-keep text-sm text-ink md:text-[15px]">{t(it)}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* Gallery — no-photo-yet premium treatment */}
        <Reveal className="mt-4">
          <div className="img-treatment flex min-h-[180px] items-center justify-center bg-elev/30 p-8">
            <div className="text-center">
              <span aria-hidden className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-brass/40 font-mono text-sm text-brass">◱</span>
              <p className="mt-3 break-keep font-mono text-[11px] uppercase tracking-[0.18em] text-ink-dim">{t(workAiOs.galleryNote)}</p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Close */}
      <section className="container-std py-20 md:py-28">
        <Reveal className="flex flex-wrap items-center gap-4 border-t border-line pt-10">
          <Link to="/career" className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3.5 font-mono text-sm uppercase tracking-[0.1em] text-ink-dim transition-colors hover:border-ink/30 hover:text-ink">
            <span aria-hidden>←</span> {t(workAiOs.backCta)}
          </Link>
          <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3.5 font-mono text-sm font-semibold uppercase tracking-[0.1em] text-night transition-colors hover:bg-amber-deep">
            {t(home.ctaPrimary)}
          </a>
        </Reveal>
      </section>
    </main>
  )
}
