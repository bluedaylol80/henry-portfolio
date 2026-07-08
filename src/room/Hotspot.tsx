import { useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { roomState } from './roomState'

/**
 * Wraps a hotspot object group. Every frame it reads the shared
 * `roomState.hoverId` (written by BOTH raycast hover and Legend-chip hover) and:
 *  - lerps the group scale toward 1.04 when hovered/focused,
 *  - boosts emissiveIntensity on any child MeshStandardMaterial flagged via
 *    userData.baseEmissive (so screens/marquees glow brighter on hover).
 *
 * No React state per frame. The mesh names carry the hotspot `id` so the
 * central raycaster (RoomExperience) can resolve which object was hit.
 */
export default function Hotspot({
  id,
  position,
  children,
}: {
  id: string
  position?: [number, number, number]
  children: ReactNode
}) {
  const group = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (document.hidden) return
    const g = group.current
    if (!g) return
    const dt = Math.min(delta, 0.05)
    const active = roomState.hoverId === id || roomState.focusId === id
    const targetScale = active ? 1.04 : 1
    const k = Math.min(1, dt * 10)

    // damped scale toward target
    const next = g.scale.x + (targetScale - g.scale.x) * k
    g.scale.setScalar(next)

    // emissive boost pass
    const boost = active ? 1 : 0
    g.traverse((o) => {
      const mesh = o as THREE.Mesh
      const mat = mesh.material as THREE.MeshStandardMaterial | undefined
      if (mat && mat.userData && typeof mat.userData.baseEmissive === 'number') {
        const base = mat.userData.baseEmissive as number
        const boosted = base * (1 + boost * 0.9)
        mat.emissiveIntensity += (boosted - mat.emissiveIntensity) * k
      }
    })
  })

  return (
    <group ref={group} position={position} name={`hotspot:${id}`} userData={{ hotspotId: id }}>
      {children}
    </group>
  )
}
