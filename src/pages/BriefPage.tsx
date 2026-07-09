import { motion, type Variants } from 'framer-motion'
import { Link } from 'react-router-dom'
import JourneyBg from '../components/JourneyBg'
import { useLang, useT } from '../lib/i18n'
import { prefersReducedMotion } from '../lib/quality'
import { brief } from '../content/brief'
import { contact } from '../content/profile'

/**
 * /brief — "3분 요약" (SPEC §15.4). A typography-first, ~3-minute recruiter brief:
 * the whole résumé compressed to one readable page. All copy lives in
 * content/brief.ts; this file only lays it out. Fully bilingual (useT/useLang),
 * one <h1>, reveal animations are light and reduced-motion guarded.
 */

/** Ultra-light diagonal arrow — the island CTA's nested trailing glyph. */
function ArrowUpRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-4 w-4"
    >
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  )
}

export default function BriefPage() {
  const t = useT()
  const { lang } = useLang()
  const reduce = prefersReducedMotion()

  // Light staggered fade-up; instant under reduced motion.
  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.08, delayChildren: reduce ? 0 : 0.05 } },
  }
  const item: Variants = {
    hidden: reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  }

  return (
    <>
      <JourneyBg />
      <main id="main" className="relative z-10">
        <motion.article
          variants={container}
          initial="hidden"
          animate="show"
          className="section-pad container-std max-w-3xl"
        >
          {/* Eyebrow → h1 → lede */}
          <motion.p variants={item} className="eyebrow">
            {t(brief.label)}
          </motion.p>
          <motion.h1
            variants={item}
            className="mt-5 break-keep font-display text-[clamp(2.5rem,7vw,5rem)] font-bold leading-[1.02]"
          >
            <span className="text-era-amber">{t(brief.title)}</span>
          </motion.h1>
          <motion.p
            variants={item}
            className="mt-6 max-w-2xl break-keep text-lg leading-relaxed text-ink-dim md:text-xl"
          >
            {t(brief.lede)}
          </motion.p>

          {/* Identity block — name + line + arc, double-bezel panel (§18.2) */}
          <motion.section variants={item} className="bezel mt-12 md:mt-16">
            <div className="bezel-core relative overflow-hidden p-7 md:p-9">
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 w-1"
                style={{ background: 'linear-gradient(180deg,#E67E22,#4FACFE,#00F2FE)' }}
              />
              <div className="pl-4 md:pl-5">
                <p className="font-display text-xl font-semibold text-ink md:text-2xl">
                  {brief.identity.name}
                </p>
                <p className="mt-2 break-keep text-base text-ink-dim md:text-lg">
                  {t(brief.identity.line)}
                </p>
                <p className="mt-3 break-keep text-sm leading-relaxed text-ink-dim md:text-[1rem]">
                  {t(brief.identity.arc)}
                </p>
              </div>
            </div>
          </motion.section>

          {/* Stat chips */}
          <motion.ul
            variants={item}
            className="mt-8 grid grid-cols-2 gap-3 md:mt-10 md:grid-cols-4 md:gap-4"
          >
            {brief.stats.map((s, i) => (
              <li key={i} className="bezel">
                <div className="bezel-core flex flex-col items-start gap-1 p-4 md:p-5">
                  <span className="font-display text-2xl font-bold tabular-nums text-era-cyan md:text-3xl">
                    {lang === 'ko' ? s.value : s.valueEn}
                  </span>
                  <span className="break-keep text-xs text-ink-dim md:text-sm">{t(s.label)}</span>
                </div>
              </li>
            ))}
          </motion.ul>

          {/* What the numbers say — 4 bullets, warm/gold markers */}
          <motion.section variants={item} className="mt-14 md:mt-20">
            <h2 className="break-keep font-display text-[clamp(1.4rem,3.5vw,2.25rem)] font-bold leading-[1.15]">
              {t(brief.workTitle)}
            </h2>
            <ul className="mt-6 flex flex-col gap-4">
              {brief.work.map((b, i) => (
                <li key={i} className="flex gap-3 break-keep">
                  <span
                    aria-hidden
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-era-amber shadow-[0_0_10px_rgba(245,176,65,0.8)]"
                  />
                  <span className="text-base leading-relaxed text-ink-dim md:text-lg">{t(b)}</span>
                </li>
              ))}
            </ul>
          </motion.section>

          {/* What I do now — 3 bullets, sky markers */}
          <motion.section variants={item} className="mt-14 md:mt-20">
            <h2 className="break-keep font-display text-[clamp(1.4rem,3.5vw,2.25rem)] font-bold leading-[1.15]">
              {t(brief.aiTitle)}
            </h2>
            <ul className="mt-6 flex flex-col gap-4">
              {brief.ai.map((b, i) => (
                <li key={i} className="flex gap-3 break-keep">
                  <span
                    aria-hidden
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-era-sky shadow-[0_0_10px_rgba(0,242,254,0.8)]"
                  />
                  <span className="text-base leading-relaxed text-ink-dim md:text-lg">{t(b)}</span>
                </li>
              ))}
            </ul>
          </motion.section>

          {/* How I work, in one line — quote style */}
          <motion.section variants={item} className="mt-14 md:mt-20">
            <h2 className="break-keep font-display text-[clamp(1.4rem,3.5vw,2.25rem)] font-bold leading-[1.15]">
              {t(brief.howTitle)}
            </h2>
            <blockquote className="mt-6 break-keep border-l-2 border-era-cyan pl-5 font-display text-xl font-medium italic leading-relaxed text-ink md:text-2xl">
              {t(brief.how)}
            </blockquote>
          </motion.section>

          {/* CTA row */}
          <motion.section
            variants={item}
            className="mt-16 border-t border-white/5 pt-10 md:mt-24"
          >
            <p className="eyebrow">{t(brief.ctaTitle)}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3 md:gap-4">
              {/* Coffee chat — primary island CTA (§18.2) */}
              <a
                href={contact.calendly}
                target="_blank"
                rel="noreferrer"
                data-cursor
                className="btn-island glass glow-cyan group py-1.5 pl-6 pr-1.5 text-sm font-semibold text-ink hover:border-era-cyan/40 md:text-[1rem]"
              >
                {t(brief.ctas.coffee)}
                <span aria-hidden className="btn-island-icon text-era-cyan">
                  <ArrowUpRight />
                </span>
              </a>
              {/* Email */}
              <a
                href={`mailto:${contact.email}`}
                data-cursor
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-medium text-ink transition-colors duration-200 hover:border-white/35 hover:text-ink md:text-[1rem]"
              >
                {t(brief.ctas.email)}
              </a>
              {/* Notion (external) */}
              <a
                href={contact.notion}
                target="_blank"
                rel="noreferrer"
                data-cursor
                className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-6 py-3 text-sm font-medium text-ink transition-colors duration-200 hover:border-white/35 hover:text-era-sky md:text-[1rem]"
              >
                {t(brief.ctas.notion)}
                <span aria-hidden>↗</span>
              </a>
              {/* Full story */}
              <Link
                to="/story"
                data-cursor
                className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-6 py-3 text-sm font-medium text-ink transition-colors duration-200 hover:border-white/35 hover:text-ink md:text-[1rem]"
              >
                {t(brief.ctas.story)}
              </Link>
              {/* Career deep-dive */}
              <Link
                to="/career"
                data-cursor
                className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-6 py-3 text-sm font-medium text-ink transition-colors duration-200 hover:border-white/35 hover:text-ink md:text-[1rem]"
              >
                {t(brief.ctas.career)}
              </Link>
            </div>
          </motion.section>
        </motion.article>
      </main>
    </>
  )
}
