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
    <Hotspot id="desk" hit={{ size: [2.2, 1.5, 1.2], position: [-1.5, 0.95, -1.8] }}>
      {/* Desk FLUSH along the BACK wall (§23.7-yaw, §23.8 remeasure): the dense
          band's back face measured z−2.33 at group z−1.96, so z−2.01 rests it at
          the back-wall plane (z−2.38, +0.02 gap); the desktop extends FORWARD into
          the room, leaving room for the chair at z≈−1.2. The baked monitor
          reclines back BEHIND the wall plane (hidden by the opaque wall box).
          x−1.5 tucks the desk into the back-left corner (owner's v11 choice). */}
      <group position={[-1.5, 0, -2.01]}>
        {/* §23.7-yaw (2026-07-11): the desk was the only diagonal object (old
            rotY=π+0.55). The TripoSR desk's internal yaw is ~−40° off axis; rotY=
            2.443 snaps the desktop long-edge parallel to the back wall and the
            monitor to face EXACTLY +Z (measured: snapToAxis −42°→−2°, obbLongEdge
            −37°→+3°). preRotX=0.16 / preRotZ=−0.06 keep the plumb levelling so the
            desktop is horizontal (the monitor.png plane + laptop sit flat ON it).
            Suspends locally (§21.1). */}
        <Suspense fallback={null}>
          <GlbModel slug="desk" width={2.0} rotY={2.443} preRotX={0.16} preRotZ={-0.06} />
        </Suspense>

        {/* Monitor overlay — re-anchored for §23.7-yaw (rotY=2.443, monitor faces
            +Z). Screen-finder measured the GLB glass centre at desk-local ≈(0.05,
            1.56, −0.20) reclined ~12° back, so the overlay sits just in FRONT of
            the glass (z−0.08) with a +X-axis back-tilt (0.2) to lie FLAT on it. No
            Y-rotation — the monitor is axis-aligned to +Z. Carries the cyan glow
            halo + dashboard plane. */}
        <group position={[0.05, 1.56, -0.08]} rotation={[0.2, 0, 0]}>
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
            monitor. Lid stands OPEN (recline ≈0.32 rad) and the unit faces +Z like
            the desk (§23.7-yaw — no more 0.55 azimuth). The desktop surface top
            sits ≈y1.28 after the new normalisation (screen-finder measured), so the
            base rests at 1.28 (no sink). Sits to the +X side of the monitor, near
            the desk front edge. */}
        <group position={[0.6, 1.28, 0.32]} rotation={[0, 0, 0]}>
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
