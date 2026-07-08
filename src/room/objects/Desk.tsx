import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import Hotspot from '../Hotspot'
import { PAL } from '../palette'
import { getGlowTexture } from '../textures'

/**
 * 데스크 — the intro hotspot. A desk slab with books + a keyboard and TWO
 * monitor planes: the left plays BASE_URL+'intro.mp4' as a muted looping
 * VideoTexture; the right is an emissive "dashboard" of simple mint bars.
 * Click → openIntro() (wired by the interaction manager via action 'intro').
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

  // Gentle animated dashboard bars (emissive intensity flicker).
  useFrame((state) => {
    if (document.hidden || !barsRef.current) return
    const t = state.clock.elapsedTime
    barsRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh
      const mat = mesh.material as THREE.MeshStandardMaterial
      const target = 0.6 + Math.abs(Math.sin(t * (0.7 + i * 0.18) + i)) * 0.9
      mat.emissiveIntensity += (target - mat.emissiveIntensity) * 0.08
      // subtle height pulse
      const h = 0.12 + Math.abs(Math.sin(t * (0.5 + i * 0.2) + i * 1.3)) * 0.16
      mesh.scale.y = h / 0.2
      mesh.position.y = (h / 0.2) * 0.1 - 0.1
    })
  })

  const glowTex = getGlowTexture()

  return (
    <Hotspot id="desk">
      {/* Desk slab (rounded — wood-ish warm plastic, edges show) */}
      <RoundedBox args={[2.4, 0.08, 1.0]} radius={0.02} smoothness={2} position={[-0.9, 0.72, -1.3]} castShadow receiveShadow>
        <meshStandardMaterial color={PAL.elev} roughness={0.5} metalness={0.15} />
      </RoundedBox>
      {/* Two front legs suggested by a base bar */}
      <mesh position={[-0.9, 0.34, -1.05]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.68, 0.06]} />
        <meshStandardMaterial color={PAL.base} roughness={0.8} metalness={0.05} />
      </mesh>

      {/* Left monitor — video texture */}
      <group position={[-1.55, 1.28, -1.55]}>
        {/* soft glow halo behind the screen (like the reference TV glow) */}
        <sprite position={[0, 0, -0.1]} scale={[1.7, 1.2, 1]}>
          <spriteMaterial
            map={glowTex}
            color={PAL.cyan}
            transparent
            opacity={0.4}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </sprite>
        <RoundedBox args={[0.98, 0.6, 0.04]} radius={0.02} smoothness={2} castShadow>
          <meshStandardMaterial color="#050b18" roughness={0.35} metalness={0.3} />
        </RoundedBox>
        <mesh position={[0, 0, 0.025]}>
          <planeGeometry args={[0.9, 0.52]} />
          <meshStandardMaterial
            map={videoTexture}
            emissiveMap={videoTexture}
            emissive="#ffffff"
            emissiveIntensity={0.9}
            toneMapped={false}
            userData={{ baseEmissive: 0.9 }}
          />
        </mesh>
        {/* stand */}
        <mesh position={[0, -0.4, 0]} castShadow>
          <boxGeometry args={[0.12, 0.24, 0.06]} />
          <meshStandardMaterial color={PAL.base} roughness={0.4} metalness={0.35} />
        </mesh>
      </group>

      {/* Right monitor — emissive mint dashboard */}
      <group position={[-0.35, 1.28, -1.6]} rotation={[0, -0.25, 0]}>
        <RoundedBox args={[0.98, 0.6, 0.04]} radius={0.02} smoothness={2} castShadow>
          <meshStandardMaterial color="#050b18" roughness={0.35} metalness={0.3} />
        </RoundedBox>
        <mesh position={[0, 0, 0.022]}>
          <planeGeometry args={[0.9, 0.52]} />
          <meshStandardMaterial color="#06121f" roughness={0.5} />
        </mesh>
        {/* dashboard bars */}
        <group ref={barsRef} position={[0, -0.02, 0.03]}>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} position={[-0.28 + i * 0.14, 0, 0]}>
              <boxGeometry args={[0.08, 0.2, 0.01]} />
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
        <mesh position={[0, -0.4, 0]} castShadow>
          <boxGeometry args={[0.12, 0.24, 0.06]} />
          <meshStandardMaterial color={PAL.base} roughness={0.4} metalness={0.35} />
        </mesh>
      </group>

      {/* Keyboard */}
      <mesh position={[-0.9, 0.79, -1.05]} rotation={[-0.05, 0, 0]} castShadow>
        <boxGeometry args={[0.7, 0.03, 0.24]} />
        <meshStandardMaterial color={PAL.elev} emissive={PAL.cyan} emissiveIntensity={0.12} roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Small book stack on the desk (matte paper) */}
      <group position={[0.05, 0.82, -1.35]}>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.34, 0.05, 0.24]} />
          <meshStandardMaterial color={PAL.burnt} roughness={0.85} />
        </mesh>
        <mesh position={[0.02, 0.055, 0]} castShadow>
          <boxGeometry args={[0.3, 0.05, 0.22]} />
          <meshStandardMaterial color={PAL.gold} roughness={0.85} />
        </mesh>
      </group>
    </Hotspot>
  )
}
