import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { ContactShadows, RoundedBox } from '@react-three/drei'
import { PAL } from '../palette'
import {
  getWoodTextures,
  getGlowTexture,
  getSlatTexture,
  getRugTexture,
  disposeRoomTextures,
} from '../textures'

/**
 * Corner diorama — the "baked-looking" warm miniature room (SPEC §13.3).
 *
 * We approximate the my-room-in-3d bake with real-time technique:
 *  - a cool blue-white directional "window light" entering from the open corner
 *    (soft PCF shadows on the full tier) with a venetian-slat gobo patch on the
 *    back wall,
 *  - a warm gold desk spot (shadowed) + a mint accent point at the server,
 *  - a procedural walnut plank floor (CanvasTexture map + roughnessMap, planks
 *    running diagonally) with a soft navy fabric rug under the centre,
 *  - big soft colour glows behind the arcade / under the desk lamp like the
 *    reference's TV glow, plus baseboard trim and NON-hotspot props for life.
 *
 * Lite tier: no shadow maps (renderer handles that), we keep ContactShadows.
 * Everything created here is disposed on unmount (textures + geometries).
 */
export default function RoomShell({ full }: { full: boolean }) {
  const wood = useMemo(() => getWoodTextures(), [])
  const glowTex = useMemo(() => getGlowTexture(), [])
  const slatTex = useMemo(() => getSlatTexture(), [])
  const rugTex = useMemo(() => getRugTexture(), [])

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

  // directional light target sits at room centre so shadows fall inward.
  const lightTarget = useRef<THREE.Object3D>(new THREE.Object3D())

  useEffect(() => {
    lightTarget.current.position.set(-0.3, 0.4, -0.3)
    return () => {
      // clones are per-instance; free them + the shared cache on real unmount.
      woodMap.dispose()
      woodRough.dispose()
      disposeRoomTextures()
    }
  }, [woodMap, woodRough])

  return (
    <group>
      {/* ── Lights ─────────────────────────────────────────────── */}
      {/* low warm ambient so darks aren't crushed — warmer + a touch brighter so
          the room reads as a cosy baked miniature, not neon-in-the-dark. */}
      <ambientLight intensity={0.66} color="#84808c" />
      <hemisphereLight args={['#4a5578', '#2b221a', 0.78]} />

      {/* Cool blue-white "window" directional — enters from the open corner,
          casts soft shadows across the floor (full tier only). */}
      <primitive object={lightTarget.current} />
      <directionalLight
        color={PAL.windowLight}
        intensity={2.6}
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

      {/* Warm gold desk spot (left, over the desk) — shadowed. */}
      <spotLight
        color={PAL.deskWarm}
        intensity={34}
        distance={10}
        angle={0.82}
        penumbra={0.9}
        decay={2}
        position={[-1.3, 3.0, -0.2]}
        target-position={[-1.0, 0.8, -1.3]}
        castShadow={full}
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-bias={-0.0008}
      />

      {/* Mint accent at the server (right) — no shadow. */}
      <pointLight position={[2.1, 1.9, 0.7]} color={PAL.mint} intensity={9} distance={6} decay={2} />
      {/* faint gold bounce toward the arcade */}
      <pointLight position={[2.0, 1.6, -1.2]} color={PAL.gold} intensity={5} distance={5} decay={2} />
      {/* Soft warm FILL from the camera side — lifts object front-faces and the
          foreground floor so the diorama reads cosy, not murky (no shadow). */}
      <pointLight position={[3.4, 3.2, 3.4]} color="#ffe6c2" intensity={11} distance={13} decay={2} />
      {/* gentle cool bounce into the shadowed back-left corner (arcade shelves) */}
      <pointLight position={[-1.6, 2.2, -1.6]} color="#9fb4e0" intensity={4} distance={6} decay={2} />

      {/* ── Floor (walnut planks) ──────────────────────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial
          map={woodMap}
          roughnessMap={woodRough}
          roughness={0.72}
          metalness={0.02}
          color="#c9c9c9"
        />
      </mesh>

      {/* Soft navy fabric rug under the seating / desk zone (rounded corners
          faked by a plane with a rounded texture alpha isn't needed — use a
          slightly inset plane with fabric texture). */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.15, 0.012, -0.35]} receiveShadow>
        <planeGeometry args={[3.4, 3.0]} />
        <meshStandardMaterial map={rugTex} roughness={0.95} metalness={0} color={PAL.rugTone} />
      </mesh>

      {/* ── Walls (warm dark navy) ─────────────────────────────── */}
      {/* Back wall (−Z) — the lit one */}
      <mesh position={[0, 2.5, -2.4]} receiveShadow>
        <planeGeometry args={[10, 5.4]} />
        <meshStandardMaterial color={PAL.wall} roughness={0.96} metalness={0.02} />
      </mesh>
      {/* Left wall (−X) — in shadow, cooler */}
      <mesh position={[-2.4, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[10, 5.4]} />
        <meshStandardMaterial color={PAL.wallB} roughness={0.96} metalness={0.02} />
      </mesh>

      {/* Baseboard trim where walls meet floor */}
      <mesh position={[0, 0.09, -2.36]}>
        <boxGeometry args={[10, 0.18, 0.06]} />
        <meshStandardMaterial color={PAL.baseboard} roughness={0.85} metalness={0.05} />
      </mesh>
      <mesh position={[-2.36, 0.09, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[10, 0.18, 0.06]} />
        <meshStandardMaterial color={PAL.baseboard} roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Thin emissive accent line above the baseboard (subtle neon nod) */}
      <mesh position={[0, 0.2, -2.35]}>
        <boxGeometry args={[10, 0.012, 0.01]} />
        <meshStandardMaterial color={PAL.cyan} emissive={PAL.cyan} emissiveIntensity={0.5} toneMapped={false} />
      </mesh>

      {/* ── Soft colour glows (like the reference's TV glow) ───── */}
      {/* Cool window patch with venetian slats on the back wall */}
      <mesh position={[1.35, 3.0, -2.37]}>
        <planeGeometry args={[2.2, 2.6]} />
        <meshBasicMaterial
          map={slatTex}
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {/* Gold halo behind the arcade (additive radial) */}
      <sprite position={[1.9, 1.7, -2.0]} scale={[3.2, 3.2, 1]}>
        <spriteMaterial
          map={glowTex}
          color={PAL.gold}
          transparent
          opacity={0.42}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>
      {/* Warm pool on the floor under the desk lamp area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.0, 0.02, -1.0]}>
        <planeGeometry args={[3.2, 3.2]} />
        <meshBasicMaterial
          map={glowTex}
          color={PAL.deskWarm}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {/* Cool mint pool on the floor at the server */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.0, 0.02, 0.6]}>
        <planeGeometry args={[2.4, 2.4]} />
        <meshBasicMaterial
          map={glowTex}
          color={PAL.mint}
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* ── NON-hotspot props (life, not menu) ─────────────────── */}
      <Plant />
      <Sofa />
      <WallShelf />
      <CableStrip />

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

