import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { contact, nav } from '../content/profile'
import { navLabel } from '../content/journey'
import { useLang, useT, type Bi } from '../lib/i18n'
import { getLenis } from '../lib/scroll'
import { isReady, onReady } from '../lib/appState'
import { prefersReducedMotion } from '../lib/quality'
import { openIntro } from '../lib/introBus'
import SoundToggle from '../components/SoundToggle'

// A11y-only labels for the icon-only menu toggle (not present in profile copy).
const MENU: { open: Bi; close: Bi } = {
  open: { ko: '메뉴 열기', en: 'Open menu' },
  close: { ko: '메뉴 닫기', en: 'Close menu' },
}

/** Section ids observed by the scrollspy (SPEC §3). */
const SECTION_IDS = ['hero', 'about', 'career', 'work', 'ai', 'skills', 'contact'] as const

function scrollTo(id: string) {
  const lenis = getLenis()
  if (lenis) lenis.scrollTo(`#${id}`, { offset: 0, duration: 1.4 })
  else document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

function LangToggle() {
  const { lang, setLang } = useLang()
  const base = 'rounded-full px-2.5 py-1 text-xs font-display font-medium transition-colors duration-200'
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

export default function Nav() {
  const t = useT()
  const reduce = prefersReducedMotion()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const onLanding = pathname === '/'
  const [ready, setReadyState] = useState(isReady())
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeId, setActiveId] = useState<string>('')

  // Entrance is triggered after the preloader completes.
  useEffect(() => onReady(() => setReadyState(true)), [])

  // Glass-on-scroll toggle.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Scrollspy (Landing only): highlight the active section's nav link.
  useEffect(() => {
    if (!onLanding) {
      setActiveId('')
      return
    }
    const els = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    )
    if (els.length === 0) return

    // The rootMargin collapses the viewport to a thin band around its vertical
    // centre; a section is "active" while it crosses that band. Sections can be
    // much taller than the band, so their intersectionRatio (visible/total) stays
    // tiny — we must pick by which intersecting section's centre sits closest to
    // the viewport centre, NOT by ratio.
    const intersecting = new Set<string>()
    const pickActive = () => {
      if (intersecting.size === 0) return // keep last active between bands (no flicker)
      const mid = window.innerHeight / 2
      let best = ''
      let bestDist = Infinity
      for (const id of intersecting) {
        const el = document.getElementById(id)
        if (!el) continue
        const r = el.getBoundingClientRect()
        const dist = Math.abs((r.top + r.bottom) / 2 - mid)
        if (dist < bestDist) {
          bestDist = dist
          best = id
        }
      }
      if (best) setActiveId(best)
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) intersecting.add(entry.target.id)
          else intersecting.delete(entry.target.id)
        }
        pickActive()
      },
      { threshold: 0, rootMargin: '-45% 0px -45% 0px' },
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [onLanding])

  // Lock scroll + Escape-to-close while the mobile overlay is open.
  useEffect(() => {
    if (!menuOpen) return
    const lenis = getLenis()
    lenis?.stop()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      lenis?.start()
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  // The '소개' (id 'about') link opens the intro video instead of scrolling.
  // On non-Landing routes, navigate home first, then open after a tick so the
  // IntroVideo overlay (mounted at the shell) can react.
  const handleIntro = () => {
    setMenuOpen(false)
    if (onLanding) {
      openIntro()
    } else {
      navigate('/')
      window.setTimeout(() => openIntro(), 60)
    }
  }

  // Anchor links: scroll in place on Landing; otherwise route to /#id and let
  // Landing's hash handler perform the scroll. 'about' is special-cased above.
  const handleNav = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    if (id === 'about') {
      handleIntro()
      return
    }
    setMenuOpen(false)
    if (onLanding) scrollTo(id)
    else navigate(`/#${id}`)
  }

  const handleJourney = () => setMenuOpen(false)

  const navVariants: Variants = {
    hidden: { y: -80, opacity: 0 },
    show: { y: 0, opacity: 1 },
  }
  const overlayList: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduce ? 0 : 0.07, delayChildren: reduce ? 0 : 0.12 },
    },
  }
  const overlayItem: Variants = {
    hidden: { y: reduce ? 0 : 24, opacity: 0 },
    show: {
      y: 0,
      opacity: 1,
      transition: { duration: reduce ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] },
    },
  }

  return (
    <>
      <motion.header
        variants={navVariants}
        initial={reduce ? 'show' : 'hidden'}
        animate={reduce ? 'show' : ready ? 'show' : 'hidden'}
        transition={{ duration: reduce ? 0 : 0.8, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
          scrolled
            ? 'border-b border-white/5 bg-base/70 backdrop-blur-md'
            : 'border-b border-transparent bg-transparent'
        }`}
      >
        <div className="container-std flex h-16 items-center justify-between md:h-20">
          {/* Wordmark */}
          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            className="flex items-baseline gap-2"
            aria-label="Henry Lim"
          >
            <span className="text-gradient font-display text-2xl font-bold leading-none">H.</span>
            <span className="hidden text-sm font-medium tracking-wide text-ink-dim sm:inline">
              Henry Lim
            </span>
          </Link>

          {/* Desktop links */}
          <nav className="hidden items-center gap-8 md:flex">
            {nav.map((item) => {
              const active = onLanding && activeId === item.id
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => handleNav(e, item.id)}
                  aria-current={active ? 'true' : undefined}
                  className={`relative text-sm transition-colors duration-200 ${
                    active ? 'text-era-cyan' : 'text-ink-dim hover:text-ink'
                  }`}
                >
                  {t(item.label)}
                  {active && (
                    <span
                      aria-hidden
                      className="absolute -bottom-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-era-cyan shadow-[0_0_8px_rgba(34,211,238,0.9)]"
                    />
                  )}
                </a>
              )
            })}
            {/* Deep-dive route — visually distinct (era-cyan). */}
            <Link
              to="/career"
              onClick={handleJourney}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-era-cyan transition-opacity duration-200 hover:opacity-80"
            >
              <span
                aria-hidden
                className="inline-block h-1.5 w-1.5 rounded-full bg-era-cyan shadow-[0_0_8px_rgba(34,211,238,0.9)]"
              />
              {t(navLabel)}
            </Link>
          </nav>

          {/* Right cluster */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* CTA pill → coffee chat (Calendly). */}
            <a
              href={contact.calendly}
              target="_blank"
              rel="noreferrer"
              data-cursor
              className="glass glow-cyan hidden items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium text-ink transition-colors duration-200 hover:border-white/25 sm:inline-flex"
            >
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full bg-era-cyan shadow-[0_0_8px_rgba(34,211,238,0.9)]"
              />
              {t(contact.navCta)}
            </a>
            {/* BGM toggle — hidden on the tightest widths to avoid crowding. */}
            <div className="hidden sm:block">
              <SoundToggle />
            </div>
            <LangToggle />
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={t(menuOpen ? MENU.close : MENU.open)}
              aria-expanded={menuOpen}
              className="relative flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
            >
              <span
                className={`block h-px w-6 bg-ink transition-transform duration-300 ${
                  menuOpen ? 'translate-y-[3.5px] rotate-45' : ''
                }`}
              />
              <span
                className={`block h-px w-6 bg-ink transition-transform duration-300 ${
                  menuOpen ? '-translate-y-[3.5px] -rotate-45' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile fullscreen overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.35 }}
            className="fixed inset-0 z-30 flex flex-col justify-center bg-base/95 backdrop-blur-xl md:hidden"
          >
            <motion.nav
              variants={overlayList}
              initial="hidden"
              animate="show"
              exit="hidden"
              className="container-std flex flex-col gap-3"
            >
              {nav.map((item, i) => (
                <motion.a
                  key={item.id}
                  variants={overlayItem}
                  href={`#${item.id}`}
                  onClick={(e) => handleNav(e, item.id)}
                  className="flex items-baseline gap-4 break-keep font-display text-4xl font-semibold text-ink transition-colors duration-200 hover:text-era-cyan"
                >
                  <span className="text-sm font-normal text-ink-mute">
                    0{i + 1}
                  </span>
                  {t(item.label)}
                </motion.a>
              ))}
              {/* Deep-dive route — distinct era-cyan entry. */}
              <motion.div variants={overlayItem}>
                <Link
                  to="/career"
                  onClick={handleJourney}
                  className="mt-2 flex items-center gap-4 break-keep font-display text-4xl font-semibold text-era-cyan transition-opacity duration-200 hover:opacity-80"
                >
                  <span
                    aria-hidden
                    className="inline-block h-2 w-2 rounded-full bg-era-cyan shadow-[0_0_10px_rgba(34,211,238,0.9)]"
                  />
                  {t(navLabel)}
                </Link>
              </motion.div>
              {/* Full-width primary CTA → coffee chat (Calendly). */}
              <motion.a
                variants={overlayItem}
                href={contact.calendly}
                target="_blank"
                rel="noreferrer"
                onClick={() => setMenuOpen(false)}
                className="glass glow-cyan mt-8 flex items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-medium text-ink transition-colors duration-200 hover:border-white/25"
              >
                <span
                  aria-hidden
                  className="h-2 w-2 rounded-full bg-era-cyan shadow-[0_0_10px_rgba(34,211,238,0.9)]"
                />
                {t(contact.navCta)}
              </motion.a>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
