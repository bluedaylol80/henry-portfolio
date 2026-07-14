import { useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { detectTier, prefersReducedMotion } from '../lib/quality'
import { toggleSound } from '../lib/sound'
import { useT } from '../lib/i18n'
import { contact } from '../content/profile'
import { coach, type RoomAction } from '../content/room'
import RoomImageNav from '../room/RoomImageNav'
import FallbackGrid from '../room/FallbackGrid'
import Legend from '../room/Legend'

/**
 * /room — opt-in static "control room" (LOCKED §5.5). A single rendered hero image
 * whose objects are hotspot pins that jump to the real sections; the bottom Legend
 * mirrors them as an accessible text menu. A secondary destination only — reached
 * via the footer link, never a content gate. The single Header (shell) supplies nav,
 * identity and the escape hatch, so the room carries no chrome of its own. On the
 * fallback tier (or a low-end reduced-motion device) a plain menu grid renders.
 */
export default function RoomPage() {
  const t = useT()
  const navigate = useNavigate()
  const tier = useMemo(() => detectTier(), [])
  const reduced = useMemo(() => prefersReducedMotion(), [])
  const useRoom = tier !== 'fallback'

  // Central dispatcher shared by the image pins and the legend chips.
  const runAction = useCallback(
    (_id: string, action: RoomAction) => {
      switch (action) {
        case 'about':
          navigate('/')
          break
        case 'career':
          navigate('/career')
          break
        case 'work':
          navigate('/#work')
          break
        case 'ai':
          navigate('/work/ai-os')
          break
        case 'contact':
          navigate('/#contact')
          break
        case 'notion':
          window.open(contact.notion, '_blank', 'noopener,noreferrer')
          break
        case 'sound':
          toggleSound()
          break
      }
    },
    [navigate],
  )
  const actionRef = useRef(runAction)
  actionRef.current = runAction
  const onAction = useCallback((id: string, action: RoomAction) => actionRef.current(id, action), [])

  if (!useRoom) {
    return (
      <main id="main" className="relative min-h-[100svh] overflow-hidden bg-night">
        <FallbackGrid onAction={onAction} />
      </main>
    )
  }

  return (
    <main id="main" className="relative h-[100svh] overflow-hidden bg-night" style={{ touchAction: 'none' }}>
      <RoomImageNav onAction={onAction} reduced={reduced} />

      {/* One-line hint, above the legend. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[4.5rem] z-30 flex justify-center px-6 md:bottom-20">
        <span className="rounded-full border border-line bg-night/80 px-4 py-2 text-center text-xs text-ink-dim backdrop-blur-sm">
          {t(coach)}
        </span>
      </div>

      <Legend onAction={onAction} />
    </main>
  )
}