/** Potted plant in the back corner — a pot + a cluster of leaf spheres. */
function Plant() {
  const leaves: [number, number, number, number][] = [
    [0, 0.55, 0, 0.24],
    [0.16, 0.44, 0.05, 0.18],
    [-0.15, 0.46, -0.04, 0.19],
    [0.05, 0.68, -0.08, 0.17],
    [-0.06, 0.62, 0.12, 0.16],
  ]
  return (
    <group position={[-2.0, 0, -1.95]}>
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

/** Low floor sofa / cushion block in the open front-right corner. */
function Sofa() {
  return (
    <group position={[1.5, 0, 1.5]} rotation={[0, -Math.PI / 4, 0]}>
      {/* seat base */}
      <RoundedBox args={[1.5, 0.34, 0.8]} radius={0.08} smoothness={2} position={[0, 0.2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={PAL.sofa} roughness={0.9} metalness={0} />
      </RoundedBox>
      {/* backrest */}
      <RoundedBox args={[1.5, 0.5, 0.22]} radius={0.08} smoothness={2} position={[0, 0.5, -0.32]} castShadow receiveShadow>
        <meshStandardMaterial color={PAL.sofa} roughness={0.9} metalness={0} />
      </RoundedBox>
      {/* two cushions */}
      <RoundedBox args={[0.62, 0.16, 0.6]} radius={0.07} smoothness={2} position={[-0.38, 0.44, 0.02]} castShadow>
        <meshStandardMaterial color={PAL.sofaCushion} roughness={0.92} metalness={0} />
      </RoundedBox>
      <RoundedBox args={[0.62, 0.16, 0.6]} radius={0.07} smoothness={2} position={[0.38, 0.44, 0.02]} castShadow>
        <meshStandardMaterial color={PAL.sofaCushion} roughness={0.92} metalness={0} />
      </RoundedBox>
    </group>
  )
}

/** Small decorative wall shelf on the back wall with a few objects. */
function WallShelf() {
  return (
    <group position={[0.35, 2.55, -2.33]}>
      {/* plank */}
      <RoundedBox args={[1.0, 0.05, 0.24]} radius={0.02} smoothness={2} castShadow receiveShadow>
        <meshStandardMaterial color={PAL.elev} roughness={0.7} metalness={0.15} />
      </RoundedBox>
      {/* a small warm-glowing cube trinket */}
      <mesh position={[0.02, 0.11, 0.03]} castShadow>
        <boxGeometry args={[0.13, 0.13, 0.13]} />
        <meshStandardMaterial
          color={PAL.gold}
          emissive={PAL.gold}
          emissiveIntensity={0.25}
          roughness={0.5}
          toneMapped={false}
        />
      </mesh>
      {/* a little cyan orb */}
      <mesh position={[0.33, 0.11, 0.02]} castShadow>
        <sphereGeometry args={[0.07, 14, 12]} />
        <meshStandardMaterial color={PAL.cyan} roughness={0.35} metalness={0.4} />
      </mesh>
    </group>
  )
}

/** A thin emissive cable strip snaking across the floor near the desk. */
function CableStrip() {
  const pts = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.6, 0.02, -0.9),
        new THREE.Vector3(-0.9, 0.02, -0.3),
        new THREE.Vector3(-0.2, 0.02, 0.2),
        new THREE.Vector3(0.6, 0.02, 0.1),
        new THREE.Vector3(1.4, 0.02, 0.5),
      ]),
    [],
  )
  const geom = useMemo(() => new THREE.TubeGeometry(pts, 40, 0.018, 6, false), [pts])
  useEffect(() => () => geom.dispose(), [geom])
  return (
    <mesh geometry={geom} castShadow>
      <meshStandardMaterial color="#0a1526" roughness={0.5} metalness={0.4} />
    </mesh>
  )
}
