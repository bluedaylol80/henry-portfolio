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
 *  - plays a brief grow-then-shrink PULSE on the RISING edge of active (§19.3) —
 *    NOT a sustained scale (a held 1.04 read as the furniture drifting): scale
 *    eases 1 → 1.07 → 1 over ~420ms with a smooth sin envelope, then rests at
 *    exactly 1 until the next rising edge re-arms it,
 *  - boosts emissiveIntensity on any child MeshStandardMaterial flagged via
 *    userData.baseEmissive (so screens/marquees glow brighter on hover). The
 *    emissive boost STAYS sustained while active — it lights the object without
 *    moving geometry, and the v9 label tour relies on that "lit" feedback.
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
 * No React state per frame — the pulse phase lives in refs. The group carries
 * the hotspot `id` in userData so the central raycaster (RoomExperience) can
 * resolve which object was hit.
 */

// One hover pulse: scale 1 → PULSE_PEAK → 1 over PULSE_MS via a sin envelope.
const PULSE_MS = 420
const PULSE_PEAK = 0.07 // extra scale at the crest (peaks at 1.07)
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
  // Pulse state (no React): `wasActive` detects the rising edge; `pulseT`
  // counts up from 0 while a pulse is running (< 0 → no pulse armed).
  const wasActive = useRef(false)
  const pulseT = useRef(-1)

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
    const k = Math.min(1, dt * 10)

    // Pulse (§19.3): a new rising edge of `active` arms one 420ms envelope. The
    // scale grows then shrinks back to 1 (a single sin bump) and rests at 1 while
    // still active — no sustained scale, so hovered furniture never looks shifted.
    if (active && !wasActive.current) pulseT.current = 0 // rising edge → arm
    wasActive.current = active

    let scale = 1
    if (pulseT.current >= 0) {
      pulseT.current += dt * 1000
      if (pulseT.current >= PULSE_MS) {
        pulseT.current = -1 // pulse done — disarm, rest at 1
      } else {
        // sin(0→π) rises 0→1→0 across the window → one smooth grow-then-shrink.
        scale = 1 + PULSE_PEAK * Math.sin((pulseT.current / PULSE_MS) * Math.PI)
      }
    }
    g.scale.setScalar(scale)

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
