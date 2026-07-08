import { useEffect, useState } from 'react'
import { useT } from '../lib/i18n'
import { hotspots } from '../content/room'
import { onTourLabel, type TourLabelState } from './roomState'

/**
 * First-visit tour chip (SPEC §16.3) — DOM overlay, mounted in RoomPage above
 * the canvas (§13.3 convention; never inside the Canvas). Subscribes to the tour
 * bus and resolves the label text with `useT` (the in-canvas TourDriver only
 * publishes ids + screen coords — it has no i18n context across the R3F
 * boundary). Renders ONE tiny destination chip near the projected object.
 *
 * Glass rounded-full, leading era-cyan dot, `hotspot.label` ONLY (no hint — the
 * chip is meant to be very small). Positioned with `translate(-50%, -110%)` so
 * it floats just above the projected point, clamped ≥8px from viewport edges.
 * Soft ~200ms fade + 4px rise per step. `pointer-events-none` + `aria-hidden`.
 * `data-tour-label={id}` exposes the active step to the QA harness.
 */
export default function LabelTour() {
  const t = useT()
  const [state, setState] = useState<TourLabelState>({ id: null, x: 0, y: 0 })

  useEffect(() => onTourLabel(setState), [])

  const spot = hotspots.find((h) => h.id === state.id)
  if (!spot) return null

  // Clamp the anchor point ≥8px from every viewport edge (the transform then
  // lifts the chip above/centred on it; the clamp keeps it comfortably onscreen).
  const x = Math.min(Math.max(state.x, 8), window.innerWidth - 8)
  const y = Math.min(Math.max(state.y, 8), window.innerHeight - 8)

  return (
    <div
      // key on the id so React remounts the node per step → the fade+rise
      // animation replays for each object instead of firing only once.
      key={spot.id}
      aria-hidden
      data-tour-label={spot.id}
      className="glass pointer-events-none fixed z-30 flex select-none items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium text-ink shadow-lg"
      style={{
        left: x,
        top: y,
        opacity: 0,
        animation: 'tourLabelIn 200ms ease-out forwards',
      }}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-era-cyan" />
      <span>{t(spot.label)}</span>
    </div>
  )
}
