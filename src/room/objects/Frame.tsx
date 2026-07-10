import { Suspense } from 'react'
import * as THREE from 'three'
import { useLoader } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import Hotspot from '../Hotspot'
import { PAL } from '../palette'
import { getGlowTexture } from '../textures'

/**
 * 벽 액자 — the '대표 성과' hotspot (→ /story#work). A big wall frame on the LEFT
 * wall (−X), front (SPEC §19.2 — the reference's left-wall art, where the TV used
 * to be), its face turned into the room (+X).
 *
 * §21.5 v13: the canvas wordmark texture (+ the per-language TEXT + useLang
 * dependency) is RETIRED — the owner delivered `art/frame.png` (850×1078,
 * portrait ≈0.79, language-agnostic poster of "기획자의 진화"). The frame geometry
 * goes PORTRAIT to match, and the hit proxy resizes to the new portrait
 * silhouette. The artwork is an emissive plane (map + emissiveMap + emissive
 * #ffffff + toneMapped:false + matching userData.baseEmissive); emissiveIntensity
 * 0.42 keeps the bright poster title legible without blowing out. A warm gold
 * glow wash on the wall behind it is kept (sprite scales retuned to portrait).
 * The group is rotated so the face points +X.
 */

/** The portrait artwork plane — suspends on useLoader; wrapped locally in
 *  <Suspense> so a loading texture can't blank the whole room canvas (§21.1). */
function FrameArt() {
  const tex = useLoader(THREE.TextureLoader, import.meta.env.BASE_URL + 'art/frame.png')
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  // Art plane 1.10 × 1.395 (≈0.789 = the image's true ratio) at z 0.035 — §22.3
  // v14 enlarges it (was 1.02 × 1.29) so the dark border margin is thin (≈0.03 x
  // / ≈0.0125 y) and the pale ring the owner flagged is gone.
  return (
    <mesh position={[0, 0, 0.035]}>
      <planeGeometry args={[1.10, 1.395]} />
      <meshStandardMaterial
        map={tex}
        emissiveMap={tex}
        emissive="#ffffff"
        emissiveIntensity={0.42}
        toneMapped={false}
        userData={{ baseEmissive: 0.42 }}
      />
    </mesh>
  )
}

export default function Frame() {
  const glowTex = getGlowTexture()

  return (
    // §21.5: hit proxy → portrait silhouette [0.16, 1.5, 1.2], same centre.
    <Hotspot id="frame" hit={{ size: [0.16, 1.5, 1.2], position: [-2.3, 1.5, 1.05] }}>
      {/* Left wall (−X), front — the reference's art-wall position; faces +X.
          Centre stays y1.5 (top ≈2.21 < wall 2.4 — clear). */}
      <group position={[-2.34, 1.5, 1.05]} rotation={[0, Math.PI / 2, 0]}>
        {/* broad warm gold wash on the wall behind the frame. noPick: this glow
            billboard is decorative and sits nearer the camera than the bookshelf
            behind it — without the flag its huge quad would shadow the bookshelf
            raycast and steal its hover/click (§19.2/§19.7). Scale retuned to the
            portrait silhouette (§21.5). */}
        <sprite position={[0, -0.1, -0.03]} scale={[3.2, 3.4, 1]} userData={{ noPick: true }}>
          <spriteMaterial
            map={glowTex}
            color={PAL.gold}
            transparent
            opacity={0.3}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </sprite>
        {/* soft warm halo tight around the lit frame (decorative → noPick).
            Scale retuned to the portrait silhouette (§21.5). */}
        <sprite position={[0, 0, -0.05]} scale={[2.0, 2.4, 1]} userData={{ noPick: true }}>
          <spriteMaterial
            map={glowTex}
            color={PAL.deskWarm}
            transparent
            opacity={0.24}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </sprite>
        {/* Frame border (rounded) — PORTRAIT to match the 850×1078 poster (§21.5).
            §22.3 v14: colour goes DARK (#141E33) — the artwork was designed with a
            black frame, so the old PAL.elev + gold wash read as a white mat (owner
            complaint). Kept the same [1.16, 1.42, 0.06] dimensions. */}
        <RoundedBox args={[1.16, 1.42, 0.06]} radius={0.025} smoothness={2} position={[0, 0, 0]} castShadow>
          <meshStandardMaterial color="#141E33" roughness={0.5} metalness={0.15} />
        </RoundedBox>
        {/* Owner poster (art/frame.png). Suspends locally so it never blanks the
            canvas while loading (§21.1). */}
        <Suspense fallback={null}>
          <FrameArt />
        </Suspense>
      </group>
    </Hotspot>
  )
}
