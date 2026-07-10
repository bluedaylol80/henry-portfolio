import { Suspense } from 'react'
import * as THREE from 'three'
import { useLoader } from '@react-three/fiber'
import { RoundedBox, useGLTF } from '@react-three/drei'
import Hotspot from '../Hotspot'
import { PAL } from '../palette'
import { GlbModel, modelUrl } from '../glb'
import { getGlowTexture } from '../textures'

/**
 * 데스크 ('컴퓨터') — the '소개' hotspot. §22.1 v14: the click navigates to
 * /story#about (action 'about'); it does not auto-play the intro film.
 *
 * §23.4 v15 (composite swap): the procedural desk slab/legs/monitor body/
 * keyboard/lamp are REPLACED by the owner-image GLB `desk` (width 2.0) — a wooden
 * desk that carries its own monitor body + lamp. The GLB monitor's screen faces
 * −Z raw, so the whole GLB is rotated rotY=π to face +Z (into the room). The
 * owner's v13 dashboard stills MUST survive, so we OVERLAY:
 *   - the `screens/monitor.png` emissive plane onto the GLB monitor's screen quad
 *     (position/scale iterated via screenshots; sits ~0.01 in front of the glass),
 *   - the KEPT procedural laptop (with `screens/laptop.png`) on the GLB desktop
 *     surface beside the monitor (the GLB has no laptop).
 * Both overlays keep map+emissiveMap+emissive #ffffff+toneMapped:false+
 * userData.baseEmissive so Hotspot's hover-boost scales correctly (§23 contract).
 */

useGLTF.preload(modelUrl('desk'))

/** Monitor screen overlay — owner still (screens/monitor.png), aspect 1.6.
 *  Suspends locally so a loading texture can't blank the room canvas (§21.1). */
function MonitorScreen() {
  const tex = useLoader(THREE.TextureLoader, import.meta.env.BASE_URL + 'screens/monitor.png')
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return (
    <mesh>
      {/* v15fix: enlarged to cover the GLB monitor's screen quad (was 0.78×0.49,
          which left the GLB glass showing around it). 1.6 aspect kept. */}
      <planeGeometry args={[0.92, 0.575]} />
      <meshStandardMaterial
        map={tex}
        emissiveMap={tex}
        emissive="#ffffff"
        emissiveIntensity={0.45}
        toneMapped={false}
        userData={{ baseEmissive: 0.45 }}
      />
    </mesh>
  )
}

/** Laptop lid screen — owner still (screens/laptop.png), aspect 1.6. Suspends
 *  locally (§21.1). */
function LaptopScreen() {
  const tex = useLoader(THREE.TextureLoader, import.meta.env.BASE_URL + 'screens/laptop.png')
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return (
    <mesh position={[0, 0, 0.013]}>
      <planeGeometry args={[0.5, 0.3125]} />
      <meshStandardMaterial
        map={tex}
        emissiveMap={tex}
        emissive="#ffffff"
        emissiveIntensity={0.55}
        toneMapped={false}
        userData={{ baseEmissive: 0.55 }}
      />
    </mesh>
  )
}

export default function Desk() {
  const glowTex = getGlowTexture()

  return (
    <Hotspot id="desk" hit={{ size: [2.1, 1.5, 1.0], position: [-1.7, 0.95, -1.6] }}>
      {/* Desk in the back-LEFT corner (§19.2). GLB rotated so its monitor faces
          +Z (into the room). */}
      <group position={[-1.7, 0, -2.0]}>
        {/* §23.4: owner-image GLB desk (width 2.0), monitor+lamp baked in. rotY=π
            turns the −Z-facing screen to +Z. Suspends locally (§21.1). */}
        <Suspense fallback={null}>
          <GlbModel slug="desk" width={2.0} rotY={Math.PI + 0.55} />
        </Suspense>

        {/* Monitor overlay — position/tilt found visually against the yawed GLB.
            v15fix: the desk GLB is yawed rotY=π+0.55 to face the resting camera
            (corner-desk angle, §defect2b), so the overlay is rotated the SAME
            0.55 about Y to stay COPLANAR with the GLB screen face, plus the
            ≈0.12 back-tilt. Position is the screen-quad centre in desk-local
            space (found visually). Carries the cyan glow halo + dashboard plane. */}
        <group position={[0.0, 1.46, 0.1]} rotation={[0.12, 0.55, 0]}>
          {/* soft cyan glow halo behind the screen (kept from the procedural
              build; noPick decorative billboard, §19.7). */}
          <sprite position={[0, 0, -0.14]} scale={[1.5, 1.05, 1]} userData={{ noPick: true }}>
            <spriteMaterial
              map={glowTex}
              color={PAL.cyan}
              transparent
              opacity={0.42}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </sprite>
          {/* owner dashboard still on a plane sitting ~0.01 in front of the GLB
              glass (§23.4). Suspends locally (§21.1). */}
          <group position={[0, 0, 0.02]}>
            <Suspense fallback={null}>
              <MonitorScreen />
            </Suspense>
          </group>
        </group>

        {/* KEPT procedural laptop (§23.4) on the GLB desktop surface, beside the
            monitor. v15fix: lid stands OPEN (recline ≈0.32 rad, was −1.15 which
            lay the lid nearly flat and read as a slab, §defect2c) and the whole
            unit yaws +0.55 to face the resting camera like the desk. The
            laptop.png screen now angles toward the viewer. Desk-surface top
            ≈y0.95 after the width-2.0 scale (found visually). */}
        <group position={[0.5, 0.95, 0.34]} rotation={[0, 0.55, 0]}>
          {/* base / keyboard deck */}
          <RoundedBox args={[0.56, 0.03, 0.4]} radius={0.015} smoothness={2} castShadow>
            <meshStandardMaterial color={PAL.base} roughness={0.4} metalness={0.35} />
          </RoundedBox>
          {/* hinged lid — stands open, reclined ~18° from vertical, screen +Z */}
          <group position={[0, 0.19, -0.19]} rotation={[-0.32, 0, 0]}>
            <RoundedBox args={[0.56, 0.38, 0.02]} radius={0.012} smoothness={2} castShadow>
              <meshStandardMaterial color="#050b18" roughness={0.35} metalness={0.3} />
            </RoundedBox>
            <Suspense fallback={null}>
              <LaptopScreen />
            </Suspense>
          </group>
        </group>
      </group>
    </Hotspot>
  )
}
