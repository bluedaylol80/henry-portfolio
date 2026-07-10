import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { contact } from '../content/profile'
import { hotspots, type RoomAction } from '../content/room'
import { useLang, useT } from '../lib/i18n'
import { getLenis } from '../lib/scroll'
import { isSoundOn, onSoundChange, toggleSound } from '../lib/sound'
import RoomMenu from './RoomMenu'

/**
 * LegendHeader — the fixed top bar on content pages (`/story`, `/career*`),
 * replacing the standard <Nav/> per SPEC §14.4.
 *
 * It mirrors the room's bottom Legend: wordmark `H.` (→ `/`) plus one chip per
 * `room.hotspots` entry, in order, using the same glass-chip family. Each chip
 * runs the same family of actions as the room:
 *  - section chips (desk→about, frame→work, server→ai, coffee→contact) scroll in
 *    place on `/story`, else navigate `/story#id`;
 *  - 책장 → `/career`; TV → external Notion; 스피커 → BGM toggle with a live mint
 *    on/off dot. (§22.1 v14: 컴퓨터 is now a plain About chip — no intro branch.)
 * On `/story` the three section-mapped chips get an active-section highlight via
 * an IntersectionObserver (cleaned up on unmount). The right cluster carries a
 * compact KO/EN toggle and the shared RoomMenu hamburger, so the full menu
 * (전체 스토리 / 여정 / 상세 이력 / 커피챗) stays reachable on content pages.
 * Chips are horizontally scrollable on mobile; wordmark + hamburger stay pinned.
 */

/** Room actions that map 1:1 to a /story section id (for scroll + scrollspy). */
const ACTION_SECTION: Partial<Record<RoomAction, string>> = {
  about: 'about',
  work: 'work',
  ai: 'ai',
  contact: 'contact',
}

/** Section ids the active-highlight observer watches (the section chips only). */
const OBSERVED_IDS = ['about', 'work', 'ai', 'contact']

function scrollTo(id: string) {
  const lenis = getLenis()
  if (lenis) lenis.scrollTo(`#${id}`, { offset: 0, duration: 1.4 })
  else document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

function LangToggle() {
  const { lang, setLang } = useLang()
  const base =
    'rounded-full px-2.5 py-1 text-xs font-display font-medium transition-colors duration-200'
  return (
    <div className="flex items-center rounded-full border border-white/10 p-0.5">
      <button
        type="button"
        aria-pressed={lang === 'ko'}
        onClick={() => setLang('ko')}
        className={`${base} ${lang === 'ko' ? 'bg-white/10 text-era-cyan' : 'text-ink-dim hover:text-ink'}`}
      >
        KO
      </button>
      <button
        type="button"
        aria-pressed={lang === 'en'}
        onClick={() => setLang('en')}
        className={`${base} ${lang === 'en' ? 'bg-white/10 text-era-cyan' : 'text-ink-dim hover:text-ink'}`}
      >
        EN
      </button>
    </div>
  )
}

export default function LegendHeader() {
  const t = useT()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const onStory = pathname === '/story'

  const [scrolled, setScrolled] = useState(false)
  const [activeId, setActiveId] = useState('')
  const [soundOn, setSoundOn] = useState(isSoundOn)

  // Glass-on-scroll toggle (mirrors the old Nav threshold).
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Mirror the shared BGM state for the speaker chip's live dot.
  useEffect(() => onSoundChange(setSoundOn), [])

  // Active-section highlight (only on /story, for the section-mapped chips).
  useEffect(() => {
    if (!onStory) {
      setActiveId('')
      return
    }
    const els = OBSERVED_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    )
    if (els.length === 0) return

    // Same "closest centre wins" strategy as the old Nav scrollspy: sections are
    // taller than the observer band, so intersectionRatio is unreliable — pick
    // the intersecting section whose centre is nearest the viewport centre.
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
  }, [onStory])

  // Dispatch a chip's action — same behaviour family as the room hotspots.
  const runAction = (action: RoomAction) => {
    const section = ACTION_SECTION[action]
    if (section) {
      if (onStory) scrollTo(section)
      else navigate(`/story#${section}`)
      return
    }
    switch (action) {
      case 'career':
        navigate('/career')
        break
      case 'notion':
        window.open(contact.notion, '_blank', 'noopener,noreferrer')
        break
      case 'sound':
        toggleSound()
        break
    }
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
        scrolled
          ? 'border-b border-white/5 bg-abyss/70 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="container-std flex h-16 items-center gap-3 md:h-20 md:gap-4">
        {/* Wordmark — always visible, links home to the room. */}
        <Link
          to="/"
          className="flex shrink-0 items-baseline gap-2"
          aria-label="Henry Lim"
        >
          <span className="text-era-amber font-display text-2xl font-bold leading-none">H.</span>
        </Link>

        {/* Chips row — horizontally scrollable on mobile, no page overflow. */}
        <div
          className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto md:gap-1.5"
          style={{ scrollbarWidth: 'none' }}
        >
          {hotspots.map((h) => {
            const section = ACTION_SECTION[h.action]
            const active = onStory && !!section && activeId === section
            const isSound = h.action === 'sound'
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => runAction(h.action)}
                title={t(h.hint)}
                aria-label={t(h.hint)}
                aria-current={active ? 'true' : undefined}
                aria-pressed={isSound ? soundOn : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200 hover:bg-white/10 hover:text-ink md:text-sm ${
                  active ? 'bg-white/10 text-era-cyan' : 'text-ink-dim'
                }`}
              >
                {t(h.label)}
                {isSound && soundOn && (
                  <span
                    aria-hidden
                    className="inline-block h-1.5 w-1.5 rounded-full bg-era-sky shadow-[0_0_8px_rgba(0,242,254,0.9)]"
                  />
                )}
                {active && (
                  <span
                    aria-hidden
                    className="inline-block h-1.5 w-1.5 rounded-full bg-era-cyan shadow-[0_0_8px_rgba(79,172,254,0.9)]"
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Right cluster — compact KO/EN + the shared hamburger navigator. */}
        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          <LangToggle />
          <RoomMenu />
        </div>
      </div>
    </header>
  )
}
