import { useEffect, useState } from 'react'
import { useT } from '../lib/i18n'
import { hotspots } from '../content/room'
import { onTooltip, type TooltipState } from './roomState'

/**
 * DOM tooltip that follows the cursor while a hotspot is hovered (raycast).
 * Glass chip, pointer-events-none, shows `label → hint`. Positioned via the
 * tooltip bus (throttled writes from the InteractionManager, not per-frame).
 * Hidden on touch (legend is the primary mobile nav).
 */
export default function Tooltip() {
  const t = useT()
  const [state, setState] = useState<TooltipState>({ id: null, x: 0, y: 0 })

  useEffect(() => onTooltip(setState), [])

  const spot = hotspots.find((h) => h.id === state.id)
  if (!spot) return null

  // keep the chip within the viewport (nudge left/up near edges)
  const nudgeX = state.x > window.innerWidth - 220 ? -180 : 16
  const nudgeY = state.y > window.innerHeight - 80 ? -48 : 18

  return (
    <div
      aria-hidden
      className="glass pointer-events-none fixed z-30 hidden select-none whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs text-ink shadow-lg md:block"
      style={{ left: state.x + nudgeX, top: state.y + nudgeY }}
    >
      <span className="font-medium">{t(spot.label)}</span>
      <span className="mx-1.5 text-ink-mute">→</span>
      <span className="text-era-cyan">{t(spot.hint)}</span>
    </div>
  )
}
