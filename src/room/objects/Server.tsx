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
    <Hotspot id="server" hit={{ size: [0.78, 1.58, 0.72], position: [2.05, 0.75, -1.65] }}>
      <group position={[2.05, 0, -1.65]}>
        {/* §23.3: owner-image GLB server rack, height 1.6. Suspends locally so a
            loading GLB can't blank the canvas (§23.1). rotY faces the front (its
            richer, panelled side) toward the viewer (+Z/+X) — found visually. */}
        <Suspense fallback={null}>
          <GlbModel slug="server" height={1.6} rotY={0} />
        </Suspense>
        {/* 3 ADDED emissive LED dots on the front face (§23.3 — the dark room
            needs the LED read). Positioned visually just proud of the +Z face;
            blink independently. No userData.baseEmissive → the hover-boost path
            leaves them alone (they animate themselves). */}
        <group ref={ledsRef}>
          {LED_COLORS.map((c, i) => (
            <mesh key={i} position={[-0.12 + i * 0.06, 1.18, 0.31]}>
              <sphereGeometry args={[0.02, 10, 10]} />
              <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.9} toneMapped={false} />
            </mesh>
          ))}
        </group>
      </group>
    </Hotspot>
  )
}
