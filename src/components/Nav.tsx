import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { nav } from '../content/profile'
import { navLabel } from '../content/journey'
import { useLang, useT, type Bi } from '../lib/i18n'
import { getLenis } from '../lib/scroll'
import { isReady, onReady } from '../lib/appState'
import { prefersReducedMotion } from '../lib/quality'

// A11y-only labels for the icon-only menu toggle (not present in profile copy).
const MENU: { open: Bi; close: Bi } = {
  open: { ko: '메뉴 열기', en: 'Open menu' },
  close: { ko: '메뉴 닫기', en: 'Close menu' },
}

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

  // Entrance is triggered after the preloader completes.
  useEffect(() => onReady(() => setReadyState(true)), [])

  // Glass-on-scroll toggle.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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

  // Anchor links: scroll in place on Landing; otherwise route to /#id and let
  // Landing's hash handler perform the scroll.
  const handleNav = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
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
            {nav.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => handleNav(e, item.id)}
                className="text-sm text-ink-dim transition-colors duration-200 hover:text-ink"
              >
                {t(item.label)}
              </a>
            ))}
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
          <div className="flex items-center gap-3 md:gap-5">
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
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
