import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import Hotspot from '../Hotspot'
import { PAL } from '../palette'

/**
 * 커피 한 잔 — the contact hotspot (→ /story#contact · 커피챗!). A mug sitting ON
 * the low coffee table in the centre of the room, with a Bruno-style steam
 * plane: a small alpha-noise shader drifting upward. The ShaderMaterial is
 * disposed on unmount.
 */
const STEAM_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
// Cheap value-noise (no texture dependency) drifting up over time.
const STEAM_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    // scroll noise upward + gentle horizontal sway
    vec2 uv = vUv;
    float sway = sin(uv.y * 6.0 + uTime * 1.2) * 0.06 * uv.y;
    float n = noise(vec2(uv.x * 4.0 + sway, uv.y * 3.0 - uTime * 0.6));
    n *= noise(vec2(uv.x * 8.0, uv.y * 6.0 - uTime * 0.9));

    // fade at edges + fade toward the top (dissipating steam)
    float edge = smoothstep(0.0, 0.25, uv.x) * smoothstep(1.0, 0.75, uv.x);
    float rise = smoothstep(0.0, 0.15, uv.y) * (1.0 - smoothstep(0.4, 1.0, uv.y));
    float a = n * edge * rise * 0.55;
    gl_FragColor = vec4(uColor, a);
  }
`

export default function Coffee() {
  const matRef = useRef<THREE.ShaderMaterial | null>(null)

  const steamMat = useMemo(() => {
    const m = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#dfeaff') },
      },
      vertexShader: STEAM_VERT,
      fragmentShader: STEAM_FRAG,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    })
    matRef.current = m
    return m
  }, [])

  useEffect(() => () => steamMat.dispose(), [steamMat])

  useFrame((state) => {
    if (document.hidden) return
    steamMat.uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <Hotspot id="coffee" hit={{ size: [0.42, 0.34, 0.42], position: [0.2, 0.55, -0.12] }}>
      {/* On the low coffee table top (table top ≈ y 0.44) in the room centre. */}
      <group position={[0.2, 0.44, -0.12]}>
        {/* Mug body (glazed ceramic) */}
        <mesh position={[0, 0.09, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.09, 0.075, 0.18, 24]} />
          <meshStandardMaterial color={PAL.ink} roughness={0.3} metalness={0.05} />
        </mesh>
        {/* Coffee surface */}
        <mesh position={[0, 0.175, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.082, 24]} />
          <meshStandardMaterial
            color="#2a1608"
            emissive={PAL.burnt}
            emissiveIntensity={0.15}
            roughness={0.3}
          />
        </mesh>
        {/* Handle */}
        <mesh position={[0.11, 0.09, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <torusGeometry args={[0.05, 0.014, 10, 20, Math.PI * 1.1]} />
          <meshStandardMaterial color={PAL.ink} roughness={0.3} metalness={0.05} />
        </mesh>
        {/* Steam plane — faces camera-ish, drifts upward */}
        <mesh position={[0, 0.5, 0.01]} material={steamMat}>
          <planeGeometry args={[0.32, 0.7]} />
        </mesh>
      </group>
    </Hotspot>
  )
}
