import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import { ANCHORS, roomState } from './roomState'

/**
 * Restricted drag-orbit camera rig. Pointer drag rotates azimuth within
 * ±AZ_RANGE and polar within [POLAR_MIN, POLAR_MAX] around the room centre,
 * damped. Clicking a hotspot (via focusOn) eases the camera toward that
 * object's anchor with a gsap tween; ESC / empty-space click eases back to the
 * resting pose.
 *
 * v7 (SPEC §14.1) — WHEEL ZOOM: the mouse wheel scales the orbit RADIUS via a
 * `zoomFactor` clamped to [0.72, 1.45] of the base radius, damped-lerped toward
 * its target so it feels smooth. `preventDefault` is set on the canvas wheel
 * only (the `/` route has no page scroll). Zoom composes cleanly with the
 * focus-on dolly (the focused camera pose is nudged along its view direction by
 * the same factor) and `reset` eases the zoom back to 1.0. No keyboard.
 *
 * The rig exposes imperative focus/reset through a ref so the interaction
 * manager can drive it after a raycast hit.
 */

// v7 reference composition: higher isometric so the wood floor is prominent
// and the whole diorama is framed with margin (fits 390px width).
const BASE_POS = new THREE.Vector3(5.8, 4.7, 5.8)
const BASE_TARGET = new THREE.Vector3(0, 0.9, 0)
const RADIUS = BASE_POS.distanceTo(BASE_TARGET)

// spherical bounds (drag orbit) — tuned to the new pose.
const AZ_CENTER = Math.PI / 4 // 45° — looking into the corner
const AZ_RANGE = 0.34
const POLAR_MIN = 1.0
const POLAR_MAX = 1.34
const POLAR_CENTER = 1.13

// wheel-zoom clamps (fraction of the base orbit radius).
const ZOOM_MIN = 0.72
const ZOOM_MAX = 1.45
const ZOOM_SPEED = 0.0011 // per wheel deltaY unit

export interface RoomCameraHandle {
  focusOn: (id: string) => void
  reset: () => void
}

