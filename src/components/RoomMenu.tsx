import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { contact, nav } from '../content/profile'
import { navLabel as journeyNavLabel } from '../content/journey'
import { menu } from '../content/room'
import { useLang, useT } from '../lib/i18n'
import { getLenis } from '../lib/scroll'
import { prefersReducedMotion } from '../lib/quality'
import SoundToggle from './SoundToggle'

/**
 * RoomMenu — the top-right hamburger navigator for the `/` room entry (SPEC §13.2).
 *
 * The standard <Nav/> does NOT render on `/`; this glass round button opens a
 * full-screen navy overlay (folio-2019 panel vibe, OUR palette) listing every
 * destination: the full story, the section anchors (→ /story#id), the career
 * journey (→ /career), the external résumé, and the coffee-chat CTA. A utility
 * row at the bottom carries KO/EN + the shared BGM toggle.
 *
 * Scroll is locked while open (Lenis stop + body overflow); ESC closes; any
 * navigation closes it; reveal is staggered (instant under reduced motion).
 */

/** Section anchors that scroll on /story — the '커리어' item is handled by the
 * dedicated Journey entry below so it appears once as a /career link. */
const SECTION_IDS = new Set(['about', 'work', 'ai', 'skills', 'contact'])

function LangRow() {
  const { lang, setLang } = useLang()
  const base =
    'rounded-full px-3 py-1.5 text-sm font-display font-medium transition-colors duration-200'
  return (
    <div className="flex items-center rounded-full border border-white/10 p-0.5">
      <button
        type="button"
        aria-pressed={lang === 'ko'}
        onClick={() => setLang('ko')}
        className={`${base} ${lang === 'ko' ? 'bg-white/10 text-era-cyan' : 'text-ink-mute hover:text-ink'}`}
      >
        KO
      </button>
      <button
        type="button"
        aria-pressed={lang === 'en'}
        onClick={() => setLang('en')}
        className={`${base} ${lang === 'en' ? 'bg-white/10 text-era-cyan' : 'text-ink-mute hover:text-ink'}`}
      >
        EN
      </button>
    </div>
  )
}

