import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { ContactShadows, RoundedBox } from '@react-three/drei'
import { PAL } from '../palette'
import {
  getWoodTextures,
  getGlowTexture,
  getSlatTexture,
  getRugTexture,
  getWallTexture,
  disposeRoomTextures,
} from '../textures'

/**
 * Corner diorama — the "baked-looking" warm miniature room (SPEC §13.3), laid
 * out to match the my-room-in-3d reference in our navy/gold/mint palette
 * (SPEC §19.2):
 *   back wall (−Z):  desk+chair (corner, left) · window slat light · TV+console
 *                    (right, warm backlit) · plant + server (corner, right)
 *   left wall (−X):  tall bookshelf (mid) + guitar prop · frame (front) ·
 *                    speaker (front)
 *   centre:          sofa facing the TV (−Z) + low coffee table on the TV axis
 *
 * Real-time recipe approximating the bake:
 *  - a cool blue-white directional "window light" from the open corner (soft PCF
 *    shadows, full tier) with a venetian-slat gobo patch on the back wall between
 *    the desk and the TV,
 *  - a warm gold desk spot (shadowed) + a mint accent point at the server,
 *  - a procedural walnut plank floor + a soft navy fabric rug under the centre,
 *  - big soft colour glows (burnt-orange behind the TV, a warm wash on the frame
 *    wall, warm pool under the desk lamp) like the reference's TV glow.
 *
 * Lite tier: no shadow maps (renderer handles that), we keep ContactShadows.
 * Everything created here is disposed on unmount (textures + geometries).
 */
