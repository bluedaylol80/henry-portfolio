import { useFrame, useThree } from '@react-three/fiber'
import { sceneState } from './sceneState'
import { clamp, lerp } from './util'

/**
 * Cinematic camera rig: per-phase dolly / vertical drift / roll tilt lerped
 * continuously, plus mouse parallax on the full tier. Drives the default
 * camera directly (no wrapping group needed in R3F).
 */

// Per-phase keyframes (§4)
const DOLLY_Z = [11, 10, 12, 10.5, 9.5, 11.5]
const DRIFT_Y = [0.5, 0.2, -0.2, 0.0, 0.3, -0.5]
const TILT_Z = [0.0, 0.015, -0.02, 0.012, -0.015, 0.0]

export default function CameraRig({ full, reduced }: { full: boolean; reduced: boolean }) {
  const camera = useThree((s) => s.camera)

  useFrame((_, delta) => {
    if (document.hidden) return
    const dt = Math.min(delta, 0.05)

    const p = clamp(sceneState.phase, 0, 5)
    const i0 = Math.floor(p)
    const i1 = Math.min(i0 + 1, 5)
    const f = p - i0

    const z = lerp(DOLLY_Z[i0], DOLLY_Z[i1], f)
    const y = lerp(DRIFT_Y[i0], DRIFT_Y[i1], f)
    const rz = lerp(TILT_Z[i0], TILT_Z[i1], f)

    const mx = full ? sceneState.mouseX : 0
    const my = full ? sceneState.mouseY : 0

    const posK = reduced ? 1 : Math.min(1, dt * 2)
    const rotK = reduced ? 1 : Math.min(1, dt * 2.5)

    camera.position.x += (mx * 0.35 - camera.position.x) * posK
    camera.position.y += (y + my * 0.2 - camera.position.y) * posK
    camera.position.z += (z - camera.position.z) * posK

    camera.rotation.x += (-my * 0.05 - camera.rotation.x) * rotK
    camera.rotation.y += (mx * 0.05 - camera.rotation.y) * rotK
    camera.rotation.z += (rz - camera.rotation.z) * rotK
  })

  return null
}
