import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { detectTier, prefersReducedMotion } from '../lib/quality'
import { openIntro } from '../lib/introBus'
import { toggleSound } from '../lib/sound'
import { useT } from '../lib/i18n'
import { contact } from '../content/profile'
import { coach, type RoomAction } from '../content/room'
import RoomExperience from '../room/RoomExperience'
import FallbackGrid from '../room/FallbackGrid'
import Legend from '../room/Legend'
import Tooltip from '../room/Tooltip'
import RoomMenu from '../components/RoomMenu'

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

  const [coachVisible, setCoachVisible] = useState(true)

  // Coach line fades out after 5s (CSS opacity transition; reduced-safe).
  useEffect(() => {
    if (!use3D) return
    const id = window.setTimeout(() => setCoachVisible(false), 5000)
    return () => window.clearTimeout(id)
  }, [use3D])

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
      <main id="main" className="relative min-h-[100svh] overflow-hidden bg-base">
        {/* Decorative wordmark — root is home, so it is a plain span (no link). */}
        <span
          aria-hidden
          className="text-gradient fixed left-4 top-4 z-30 font-display text-2xl font-bold leading-none md:left-8 md:top-8"
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
      className="relative h-[100svh] overflow-hidden bg-base"
      style={{ touchAction: 'none' }}
    >
      {/* 3D scene */}
      <RoomExperience tier={tier} reduced={reduced} onAction={onAction} />

      {/* Decorative wordmark — root is home, so it is a plain span (no link). */}
      <span
        aria-hidden
        className="text-gradient fixed left-4 top-4 z-30 font-display text-2xl font-bold leading-none md:left-8 md:top-8"
      >
        H.
      </span>

      {/* Top-right hamburger navigator (all other destinations). */}
      <RoomMenu />

      {/* Coach line — centre-bottom above the legend, fades after 5s */}
      <div
        aria-hidden
        className={`pointer-events-none fixed inset-x-0 bottom-24 z-30 flex justify-center px-6 transition-opacity duration-700 md:bottom-28 ${
          coachVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <span className="glass rounded-full px-4 py-2 text-center text-xs text-ink-dim md:text-sm">
          {t(coach)}
        </span>
      </div>

      {/* Tooltip (desktop hover) + Legend (always-visible menu) */}
      <Tooltip />
      <Legend />
    </main>
  )
}