export default function RoomShell({ full }: { full: boolean }) {
  const wood = useMemo(() => getWoodTextures(), [])
  const glowTex = useMemo(() => getGlowTexture(), [])
  const slatTex = useMemo(() => getSlatTexture(), [])
  const rugTex = useMemo(() => getRugTexture(), [])
  const wallWarmTex = useMemo(() => getWallTexture(true), []) // back wall
  const wallCoolTex = useMemo(() => getWallTexture(false), []) // left wall

  // wood UVs: repeat a little so planks aren't oversized, diagonal rotation.
  const woodMap = useMemo(() => {
    const m = wood.map.clone()
    m.needsUpdate = true
    m.repeat.set(1.6, 1.6)
    m.center.set(0.5, 0.5)
    m.rotation = Math.PI / 4
    return m
  }, [wood])
  const woodRough = useMemo(() => {
    const r = wood.rough.clone()
    r.needsUpdate = true
    r.repeat.set(1.6, 1.6)
    r.center.set(0.5, 0.5)
    r.rotation = Math.PI / 4
    return r
  }, [wood])

  // ── Finite-shell wall materials (§17.3) ─────────────────────────
  // Each wall is a THICK box; only its INNER face carries the baked §17.2
  // gradient map, the other faces get a dark plinth tone so the outside of the
  // diorama reads as a crisp model-kit box (not a fogged plane). boxGeometry
  // material-array order is [+X, −X, +Y, −Y, +Z, −Z].
  const wallMats = useMemo(() => {
    const plinth = () =>
      new THREE.MeshStandardMaterial({ color: '#0B1526', roughness: 0.9, metalness: 0.02 })
    const inner = (map: THREE.Texture) =>
      new THREE.MeshStandardMaterial({ map, roughness: 0.94, metalness: 0.02 })
    // Back wall (z=−2.47): inner face points +Z (index 4).
    const back: THREE.Material[] = [plinth(), plinth(), plinth(), plinth(), inner(wallWarmTex), plinth()]
    // Left wall (x=−2.47): inner face points +X (index 0).
    const left: THREE.Material[] = [inner(wallCoolTex), plinth(), plinth(), plinth(), plinth(), plinth()]
    return { back, left }
  }, [wallWarmTex, wallCoolTex])

  // directional light target sits at room centre so shadows fall inward.
  const lightTarget = useRef<THREE.Object3D>(new THREE.Object3D())

  useEffect(() => {
    lightTarget.current.position.set(-0.3, 0.4, -0.3)
    return () => {
      // clones + per-instance wall materials are ours; free them + the shared
      // texture cache on real unmount.
      woodMap.dispose()
      woodRough.dispose()
      wallMats.back.forEach((m) => m.dispose())
      wallMats.left.forEach((m) => m.dispose())
      disposeRoomTextures()
    }
  }, [woodMap, woodRough, wallMats])

  return (
    <group>
      {/* ── Lights ─────────────────────────────────────────────── */}
      {/* low warm ambient so darks aren't crushed — warmer + a touch brighter so
          the room reads as a cosy baked miniature, not neon-in-the-dark. */}
      <ambientLight intensity={1.02} color="#84808c" />
      <hemisphereLight args={['#4a5578', '#3a2c20', 1.15]} />

      {/* Cool blue-white "window" directional — enters from the open corner,
          casts soft shadows across the floor (full tier only). */}
      <primitive object={lightTarget.current} />
      <directionalLight
        color={PAL.windowLight}
        intensity={3.2}
        position={[5.5, 6.5, 4.5]}
        target={lightTarget.current}
        castShadow={full}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={20}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-bias={-0.0006}
        shadow-radius={5}
      />

      {/* Warm gold desk spot (back-LEFT corner, over the desk) — shadowed.
          Follows the desk into the corner (§19.2). */}
      <spotLight
        color={PAL.deskWarm}
        intensity={40}
        distance={10}
        angle={0.82}
        penumbra={0.9}
        decay={2}
        position={[-1.85, 3.0, -1.2]}
        target-position={[-1.7, 0.8, -1.9]}
        castShadow={full}
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-bias={-0.0008}
      />

      {/* Mint accent at the server (back-right corner) — no shadow. */}
      <pointLight position={[2.0, 1.9, -1.5]} color={PAL.mint} intensity={9} distance={6} decay={2} />
      {/* faint warm bounce in front of the TV on the back wall (right, §19.2) */}
      <pointLight position={[0.85, 1.7, -1.7]} color={PAL.burnt} intensity={3.2} distance={4.5} decay={2} />
      {/* Soft warm FILL from the camera side — lifts object front-faces and the
          foreground floor so the diorama reads cosy, not murky (no shadow).
          Was 38 (+ an extra 26 foreground fill) while SSAO ate ~half the scene
          light; SSAO is gone (v10 amendment) so the fill returns near spec
          §17.4 level or the room washes out past the luma ceiling. */}
      <pointLight position={[3.4, 3.2, 3.4]} color="#ffe6c2" intensity={18} distance={15} decay={2} />
      {/* gentle cool bounce into the shadowed back-left corner (bookshelf) */}
      <pointLight position={[-1.6, 2.2, -1.6]} color="#9fb4e0" intensity={4} distance={6} decay={2} />

      {/* ── Floor (walnut planks) — finite slab (§17.3) ─────────── */}
      {/* A thick RoundedBox slab in a dark plinth tone (its sides read as the
          crisp edge of a floating model, not a plane fading into fog); the wood
          map rides a thin plane sitting on the top face at y=0 (0.001 above the
          slab top → no z-fighting). */}
      <RoundedBox
        args={[5.2, 0.26, 5.2]}
        radius={0.05}
        smoothness={2}
        position={[0, -0.13, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#0B1526" roughness={0.9} metalness={0.02} />
      </RoundedBox>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} receiveShadow>
        <planeGeometry args={[5.2, 5.2]} />
        <meshStandardMaterial
          map={woodMap}
          roughnessMap={woodRough}
          roughness={0.72}
          metalness={0.02}
          color="#c9c9c9"
        />
      </mesh>

      {/* Soft navy fabric rug under the centre seating / coffee-table zone —
          shifted right with the sofa/table to sit on the TV axis (§19.2). */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.5, 0.012, 0.15]} receiveShadow>
        <planeGeometry args={[3.2, 2.8]} />
        <meshStandardMaterial map={rugTex} roughness={0.95} metalness={0} color={PAL.rugTone} />
      </mesh>

      {/* ── Walls — finite thick boxes (§17.3) ─────────────────── */}
      {/* Back wall (−Z): box centre z=−2.47, thickness 0.14 → inner face stays
          EXACTLY at z=−2.4 (§14.2 lock). The inner (+Z) face carries the §17.2
          warm gradient map; the other faces are the dark plinth tone. */}
      <mesh position={[0, 1.65, -2.47]} receiveShadow material={wallMats.back}>
        <boxGeometry args={[5.2, 3.3, 0.14]} />
      </mesh>
      {/* Left wall (−X): box centre x=−2.47 → inner (+X) face stays at x=−2.4. */}
      <mesh position={[-2.47, 1.65, 0]} receiveShadow material={wallMats.left}>
        <boxGeometry args={[0.14, 3.3, 5.2]} />
      </mesh>

      {/* Lighter "model-kit" rim highlight along each wall's top edge (§17.3). */}
      <mesh position={[0, 3.3, -2.47]}>
        <boxGeometry args={[5.24, 0.05, 0.18]} />
        <meshStandardMaterial color="#4A6191" roughness={0.6} metalness={0.05} />
      </mesh>
      <mesh position={[-2.47, 3.3, 0]}>
        <boxGeometry args={[0.18, 0.05, 5.24]} />
        <meshStandardMaterial color="#4A6191" roughness={0.6} metalness={0.05} />
      </mesh>

      {/* Baseboard trim where walls meet floor — sized to the finite 5.2 shell
          (§17.3) so it doesn't overhang into the dark background. */}
      <mesh position={[0, 0.09, -2.36]}>
        <boxGeometry args={[5.2, 0.18, 0.06]} />
        <meshStandardMaterial color={PAL.baseboard} roughness={0.85} metalness={0.05} />
      </mesh>
      <mesh position={[-2.36, 0.09, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[5.2, 0.18, 0.06]} />
        <meshStandardMaterial color={PAL.baseboard} roughness={0.85} metalness={0.05} />
      </mesh>

      {/* ── Soft colour glows (like the reference's TV glow) ───── */}
      {/* Cool window patch with venetian slats on the BACK wall, between the
          desk corner and the TV (§19.2 — a modest panel, narrowed + dimmed so it
          reads as one window, not a wall of blinds crowding the TV). §20.2-6:
          lowered to centre ≈y2.3 so it reads as a mid-wall window (was floating
          near the wall top); stays clear of the TV panel (TV top ≈y2.11 at x0.85,
          this sits at x−0.25). */}
      <mesh position={[-0.25, 2.3, -2.37]}>
        <planeGeometry args={[1.1, 1.7]} />
        <meshBasicMaterial
          map={slatTex}
          transparent
          opacity={0.62}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {/* Warm burnt halo behind the TV on the BACK wall (§19.2 — the old left-
          wall TV halo, moved here with the TV; burnt-orange like the reference).
          noPick: decorative billboard, never a raycast target (§19.7). */}
      <sprite position={[0.85, 1.7, -2.36]} scale={[3.2, 3.2, 1]} userData={{ noPick: true }}>
        <spriteMaterial
          map={glowTex}
          color={PAL.burnt}
          transparent
          opacity={0.34}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>
      {/* Warm pool on the floor under the desk area (back-LEFT corner) — dialed
          DOWN (§17.2): the light is now BAKED into the wood, so the additive
          haze only needs to hint (it read as fog over dark wood before). */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.7, 0.02, -1.3]}>
        <planeGeometry args={[3.0, 3.0]} />
        <meshBasicMaterial
          map={glowTex}
          color={PAL.deskWarm}
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {/* Cool mint pool on the floor at the server (back-right corner) — dialed
          DOWN (§17.2), light baked into the wood. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.0, 0.02, -1.6]}>
        <planeGeometry args={[2.4, 2.4]} />
        <meshBasicMaterial
          map={glowTex}
          color={PAL.mint}
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* ── NON-hotspot props (life, not menu) ─────────────────── */}
      <Plant />
      <Guitar />
      <Chair />
      <Sofa />
      <CoffeeTable />

      {/* Soft contact shadow (grounds objects even on lite where maps are off) */}
      <ContactShadows
        position={[0, 0.015, 0]}
        scale={10}
        resolution={full ? 512 : 256}
        blur={2.8}
        opacity={0.42}
        far={4}
        color="#02060f"
        frames={full ? Infinity : 1}
      />
    </group>
  )
}

