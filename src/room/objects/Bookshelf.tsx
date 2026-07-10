import { Suspense, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useLoader } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import Hotspot from '../Hotspot'
import { PAL, PHASE_COLORS } from '../palette'

/**
 * 책장 — the career hotspot (→ /career). A TALL floor-standing bookshelf against
 * the LEFT wall (−X): two shelf levels, the upper one holding the five career
 * "chapter" books whose spines run through the five phase colours (gold → mint).
 * Rounded edges + soft shadows for the baked look. A guitar prop leans beside it
 * (see RoomShell). Mesh-lean to respect the ≤95 budget.
 *
 * §21.7 v13: the plain lower-shelf storage box is replaced with a BOOKS block
 * carrying the owner-delivered `textures/books.png` spine strip on the
 * room-facing +X face only. The 5 phase-colour chapter books on the UPPER shelf
 * stay — they are semantic (career phases), not decoration.
 */

/** Books block on the lower shelf (§21.7). A box [0.24, 0.5, 1.4] whose +X
 *  (room-facing) face shows the owner spine strip; the other 5 faces are a flat
 *  dark tone. boxGeometry material-array order is [+X, −X, +Y, −Y, +Z, −Z].
 *  The +X face is 1.4(z) × 0.5(y) = 2.8:1 while the strip is 8:1, so a
 *  horizontal window (repeat.x≈0.35, offset.x≈0.3) keeps the spines at their
 *  true proportions. Suspends locally so a loading texture can't blank the
 *  canvas (§21.1). */
function BooksBlock() {
  // BASE_URL-prefixed for GitHub Pages (§21.1); never root-absolute.
  const tex = useLoader(THREE.TextureLoader, import.meta.env.BASE_URL + 'textures/books.png')

  // Build the 6-material array once (order [+X, −X, +Y, −Y, +Z, −Z]); only the
  // +X (room-facing) face carries the spine strip, the other 5 are flat dark.
  const mats = useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
    // Window a slice of the 8:1 strip onto the 2.8:1 face so spines stay upright
    // and un-stretched (§21.7 — verified visually; adjust rotation/offset only if
    // the shot shows them sideways/mirrored).
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(0.35, 1)
    tex.offset.set(0.3, 0)
    const dark = new THREE.MeshStandardMaterial({ color: '#16233E', roughness: 0.7, metalness: 0.08 })
    const face = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0.05 })
    return [face, dark, dark, dark, dark, dark] as THREE.Material[]
  }, [tex])

  // Dispose the two owned materials on unmount (the shared TextureLoader cache
  // owns the texture itself, so we leave that to R3F).
  useEffect(
    () => () => {
      mats[0].dispose()
      mats[1].dispose()
    },
    [mats],
  )

  return (
    <mesh position={[0, 0.925, 0]} material={mats} castShadow>
      <boxGeometry args={[0.24, 0.5, 1.4]} />
    </mesh>
  )
}

export default function Bookshelf() {
  return (
    <Hotspot id="bookshelf" hit={{ size: [0.5, 2.6, 1.78], position: [-2.06, 1.3, -0.45] }}>
      {/* Mid LEFT wall (§19.2), the unit runs along Z beside the wall. */}
      <group position={[-2.06, 0, -0.45]}>
        {/* Side panels + back + top cap */}
        <RoundedBox args={[0.42, 2.5, 0.06]} radius={0.02} smoothness={2} position={[0, 1.25, -0.82]} castShadow receiveShadow>
          <meshStandardMaterial color={PAL.elev} roughness={0.62} metalness={0.12} />
        </RoundedBox>
        <RoundedBox args={[0.42, 2.5, 0.06]} radius={0.02} smoothness={2} position={[0, 1.25, 0.82]} castShadow receiveShadow>
          <meshStandardMaterial color={PAL.elev} roughness={0.62} metalness={0.12} />
        </RoundedBox>
        <mesh position={[-0.19, 1.25, 0]} receiveShadow>
          <boxGeometry args={[0.03, 2.5, 1.62]} />
          <meshStandardMaterial color={PAL.wallB} roughness={0.9} />
        </mesh>
        <RoundedBox args={[0.42, 0.06, 1.7]} radius={0.02} smoothness={2} position={[0, 2.52, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={PAL.elev} roughness={0.6} metalness={0.12} />
        </RoundedBox>

        {/* Two shelf planks (upper = chapter books, lower = the books block) */}
        <RoundedBox args={[0.4, 0.05, 1.62]} radius={0.015} smoothness={2} position={[0, 1.5, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={PAL.baseboard} roughness={0.6} metalness={0.14} />
        </RoundedBox>
        <RoundedBox args={[0.4, 0.05, 1.62]} radius={0.015} smoothness={2} position={[0, 0.65, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={PAL.baseboard} roughness={0.6} metalness={0.14} />
        </RoundedBox>

        {/* 5 chapter books on the upper shelf, spines in phase colours (KEPT —
            semantic career phases, not decoration; §21.7). */}
        {PHASE_COLORS.map((c, i) => {
          const z = -0.62 + i * 0.31
          const lean = i === 3 ? 0.16 : 0
          const h = 0.56 - (i % 2) * 0.06
          return (
            <mesh key={i} position={[0, 1.55 + h / 2, z]} rotation={[0, 0, lean]} castShadow>
              <boxGeometry args={[0.2, h, 0.22]} />
              <meshStandardMaterial
                color={c}
                emissive={c}
                emissiveIntensity={0.26}
                roughness={0.6}
                toneMapped={false}
                userData={{ baseEmissive: 0.26 }}
              />
            </mesh>
          )
        })}

        {/* Books block on the lower shelf (§21.7) — owner spine strip on the +X
            face, sits on the y0.65 plank. Suspends locally (§21.1). */}
        <Suspense fallback={null}>
          <BooksBlock />
        </Suspense>
      </group>
    </Hotspot>
  )
}
