import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useLang, useT } from '../lib/i18n'
import { brief } from '../content/brief'
import { contact, home } from '../content/profile'

/**
 * /brief — the decision-maker artifact (LOCKED §5.3): the whole résumé compressed
 * to one readable, ~3-minute, print-friendly page. Typography-first, re-skinned to
 * the v20 CONTROL ROOM system (mono eyebrows, u-display headings with KO 900, amber
 * as the single accent, line/elev surfaces). All copy lives in content/brief.ts.
 */
export default function BriefPage() {
  const t = useT()
  const { lang } = useLang()
  const reduce = useReducedMotion()

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.07, delayChildren: reduce ? 0 : 0.05 } },
  }
  const item: Variants = {
    hidden: reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] } },
  }

  return (
    <main id="main" className="relative z-10">
      <motion.article
        variants={container}
        initial="hidden"
        animate="show"
        className="container-std max-w-3xl py-24 md:py-28"
      >
        <motion.p variants={item} className="font-mono text-[11px] uppercase tracking-[0.3em] text-amber">
          {t(brief.label)}
        </motion.p>
        <motion.h1 variants={item} className="u-display mt-5 break-keep text-[clamp(2.5rem,7vw,4.5rem)] font-semibold leading-[1.05] text-ink">
          {t(brief.title)}
        </motion.h1>
        <motion.p variants={item} className="mt-6 max-w-2xl break-keep text-lg leading-relaxed text-ink-soft">
          {t(brief.lede)}
        </motion.p>

        {/* Identity panel */}
        <motion.section variants={item} className="mt-12 overflow-hidden rounded-2xl border border-line bg-elev/40">
          <div className="relative p-7 md:p-9">
            <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-amber" />
            <div className="pl-4 md:pl-5">
              <p className="u-display text-xl font-semibold text-ink md:text-2xl">{brief.identity.name}</p>
              <p className="mt-2 break-keep text-base text-ink-soft md:text-lg">{t(brief.identity.line)}</p>
              <p className="mt-3 break-keep text-sm leading-relaxed text-ink-dim md:text-base">{t(brief.identity.arc)}</p>
            </div>
          </div>
        </motion.section>

        {/* Stat chips */}
        <motion.ul variants={item} className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {brief.stats.map((s, i) => (
            <li key={i} className="rounded-2xl border border-line bg-elev/30 p-4 md:p-5">
              <span className="u-fig block text-2xl font-semibold text-amber md:text-3xl">
                {lang === 'ko' ? s.value : s.valueEn}
              </span>
              <span className="mt-1 block break-keep font-mono text-[11px] uppercase tracking-[0.1em] text-ink-dim">
                {t(s.label)}
              </span>
            </li>
          ))}
        </motion.ul>

        {/* What the numbers say */}
        <motion.section variants={item} className="mt-14 md:mt-20">
          <h2 className="u-display break-keep text-[clamp(1.4rem,3.5vw,2.1rem)] font-semibold leading-tight text-ink">
            {t(brief.workTitle)}
          </h2>
          <ul className="mt-6 flex flex-col gap-4">
            {brief.work.map((b, i) => (
              <li key={i} className="flex gap-3 break-keep">
                <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
                <span className="text-base leading-relaxed text-ink-soft">{t(b)}</span>
              </li>
            ))}
          </ul>
        </motion.section>

        {/* What I do now */}
        <motion.section variants={item} className="mt-14 md:mt-20">
          <h2 className="u-display break-keep text-[clamp(1.4rem,3.5vw,2.1rem)] font-semibold leading-tight text-ink">
            {t(brief.aiTitle)}
          </h2>
          <ul className="mt-6 flex flex-col gap-4">
            {brief.ai.map((b, i) => (
              <li key={i} className="flex gap-3 break-keep">
                <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brass" />
                <span className="text-base leading-relaxed text-ink-soft">{t(b)}</span>
              </li>
            ))}
          </ul>
        </motion.section>

        {/* How I work, in one line */}
        <motion.section variants={item} className="mt-14 md:mt-20">
          <h2 className="u-display break-keep text-[clamp(1.4rem,3.5vw,2.1rem)] font-semibold leading-tight text-ink">
            {t(brief.howTitle)}
          </h2>
          <blockquote className="u-display mt-6 break-keep border-l-2 border-amber pl-5 text-xl font-medium italic leading-relaxed text-ink md:text-2xl">
            {t(brief.how)}
          </blockquote>
        </motion.section>

        {/* CTA row */}
        <motion.section variants={item} className="mt-16 border-t border-line pt-10 md:mt-24 print:hidden">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-amber">{t(brief.ctaTitle)}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href={`mailto:${contact.email}`}
              className="inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 font-mono text-sm font-semibold uppercase tracking-[0.1em] text-night transition-colors hover:bg-amber-deep"
            >
              {t(home.ctaPrimary)}
            </a>
            <a href={contact.calendly} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 font-mono text-sm uppercase tracking-[0.1em] text-ink-soft transition-colors hover:border-amber/50 hover:text-amber">
              {t(brief.ctas.coffee)}
            </a>
            <a href={contact.notion} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-line px-6 py-3 font-mono text-sm uppercase tracking-[0.1em] text-ink-soft transition-colors hover:border-amber/50 hover:text-amber">
              {t(brief.ctas.notion)}
              <span aria-hidden>↗</span>
            </a>
            <Link to="/" className="inline-flex items-center gap-1.5 rounded-full border border-line px-6 py-3 font-mono text-sm uppercase tracking-[0.1em] text-ink-soft transition-colors hover:border-amber/50 hover:text-amber">
              {t(brief.ctas.story)}
            </Link>
            <Link to="/career" className="inline-flex items-center gap-1.5 rounded-full border border-line px-6 py-3 font-mono text-sm uppercase tracking-[0.1em] text-ink-soft transition-colors hover:border-amber/50 hover:text-amber">
              {t(brief.ctas.career)}
            </Link>
          </div>
        </motion.section>
      </motion.article>
    </main>
  )
}