/* ─────────────────────────────────────────────────────────────
 *  Non-hotspot props — small modules kept in-file (private).
 * ───────────────────────────────────────────────────────────── */

/** Potted plant on the floor in the clear wall gap between the window and the TV
 *  console (§20.2-2). It previously sat at x=1.05 INSIDE the console footprint
 *  (console spans x≈0.1–1.6) so its leaves poked through the console top; moved
 *  to x≈−0.35 (window↔TV gap) with zero mesh intersection from the resting AND
 *  a slightly-orbited camera. */
function Plant() {
  const leaves: [number, number, number, number][] = [
    [0, 0.56, 0, 0.26],
    [0.17, 0.45, 0.05, 0.2],
    [-0.15, 0.47, -0.04, 0.2],
  ]
  return (
    <group position={[-0.35, 0, -2.02]}>
      {/* pot */}
      <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.17, 0.13, 0.32, 16]} />
        <meshStandardMaterial color={PAL.plantPot} roughness={0.8} metalness={0.05} />
      </mesh>
      {/* soil */}
      <mesh position={[0, 0.31, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.15, 16]} />
        <meshStandardMaterial color="#241811" roughness={1} />
      </mesh>
      {/* leaves */}
      {leaves.map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y + 0.18, z]} castShadow>
          <sphereGeometry args={[r, 12, 10]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? PAL.leaf : PAL.leafLight}
            roughness={0.85}
            metalness={0}
          />
        </mesh>
      ))}
    </group>
  )
}

