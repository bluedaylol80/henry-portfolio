import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import Hotspot from '../Hotspot'
import { PAL } from '../palette'

/**
 * 서버 랙 — the AI-chapter hotspot (→ /#ai). A dark rack with 3 LEDs blinking at
 * staggered rates (gold / cyan / mint) plus a thin emissive cable line running
 * to the desk side.
 */
const LED_COLORS = [PAL.goldDeep, PAL.cyan, PAL.mint] as const
const LED_RATES = [1.7, 2.6, 3.4] as const

export default function Server() {
  const ledsRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (document.hidden || !ledsRef.current) return
    const t = state.clock.elapsedTime
    ledsRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh
      const mat = mesh.material as THREE.MeshStandardMaterial
      // staggered square-ish blink
      const blink = Math.sin(t * LED_RATES[i] + i * 1.4) > 0 ? 1 : 0.15
      mat.emissiveIntensity += (blink * 1.6 - mat.emissiveIntensity) * 0.25
    })
  })

  return (
    <Hotspot id="server">
      <group position={[2.0, 0, 0.6]}>
        {/* Rack body */}
        <mesh position={[0, 0.75, 0]}>
          <boxGeometry args={[0.7, 1.5, 0.6]} />
          <meshStandardMaterial color="#0b1424" roughness={0.65} metalness={0.35} />
        </mesh>
        {/* Front panel (slightly lighter) */}
        <mesh position={[0, 0.75, 0.31]}>
          <boxGeometry args={[0.62, 1.42, 0.02]} />
          <meshStandardMaterial color={PAL.base} roughness={0.5} metalness={0.4} />
        </mesh>
        {/* Rack unit slots (dark grooves) */}
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[0, 0.25 + i * 0.26, 0.325]}>
            <boxGeometry args={[0.5, 0.18, 0.015]} />
            <meshStandardMaterial color="#050b16" roughness={0.6} />
          </mesh>
        ))}
        {/* 3 blinking LEDs */}
        <group ref={ledsRef}>
          {LED_COLORS.map((c, i) => (
            <mesh key={i} position={[-0.18 + i * 0.06, 1.28, 0.34]}>
              <sphereGeometry args={[0.022, 10, 10]} />
              <meshStandardMaterial
                color={c}
                emissive={c}
                emissiveIntensity={0.9}
                toneMapped={false}
              />
            </mesh>
          ))}
        </group>
        {/* Thin emissive cable line (toward desk) */}
        <mesh position={[-0.55, 0.06, 0.2]} rotation={[0, 0, 0.08]}>
          <boxGeometry args={[1.1, 0.012, 0.012]} />
          <meshStandardMaterial
            color={PAL.cyan}
            emissive={PAL.cyan}
            emissiveIntensity={0.7}
            toneMapped={false}
            userData={{ baseEmissive: 0.7 }}
          />
        </mesh>
      </group>
    </Hotspot>
  )
}
