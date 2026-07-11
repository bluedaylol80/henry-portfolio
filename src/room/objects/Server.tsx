import { Suspense, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import Hotspot from '../Hotspot'
import { PAL } from '../palette'
import { GlbModel, modelUrl } from '../glb'

/**
 * 서버 랙 — the AI-chapter hotspot (→ /story#ai). In the back-RIGHT corner
 * (+X/−Z). §23.3 v15: the procedural rack body/panel/slots are replaced by the
 * owner-image GLB `server` (height 1.6). Vertex-coloured GLBs read dark in the
 * dim room, so per §23.3 we ADD 3 tiny emissive LED dots on the GLB's front
 * (+Z-facing) face — they blink at staggered rates (gold / cyan / mint) so the
 * rack still "lives". LED positions were found visually against the GLB front.
 * The Hotspot id/hit-proxy/ANCHOR are untouched.
 */
useGLTF.preload(modelUrl('server'))

const LED_COLORS = [PAL.goldDeep, PAL.cyan, PAL.mint] as const
const LED_RATES = [1.7, 2.6, 3.4] as const

export default function Server() {
  const ledsRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (document.hidden || !ledsRef.current) return
    const t = state.clock.elapsedTime
    ledsRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh
      const mat = mesh.material as THREE.MeshStandardMaterial
      // staggered square-ish blink
      const blink = Math.sin(t * LED_RATES[i] + i * 1.4) > 0 ? 1 : 0.15
      mat.emissiveIntensity += (blink * 1.6 - mat.emissiveIntensity) * 0.25
    })
  })

  return (
    <Hotspot id="server" hit={{ size: [0.75, 1.58, 0.7], position: [1.95, 0.75, -2.1] }}>
      {/* §23.8 remeasure (2026-07-12): the rack's dense band sat at z[−1.89,−1.38]
          — floating 0.51m off the back wall. z−2.14 rests the dense back face at
          the back-wall plane (z−2.38) so the rack hugs the back-right corner like
          the reference. Hit proxy tightened to the measured dense unit. */}
      <group position={[1.95, 0, -2.14]}>
        {/* §23.7-yaw (2026-07-11): owner-image GLB server rack, height 1.6.
            preRotX=0.30 keeps the ~18° baked-pitch plumb correction. The GLB's rich
            LED rack-unit face is on the +X side of the levelled pose; rotY=−2.618
            snaps the rack axis-aligned AND turns that LED face to EXACTLY +Z (into
            the room, toward the camera) — the calibration render confirmed the
            blue-lit rack units face +Z. x1.95 keeps the aligned footprint (half-X
            0.65) fully on the floor slab. Suspends locally (§23.1). */}
        <Suspense fallback={null}>
          <GlbModel slug="server" height={1.6} rotY={-2.618} preRotX={0.3} />
        </Suspense>
        {/* 3 ADDED emissive LED dots on the +Z-facing rack face (§23.3 — the dark
            room needs the LED read). The aligned face front is at z≈+0.76; the dots
            sit just proud of it, spread along X. Blink independently. No
            userData.baseEmissive → the hover-boost path leaves them alone. */}
        <group ref={ledsRef}>
          {LED_COLORS.map((c, i) => (
            <mesh key={i} position={[-0.06 + i * 0.06, 1.18, 0.63]}>
              <sphereGeometry args={[0.02, 10, 10]} />
              <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.9} toneMapped={false} />
            </mesh>
          ))}
        </group>
      </group>
    </Hotspot>
  )
}