/** Acoustic guitar leaning in the back-left corner between the bookshelf's rear
 *  end and the desk corner (§19.2, z≈−1.4) — pulled off the left wall so it reads
 *  in the gap rather than hiding flat against it or crowding the front. */
function Guitar() {
  return (
    <group position={[-1.9, 0, -1.32]} rotation={[0, 0.6, 0.18]}>
      {/* body (a flattened sphere → guitar-ish soundbox) */}
      <mesh position={[0, 0.46, 0]} scale={[1, 1.35, 0.6]} castShadow receiveShadow>
        <sphereGeometry args={[0.24, 18, 14]} />
        <meshStandardMaterial color={PAL.woodLight} roughness={0.55} metalness={0.05} />
      </mesh>
      {/* neck */}
      <mesh position={[0.02, 1.15, 0]} castShadow>
        <boxGeometry args={[0.08, 0.7, 0.05]} />
        <meshStandardMaterial color={PAL.woodDark} roughness={0.5} metalness={0.05} />
      </mesh>
      {/* headstock */}
      <mesh position={[0.02, 1.52, 0]} castShadow>
        <boxGeometry args={[0.1, 0.14, 0.04]} />
        <meshStandardMaterial color="#1a120b" roughness={0.5} />
      </mesh>
    </group>
  )
}

/** Gaming chair in front of the desk (NON-hotspot) — seat, backrest with a gold
 *  accent stripe, star base + gas column. Mesh-lean for the ≤95 budget. */
