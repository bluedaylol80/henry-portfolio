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
    <Hotspot id="bookshelf" hit={{ size: [0.8, 2.5, 1.4], position: [-2.0, 1.25, -0.4] }}>
      {/* Mid LEFT wall (§19.2), FLUSH: the aligned box depth (X) is 1.547, so the
          footprint-centre origin sits at x = −2.4 + 1.547/2 + 0.02 = −1.61 → the
          back face rests at the left-wall plane (x−2.4) + a 0.02 gap. Runs along
          Z beside the wall (§23.7-yaw).
          Hit proxy hugs the VISIBLE unit only (0.8×2.5×1.4 at x−2.0) — the mesh
          Box3 (1.5 deep) includes stray fragments, and a proxy that big shadowed
          the desk's raycast (desk hover read 책장, desk click went /career). */}
      <group position={[-1.61, 0, -0.45]}>
        {/* §23.7-yaw (2026-07-11): the TripoSR bookshelf has a ~23° YAW baked into
            its mesh content (the open shelves are skewed off the structural box).
            preRotY=+0.405 squares that skew to world axes BEFORE normalisation
            (measured: obbLongEdge 23°→0.16°), so the unit reads flat against the
            wall, not angled. With the content squared, rotY=0 already faces the
            wide open shelf front EXACTLY +X (into the room, off the left wall) —
            confirmed by the +X-side calibration render. preRotX=0.26 keeps the
            plumb correction. Suspends locally (§21.1). */}
        <Suspense fallback={null}>
          <GlbModel slug="bookshelf" height={2.5} rotY={0} preRotX={0.26} preRotY={0.405} />
        </Suspense>

        {/* 5 KEPT chapter books, spines in phase colours (semantic career phases;
            §23.7-yaw). After the preRotY squaring the shelf boards sit at measured
            world Y ≈ {0.82, 1.39, 1.69, 2.22} and the open front face is at local
            x ≈ +0.618. The books seat on the y1.39 board (clearly empty above it to
            the y1.69 board), spines at the front lip (local x0.42, just inside the
            0.618 front so they read as ON the shelf, not proud) and spread along
            the shelf width Z. Shorter than the ~0.30 cavity so they have headroom. */}
        {PHASE_COLORS.map((c, i) => {
          const z = -0.42 + i * 0.21
          const h = 0.24 - (i % 2) * 0.03
          return (
            <mesh key={i} position={[0.34, 1.39 + h / 2, z]} castShadow>
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
