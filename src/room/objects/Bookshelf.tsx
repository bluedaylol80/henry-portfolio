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
    <Hotspot id="bookshelf" hit={{ size: [0.55, 2.5, 1.15], position: [-2.13, 1.25, -0.76] }}>
      {/* Mid LEFT wall (§19.2), FLUSH — §23.8 remeasure (2026-07-12): the layout
          harness (scripts/measure-layout.mjs, dense p02/p98 vertex band) showed the
          v15.2 pose actually faced +Z with its 1.08 width along X — floating 1.7m
          off every wall mid-room. The REAL dense unit is 1.08 wide × 0.48 deep.
          Fix: wrap rotY=+π/2 turns the open front to +X (into the room), width now
          runs along Z; group x −2.12 rests the dense back face at the left-wall
          plane (x −2.38), z −0.76 sits it between the desk corner (desk front
          z −1.56) and the guitar/frame stretch (guitar z ≈ 0.0+).
          Hit proxy hugs the measured dense unit (0.55×2.5×1.15 at x −2.13) — never
          the mesh Box3 (stray fragments shadow the desk raycast, v15.2 gotcha). */}
      <group position={[-2.12, 0, -0.76]}>
        {/* §23.7-yaw: preRotY=+0.405 squares the ~23° baked content yaw BEFORE
            normalisation (measured: obbLongEdge 23°→0.16°); preRotX=0.26 keeps the
            plumb correction. §23.8: with the content squared, the wide open front
            faces +Z — so rotY=+π/2 (NOT 0) faces it +X off the left wall
            (verified by the measure-layout dense axes). Suspends locally (§21.1). */}
        <Suspense fallback={null}>
          <GlbModel slug="bookshelf" height={2.5} rotY={Math.PI / 2} preRotX={0.26} preRotY={0.405} />
        </Suspense>

        {/* 5 KEPT chapter books, spines in phase colours (semantic career phases).
            §23.8: after the rotY=+π/2 facing fix the shelf's open front sits at
            group-local x ≈ +0.22 (measured dense half-depth 0.24, centre offset
            −0.02) and the width runs along Z (half ≈ 0.54). Boards stay at world
            Y ≈ {0.82, 1.39, 1.69, 2.22} (yaw-invariant). Books seat on the y1.39
            board, spines just inside the front lip (x0.12) and spread along Z
            (±0.42 fits the ±0.54 width with margin). */}
        {PHASE_COLORS.map((c, i) => {
          const z = -0.42 + i * 0.21
          const h = 0.24 - (i % 2) * 0.03
          return (
            <mesh key={i} position={[0.12, 1.39 + h / 2, z]} castShadow>
              <boxGeometry args={[0.12, h, 0.14]} />
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
