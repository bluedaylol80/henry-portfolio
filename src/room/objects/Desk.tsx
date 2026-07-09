import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import Hotspot from '../Hotspot'
import { PAL } from '../palette'
import { getGlowTexture } from '../textures'

/**
 * 데스크 ('컴퓨터') — the intro hotspot. A desk slab against the BACK wall (−Z),
 * center-left, holding a monitor that plays BASE_URL+'intro.mp4' as a muted
 * looping VideoTexture, an open laptop with an emissive mint dashboard, and a
 * warm desk lamp. A NON-hotspot gaming chair sits in front (in RoomShell).
 * Click → openIntro({ afterNavigate:'/story#about' }) (wired via action 'intro').
 */
export default function Desk() {
  const barsRef = useRef<THREE.Group>(null)

  // Create the video + texture exactly once per fiber (survives StrictMode's
  // mount→cleanup→mount without leaking a second element).
  const [{ video, videoTexture }] = useState(() => {
    const el = document.createElement('video')
    el.src = import.meta.env.BASE_URL + 'intro.mp4'
    el.crossOrigin = 'anonymous'
    el.loop = true
    el.muted = true
    el.playsInline = true
    el.preload = 'auto'
    const tex = new THREE.VideoTexture(el)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
    return { video: el, videoTexture: tex }
  })

  // Play while mounted; fully tear down only on a REAL unmount. StrictMode
  // fires cleanup then immediately re-runs setup on the same fiber, so we defer
  // disposal to a microtask and cancel it if setup runs again (remount).
  const aliveRef = useRef(true)
  useEffect(() => {
    aliveRef.current = true
    video.play().catch(() => {})
    return () => {
      video.pause()
      aliveRef.current = false
      queueMicrotask(() => {
        if (aliveRef.current) return // remounted (StrictMode) — keep resources
        videoTexture.dispose()
        video.removeAttribute('src')
        video.load()
      })
    }
  }, [video, videoTexture])

  // Gentle animated laptop dashboard bars (emissive intensity flicker).
  useFrame((state) => {
    if (document.hidden || !barsRef.current) return
    const t = state.clock.elapsedTime
    barsRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh
      const mat = mesh.material as THREE.MeshStandardMaterial
      const target = 0.6 + Math.abs(Math.sin(t * (0.7 + i * 0.18) + i)) * 0.9
      mat.emissiveIntensity += (target - mat.emissiveIntensity) * 0.08
      const h = 0.12 + Math.abs(Math.sin(t * (0.5 + i * 0.2) + i * 1.3)) * 0.16
      mesh.scale.y = h / 0.2
      mesh.position.y = (h / 0.2) * 0.1 - 0.1
    })
  })

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

        {/* Monitor — video texture, faces +Z */}
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
          <RoundedBox args={[1.06, 0.64, 0.04]} radius={0.02} smoothness={2} castShadow>
            <meshStandardMaterial color="#050b18" roughness={0.35} metalness={0.3} />
          </RoundedBox>
          {/* §20.2-4a: emissiveIntensity was 0.9 with toneMapped:false, so a
              bright video frame blew out to a white slab. Dropped to 0.45 (and
              userData.baseEmissive follows, so Hotspot's hover boost scales from
              the new base) — the video reads without becoming a blank white board. */}
          <mesh position={[0, 0, 0.025]}>
            <planeGeometry args={[0.98, 0.56]} />
            <meshStandardMaterial
              map={videoTexture}
              emissiveMap={videoTexture}
              emissive="#ffffff"
              emissiveIntensity={0.45}
              toneMapped={false}
              userData={{ baseEmissive: 0.45 }}
            />
          </mesh>
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

        {/* Open laptop (right), emissive mint dashboard on the screen. §20.2-4b:
            the lid used to face −X (its BACK to the camera); rotated to +0.5 so
            the lid + mint dashboard face the viewer (+X/+Z side). Bars stay inside
            the lid bounds. */}
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
            <mesh position={[0, 0, 0.013]}>
              <planeGeometry args={[0.5, 0.32]} />
              <meshStandardMaterial color="#06121f" roughness={0.5} />
            </mesh>
            {/* dashboard bars */}
            <group ref={barsRef} position={[0, -0.01, 0.02]}>
              {[0, 1].map((i) => (
                <mesh key={i} position={[-0.09 + i * 0.18, 0, 0]}>
                  <boxGeometry args={[0.11, 0.2, 0.008]} />
                  <meshStandardMaterial
                    color={i % 2 === 0 ? PAL.mint : PAL.cyan}
                    emissive={i % 2 === 0 ? PAL.mint : PAL.cyan}
                    emissiveIntensity={0.8}
                    toneMapped={false}
                    userData={{ baseEmissive: 0.8 }}
                  />
                </mesh>
              ))}
            </group>
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
