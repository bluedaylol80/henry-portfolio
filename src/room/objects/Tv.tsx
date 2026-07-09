import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import Hotspot from '../Hotspot'
import { PAL } from '../palette'
import { getGlowTexture } from '../textures'

/**
 * TV (hotspot `tv`, renamed from the old arcade) — the '상세 이력' hotspot
 * (→ Notion, external). A flat-panel screen wall-mounted on the BACK wall (−Z),
 * right side (SPEC §19.2 — the reference's warm-backlit TV), its screen facing
 * into the room (+Z), a low media console below on the floor. A warm burnt-orange
 * glow halo sits behind the panel like the reference TV's red glow, and the
 * screen shows subtle scrolling emissive scanlines + a wordmark bar (custom
 * ShaderMaterial, disposed on unmount).
 *
 * The group is NOT rotated: the screen already faces +Z (toward the sofa).
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
    float scroll = vUv.y * 26.0 - uTime * 1.1;
    float lines = 0.5 + 0.5 * sin(scroll * 3.14159);
    lines = pow(lines, 3.0);
    // a bright horizontal "wordmark" band drifting up the panel
    float band = smoothstep(0.06, 0.0, abs(fract(vUv.y - uTime * 0.06) - 0.5) - 0.04);
    // gentle vertical column glow sweeping across
    float sweep = 0.5 + 0.5 * sin(vUv.x * 3.4 + uTime * 0.7);
    vec3 col = mix(uColorA, uColorB, sweep);
    float a = 0.22 + lines * 0.62 + band * 0.5;
    gl_FragColor = vec4(col * (0.55 + lines * 0.85 + band * 0.8), a);
  }
`

export default function Tv() {
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

  const glowTex = getGlowTexture()

  return (
    <Hotspot id="tv" hit={{ size: [1.7, 2.2, 0.62], position: [0.85, 1.1, -2.0] }}>
      {/* Wall-mounted on the back wall (−Z), right side; screen faces +Z. */}
      <group position={[0.85, 0, -2.0]} rotation={[0, 0, 0]}>
        {/* Warm burnt-orange halo behind the panel (reference-style TV glow).
            noPick: decorative billboard, never a raycast target (§19.7). */}
        <sprite position={[0, 1.62, -0.18]} scale={[3.2, 2.4, 1]} userData={{ noPick: true }}>
          <spriteMaterial
            map={glowTex}
            color={PAL.burnt}
            transparent
            opacity={0.42}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </sprite>

        {/* Low media console */}
        <RoundedBox
          args={[1.5, 0.42, 0.5]}
          radius={0.03}
          smoothness={2}
          position={[0, 0.24, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color={PAL.elev} roughness={0.5} metalness={0.14} />
        </RoundedBox>
        {/* console front seam + a warm accent line */}
        <mesh position={[0, 0.24, 0.255]}>
          <boxGeometry args={[1.44, 0.02, 0.01]} />
          <meshStandardMaterial
            color={PAL.gold}
            emissive={PAL.gold}
            emissiveIntensity={0.5}
            toneMapped={false}
            userData={{ baseEmissive: 0.5 }}
          />
        </mesh>
        {/* two little console feet suggested by a base bar */}
        <mesh position={[0, 0.03, 0]}>
          <boxGeometry args={[1.44, 0.05, 0.44]} />
          <meshStandardMaterial color={PAL.base} roughness={0.7} metalness={0.1} />
        </mesh>

        {/* Flat-panel body (thin, wall-mounted high above the console) — a large
            screen like the reference's TV. */}
        <RoundedBox
          args={[1.6, 0.98, 0.06]}
          radius={0.02}
          smoothness={2}
          position={[0, 1.62, 0.02]}
          castShadow
        >
          <meshStandardMaterial color="#050b18" roughness={0.32} metalness={0.35} />
        </RoundedBox>
        {/* Screen — scanline / wordmark shader */}
        <mesh position={[0, 1.62, 0.056]} material={material}>
          <planeGeometry args={[1.44, 0.84]} />
        </mesh>
        {/* Slim wall-mount bracket behind the panel (no floor stand) */}
        <mesh position={[0, 1.62, -0.04]}>
          <boxGeometry args={[0.16, 0.34, 0.04]} />
          <meshStandardMaterial color={PAL.base} roughness={0.4} metalness={0.4} />
        </mesh>
      </group>
    </Hotspot>
  )
}