export default function RoomMenu() {
  const t = useT()
  const navigate = useNavigate()
  const reduce = prefersReducedMotion()
  const [open, setOpen] = useState(false)

  const close = () => setOpen(false)

  // Lock scroll + Escape-to-close while the panel is open.
  useEffect(() => {
    if (!open) return
    const lenis = getLenis()
    lenis?.stop()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      lenis?.start()
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Section anchors → /story#id (Landing's hash handler performs the scroll).
  const goSection = (id: string) => {
    close()
    navigate(`/story#${id}`)
  }

  // Staggered mask reveal (§18.2): items rise 12px (translate-y-3) into view,
  // 60ms apart, on the out4 curve. Reduced motion collapses to instant/visible.
  const listVariants: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduce ? 0 : 0.06, delayChildren: reduce ? 0 : 0.08 },
    },
  }
  const itemVariants: Variants = {
    hidden: { y: reduce ? 0 : 12, opacity: reduce ? 1 : 0 },
    show: {
      y: 0,
      opacity: 1,
      transition: { duration: reduce ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] },
    },
  }

  return (
    <>
      {/* Top-right hamburger — glass round button, animated 2-line → X. */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t(open ? menu.close : menu.open)}
        aria-expanded={open}
        data-cursor
        className="glass fixed right-4 top-4 z-40 flex h-12 w-12 flex-col items-center justify-center gap-1.5 rounded-full transition-colors duration-200 hover:border-white/25 md:right-8 md:top-8"
      >
        <span
          className={`block h-px w-5 bg-ink transition-transform duration-300 ease-lux ${
            open ? 'translate-y-[3.5px] rotate-45' : ''
          }`}
        />
        <span
          className={`block h-px w-5 bg-ink transition-transform duration-300 ease-lux ${
            open ? '-translate-y-[3.5px] -rotate-45' : ''
          }`}
        />
      </button>

      {/* Full-screen navy panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="room-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.3 }}
            role="dialog"
            aria-modal="true"
            aria-label={t(menu.title)}
            // Panel = the bezel "core" (§18.2): full-bleed navy glass with a hairline
            // inner ring + inset top highlight so the panel edge reads machined.
            className="fixed inset-0 z-[45] flex flex-col overflow-y-auto bg-base/95 shadow-[inset_0_1px_1px_rgba(255,255,255,0.10)] ring-1 ring-inset ring-white/[0.06] backdrop-blur-xl"
          >
            {/* Header — title + close X */}
            <div className="container-std flex items-center justify-between pt-6 md:pt-10">
              <span className="font-display text-sm uppercase tracking-[0.35em] text-ink-mute">
                {t(menu.title)}
              </span>
              <button
                type="button"
                onClick={close}
                aria-label={t(menu.close)}
                data-cursor
                className="relative flex h-11 w-11 items-center justify-center text-ink-dim transition-colors duration-200 hover:text-ink"
              >
                <span aria-hidden className="absolute block h-px w-6 rotate-45 bg-current" />
                <span aria-hidden className="absolute block h-px w-6 -rotate-45 bg-current" />
              </button>
            </div>

            {/* Primary list */}
            <motion.nav
              variants={listVariants}
              initial="hidden"
              animate="show"
              className="container-std flex flex-1 flex-col justify-center gap-5 py-10"
            >
              {/* 3분 요약 — the quick-review brief (first primary item) → /brief. */}
              <motion.div variants={itemVariants}>
                <Link
                  to="/brief"
                  onClick={close}
                  className="group block break-keep"
                >
                  <span className="font-display text-4xl font-bold text-ink transition-colors duration-200 group-hover:text-era-cyan md:text-5xl">
                    {t(menu.brief)}
                  </span>
                  <span className="mt-2 block max-w-md text-sm text-ink-dim md:text-base">
                    {t(menu.briefHint)}
                  </span>
                </Link>
              </motion.div>

              {/* The full story → /story */}
              <motion.div variants={itemVariants}>
                <Link
                  to="/story"
                  onClick={close}
                  className="group block break-keep"
                >
                  <span className="font-display text-4xl font-bold text-ink transition-colors duration-200 group-hover:text-era-cyan md:text-5xl">
                    {t(menu.storyLabel)}
                  </span>
                  <span className="mt-2 block max-w-md text-sm text-ink-dim md:text-base">
                    {t(menu.storyHint)}
                  </span>
                </Link>
              </motion.div>

              {/* Section anchors → /story#id, plus the career journey → /career. */}
              <div className="mt-2 flex flex-col gap-3">
                {nav.map((item) => {
                  // The '커리어' section item becomes the single Journey entry
                  // (→ /career) so it is not duplicated as an anchor link.
                  if (!SECTION_IDS.has(item.id)) return null
                  return (
                    <motion.a
                      key={item.id}
                      variants={itemVariants}
                      href={`/story#${item.id}`}
                      onClick={(e) => {
                        e.preventDefault()
                        goSection(item.id)
                      }}
                      className="break-keep font-display text-2xl font-semibold text-ink-dim transition-colors duration-200 hover:text-ink md:text-3xl"
                    >
                      {t(item.label)}
                    </motion.a>
                  )
                })}
                {/* 여정 — career deep-dive (journey.navLabel, used once) → /career. */}
                <motion.div variants={itemVariants}>
                  <Link
                    to="/career"
                    onClick={close}
                    className="inline-flex items-center gap-2 break-keep font-display text-2xl font-semibold text-era-cyan transition-opacity duration-200 hover:opacity-80 md:text-3xl"
                  >
                    <span
                      aria-hidden
                      className="inline-block h-2 w-2 rounded-full bg-era-cyan shadow-[0_0_10px_rgba(79,172,254,0.9)]"
                    />
                    {t(journeyNavLabel)}
                  </Link>
                </motion.div>
              </div>

              {/* External résumé (Notion). */}
              <motion.a
                variants={itemVariants}
                href={contact.notion}
                target="_blank"
                rel="noreferrer"
                onClick={close}
                className="mt-4 inline-flex items-center gap-2 break-keep text-lg text-ink-dim transition-colors duration-200 hover:text-era-sky md:text-xl"
              >
                {t(contact.notionNavLabel)}
                <span aria-hidden className="text-base">↗</span>
              </motion.a>

              {/* Coffee-chat CTA pill. */}
              <motion.a
                variants={itemVariants}
                href={contact.calendly}
                target="_blank"
                rel="noreferrer"
                onClick={close}
                data-cursor
                className="glass glow-cyan mt-6 inline-flex w-fit items-center gap-2 rounded-full px-6 py-3 text-base font-medium text-ink transition-colors duration-200 hover:border-white/25"
              >
                <span
                  aria-hidden
                  className="h-2 w-2 rounded-full bg-era-cyan shadow-[0_0_10px_rgba(79,172,254,0.9)]"
                />
                {t(contact.navCta)}
              </motion.a>
            </motion.nav>

            {/* Utility row — language + BGM. */}
            <div className="container-std flex items-center gap-4 border-t border-white/5 py-6">
              <LangRow />
              <SoundToggle />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
