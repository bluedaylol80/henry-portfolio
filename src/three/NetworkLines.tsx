import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { SceneData } from './keyframes'
import { sceneState } from './sceneState'
import { smoothstep } from './util'

/**
 * Pulsing connection lines for the AI-era lattice (phase ~4).
 * Additive LineSegments; a bright dot travels along each segment via uTime.
 * Global opacity fades the whole graph in/out around phase 4.
 */

const VERT = /* glsl */ `
  attribute float aAlong;
  attribute float aSeed;
  varying float vAlong;
  varying float vSeed;

  void main() {
    vAlong = aAlong;
    vSeed = aSeed;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uColor;
  varying float vAlong;
  varying float vSeed;

  void main() {
    float head = fract(uTime * 0.22 + vSeed);
    float d = abs(vAlong - head);
    d = min(d, 1.0 - d);
    float pulse = 1.0 - smoothstep(0.0, 0.14, d);
    float glow = 0.2 + pulse * 1.1;
    gl_FragColor = vec4(uColor * glow, uOpacity * glow);
  }
`

export default function NetworkLines({ data }: { data: SceneData }) {
  const ref = useRef<THREE.LineSegments>(null)

  const { geometry, material } = useMemo(() => {
    const net = data.network
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(net.position, 3))
    geo.setAttribute('aAlong', new THREE.BufferAttribute(net.along, 1))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(net.seed, 1))
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 12)

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uColor: { value: new THREE.Vector3(0.1333, 0.8275, 0.9333) }, // era-cyan
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    return { geometry: geo, material: mat }
  }, [data])

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  useFrame(() => {
    if (document.hidden) return
    const p = sceneState.phase
    const op = smoothstep(3.4, 4.0, p) * (1 - smoothstep(4.6, 5.2, p))
    material.uniforms.uOpacity.value = op
    material.uniforms.uTime.value = sceneState.time
    if (ref.current) ref.current.visible = op > 0.001
  })

  return (
    <lineSegments ref={ref} geometry={geometry} material={material} frustumCulled={false} visible={false} />
  )
}
