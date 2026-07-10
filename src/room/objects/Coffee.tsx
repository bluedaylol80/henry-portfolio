import { Suspense, useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import Hotspot from '../Hotspot'
import { GlbModel, modelUrl } from '../glb'

/**
 * 커피 한 잔 — the contact hotspot (→ /story#contact · 커피챗!). §23.3 v15: the
 * procedural mug/handle/coffee-surface meshes are replaced by the owner-image
 * GLB `coffee` (mug + pad; target WIDTH kept modest so the mug reads at a sane
 * scale on the low coffee table — see note below). The Bruno-style steam plane
 * (a small alpha-noise shader drifting upward) is KEPT over the mug's approx
 * spot; the ShaderMaterial is disposed on unmount. The Hotspot id/hit-proxy/
 * ANCHOR are untouched.
 *
 * Scale deviation (§23.3 allowance): §23.3 lists width 1.1, but a 1.1-wide mug
 * would nearly span the 1.2-wide coffee-table top and dwarf the sofa. The GLB is
 * a mug-on-a-pad, so its natural footprint is small; width 0.44 lands the mug at
 * a believable size on the table (verified via crop). Deviation recorded in the
 * report.
 */
useGLTF.preload(modelUrl('coffee'))

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
    <Hotspot id="coffee" hit={{ size: [0.42, 0.34, 0.42], position: [0.5, 0.55, -0.12] }}>
      {/* On the low coffee-table top (table top ≈ y0.44), shifted right (§19.2). */}
      <group position={[0.5, 0.44, -0.12]}>
        {/* §23.3: owner-image GLB mug + pad. Suspends locally so the loading GLB
            can't blank the canvas (§23.1). rotY orients the handle sideways. */}
        <Suspense fallback={null}>
          <GlbModel slug="coffee" width={0.44} rotY={0} />
        </Suspense>
        {/* Steam plane — kept, drifts upward over the mug's approx spot (§23.3).
            The mug sits ≈0.18 tall after normalisation; the plane bottom starts a
            touch above the rim. */}
        <mesh position={[0, 0.52, 0.01]} material={steamMat}>
          <planeGeometry args={[0.32, 0.7]} />
        </mesh>
      </group>
    </Hotspot>
  )
}
