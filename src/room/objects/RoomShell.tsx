import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useLoader } from '@react-three/fiber'
import { ContactShadows, RoundedBox, useGLTF } from '@react-three/drei'
import { PAL } from '../palette'
import { GlbModel, modelUrl } from '../glb'
import {
  getWoodTextures,
  getGlowTexture,
  getSlatTexture,
  getWallTexture,
  disposeRoomTextures,
} from '../textures'

// §23.1: preload the simple-swap furniture GLBs at module scope so the room's
// ≈2MB furniture payload fetches in parallel (draco decoder auto via drei CDN).
useGLTF.preload(modelUrl('chair'))
useGLTF.preload(modelUrl('sofa'))
useGLTF.preload(modelUrl('plant'))
useGLTF.preload(modelUrl('guitar'))

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

      {/* Owner-delivered rug (§21.6) under the centre seating / coffee-table
          zone — a real fabric PNG (textures/rug.png) replaces the old procedural
          navy rug. Suspends locally so a loading texture can't blank the canvas
          (§21.1). userData.noPick so it can never shadow a hotspot raycast. */}
      <Suspense fallback={null}>
        <Rug />
      </Suspense>

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

/** Owner-delivered rug (§21.6) — a flat fabric plane under the sofa/coffee-table
 *  zone. Plane 2.3(x) × 2.7(z), rotated flat (−π/2), centred [0.5, 0.006, 0.45]
 *  so it spans the coffee table ([0.5,0,−0.12]) and the sofa front ([0.5,0,1.15]).
 *  y=0.006 sits just above the wood floor top (y≈0.001) — no z-fighting shimmer
 *  observed; polygonOffset only if a shot shows one (§21.6). No emissive.
 *  userData.noPick so the flat quad never shadows a hotspot raycast (§21.6). */
function Rug() {
  // BASE_URL-prefixed for GitHub Pages (§21.1); never root-absolute.
  const tex = useLoader(THREE.TextureLoader, import.meta.env.BASE_URL + 'textures/rug.png')
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0.5, 0.006, 0.45]}
      receiveShadow
      userData={{ noPick: true }}
    >
      <planeGeometry args={[2.3, 2.7]} />
      <meshStandardMaterial map={tex} roughness={0.95} metalness={0} />
    </mesh>
  )
}

/** §23.2 — owner-image GLB potted plant on the floor in the clear wall gap
 *  between the window and the TV console (§20.2-2 slot kept). height 1.2; rotY
 *  found visually (a plant is near-symmetric so facing is cosmetic). Suspends
 *  locally so a loading GLB can't blank the canvas (§23.1). */
function Plant() {
  return (
    <group position={[-0.27, 0, -2.02]}>
      {/* §23.6-calib: preRotX=0.05 trues the pot's slight baked lean (the pot is
          near-plumb raw; the −20° PCA reading is the leaves splaying back). */}
      <Suspense fallback={null}>
        <GlbModel slug="plant" height={1.2} rotY={0} preRotX={0.05} />
      </Suspense>
    </group>
  )
}

/** §23.2 — owner-image GLB acoustic guitar leaning in the back-left corner
 *  between the bookshelf's rear end and the desk corner (§19.2 slot kept). Target
 *  height 1.0; the outer group carries the ≈0.12 rad Z-lean toward the left wall
 *  (§23.2), rotY orients the body/neck toward the viewer (found visually).
 *  Suspends locally (§23.1). */
function Guitar() {
  return (
    <group position={[-2.16, 0, 0.15]} rotation={[0, 0, 0.12]}>
      {/* §23.8 remeasure: the flush bookshelf now spans z[−1.34,−0.19] on the left
          wall, and at z0.6 the guitar's headstock crossed the frame's left edge
          (frame z0.47+). z0.15 stands it in the clear stretch BETWEEN the
          bookshelf and the frame, near the wall (x−2.16). Keeps its intentional
          ≈0.12-rad Z-lean toward the left wall (a posed lean, not a defect).
          preRotX=0.05 / preRotZ=−0.02 true the small ~8° baked lean so it hangs
          plumb BEFORE that deliberate lean. rotY=−0.6 angles the body toward the
          viewer. */}
      <Suspense fallback={null}>
        <GlbModel slug="guitar" height={1.0} rotY={-0.6} preRotX={0.05} preRotZ={-0.02} />
      </Suspense>
    </group>
  )
}

/** §23.2 — owner-image GLB gaming chair in front of the desk (NON-hotspot).
 *  height 1.25; slot kept (desk front, z≈−1.25). rotY turns the seat/back to FACE
 *  the desk (the desk is behind it at −Z, so the chair back faces the viewer like
 *  the reference). Found visually. Suspends locally (§23.1). */
function Chair() {
  return (
    <group position={[-1.45, 0, -1.2]}>
      {/* §23.7-yaw (2026-07-11): the old rotY=π/2 jammed the chair SIDEWAYS into the
          desk. The chair's internal yaw is ~+45° off axis; rotY=0.78 turns the
          seat to face the desk (world −Z) with the back toward the viewer, axis-
          aligned (calibration render confirmed the seat opening faces −Z). A tiny
          +0.12 life offset keeps it from looking robotically square. It sits at
          z−1.2, IN FRONT of the desktop front edge (≈z−1.54) so it never clips the
          desk. preRotX=0.05 / preRotZ=0.22 keep the plumb levelling. */}
      <Suspense fallback={null}>
        <GlbModel slug="chair" height={1.25} rotY={0.78 + 0.12} preRotX={0.05} preRotZ={0.22} />
      </Suspense>
    </group>
  )
}

/** §23.2 — owner-image GLB low floor sofa in the room centre, facing the TV on
 *  the back wall (−Z). width 1.9; slot [0.5,0,1.15] kept. rotY faces the seat
 *  toward −Z (the TV). Found visually. Suspends locally (§23.1). */
function Sofa() {
  return (
    <group position={[0.5, 0, 1.15]}>
      {/* §23.7-yaw (2026-07-11): the sofa read ~30–40° diagonal to the rug because
          its GLB internal yaw is ~+18° off axis. rotY=0.32 snaps it axis-aligned
          (measured snapToAxis 18°→1°, obbLongEdge 24°→6°), so its back edge is now
          PARALLEL to the rug edge and the seat faces EXACTLY −Z (toward the TV) —
          calibration render confirmed the back slab toward the viewer, seat toward
          −Z. preRotZ=−0.19 keeps the ~11° roll levelling (feet on a level line). */}
      <Suspense fallback={null}>
        <GlbModel slug="sofa" width={1.9} rotY={0.32} preRotZ={-0.19} />
      </Suspense>
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
