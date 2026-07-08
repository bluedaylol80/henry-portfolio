import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import Hotspot from '../Hotspot'
import { PAL } from '../palette'

/**
 * 아케이드 캐비닛 — the '대표 성과' hotspot (→ /#work). A cabinet box with a gold
 * emissive marquee, a tiny joystick + button, and a screen showing slowly
 * scrolling emissive scanlines (custom ShaderMaterial, disposed on unmount).
 */
const SCREEN_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const SCREEN_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying vec2 vUv;
  void main() {
    // slowly scrolling horizontal scanlines
    float scroll = vUv.y * 22.0 - uTime * 1.2;
    float lines = 0.5 + 0.5 * sin(scroll * 3.14159);
    lines = pow(lines, 3.0);
    // vertical column glow sweeping across
    float sweep = 0.5 + 0.5 * sin(vUv.x * 4.0 + uTime * 0.8);
    vec3 col = mix(uColorA, uColorB, sweep);
    float a = 0.25 + lines * 0.75;
    gl_FragColor = vec4(col * (0.6 + lines * 0.9), a);
  }
`

export default function Arcade() {
  const matRef = useRef<THREE.ShaderMaterial | null>(null)

  const material = useMemo(() => {
    const m = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorA: { value: new THREE.Color(PAL.goldDeep) },
        uColorB: { value: new THREE.Color(PAL.gold) },
      },
      vertexShader: SCREEN_VERT,
      fragmentShader: SCREEN_FRAG,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    })
    matRef.current = m
    return m
  }, [])

  useEffect(() => () => material.dispose(), [material])

  useFrame((state) => {
    if (document.hidden) return
    material.uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <Hotspot id="arcade">
      <group position={[1.9, 0, -1.4]}>
        {/* Cabinet body */}
        <mesh position={[0, 0.9, 0]}>
          <boxGeometry args={[0.9, 1.8, 0.8]} />
          <meshStandardMaterial color={PAL.elev} roughness={0.6} metalness={0.2} />
        </mesh>
        {/* Marquee (gold emissive) */}
        <mesh position={[0, 1.72, 0.31]}>
          <boxGeometry args={[0.86, 0.26, 0.16]} />
          <meshStandardMaterial
            color={PAL.gold}
            emissive={PAL.gold}
            emissiveIntensity={1.1}
            toneMapped={false}
            userData={{ baseEmissive: 1.1 }}
          />
        </mesh>
        {/* Screen bezel */}
        <mesh position={[0, 1.2, 0.36]} rotation={[-0.18, 0, 0]}>
          <boxGeometry args={[0.72, 0.56, 0.06]} />
          <meshStandardMaterial color="#050b18" roughness={0.4} metalness={0.3} />
        </mesh>
        {/* Screen — scanline shader */}
        <mesh position={[0, 1.205, 0.395]} rotation={[-0.18, 0, 0]} material={material}>
          <planeGeometry args={[0.62, 0.46]} />
        </mesh>
        {/* Control deck */}
        <mesh position={[0, 0.78, 0.42]} rotation={[-0.5, 0, 0]}>
          <boxGeometry args={[0.86, 0.34, 0.06]} />
          <meshStandardMaterial color={PAL.base} roughness={0.7} />
        </mesh>
        {/* Joystick base + stick + ball */}
        <mesh position={[-0.18, 0.82, 0.5]}>
          <cylinderGeometry args={[0.06, 0.07, 0.04, 12]} />
          <meshStandardMaterial color="#0a1526" roughness={0.6} metalness={0.3} />
        </mesh>
        <mesh position={[-0.18, 0.9, 0.5]} rotation={[0.3, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.14, 8]} />
          <meshStandardMaterial color="#0a1526" roughness={0.5} metalness={0.4} />
        </mesh>
        <mesh position={[-0.175, 0.97, 0.52]}>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshStandardMaterial
            color={PAL.burnt}
            emissive={PAL.burnt}
            emissiveIntensity={0.5}
            toneMapped={false}
            userData={{ baseEmissive: 0.5 }}
          />
        </mesh>
        {/* Two buttons */}
        {[0.08, 0.2].map((x, i) => (
          <mesh key={i} position={[x, 0.83, 0.5]} rotation={[-0.5, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.03, 12]} />
            <meshStandardMaterial
              color={i === 0 ? PAL.cyan : PAL.mint}
              emissive={i === 0 ? PAL.cyan : PAL.mint}
              emissiveIntensity={0.6}
              toneMapped={false}
              userData={{ baseEmissive: 0.6 }}
            />
          </mesh>
        ))}
      </group>
    </Hotspot>
  )
}
