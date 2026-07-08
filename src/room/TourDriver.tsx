import { useEffect } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { ANCHORS, roomState, setTourLabel } from './roomState'
import { hotspots } from '../content/room'

/**
 * First-visit label tour (SPEC §16) — IN-CANVAS, renders null.
 *
 * For ~5s after the room loads it sequentially "lights up" each object: it sets
 * `roomState.hoverId` per step (reusing the existing hover visuals via Hotspot)
 * and projects that hotspot's anchor to CSS pixels, publishing `{ id, x, y }` on
 * the tour bus so the DOM LabelTour can render one tiny destination chip near
 * the object. The goal is touch discoverability — mobile users have no hover, so
 * this reveals that the objects ARE the menu.
 *
 * Why in-canvas: it needs `camera` + `gl` to project world → screen. It MUST NOT
 * touch i18n/React context (R3F is a separate reconciler — the app-tree context
 * does not cross the boundary), so it publishes the id + coords ONLY; LabelTour
 * resolves the text with `useT`.
 *
 * Gate: `sessionStorage['henry.roomTour'] === '1'` → skip entirely. One-shot per
 * browser session. The flag is set ONLY when the tour ENDS or is CANCELLED —
 * never on a plain unmount, so StrictMode's dev double-mount and SPA nav-away do
 * not falsely mark it done.
 *
 * Timeline: start 900ms after mount; step through ALL 7 hotspots in content
 * order (= legend order), 650ms per step (~5.4s total).
 *
 * Cancel on ANY interaction (§16.1): `window` pointerdown / wheel / keydown, or
 * pointermove over `gl.domElement` — because desktop mouse movement fights the
 * raycast-hover writes (InteractionManager writes hoverId at ~25Hz on move), and
 * any interaction means the user is already engaged. On touch nothing fires
 * until the first tap, so the tour plays out for the target audience.
 */

const START_DELAY = 900 // ms before the first chip appears
const STEP_MS = 650 // ms per hotspot
const REFRESH_MS = 40 // per-frame projection refresh throttle (~25Hz)
const FLAG_KEY = 'henry.roomTour'

export default function TourDriver() {
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)

  useEffect(() => {
    // Session gate — skip entirely if the tour already ran/was cancelled.
    try {
      if (sessionStorage.getItem(FLAG_KEY) === '1') return
    } catch {
      return // no sessionStorage (private mode / SSR) → don't run the tour
    }

    const el = gl.domElement
    const timers = new Set<number>()
    const v = new THREE.Vector3()
    // The tour's current step id — so a mid-tour cancel only clears the hover it
    // owns (never a hover the raycast has since taken over).
    let currentId: string | null = null
    let lastRefresh = 0
    let rafId = 0
    let done = false // guard so cancel/end run exactly once

    const setFlag = () => {
      try {
        sessionStorage.setItem(FLAG_KEY, '1')
      } catch {
        /* private mode — nothing to persist */
      }
    }

    // Project the given hotspot's anchor to CSS pixels via the canvas rect.
    const project = (id: string): { x: number; y: number } | null => {
      const anchor = ANCHORS[id]
      if (!anchor) return null
      const rect = el.getBoundingClientRect()
      v.set(anchor.target[0], anchor.target[1], anchor.target[2]).project(camera)
      return {
        x: rect.left + ((v.x + 1) / 2) * rect.width,
        y: rect.top + ((1 - v.y) / 2) * rect.height,
      }
    }

    // Publish the current step's projected position (bail when there is no id).
    const publish = () => {
      if (!currentId) return
      const p = project(currentId)
      if (!p) return
      setTourLabel({ id: currentId, x: p.x, y: p.y })
    }

    // Light per-frame refresh so the chip tracks the object while the resting
    // orbit drifts. Throttled (tooltip precedent); bails when id is null.
    const loop = () => {
      rafId = requestAnimationFrame(loop)
      if (!currentId) return
      const now = performance.now()
      if (now - lastRefresh < REFRESH_MS) return
      lastRefresh = now
      publish()
    }

    // Detach every listener + timer + rAF. Idempotent.
    const teardown = () => {
      for (const t of timers) window.clearTimeout(t)
      timers.clear()
      if (rafId) cancelAnimationFrame(rafId)
      rafId = 0
      window.removeEventListener('pointerdown', cancel)
      window.removeEventListener('wheel', cancel)
      window.removeEventListener('keydown', cancel)
      el.removeEventListener('pointermove', cancel)
    }

    // Hide the chip + clear the hover the tour owns (only if the raycast has not
    // taken it over) + null the bus. Shared by cancel and natural end.
    const stopVisuals = () => {
      setTourLabel({ id: null, x: 0, y: 0 })
      if (currentId && roomState.hoverId === currentId) roomState.hoverId = null
      currentId = null
    }

    // Cancel = stop visuals + set the flag + detach. Runs once.
    function cancel() {
      if (done) return
      done = true
      teardown()
      stopVisuals()
      setFlag()
    }

    // Natural end = same as cancel (flag set), just reached by the timeline.
    const finish = () => {
      if (done) return
      done = true
      teardown()
      stopVisuals()
      setFlag()
    }

    // Advance to a given step index; the last step schedules the finish.
    const step = (i: number) => {
      if (done) return
      if (i >= hotspots.length) {
        finish()
        return
      }
      currentId = hotspots[i].id
      roomState.hoverId = currentId
      publish()
      const t = window.setTimeout(() => {
        timers.delete(t)
        step(i + 1)
      }, STEP_MS)
      timers.add(t)
    }

    // Kick off after the start delay, then start the per-frame refresh.
    const start = window.setTimeout(() => {
      timers.delete(start)
      if (done) return
      step(0)
    }, START_DELAY)
    timers.add(start)
    rafId = requestAnimationFrame(loop)

    // Any interaction cancels immediately (see header rationale).
    window.addEventListener('pointerdown', cancel)
    window.addEventListener('wheel', cancel, { passive: true })
    window.addEventListener('keydown', cancel)
    el.addEventListener('pointermove', cancel, { passive: true })

    // Plain unmount (StrictMode double-mount / SPA nav-away): clear timers +
    // listeners + null the bus + clear the tour-owned hover, but DO NOT set the
    // flag — the tour did not run to an end or a cancel.
    return () => {
      if (done) return // already ended/cancelled — nothing more to undo
      teardown()
      stopVisuals()
    }
  }, [camera, gl])

  return null
}
