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
  /** true once the start overlay has been dismissed this session (§19.1). */
  entered: false,
}

/** Camera anchor per hotspot: where the object lives + a dolly target for the
 *  camera to ease toward on click. Positions match the object modules. */
export interface Anchor {
  /** world position of the object (lookAt target on focus). */
  target: [number, number, number]
  /** camera position when focused on this object. */
  camera: [number, number, number]
}

// v11 natural layout (SPEC §19.2) — matches owner-ref-myroom.png. Object world
// centres + a dolly pose per hotspot that frames it with margin from the +x/+z
// viewer side. On focus the camera eases toward `camera`; on reset it returns to
// the resting orbit. §14.2 position locks are SUPERSEDED for the moved objects.
//   back wall (−Z):  desk (corner, left) · window · TV+console (right) · server+plant (corner)
//   left wall (−X):  bookshelf (mid, +guitar) · frame (front) · speaker (front)
//   centre:          sofa facing −Z (the TV) · coffee table + mug + gamepad
export const ANCHORS: Record<string, Anchor> = {
  desk: { target: [-1.7, 1.32, -1.9], camera: [1.2, 2.7, 2.6] },
  tv: { target: [0.85, 1.6, -2.0], camera: [2.6, 2.7, 2.9] },
  bookshelf: { target: [-1.95, 1.45, -0.45], camera: [1.5, 2.7, 2.9] },
  server: { target: [2.05, 1.0, -1.65], camera: [4.0, 2.6, 1.9] },
  coffee: { target: [0.5, 0.95, -0.15], camera: [2.7, 2.2, 2.6] },
  speaker: { target: [-1.95, 0.7, 1.85], camera: [1.5, 2.2, 3.8] },
  frame: { target: [-2.0, 1.5, 1.05], camera: [1.6, 2.4, 3.6] },
}

/** Small event bus so DOM overlays can command the 3D interaction manager
 *  (Legend click → same behaviour as clicking the object). `immediate` runs the
 *  action right away with NO dolly wait (DOM menu latency fix §15.5-1); 3D object
 *  clicks omit it so they keep the dolly-then-act behaviour. */
type ActivateListener = (id: string, action: RoomAction, immediate: boolean) => void
const activateSubs = new Set<ActivateListener>()

export function activateHotspot(id: string, action: RoomAction, immediate = false): void {
  activateSubs.forEach((l) => l(id, action, immediate))
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

/** First-visit tour bus (§16.2): the in-canvas TourDriver projects the current
 *  step's anchor to CSS pixels and publishes `{ id, x, y }`; the DOM LabelTour
 *  reads them via a subscribe callback and resolves the text with i18n. Same
 *  subscriber shape as the tooltip bus — coords only, never text (the R3F
 *  renderer boundary means the driver has no i18n context). `id: null` hides. */
export interface TourLabelState {
  id: string | null
  x: number
  y: number
}
type TourLabelListener = (s: TourLabelState) => void
const tourLabelSubs = new Set<TourLabelListener>()

export function setTourLabel(s: TourLabelState): void {
  tourLabelSubs.forEach((l) => l(s))
}

export function onTourLabel(cb: TourLabelListener): () => void {
  tourLabelSubs.add(cb)
  return () => {
    tourLabelSubs.delete(cb)
  }
}

/** Room entry gate (§19.1): the "CLICK TO MENU" start overlay (DOM, RoomStart)
 *  calls `enterRoom()` on its dismiss click; in-canvas systems that must wait
 *  for entry (TourDriver's label tour) subscribe via `onRoomEnter` or read
 *  `roomState.entered`. When the overlay was already seen this session the
 *  page sets `entered` true at mount and no event ever fires. */
type RoomEnterListener = () => void
const enterSubs = new Set<RoomEnterListener>()

export function enterRoom(): void {
  if (roomState.entered) return
  roomState.entered = true
  enterSubs.forEach((l) => l())
}

export function onRoomEnter(cb: RoomEnterListener): () => void {
  enterSubs.add(cb)
  return () => {
    enterSubs.delete(cb)
  }
}
