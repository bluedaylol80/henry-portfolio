import { Suspense } from 'react'
import * as THREE from 'three'
import { useLoader } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import Hotspot from '../Hotspot'
import { PAL } from '../palette'
import { getGlowTexture } from '../textures'

/**
 * TV (hotspot `tv`) — the '상세 이력' hotspot (→ Notion). A flat-panel screen on
 * a low media console on the BACK wall (−Z), right side, screen facing +Z into
 * the room. A warm burnt-orange glow halo sits behind the panel.
 *
 * §23.4-fix v15fix (TV FALLBACK — sanctioned by §23.4 "Fallback rule"): the v15
 * composite swap put the `tv` GLB into this slot and OVERLAID `screens/tv.png`
 * onto the GLB screen quad. Review found the overlay unrecoverable from the
 * resting view — the tv.png plane sat behind/offset from the GLB glass so the
 * panel read BLACK ("PLANNER EVOLVED" absent), and the GLB console washed white
 * under the warm light. Per §23.4 ("A half-aligned floating screen is WORSE than
 * the current build") this object reverts to the pre-v15 PROCEDURAL TV, which
 * renders tv.png cleanly on its own panel and grounds correctly. The GLB is no
 * longer loaded for the TV. Deviation recorded in the report.
 *
 * The group is NOT rotated: the screen already faces +Z (toward the sofa).
 */

/** The TV screen plane — suspends on useLoader; wrapped locally in <Suspense>
 *  so a still-loading texture can't blank the whole room canvas (§21.1). */
function TvScreen() {
  // BASE_URL-prefixed so GitHub Pages (served under /henry-portfolio/) resolves
  // the asset; never a root-absolute path (§21.1).
  const tex = useLoader(THREE.TextureLoader, import.meta.env.BASE_URL + 'screens/tv.png')
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8

  // 1.44 × 0.81 = 16:9 to match the 1280×720 asset.
  return (
    <mesh position={[0, 1.62, 0.056]}>
      <planeGeometry args={[1.44, 0.81]} />
      <meshStandardMaterial
        map={tex}
        emissiveMap={tex}
        emissive="#ffffff"
        emissiveIntensity={0.5}
        toneMapped={false}
        userData={{ baseEmissive: 0.5 }}
      />
    </mesh>
  )
}

export default function Tv() {
  const glowTex = getGlowTexture()

  return (
    <Hotspot id="tv" hit={{ size: [1.7, 2.2, 0.62], position: [0.85, 1.1, -2.0] }}>
      {/* Wall-mounted on the back wall (−Z), right side; screen faces +Z. */}
      <group position={[0.85, 0, -2.0]} rotation={[0, 0, 0]}>
        {/* Warm burnt-orange halo behind the panel (reference-style TV glow).
            noPick: decorative billboard, never a raycast target (§19.7). */}
        <sprite position={[0, 1.62, -0.18]} scale={[3.2, 2.4, 1]} userData={{ noPick: true }}>
          <spriteMaterial
            map={glowTex}
            color={PAL.burnt}
            transparent
            opacity={0.42}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </sprite>

        {/* Low media console */}
        <RoundedBox
          args={[1.5, 0.42, 0.5]}
          radius={0.03}
          smoothness={2}
          position={[0, 0.24, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color={PAL.elev} roughness={0.5} metalness={0.14} />
        </RoundedBox>
        {/* console front seam + a warm accent line */}
        <mesh position={[0, 0.24, 0.255]}>
          <boxGeometry args={[1.44, 0.02, 0.01]} />
          <meshStandardMaterial
            color={PAL.gold}
            emissive={PAL.gold}
            emissiveIntensity={0.5}
            toneMapped={false}
            userData={{ baseEmissive: 0.5 }}
          />
        </mesh>
        {/* two little console feet suggested by a base bar */}
        <mesh position={[0, 0.03, 0]}>
          <boxGeometry args={[1.44, 0.05, 0.44]} />
          <meshStandardMaterial color={PAL.base} roughness={0.7} metalness={0.1} />
        </mesh>

        {/* Flat-panel body (thin, wall-mounted high above the console) — a large
            screen like the reference's TV. */}
        <RoundedBox
          args={[1.6, 0.98, 0.06]}
          radius={0.02}
          smoothness={2}
          position={[0, 1.62, 0.02]}
          castShadow
        >
          <meshStandardMaterial color="#050b18" roughness={0.32} metalness={0.35} />
        </RoundedBox>
        {/* Screen — owner PNG (screens/tv.png). Suspends locally so it never
            blanks the canvas while the texture loads (§21.1). */}
        <Suspense fallback={null}>
          <TvScreen />
        </Suspense>
        {/* Slim wall-mount bracket behind the panel (no floor stand) */}
        <mesh position={[0, 1.62, -0.04]}>
          <boxGeometry args={[0.16, 0.34, 0.04]} />
          <meshStandardMaterial color={PAL.base} roughness={0.4} metalness={0.4} />
        </mesh>
      </group>
    </Hotspot>
  )
}
