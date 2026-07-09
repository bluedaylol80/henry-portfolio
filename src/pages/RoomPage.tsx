import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { detectTier, prefersReducedMotion } from '../lib/quality'
import { openIntro } from '../lib/introBus'
import { toggleSound } from '../lib/sound'
import { useT } from '../lib/i18n'
import { contact } from '../content/profile'
import { coach, identity, introBadge, type RoomAction } from '../content/room'
import RoomExperience from '../room/RoomExperience'
import FallbackGrid from '../room/FallbackGrid'
import Legend from '../room/Legend'
import Tooltip from '../room/Tooltip'
import LabelTour from '../room/LabelTour'
import RoomMenu from '../components/RoomMenu'
import RoomStart from '../components/RoomStart'
import { roomState } from '../room/roomState'

/**
 * `/` — full-viewport immersive 3D navigator and the site entry (SPEC §13.1).
 * The room's objects ARE the menu; the top-right RoomMenu holds every other
 * destination (there is no standard Nav or Footer here). On the fallback tier
 * (or reduced-motion) a plain menu grid renders instead of the canvas. The room
 * has no back-link (root is home). document.title is owned by RouteEffects.
 */
export default function RoomPage() {
  const t = useT()
  const navigate = useNavigate()
  const tier = useMemo(() => detectTier(), [])
  const reduced = useMemo(() => prefersReducedMotion(), [])
  const use3D = tier !== 'fallback' && !reduced

  // ── Start gate (§19.1) ───────────────────────────────────────────────
  // Unseen this session → show the "CLICK TO MENU" overlay; the bottom stack
  // (identity / badge / coach / Legend) waits until entry so the start screen
  // stays minimal, and its timers count from entry rather than mount. Seen (or
  // a same-session reload) → enter immediately with no overlay. On the fallback
  // tier there is no overlay (the grid is already a menu), so `entered` is moot.
  const seenGate = useCallback(() => {
    try {
      return sessionStorage.getItem('henry.roomEntered') === '1'
    } catch {
      return false
    }
  }, [])
  const [entered, setEntered] = useState(() => !use3D || seenGate())
  // When the gate was already seen we set the shared bus flag at mount (no event
  // fires); an unseen gate flips it via enterRoom() inside RoomStart on click.
  useEffect(() => {
    if (entered) roomState.entered = true
  }, [entered])
  const onEnter = useCallback(() => setEntered(true), [])

  const [coachVisible, setCoachVisible] = useState(true)

  // Coach line fades out 5s AFTER entry (CSS opacity transition; reduced-safe).
  useEffect(() => {
    if (!use3D || !entered) return
    const id = window.setTimeout(() => setCoachVisible(false), 5000)
    return () => window.clearTimeout(id)
  }, [use3D, entered])

  // ── Intro badge (§15.2) ──────────────────────────────────────────────
  // Show a pulsing "▶ 소개 영상 보기" badge ~2.5s after mount, but ONLY while the
  // intro has never been seen. Closing the intro always sets henry.introSeen='1'
  // (IntroVideo.close → markSeen), so we (a) reveal after the delay, (b) hide as
  // soon as the flag flips — re-checked on window focus / tab visibility as a
  // safety net — and (c) let the × dismiss it for the session WITHOUT setting the
  // flag. On the fallback tier the 소개 card already covers this, so it's 3D-only.
  const readIntroSeen = useCallback(() => {
    try {
      return localStorage.getItem('henry.introSeen') === '1'
    } catch {
      return false
    }
  }, [])
  const [badgeSeen, setBadgeSeen] = useState(readIntroSeen)
  const [badgeDismissed, setBadgeDismissed] = useState(false)
  const [badgeReady, setBadgeReady] = useState(false)

  useEffect(() => {
    if (!use3D || !entered) return
    const id = window.setTimeout(() => setBadgeReady(true), 2500)
    return () => window.clearTimeout(id)
  }, [use3D, entered])

  useEffect(() => {
    if (!use3D || badgeSeen) return
    const recheck = () => {
      if (readIntroSeen()) setBadgeSeen(true)
    }
    window.addEventListener('focus', recheck)
    document.addEventListener('visibilitychange', recheck)
    return () => {
      window.removeEventListener('focus', recheck)
      document.removeEventListener('visibilitychange', recheck)
    }
  }, [use3D, badgeSeen, readIntroSeen])

  const showBadge = entered && badgeReady && !badgeSeen && !badgeDismissed
  const openIntroFromBadge = useCallback(() => {
    setBadgeSeen(true) // closing the intro sets the flag; hide immediately either way
    openIntro({ afterNavigate: '/story#about' })
  }, [])

  // Central action dispatcher — used by BOTH the 3D scene and the fallback grid.
  const runAction = useCallback(
    (_id: string, action: RoomAction) => {
      switch (action) {
        case 'intro':
          // Play the intro film, then land on /story#about once it closes.
          openIntro({ afterNavigate: '/story#about' })
          break
        case 'about':
          navigate('/story#about')
          break
        case 'career':
          navigate('/career')
          break
        case 'work':
          navigate('/story#work')
          break
        case 'ai':
          navigate('/story#ai')
          break
        case 'contact':
          navigate('/story#contact')
          break
        case 'notion':
          // 상세 이력 — external Notion page in a new tab.
          window.open(contact.notion, '_blank', 'noopener,noreferrer')
          break
        case 'sound':
          toggleSound()
          break
      }
    },
    [navigate],
  )

  // Keep a stable ref so the canvas subtree never re-mounts on coach changes.
  const actionRef = useRef(runAction)
  actionRef.current = runAction
  const onAction = useCallback((id: string, action: RoomAction) => actionRef.current(id, action), [])

  if (!use3D) {
    return (
      <main id="main" className="relative min-h-[100svh] overflow-hidden bg-abyss">
        {/* Decorative wordmark — root is home, so it is a plain span (no link). */}
        <span
          aria-hidden
          className="text-era-amber fixed left-4 top-4 z-30 font-display text-2xl font-bold leading-none md:left-8 md:top-8"
        >
          H.
        </span>
        <FallbackGrid onAction={onAction} />
        {/* Top-right hamburger navigator (all other destinations). */}
        <RoomMenu />
      </main>
    )
  }

  return (
    <main
      id="main"
      className="relative h-[100svh] overflow-hidden bg-abyss"
      style={{ touchAction: 'none' }}
    >
      {/* 3D scene */}
      <RoomExperience tier={tier} reduced={reduced} onAction={onAction} />

      {/* Start gate (§19.1) — "CLICK TO MENU" overlay above the live canvas,
          only while the session flag is unseen. Its click runs enterRoom(). */}
      {!entered && <RoomStart onEnter={onEnter} />}

      {/* Decorative wordmark — root is home, so it is a plain span (no link). */}
      <span
        aria-hidden
        className="text-era-amber fixed left-4 top-4 z-30 font-display text-2xl font-bold leading-none md:left-8 md:top-8"
      >
        H.
      </span>

      {/* Top-right hamburger navigator (all other destinations). */}
      <RoomMenu />

      {/* Bottom stack (§19.1) renders only AFTER entry — the start screen stays
          minimal like the reference. Identity → badge → coach → Legend. */}
      {entered && (
        <>
          {/* Identity strip (§15.3) — bottom-left, the HIGHEST of the bottom stack
              (identity → badge → coach → legend) so nothing collides at 390px. On
              mobile it's a compact corner card (narrow, links wrap tight); on
              desktop it sits above the legend. Fades in with the coach. */}
          <div
            className={`fixed bottom-48 left-3 z-30 max-w-[68vw] transition-opacity duration-700 md:bottom-24 md:left-8 md:max-w-sm ${
              coachVisible ? 'opacity-100' : 'opacity-80'
            }`}
          >
            <div className="glass rounded-2xl px-3.5 py-2.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.10)] md:px-4 md:py-3">
              <p className="font-display text-sm font-semibold leading-tight text-ink md:text-base">
                {identity.name}
              </p>
              <p className="mt-0.5 break-keep text-[11px] leading-snug text-ink-dim md:text-xs">
                {t(identity.line)}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                {identity.quick.map((q) => (
                  <Link
                    key={q.to}
                    to={q.to}
                    className="text-[11px] text-ink-dim underline-offset-2 transition-colors duration-200 hover:text-ink hover:underline md:text-xs"
                  >
                    {t(q.label)}
                  </Link>
                ))}
              </div>
            </div>
          </div>

      {/* Intro badge (§15.2) — centre-bottom above the coach, pulsing until seen. */}
      {showBadge && (
        <div className="fixed inset-x-0 bottom-36 z-30 flex justify-center px-6 md:bottom-40">
          <div
            className={`glass flex items-center gap-1 rounded-full pl-4 pr-1.5 py-1 shadow-[inset_0_1px_1px_rgba(255,255,255,0.10)] ${
              reduced ? '' : 'animate-pulse'
            }`}
          >
            <button
              type="button"
              onClick={openIntroFromBadge}
              className="whitespace-nowrap py-1 text-xs font-medium text-ink transition-colors duration-200 hover:text-era-cyan md:text-sm"
            >
              {t(introBadge)}
            </button>
            <button
              type="button"
              onClick={() => setBadgeDismissed(true)}
              aria-label={t({ ko: '닫기', en: 'Dismiss' })}
              className="ml-0.5 flex h-6 w-6 items-center justify-center rounded-full text-ink-dim transition-colors duration-200 hover:bg-white/10 hover:text-ink"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      )}

          {/* Coach line — centre-bottom above the legend, fades 5s after entry */}
          <div
            aria-hidden
            className={`pointer-events-none fixed inset-x-0 bottom-24 z-30 flex justify-center px-6 transition-opacity duration-700 md:bottom-28 ${
              coachVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <span className="glass rounded-full px-4 py-2 text-center text-xs text-ink-dim shadow-[inset_0_1px_1px_rgba(255,255,255,0.10)] md:text-sm">
              {t(coach)}
            </span>
          </div>

          {/* Legend (always-visible menu) — part of the post-entry bottom stack */}
          <Legend />
        </>
      )}

      {/* First-visit tour chip (§16) + desktop hover Tooltip — mounted always;
          both self-hide until the in-canvas tour/hover fires (the tour itself
          waits for entry via TourDriver), so they never show on the start gate. */}
      <LabelTour />
      <Tooltip />
    </main>
  )
}