export default function RoomCamera({
  reduced,
  handleRef,
}: {
  reduced: boolean
  handleRef: React.MutableRefObject<RoomCameraHandle | null>
}) {
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)

  // Orbit state (spherical). azimuth/polar are the *target*; damped toward.
  const orbit = useRef({
    az: AZ_CENTER,
    polar: POLAR_CENTER,
    azTarget: AZ_CENTER,
    polarTarget: POLAR_CENTER,
  })
  // Wheel zoom: `zoom` damped toward `zoomTarget`; applied to the orbit radius.
  const zoom = useRef({ value: 1, target: 1 })
  // When focused, gsap tweens these override vectors and we lerp toward them.
  const focus = useRef({
    active: false,
    pos: BASE_POS.clone(),
    target: BASE_TARGET.clone(),
  })
  const tweenRef = useRef<gsap.core.Tween | null>(null)

  // Initialise camera at resting pose.
  useEffect(() => {
    camera.position.copy(BASE_POS)
    camera.lookAt(BASE_TARGET)
    focus.current.pos.copy(camera.position)
    focus.current.target.copy(BASE_TARGET)
  }, [camera])

  // Drag-orbit input (pointer + touch, no pan).
  useEffect(() => {
    const el = gl.domElement
    let dragging = false
    let lastX = 0
    let lastY = 0

    const onDown = (e: PointerEvent) => {
      dragging = true
      lastX = e.clientX
      lastY = e.clientY
      el.setPointerCapture?.(e.pointerId)
    }
    const onMove = (e: PointerEvent) => {
      if (!dragging) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY
      const o = orbit.current
      o.azTarget = THREE.MathUtils.clamp(
        o.azTarget - dx * 0.004,
        AZ_CENTER - AZ_RANGE,
        AZ_CENTER + AZ_RANGE,
      )
      o.polarTarget = THREE.MathUtils.clamp(o.polarTarget - dy * 0.003, POLAR_MIN, POLAR_MAX)
    }
    const onUp = (e: PointerEvent) => {
      dragging = false
      el.releasePointerCapture?.(e.pointerId)
    }

    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [gl])

  // Wheel zoom on the canvas only (passive:false so we can preventDefault).
  useEffect(() => {
    const el = gl.domElement
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const z = zoom.current
      // wheel down (deltaY > 0) → zoom OUT (larger radius); up → zoom IN.
      z.target = THREE.MathUtils.clamp(
        z.target + e.deltaY * ZOOM_SPEED,
        ZOOM_MIN,
        ZOOM_MAX,
      )
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [gl])

  // Imperative focus / reset (called by the interaction manager & Legend).
  useEffect(() => {
    const focusOn = (id: string) => {
      const anchor = ANCHORS[id]
      if (!anchor) return
      roomState.focusId = id
      focus.current.active = true
      tweenRef.current?.kill()
      const fromPos = camera.position.clone()
      const fromTarget = focus.current.target.clone()
      const toPos = new THREE.Vector3(...anchor.camera)
      const toTarget = new THREE.Vector3(...anchor.target)
      if (reduced) {
        focus.current.pos.copy(toPos)
        focus.current.target.copy(toTarget)
        return
      }
      const proxy = { t: 0 }
      tweenRef.current = gsap.to(proxy, {
        t: 1,
        duration: 0.7,
        ease: 'power2.inOut',
        onUpdate: () => {
          focus.current.pos.lerpVectors(fromPos, toPos, proxy.t)
          focus.current.target.lerpVectors(fromTarget, toTarget, proxy.t)
        },
      })
    }

    const reset = () => {
      roomState.focusId = null
      tweenRef.current?.kill()
      focus.current.active = false
      // ease the wheel-zoom back to the resting radius as well.
      zoom.current.target = 1
      // ease target back to BASE_TARGET; position handled by orbit lerp
      if (reduced) {
        focus.current.target.copy(BASE_TARGET)
        return
      }
      const fromTarget = focus.current.target.clone()
      const proxy = { t: 0 }
      tweenRef.current = gsap.to(proxy, {
        t: 1,
        duration: 0.6,
        ease: 'power2.inOut',
        onUpdate: () => {
          focus.current.target.lerpVectors(fromTarget, BASE_TARGET, proxy.t)
        },
      })
    }

    handleRef.current = { focusOn, reset }
    return () => {
      handleRef.current = null
      tweenRef.current?.kill()
    }
  }, [camera, reduced, handleRef])

  const _pos = useRef(new THREE.Vector3()).current
  const _lookTarget = useRef(new THREE.Vector3()).current
  const _focusPos = useRef(new THREE.Vector3()).current

  useFrame((_, delta) => {
    if (document.hidden) return
    const dt = Math.min(delta, 0.05)
    const o = orbit.current
    const z = zoom.current
    const k = reduced ? 1 : Math.min(1, dt * 6)

    // damp azimuth/polar/zoom toward their targets
    o.az += (o.azTarget - o.az) * k
    o.polar += (o.polarTarget - o.polar) * k
    z.value += (z.target - z.value) * k

    // orbit position around BASE_TARGET (radius scaled by the wheel zoom)
    const r = RADIUS * z.value
    const sinP = Math.sin(o.polar)
    _pos.set(
      BASE_TARGET.x + r * sinP * Math.cos(o.az),
      BASE_TARGET.y + r * Math.cos(o.polar),
      BASE_TARGET.z + r * sinP * Math.sin(o.az),
    )

    if (focus.current.active || roomState.focusId) {
      // compose the wheel zoom with the focus dolly: nudge the focused camera
      // pose along its view direction by (zoom − 1) of the eye→target distance.
      _focusPos.copy(focus.current.pos)
      _focusPos.sub(focus.current.target).multiplyScalar(z.value).add(focus.current.target)
      camera.position.lerp(_focusPos, k)
      _lookTarget.copy(focus.current.target)
    } else {
      camera.position.lerp(_pos, k)
      _lookTarget.copy(focus.current.target) // eased back to BASE_TARGET on reset
    }
    camera.lookAt(_lookTarget)
  })

  return null
}
