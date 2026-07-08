import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { sceneState } from './sceneState'
import { clamp, mulberry32, smoothstep, TAU } from './util'

/**
 * Instanced low-poly artifacts belonging to the hero era.
 * Solid near-white icosahedra + wireframe amber octahedra, scattered around
 * the origin with slow individual rotation and subtle float. They scale to 0
 * as the phase leaves the hero era and never reappear. Full tier only.
 */

interface Datum {
  px: number
  py: number
  pz: number
  rx: number
  ry: number
  rz: number
  sx: number
  sy: number
  sz: number
  scale: number
  floatAmp: number
  floatSpeed: number
  floatPhase: number
}

function makeInstances(n: number, rng: () => number): Datum[] {
  const out: Datum[] = []
  for (let i = 0; i < n; i++) {
    const u = rng() * 2 - 1
    const th = rng() * TAU
    const rad = 2.8 + rng() * 2.2 // 2.8 → 5.0
    const s = Math.sqrt(1 - u * u)
    out.push({
      px: Math.cos(th) * s * rad,
      py: u * rad * 0.7,
      pz: Math.sin(th) * s * rad,
      rx: rng() * TAU,
      ry: rng() * TAU,
      rz: rng() * TAU,
      sx: (rng() - 0.5) * 0.4,
      sy: (rng() - 0.5) * 0.4,
      sz: (rng() - 0.5) * 0.4,
      scale: 0.7 + rng() * 0.7,
      floatAmp: 0.12 + rng() * 0.18,
      floatSpeed: 0.4 + rng() * 0.5,
      floatPhase: rng() * TAU,
    })
  }
  return out
}

const SOLID_COUNT = 14
const WIRE_COUNT = 10

export default function Artifacts({ reduced }: { reduced: boolean }) {
  const groupRef = useRef<THREE.Group>(null)
  const solidRef = useRef<THREE.InstancedMesh>(null)
  const wireRef = useRef<THREE.InstancedMesh>(null)
  const goneRef = useRef(false)

  const { solidGeo, wireGeo, solidMat, wireMat, solid, wire } = useMemo(() => {
    const rng = mulberry32(4242)
    return {
      solidGeo: new THREE.IcosahedronGeometry(0.32, 0),
      wireGeo: new THREE.OctahedronGeometry(0.38, 0),
      solidMat: new THREE.MeshStandardMaterial({
        color: '#E8ECF4',
        metalness: 0.9,
        roughness: 0.25,
        emissive: '#1a2740',
        emissiveIntensity: 0.25,
      }),
      wireMat: new THREE.MeshStandardMaterial({
        color: '#F5B041',
        wireframe: true,
        metalness: 0.2,
        roughness: 0.6,
        emissive: '#F5B041',
        emissiveIntensity: 0.45,
      }),
      solid: makeInstances(SOLID_COUNT, rng),
      wire: makeInstances(WIRE_COUNT, rng),
    }
  }, [])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useEffect(() => {
    return () => {
      solidGeo.dispose()
      wireGeo.dispose()
      solidMat.dispose()
      wireMat.dispose()
    }
  }, [solidGeo, wireGeo, solidMat, wireMat])

  // Stable across renders (deps: only the reduced-motion flag + the memoized
  // Object3D). Memoizing lets the layout-effect list it honestly and still run
  // just once, since `solid`/`wire`/`dummy` are all stable useMemo values.
  const writeMatrices = useCallback(
    (mesh: THREE.InstancedMesh | null, data: Datum[], vis: number, dt: number) => {
      if (!mesh) return
      for (let i = 0; i < data.length; i++) {
        const d = data[i]
        if (!reduced) {
          d.rx += d.sx * dt
          d.ry += d.sy * dt
          d.rz += d.sz * dt
        }
        const fy = reduced ? 0 : Math.sin(sceneState.time * d.floatSpeed + d.floatPhase) * d.floatAmp
        dummy.position.set(d.px, d.py + fy, d.pz)
        dummy.rotation.set(d.rx, d.ry, d.rz)
        dummy.scale.setScalar(d.scale * vis)
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
      }
      mesh.instanceMatrix.needsUpdate = true
    },
    [reduced, dummy],
  )

  // Place instances before the first paint to avoid an identity-matrix flash.
  useLayoutEffect(() => {
    writeMatrices(solidRef.current, solid, 1, 0)
    writeMatrices(wireRef.current, wire, 1, 0)
  }, [writeMatrices, solid, wire])

  useFrame((_, delta) => {
    if (document.hidden || goneRef.current) return
    const dt = Math.min(delta, 0.05)

    let vis = 1 - smoothstep(0.0, 0.9, sceneState.phase)
    if (sceneState.phase > 1.0) {
      vis = 0
      goneRef.current = true
      if (groupRef.current) groupRef.current.visible = false
    }

    if (!reduced && groupRef.current) {
      const g = groupRef.current
      const k = Math.min(1, dt * 2)
      g.rotation.y += (sceneState.mouseX * 0.08 - g.rotation.y) * k
      g.rotation.x += (-sceneState.mouseY * 0.08 - g.rotation.x) * k
    }

    writeMatrices(solidRef.current, solid, clamp(vis, 0, 1), dt)
    writeMatrices(wireRef.current, wire, clamp(vis, 0, 1), dt)
  })

  return (
    <group ref={groupRef}>
      <instancedMesh ref={solidRef} args={[solidGeo, solidMat, SOLID_COUNT]} frustumCulled={false} />
      <instancedMesh ref={wireRef} args={[wireGeo, wireMat, WIRE_COUNT]} frustumCulled={false} />
    </group>
  )
}
