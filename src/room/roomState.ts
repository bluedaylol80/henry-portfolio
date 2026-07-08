import type { RoomAction } from '../content/room'

/**
 * Shared mutable state for the room — read/written per-frame by 3D objects and
 * per-event by the DOM overlays (Legend / Tooltip). NEVER React state in the
 * frame loop (mirrors the `sceneState` pattern in three/sceneState.ts).
 *
 * `hoverId` is the single source of truth for "which hotspot is highlighted":
 *  - raycast hover (from the 3D scene) writes it,
 *  - Legend chip hover writes it too,
 * so both paths light up the same object without React re-renders.
 */
export const roomState = {
  /** id of the currently highlighted hotspot, or null. */
  hoverId: null as string | null,
  /** id of the hotspot the camera is currently dollied toward, or null. */
  focusId: null as string | null,
  /** true once the pointer is a touch device (raycast hover unreliable). */
  touch: false,
}

/** Camera anchor per hotspot: where the object lives + a dolly target for the
 *  camera to ease toward on click. Positions match the object modules. */
export interface Anchor {
  /** world position of the object (lookAt target on focus). */
  target: [number, number, number]
  /** camera position when focused on this object. */
  camera: [number, number, number]
}

export const ANCHORS: Record<string, Anchor> = {
  desk: { target: [-0.9, 1.15, -1.5], camera: [1.6, 1.9, 2.2] },
  arcade: { target: [1.9, 0.9, -1.4], camera: [3.4, 1.7, 1.6] },
  bookshelf: { target: [-2.0, 1.7, -0.4], camera: [1.2, 2.1, 2.6] },
  server: { target: [2.0, 0.75, 0.6], camera: [3.2, 1.6, 2.6] },
  coffee: { target: [-0.05, 0.92, -1.05], camera: [1.9, 1.7, 1.9] },
  speaker: { target: [1.15, 0.62, -1.75], camera: [3.0, 1.8, 1.4] },
  frame: { target: [-1.55, 2.2, -1.98], camera: [1.6, 2.6, 2.4] },
}

/** Small event bus so DOM overlays can command the 3D interaction manager
 *  (Legend click → same behaviour as clicking the object). */
type ActivateListener = (id: string, action: RoomAction) => void
const activateSubs = new Set<ActivateListener>()

export function activateHotspot(id: string, action: RoomAction): void {
  activateSubs.forEach((l) => l(id, action))
}

export function onActivate(cb: ActivateListener): () => void {
  activateSubs.add(cb)
  return () => {
    activateSubs.delete(cb)
  }
}

/** Tooltip position bus: raycast writes cursor coords + id; Tooltip reads them
 *  via a subscribe callback (throttled by the manager, not per-frame React). */
export interface TooltipState {
  id: string | null
  x: number
  y: number
}
type TooltipListener = (s: TooltipState) => void
const tooltipSubs = new Set<TooltipListener>()

export function setTooltip(s: TooltipState): void {
  tooltipSubs.forEach((l) => l(s))
}

export function onTooltip(cb: TooltipListener): () => void {
  tooltipSubs.add(cb)
  return () => {
    tooltipSubs.delete(cb)
  }
}
