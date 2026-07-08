import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import Hotspot from '../Hotspot'
import { PAL } from '../palette'
import { isSoundOn, onSoundChange } from '../../lib/sound'

/**
 * 스피커 — toggles the shared BGM (action 'sound'). A speaker box with two cone
 * circles; when the BGM is on (subscribed via onSoundChange) an emissive mint
 * ring pulses outward.
 */
export default function Speaker() {
  const [soundOn, setSoundOn] = useState(isSoundOn())
  const ringRef = useRef<THREE.Mesh>(null)

  useEffect(() => onSoundChange(setSoundOn), [])

  useFrame((state) => {
    if (document.hidden || !ringRef.current) return
    const ring = ringRef.current
    const mat = ring.material as THREE.MeshStandardMaterial
    if (soundOn) {
      const t = state.clock.elapsedTime
      const pulse = 0.5 + 0.5 * Math.sin(t * 4)
      const scale = 1 + pulse * 0.35
      ring.scale.set(scale, scale, 1)
      mat.emissiveIntensity += (0.6 + pulse * 1.4 - mat.emissiveIntensity) * 0.2
      mat.opacity += (0.9 - mat.opacity) * 0.2
    } else {
      ring.scale.x += (1 - ring.scale.x) * 0.15
      ring.scale.y += (1 - ring.scale.y) * 0.15
      mat.emissiveIntensity += (0 - mat.emissiveIntensity) * 0.15
      mat.opacity += (0 - mat.opacity) * 0.15
    }
  })

  return (
    <Hotspot id="speaker">
      <group position={[1.15, 0, -1.75]}>
        {/* Speaker box (rounded matte plastic) */}
        <RoundedBox args={[0.42, 1.2, 0.42]} radius={0.03} smoothness={2} position={[0, 0.6, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={PAL.elev} roughness={0.55} metalness={0.1} />
        </RoundedBox>
        {/* Two cone circles (drivers) */}
        <mesh position={[0, 0.86, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.02, 24]} />
          <meshStandardMaterial color="#050b16" roughness={0.5} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.86, 0.235]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.09, 0.06, 24]} />
          <meshStandardMaterial color={PAL.base} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.42, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.11, 0.11, 0.02, 24]} />
          <meshStandardMaterial color="#050b16" roughness={0.5} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.42, 0.235]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.07, 0.05, 24]} />
          <meshStandardMaterial color={PAL.base} roughness={0.5} />
        </mesh>
        {/* Pulsing mint ring (visible only when sound on) */}
        <mesh ref={ringRef} position={[0, 0.86, 0.27]} rotation={[0, 0, 0]}>
          <ringGeometry args={[0.16, 0.19, 32]} />
          <meshStandardMaterial
            color={PAL.mint}
            emissive={PAL.mint}
            emissiveIntensity={0}
            transparent
            opacity={0}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </Hotspot>
  )
}
