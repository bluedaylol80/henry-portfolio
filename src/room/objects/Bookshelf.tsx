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
            §23.4). They stand on ONE visible GLB shelf level (the top shelf, top
            surface ≈y1.86 in this group's frame), proud at the room-facing front
            (+X≈0.3) and spread along Z. Book spines face +X so the colours read
            from the resting camera. x/y/z found visually against the GLB. */}
        {PHASE_COLORS.map((c, i) => {
          const z = -0.42 + i * 0.2
          const h = 0.34 - (i % 2) * 0.04
          // v15fix: after the preRotX=0.26 levelling the top shelf surface sits
          // ≈y1.76 in this group's frame — the books were floating (base 1.86),
          // so they drop to sit ON the shelf with headroom to the shelf above. x
          // pulled back to 0.24 to stay within the shelf's front edge.
          return (
            <mesh key={i} position={[0.24, 1.76 + h / 2, z]} castShadow>
              <boxGeometry args={[0.13, h, 0.14]} />
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
