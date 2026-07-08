import { useMemo, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { roomState } from './roomState'

/** A box hit-proxy for a hotspot: a local-space size (and optional offset). */
export interface HitProxy {
  /** box dimensions in the group's local space. */
  size: [number, number, number]
  /** optional local offset of the proxy centre (defaults to origin). */
  position?: [number, number, number]
}

/**
 * Wraps a hotspot object group. Every frame it reads the shared
 * `roomState.hoverId` (written by BOTH raycast hover and Legend-chip hover) and:
 *  - lerps the group scale toward 1.04 when hovered/focused,
 *  - boosts emissiveIntensity on any child MeshStandardMaterial flagged via
 *    userData.baseEmissive (so screens/marquees glow brighter on hover).
 *
 * §15.6 hit-proxy: each hotspot renders ONE invisible box that is the reliable
 * raycast target (small props like the mug/speaker are otherwise hard to hit).
 * The proxy is FULLY invisible at all times — `transparent, opacity 0,
 * depthWrite false, colorWrite false` — never `visible={false}` (that would skip
 * the raycast). It is NOT hover-toggled, so no ghost box can appear at rest.
 *
 * Perf (§15.5-5): the emissive-boost target materials are traversed ONCE on
 * first frame and cached in a ref; the per-frame loop only lerps the cached
 * array (no per-frame scene traversal).
 *
 * No React state per frame. The group carries the hotspot `id` in userData so
 * the central raycaster (RoomExperience) can resolve which object was hit.
 */
export default function Hotspot({
  id,
  position,
  hit,
  children,
}: {
  id: string
  position?: [number, number, number]
  hit?: HitProxy
  children: ReactNode
}) {
  const group = useRef<THREE.Group>(null)
  // Cached list of materials to boost on hover (filled once, then reused).
  const boostMats = useRef<THREE.MeshStandardMaterial[] | null>(null)

  // A single shared invisible material for every proxy — created once. Fully
  // transparent + no colour/depth writes so it never paints yet still raycasts.
  const proxyMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
        colorWrite: false,
      }),
    [],
  )

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

    // Collect boost-target materials once (traverse a single time on mount).
    if (boostMats.current === null) {
      const found: THREE.MeshStandardMaterial[] = []
      g.traverse((o) => {
        const mat = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined
        if (mat && mat.userData && typeof mat.userData.baseEmissive === 'number') {
          found.push(mat)
        }
      })
      boostMats.current = found
    }

    // emissive boost pass — only the cached materials, no scene traversal
    const boost = active ? 1 : 0
    for (const mat of boostMats.current) {
      const base = mat.userData.baseEmissive as number
      const boosted = base * (1 + boost * 0.9)
      mat.emissiveIntensity += (boosted - mat.emissiveIntensity) * k
    }
  })

  return (
    <group ref={group} position={position} name={`hotspot:${id}`} userData={{ hotspotId: id }}>
      {children}
      {hit && (
        <mesh position={hit.position} material={proxyMat} userData={{ hotspotId: id }}>
          <boxGeometry args={hit.size} />
        </mesh>
      )}
    </group>
  )
}
