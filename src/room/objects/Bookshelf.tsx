import { Suspense } from 'react'
import { useGLTF } from '@react-three/drei'
import Hotspot from '../Hotspot'
import { PHASE_COLORS } from '../palette'
import { GlbModel, modelUrl } from '../glb'

/**
 * 책장 — the career hotspot (→ /career). A TALL floor-standing bookshelf against
 * the LEFT wall (−X).
 *
 * §23.4 v15 (composite swap): the procedural side panels/shelves/back + the v13
 * `textures/books.png` block are REPLACED by the owner-image GLB `bookshelf`
 * (height 2.5) — an open shelf whose books are baked into the mesh. The GLB's
 * open front faces +Z raw, so it is rotated rotY=−π/2 to face +X (into the room,
 * off the left wall). The v13 books.png block is DELETED (books are in the GLB).
 * The 5 phase-colour "chapter" books are KEPT (semantic: career phases) and stand
 * on ONE clearly-visible GLB shelf level (y found visually).
 */

useGLTF.preload(modelUrl('bookshelf'))

export default function Bookshelf() {
  return (
    <Hotspot id="bookshelf" hit={{ size: [0.5, 2.6, 1.78], position: [-2.06, 1.3, -0.45] }}>
      {/* Mid LEFT wall (§19.2), the unit runs along Z beside the wall. */}
      <group position={[-2.06, 0, -0.45]}>
        {/* §23.4: owner-image GLB bookshelf (height 2.5). rotY=−π/2 turns the
            +Z-facing open front to +X (into the room). Suspends locally (§21.1). */}
        <Suspense fallback={null}>
          <GlbModel slug="bookshelf" height={2.5} rotY={-Math.PI / 2} preRotX={0.26} />
        </Suspense>

        {/* 5 KEPT chapter books, spines in phase colours (semantic career phases;
            §23.4 / §23.6-calib). v16: the books previously stood in the TOP cavity
            where they overlapped the GLB's own baked books + the top rail and read
            as oversized floating blocks. They now sit INSIDE the clearly-EMPTY
            second-from-top shelf cavity (floor ≈y1.16 in this group's frame after
            the height-2.5 scale + preRotX levelling), SHORTER than the cavity so
            they seat with headroom. Spines face +X (into the room) at the shelf's
            front edge; spread along Z. x/y/z/scale found visually against the GLB
            crop. */}
        {PHASE_COLORS.map((c, i) => {
          const z = -0.12 + i * 0.14
          const h = 0.22 - (i % 2) * 0.03
          return (
            <mesh key={i} position={[0.22, 1.2 + h / 2, z]} castShadow>
              <boxGeometry args={[0.11, h, 0.1]} />
              <meshStandardMaterial
                color={c}
                emissive={c}
                emissiveIntensity={0.32}
                roughness={0.6}
                toneMapped={false}
                userData={{ baseEmissive: 0.32 }}
              />
            </mesh>
          )
        })}
      </group>
    </Hotspot>
  )
}
