import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import { ANCHORS, roomState } from './roomState'

/**
 * Restricted drag-orbit camera rig (owner directive: drag only, NO keyboard /
 * gamepad / zoom / pan). Pointer drag rotates azimuth within ±0.35rad and polar
 * within [0.95, 1.25]rad around the room centre, damped. Clicking a hotspot
 * (via focusOn) eases the camera toward that object's anchor with a gsap tween;
 * ESC / empty-space click eases back to the resting pose.
 *
 * The rig exposes imperative focus/reset through a ref so the interaction
 * manager can drive it after a raycast hit.
 */

// v6 baked-look composition: higher isometric so the wood floor is prominent
// and the whole diorama is framed with margin (fits 390px width).
const BASE_POS = new THREE.Vector3(5.6, 4.6, 5.6)
const BASE_TARGET = new THREE.Vector3(0, 0.9, 0)
const RADIUS = BASE_POS.distanceTo(BASE_TARGET) // ~8.74

// spherical bounds (drag orbit) — re-tuned to the new pose.
const AZ_CENTER = Math.PI / 4 // 45° — looking into the corner
const AZ_RANGE = 0.32
const POLAR_MIN = 1.02
const POLAR_MAX = 1.32
const POLAR_CENTER = 1.13

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

  // Drag-orbit input (pointer + touch, no zoom/pan).
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

  useFrame((_, delta) => {
    if (document.hidden) return
    const dt = Math.min(delta, 0.05)
    const o = orbit.current
    const k = reduced ? 1 : Math.min(1, dt * 6)

    // damp azimuth/polar toward their drag targets
    o.az += (o.azTarget - o.az) * k
    o.polar += (o.polarTarget - o.polar) * k

    // orbit position around BASE_TARGET
    const sinP = Math.sin(o.polar)
    _pos.set(
      BASE_TARGET.x + RADIUS * sinP * Math.cos(o.az),
      BASE_TARGET.y + RADIUS * Math.cos(o.polar),
      BASE_TARGET.z + RADIUS * sinP * Math.sin(o.az),
    )

    if (focus.current.active || roomState.focusId) {
      // blend toward focused camera pose
      camera.position.lerp(focus.current.pos, k)
      _lookTarget.copy(focus.current.target)
    } else {
      camera.position.lerp(_pos, k)
      _lookTarget.copy(focus.current.target) // eased back to BASE_TARGET on reset
    }
    camera.lookAt(_lookTarget)
  })

  return null
}