function Chair() {
  return (
    // §20.2-3: the backrest used to sit on local −Z (toward the desk), burying it
    // in the desk slab so the chair read as a stool. The backrest now faces the
    // VIEWER (local +Z) with a −0.16 recline, raised to gaming-chair proportions
    // (top ≈y1.2), and the whole chair is pulled slightly out (z −1.35 → −1.25) so
    // the resting camera sees a proper tall chair BACK like the reference.
    <group position={[-1.62, 0, -1.25]} rotation={[0, 0.1, 0]}>
      {/* star base (5-point cylinder) */}
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.34, 0.36, 0.05, 5]} />
        <meshStandardMaterial color={PAL.base} roughness={0.5} metalness={0.4} />
      </mesh>
      {/* gas column */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.42, 12]} />
        <meshStandardMaterial color="#0a1526" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* seat */}
      <RoundedBox args={[0.56, 0.12, 0.52]} radius={0.05} smoothness={2} position={[0, 0.56, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={PAL.sofa} roughness={0.7} metalness={0.05} />
      </RoundedBox>
      {/* backrest on the VIEWER side (+Z), tall + reclined, gold accent emissive.
          height 0.8, centre y0.8 → top ≈y1.2; +Z 0.24 offset clears the seat. */}
      <RoundedBox args={[0.54, 0.8, 0.12]} radius={0.06} smoothness={2} position={[0, 0.8, 0.24]} rotation={[-0.16, 0, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={PAL.sofa} emissive={PAL.gold} emissiveIntensity={0.06} roughness={0.7} metalness={0.05} />
      </RoundedBox>
    </group>
  )
}

/** Low floor sofa in the room centre, facing the TV on the back wall (−Z). */
function Sofa() {
  return (
    // backrest toward +Z so the seat faces the TV on the −Z wall; shifted right
    // onto the TV axis (§19.2).
    <group position={[0.5, 0, 1.15]} rotation={[0, Math.PI, 0]}>
      {/* seat base */}
      <RoundedBox args={[1.6, 0.34, 0.82]} radius={0.08} smoothness={2} position={[0, 0.2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={PAL.sofa} roughness={0.9} metalness={0} />
      </RoundedBox>
      {/* backrest */}
      <RoundedBox args={[1.6, 0.52, 0.22]} radius={0.08} smoothness={2} position={[0, 0.5, -0.32]} castShadow receiveShadow>
        <meshStandardMaterial color={PAL.sofa} roughness={0.9} metalness={0} />
      </RoundedBox>
      {/* two cushions */}
      <RoundedBox args={[0.66, 0.16, 0.62]} radius={0.07} smoothness={2} position={[-0.38, 0.44, 0.04]} castShadow>
        <meshStandardMaterial color={PAL.sofaCushion} roughness={0.92} metalness={0} />
      </RoundedBox>
      <RoundedBox args={[0.66, 0.16, 0.62]} radius={0.07} smoothness={2} position={[0.38, 0.44, 0.04]} castShadow>
        <meshStandardMaterial color={PAL.sofaCushion} roughness={0.92} metalness={0} />
      </RoundedBox>
    </group>
  )
}

/** Low coffee table in the centre (mug + gamepad sit on top) — on the TV axis. */
function CoffeeTable() {
  return (
    <group position={[0.5, 0, -0.12]}>
      {/* table top */}
      <RoundedBox args={[1.2, 0.06, 0.7]} radius={0.03} smoothness={2} position={[0, 0.42, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={PAL.elev} roughness={0.4} metalness={0.2} />
      </RoundedBox>
      {/* thin warm accent edge */}
      <mesh position={[0, 0.42, 0.355]}>
        <boxGeometry args={[1.16, 0.015, 0.008]} />
        <meshStandardMaterial color={PAL.gold} emissive={PAL.gold} emissiveIntensity={0.35} toneMapped={false} />
      </mesh>
      {/* 4 legs */}
      {(
        [
          [-0.52, -0.29],
          [0.52, -0.29],
          [-0.52, 0.29],
          [0.52, 0.29],
        ] as [number, number][]
      ).map(([x, z], i) => (
        <mesh key={i} position={[x, 0.2, z]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.4, 10]} />
          <meshStandardMaterial color={PAL.base} roughness={0.4} metalness={0.5} />
        </mesh>
      ))}
      {/* tiny gamepad prop on the table */}
      <Gamepad />
    </group>
  )
}

/** A small gamepad sitting on the coffee table (non-interactive prop). */
function Gamepad() {
  return (
    <group position={[-0.34, 0.47, 0.12]} rotation={[0, 0.5, 0]}>
      {/* body (rounded, with two suggested grips via a wider footprint) */}
      <RoundedBox args={[0.3, 0.06, 0.18]} radius={0.05} smoothness={3} castShadow>
        <meshStandardMaterial color={PAL.baseboard} roughness={0.5} metalness={0.2} />
      </RoundedBox>
      {/* a glowing button cluster (single mesh) */}
      <mesh position={[0.08, 0.04, -0.01]}>
        <cylinderGeometry args={[0.02, 0.02, 0.012, 12]} />
        <meshStandardMaterial color={PAL.mint} emissive={PAL.mint} emissiveIntensity={0.6} toneMapped={false} />
      </mesh>
    </group>
  )
}

/* §20.2-1: the CableStrip floor tube was DELETED — its metal caught the cool
 * window light and read as a stray blue line left of the server rack; the
 * my-room-in-3d reference has no floor cable. Component + usage removed. */
