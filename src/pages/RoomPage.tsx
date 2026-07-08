import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { detectTier, prefersReducedMotion } from '../lib/quality'
import { openIntro } from '../lib/introBus'
import { toggleSound } from '../lib/sound'
import { useT } from '../lib/i18n'
import { coach, backLabel, type RoomAction } from '../content/room'
import RoomExperience from '../room/RoomExperience'
import FallbackGrid from '../room/FallbackGrid'
import Legend from '../room/Legend'
import Tooltip from '../room/Tooltip'

/**
 * /room — full-viewport immersive 3D navigator (SPEC §11).
 * The room's objects ARE the menu. On the fallback tier (or reduced-motion) we
 * render a plain menu grid instead of the canvas. DOM overlays (back link,
 * coach line, Legend, Tooltip) sit above the scene. document.title is set here.
 */
export default function RoomPage() {
  const t = useT()
  const navigate = useNavigate()
  const tier = useMemo(() => detectTier(), [])
  const reduced = useMemo(() => prefersReducedMotion(), [])
  const use3D = tier !== 'fallback' && !reduced

  const [coachVisible, setCoachVisible] = useState(true)

  useEffect(() => {
    document.title = 'The Room — Henry Lim'
  }, [])

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
          openIntro()
          break
        case 'about':
          navigate('/#about')
          break
        case 'career':
          navigate('/career')
          break
        case 'work':
          navigate('/#work')
          break
        case 'ai':
          navigate('/#ai')
          break
        case 'contact':
          navigate('/#contact')
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
        <FallbackGrid onAction={onAction} />
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

      {/* Back link — top-left, below the nav */}
      <Link
        to="/"
        className="glass fixed left-4 top-20 z-30 rounded-full px-4 py-2 text-sm text-ink-dim transition-colors duration-200 hover:text-ink md:left-8"
      >
        ← {t(backLabel)}
      </Link>

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
