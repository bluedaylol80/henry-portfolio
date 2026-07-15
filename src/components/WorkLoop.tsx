import { m, useReducedMotion, type Variants } from 'framer-motion'
import { hub } from '../content/journey'
import { useT } from '../lib/i18n'

/**
 * E2 — the delegate·verify loop (LOCKED §6 E2). The five workstyle constants
 * rendered as one closed process rail: record → one-pager → delegate → verify →
 * honest limits, looping back to the record. Code-drawn DOM in the ArchDiagram
 * idiom (mono labels, line strokes, amber flow accent); static under reduced
 * motion. Kept quiet on purpose — the page signature stays the arch diagram.
 */
export default function WorkLoop() {
  const t = useT()
  const reduce = useReducedMotion()

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.09 } },
  }
  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 14 },
    show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] } },
  }

  return (
    <m.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      className="rounded-2xl border border-line bg-elev/30 p-5 md:p-6"
      aria-label={t(hub.loop.eyebrow)}
    >
      <m.p variants={item} className="font-mono text-[11px] uppercase tracking-[0.24em] text-ink-dim">
        {t(hub.loop.eyebrow)}
      </m.p>

      <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-3">
        {hub.loop.steps.map((s, i) => (
          <m.div key={i} variants={item} className="flex items-center gap-2">
            <span className="flex items-center gap-2 rounded-full border border-line bg-night/40 px-3.5 py-1.5">
              <span className="u-fig text-[11px] text-ink-dim">0{i + 1}</span>
              <span className="break-keep font-mono text-[12px] uppercase tracking-[0.14em] text-ink-soft">{t(s)}</span>
            </span>
            {i < hub.loop.steps.length - 1 && (
              <span aria-hidden className="text-amber/80">
                →
              </span>
            )}
          </m.div>
        ))}
      </div>

      {/* loop-back: verification feeds the record */}
      <m.div variants={item} className="mt-4 flex items-center gap-3">
        <span aria-hidden className="h-px min-w-8 flex-1 border-t border-dashed border-amber/35" />
        <span className="flex items-center gap-2 break-keep font-mono text-[11px] text-ink-dim">
          <span aria-hidden className="text-amber">
            ↺
          </span>
          {t(hub.loop.caption)}
        </span>
      </m.div>
    </m.div>
  )
}
