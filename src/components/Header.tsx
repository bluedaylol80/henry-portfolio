import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { contact } from '../content/profile'
import { useLang, useT, type Bi } from '../lib/i18n'
import { getLenis } from '../lib/scroll'
import { isReady, onReady } from '../lib/appState'
import { prefersReducedMotion } from '../lib/quality'

/**
 * v20 single Header (LOCKED §4.2) — the one navigator that replaces the four old
 * variants (Nav / LegendHeader / RoomMenu / room Legend). Primary rail is
 * Work · Career · Brief; the always-on Contact pill is the sole primary CTA
 * (amber, one-tap mailto — §C5); KO/EN toggle sits at the end. Music and Résumé
 * are demoted to the footer. No furniture-metaphor labels (③).
 */

type Primary = { label: Bi; to: string; anchor?: string }

const PRIMARY: Primary[] = [
  { label: { ko: '성과', en: 'Work' }, to: '/#work', anchor: 'work' },
  { label: { ko: '커리어', en: 'Career' }, to: '/career' },
  { label: { ko: '요약', en: 'Brief' }, to: '/brief' },
]

const CONTACT: Bi = { ko: '연락하기', en: 'Contact' }
const MENU: { open: Bi; close: Bi } = {
  open: { ko: '메뉴 열기', en: 'Open menu' },
  close: { ko: '메뉴 닫기', en: 'Close menu' },
}

function LangToggle() {
  const { lang, setLang } = useLang()
  const base = 'rounded-full px-2.5 py-1 text-[11px] font-mono font-medium tracking-wide transition-colors duration-200'
  return (
    <div className="flex items-center rounded-full border border-line p-0.5">
      <button
        type="button"
        aria-pressed={lang === 'ko'}
        onClick={() => setLang('ko')}
        className={`${base} ${lang === 'ko' ? 'bg-amber/15 text-amber' : 'text-ink-dim hover:text-ink'}`}
      >
        KO
      </button>
      <button
        type="button"
        aria-pressed={lang === 'en'}
        onClick={() => setLang('en')}
        className={`${base} ${lang === 'en' ? 'bg-amber/15 text-amber' : 'text-ink-dim hover:text-ink'}`}
      >
        EN
      </button>
    </div>
  )
}

export default function Header() {
  const t = useT()
  const reduce = prefersReducedMotion()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const onHome = pathname === '/'
  const [ready, setReady] = useState(isReady())
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => onReady(() => setReady(true)), [])

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

  // Anchor links (e.g. /#work): scroll in place when already on home, else route
  // to /#id and let Home's hash handler perform the scroll.
  const handleClick = (e: React.MouseEvent, item: Primary) => {
    setMenuOpen(false)
    if (!item.anchor) return // plain route — let <Link> handle it
    e.preventDefault()
    if (onHome) {
      const lenis = getLenis()
      const el = document.getElementById(item.anchor)
      if (lenis && el) lenis.scrollTo(el, { offset: 0, duration: 1.2 })
      else el?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate(item.to)
    }
  }

  const headerVariants: Variants = {
    hidden: { y: -80, opacity: 0 },
    show: { y: 0, opacity: 1 },
  }
  const overlayList: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.06, delayChildren: reduce ? 0 : 0.1 } },
  }
  const overlayItem: Variants = {
    hidden: { y: reduce ? 0 : 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: reduce ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] } },
  }

  return (
    <>
      <motion.header
        variants={headerVariants}
        initial={reduce ? 'show' : 'hidden'}
        animate={reduce ? 'show' : ready ? 'show' : 'hidden'}
        transition={{ duration: reduce ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
          scrolled ? 'border-b border-line/70 bg-night/80 backdrop-blur-md' : 'border-b border-transparent bg-transparent'
        }`}
      >
        <div className="container-std flex h-16 items-center justify-between md:h-[4.5rem]">
          {/* Wordmark */}
          <Link to="/" onClick={() => setMenuOpen(false)} className="group flex items-baseline gap-2" aria-label="Henry Lim">
            <span className="u-display text-2xl font-semibold leading-none text-amber">HL</span>
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.28em] text-ink-dim transition-colors group-hover:text-ink-soft sm:inline">
              Henry&nbsp;Lim · 임현택
            </span>
          </Link>

          {/* Desktop primary rail */}
          <nav className="hidden items-center gap-9 md:flex">
            {PRIMARY.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={(e) => handleClick(e, item)}
                className="font-mono text-[13px] uppercase tracking-[0.14em] text-ink-dim transition-colors duration-200 hover:text-ink"
              >
                {t(item.label)}
              </Link>
            ))}
          </nav>

          {/* Right cluster: Contact pill (primary CTA) + KO/EN */}
          <div className="flex items-center gap-3">
            <a
              href={`mailto:${contact.email}`}
              className="hidden items-center gap-2 rounded-full bg-amber px-4 py-1.5 font-mono text-[12px] font-semibold uppercase tracking-[0.12em] text-night transition-colors duration-200 hover:bg-amber-deep sm:inline-flex"
            >
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-night/70" />
              {t(CONTACT)}
            </a>
            <LangToggle />
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={t(menuOpen ? MENU.close : MENU.open)}
              aria-expanded={menuOpen}
              className="relative flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
            >
              <span className={`block h-px w-6 bg-ink transition-transform duration-300 ${menuOpen ? 'translate-y-[3.5px] rotate-45' : ''}`} />
              <span className={`block h-px w-6 bg-ink transition-transform duration-300 ${menuOpen ? '-translate-y-[3.5px] -rotate-45' : ''}`} />
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
            transition={{ duration: reduce ? 0 : 0.3 }}
            className="fixed inset-0 z-30 flex flex-col justify-center bg-night/96 backdrop-blur-xl md:hidden"
          >
            <motion.nav variants={overlayList} initial="hidden" animate="show" exit="hidden" className="container-std flex flex-col gap-4">
              {PRIMARY.map((item, i) => (
                <motion.div key={item.to} variants={overlayItem}>
                  <Link
                    to={item.to}
                    onClick={(e) => handleClick(e, item)}
                    className="u-display flex items-baseline gap-4 break-keep text-4xl font-semibold text-ink transition-colors duration-200 hover:text-amber"
                  >
                    <span className="font-mono text-sm font-normal text-ink-dim">0{i + 1}</span>
                    {t(item.label)}
                  </Link>
                </motion.div>
              ))}
              <motion.a
                variants={overlayItem}
                href={`mailto:${contact.email}`}
                onClick={() => setMenuOpen(false)}
                className="mt-8 flex items-center justify-center gap-2 rounded-full bg-amber px-6 py-4 font-mono text-base font-semibold uppercase tracking-[0.12em] text-night transition-colors duration-200 hover:bg-amber-deep"
              >
                {t(CONTACT)}
              </motion.a>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
