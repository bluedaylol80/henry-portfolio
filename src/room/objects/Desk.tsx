import { Suspense } from 'react'
import * as THREE from 'three'
import { useLoader } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import Hotspot from '../Hotspot'
import { PAL } from '../palette'
import { getGlowTexture } from '../textures'

/**
 * 데스크 ('컴퓨터') — the '소개' hotspot. A desk slab against the BACK wall (−Z),
 * center-left, holding a monitor and an open laptop (both now owner-delivered
 * dashboard stills), plus a warm desk lamp. A NON-hotspot gaming chair sits in
 * front (in RoomShell). §22.1 v14: the click now navigates to /story#about
 * (wired via action 'about') — it no longer auto-plays the intro film. The intro
 * plays instead from the /story#about character card and the room's introBadge.
 *
 * §21.3/§21.4 v13: the monitor's intro.mp4 VideoTexture pipeline and the
 * animated laptop mint bars are RETIRED — the owner delivered static dashboard
 * stills (`screens/monitor.png`, `screens/laptop.png`). Both are textured
 * emissive planes (map + emissiveMap + emissive #ffffff + toneMapped:false + a
 * matching userData.baseEmissive so Hotspot's hover-boost scales correctly).
 * `intro.mp4` itself STAYS in public/ — the DOM IntroOverlay ('소개 영상')
 * still uses it; only the in-scene VideoTexture (and its decode cost) is gone.
 */

/** Monitor screen — owner still (screens/monitor.png), aspect 1.6 (1280×800).
 *  Suspends on useLoader; wrapped locally in <Suspense> so it can't blank the
 *  whole room canvas while loading (§21.1). */
function MonitorScreen() {
  const tex = useLoader(THREE.TextureLoader, import.meta.env.BASE_URL + 'screens/monitor.png')
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return (
    <mesh position={[0, 0, 0.025]}>
      <planeGeometry args={[0.98, 0.6125]} />
      <meshStandardMaterial
        map={tex}
        emissiveMap={tex}
        emissive="#ffffff"
        emissiveIntensity={0.45}
        toneMapped={false}
        userData={{ baseEmissive: 0.45 }}
      />
    </mesh>
  )
}

/** Laptop lid screen — owner still (screens/laptop.png), aspect 1.6. Suspends
 *  locally (§21.1). */
function LaptopScreen() {
  const tex = useLoader(THREE.TextureLoader, import.meta.env.BASE_URL + 'screens/laptop.png')
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return (
    <mesh position={[0, 0, 0.013]}>
      <planeGeometry args={[0.5, 0.3125]} />
      <meshStandardMaterial
        map={tex}
        emissiveMap={tex}
        emissive="#ffffff"
        emissiveIntensity={0.55}
        toneMapped={false}
        userData={{ baseEmissive: 0.55 }}
      />
    </mesh>
  )
}

