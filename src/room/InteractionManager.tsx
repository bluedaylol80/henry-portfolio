import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { roomState, setTooltip, onActivate } from './roomState'
import type { RoomCameraHandle } from './RoomCamera'
import { hotspots, type RoomAction } from '../content/room'

/**
 * Central pointer/raycast manager for the room:
 *  - pointermove (throttled) raycasts hotspot meshes → sets roomState.hoverId,
 *    body cursor, and DOM Tooltip position (all outside React state).
 *  - click/tap on an object → dolly camera to its anchor, then perform action.
 *  - ESC / empty-space click → reset camera.
 *  - Legend chip clicks arrive via onActivate and reuse the same handler.
 *
 * Touch: a tap sets the pointer then a click fires; we act directly (no hover
 * dependency). We DO run the raycast on touch to resolve which object was hit.
 */
export default function InteractionManager({
  cameraHandle,
  onAction,
}: {
  cameraHandle: React.MutableRefObject<RoomCameraHandle | null>
  onAction: (id: string, action: RoomAction) => void
}) {
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const scene = useThree((s) => s.scene)

  const raycaster = useRef(new THREE.Raycaster()).current
  const ndc = useRef(new THREE.Vector2()).current
  // pending action timers (cleared on unmount so no stray callback fires).
  const timers = useRef(new Set<number>()).current

  // Resolve the hotspot id from a raycast at client coords, or null.
  const pick = useRef((clientX: number, clientY: number): string | null => {
    const rect = gl.domElement.getBoundingClientRect()
    ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1
    ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(ndc, camera)
    const hits = raycaster.intersectObjects(scene.children, true)
    for (const hit of hits) {
      // walk up to the nearest ancestor carrying userData.hotspotId
      let o: THREE.Object3D | null = hit.object
      while (o) {
        const hid = o.userData?.hotspotId
        if (typeof hid === 'string') return hid
        o = o.parent
      }
    }
    return null
  }).current

  useEffect(() => {
    const el = gl.domElement
    let last = 0
    let downX = 0
    let downY = 0
    let moved = false

    const onPointerMove = (e: PointerEvent) => {
      // track drag so a drag doesn't count as a click
      if (e.buttons > 0 && (Math.abs(e.clientX - downX) > 4 || Math.abs(e.clientY - downY) > 4)) {
        moved = true
      }
      if (roomState.touch && e.pointerType === 'touch') return // no hover on touch
      const now = performance.now()
      if (now - last < 40) return // throttle ~25Hz
      last = now
      const id = pick(e.clientX, e.clientY)
      roomState.hoverId = id
      document.body.style.cursor = id ? 'pointer' : ''
      setTooltip({ id, x: e.clientX, y: e.clientY })
    }

    const onPointerDown = (e: PointerEvent) => {
      downX = e.clientX
      downY = e.clientY
      moved = false
      if (e.pointerType === 'touch') roomState.touch = true
    }

    const onPointerUp = (e: PointerEvent) => {
      if (moved) return // was a drag-orbit, not a tap
      const id = pick(e.clientX, e.clientY)
      if (id) {
        activate(id)
      } else {
        // empty space → reset camera + clear hover
        cameraHandle.current?.reset()
        roomState.hoverId = null
        document.body.style.cursor = ''
        setTooltip({ id: null, x: 0, y: 0 })
      }
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cameraHandle.current?.reset()
        roomState.hoverId = null
        document.body.style.cursor = ''
        setTooltip({ id: null, x: 0, y: 0 })
      }
    }

    el.addEventListener('pointermove', onPointerMove, { passive: true })
    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointerup', onPointerUp)
    window.addEventListener('keydown', onKey)

    return () => {
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('keydown', onKey)
      document.body.style.cursor = ''
    }
    // `activate` is stable via closure over refs/props below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, camera, scene])

  // Shared activation: dolly to the object then run its action.
  const activate = (id: string) => {
    cameraHandle.current?.focusOn(id)
    // perform the action after the dolly completes (0.7s per RoomCamera).
    const tid = window.setTimeout(() => {
      timers.delete(tid)
      onAction(id, resolveAction(id))
    }, 720)
    timers.add(tid)
  }

  // Legend-chip clicks route here too. Clear any pending timers on unmount.
  useEffect(() => {
    const off = onActivate((id) => activate(id))
    return () => {
      off()
      timers.forEach((t) => window.clearTimeout(t))
      timers.clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

// Resolve hotspot id → action straight from the content source of truth, so
// the raycast path and the DOM Legend/FallbackGrid never drift (ids: desk/tv/
// bookshelf/server/coffee/speaker/frame; the renamed 'tv' → 'notion').
const ACTION_BY_ID: Record<string, RoomAction> = Object.fromEntries(
  hotspots.map((h) => [h.id, h.action]),
)
function resolveAction(id: string): RoomAction {
  return ACTION_BY_ID[id] ?? 'about'
}