export default function Desk() {
  const glowTex = getGlowTexture()

  return (
    <Hotspot id="desk" hit={{ size: [2.1, 1.5, 1.0], position: [-1.7, 0.95, -1.6] }}>
      {/* Desk in the back-LEFT corner (−X/−Z junction), §19.2. Monitor faces +Z. */}
      <group position={[-1.7, 0, -2.0]}>
        {/* Desk slab (rounded — warm plastic, edges show) */}
        <RoundedBox args={[2.0, 0.08, 0.9]} radius={0.02} smoothness={2} position={[0, 0.72, 0.35]} castShadow receiveShadow>
          <meshStandardMaterial color={PAL.elev} roughness={0.5} metalness={0.15} />
        </RoundedBox>
        {/* Two side panels as legs */}
        <mesh position={[-0.92, 0.34, 0.38]} castShadow receiveShadow>
          <boxGeometry args={[0.06, 0.68, 0.72]} />
          <meshStandardMaterial color={PAL.base} roughness={0.8} metalness={0.05} />
        </mesh>
        <mesh position={[0.92, 0.34, 0.38]} castShadow receiveShadow>
          <boxGeometry args={[0.06, 0.68, 0.72]} />
          <meshStandardMaterial color={PAL.base} roughness={0.8} metalness={0.05} />
        </mesh>

        {/* Monitor — owner dashboard still, faces +Z */}
        <group position={[-0.2, 1.3, 0.12]}>
          {/* soft glow halo behind the screen (like the reference TV glow).
              noPick: decorative billboard, never a raycast target (§19.7). */}
          <sprite position={[0, 0, -0.12]} scale={[1.9, 1.35, 1]} userData={{ noPick: true }}>
            <spriteMaterial
              map={glowTex}
              color={PAL.cyan}
              transparent
              opacity={0.42}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </sprite>
          {/* §21.3: bezel grew 1.06×0.64 → 1.06×0.70 to match the 1.6-aspect image. */}
          <RoundedBox args={[1.06, 0.70, 0.04]} radius={0.02} smoothness={2} castShadow>
            <meshStandardMaterial color="#050b18" roughness={0.35} metalness={0.3} />
          </RoundedBox>
          {/* §21.3: static owner dashboard (screens/monitor.png) replaces the
              intro.mp4 VideoTexture; emissiveIntensity 0.45 (§20.2-4a value
              carries over) so it reads without becoming a blank white board.
              Suspends locally (§21.1). */}
          <Suspense fallback={null}>
            <MonitorScreen />
          </Suspense>
          {/* stand */}
          <mesh position={[0, -0.42, 0]} castShadow>
            <boxGeometry args={[0.12, 0.24, 0.06]} />
            <meshStandardMaterial color={PAL.base} roughness={0.4} metalness={0.35} />
          </mesh>
          <mesh position={[0, -0.54, 0.06]} castShadow>
            <boxGeometry args={[0.34, 0.03, 0.2]} />
            <meshStandardMaterial color={PAL.base} roughness={0.4} metalness={0.35} />
          </mesh>
        </group>

        {/* Open laptop (right) — owner dashboard still on the lid. §20.2-4b: the
            lid used to face −X (its BACK to the camera); rotated to +0.5 so the
            lid + dashboard face the viewer (+X/+Z side). */}
        <group position={[0.62, 0.79, 0.42]} rotation={[0, 0.5, 0]}>
          {/* base / keyboard deck */}
          <RoundedBox args={[0.56, 0.03, 0.4]} radius={0.015} smoothness={2} castShadow>
            <meshStandardMaterial color={PAL.base} roughness={0.4} metalness={0.35} />
          </RoundedBox>
          {/* hinged screen */}
          <group position={[0, 0.2, -0.19]} rotation={[-1.15, 0, 0]}>
            <RoundedBox args={[0.56, 0.38, 0.02]} radius={0.012} smoothness={2} castShadow>
              <meshStandardMaterial color="#050b18" roughness={0.35} metalness={0.3} />
            </RoundedBox>
            {/* §21.4: static owner dashboard (screens/laptop.png) replaces the
                animated mint bars + the flat inner plane. 0.5 × 0.3125 (aspect
                1.6) sits inside the lid bounds; suspends locally (§21.1). */}
            <Suspense fallback={null}>
              <LaptopScreen />
            </Suspense>
          </group>
        </group>

        {/* Keyboard in front of the monitor */}
        <mesh position={[-0.2, 0.79, 0.5]} rotation={[-0.05, 0, 0]} castShadow>
          <boxGeometry args={[0.66, 0.03, 0.22]} />
          <meshStandardMaterial color={PAL.elev} emissive={PAL.cyan} emissiveIntensity={0.12} roughness={0.4} metalness={0.1} />
        </mesh>

        {/* Warm desk lamp (left) — upright arm + a glowing gold head */}
        <group position={[-0.86, 0.76, 0.18]}>
          {/* base */}
          <mesh castShadow>
            <cylinderGeometry args={[0.09, 0.1, 0.04, 16]} />
            <meshStandardMaterial color={PAL.base} roughness={0.4} metalness={0.4} />
          </mesh>
          {/* arm (angled up-and-over) */}
          <mesh position={[0.06, 0.3, 0.02]} rotation={[0, 0, -0.35]} castShadow>
            <cylinderGeometry args={[0.012, 0.012, 0.56, 8]} />
            <meshStandardMaterial color={PAL.base} roughness={0.4} metalness={0.5} />
          </mesh>
          {/* head (glowing warm) */}
          <mesh position={[0.22, 0.5, 0.04]} rotation={[0.6, 0, -0.6]} castShadow>
            <coneGeometry args={[0.08, 0.12, 16, 1, true]} />
            <meshStandardMaterial
              color={PAL.gold}
              emissive={PAL.deskWarm}
              emissiveIntensity={0.9}
              roughness={0.4}
              side={THREE.DoubleSide}
              toneMapped={false}
              userData={{ baseEmissive: 0.9 }}
            />
          </mesh>
        </group>
      </group>
    </Hotspot>
  )
}
