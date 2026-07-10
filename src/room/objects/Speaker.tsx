import { Suspense, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import Hotspot from '../Hotspot'
import { PAL } from '../palette'
import { GlbModel, modelUrl } from '../glb'
import { isSoundOn, onSoundChange } from '../../lib/sound'

/**
 * 스피커 — toggles the shared BGM (action 'sound'). Stands on the LEFT-wall front
 * (−X), its front facing into the room (+X). §23.3 v15: the procedural box +
 * cone meshes are replaced by the owner-image GLB `speaker` (height 0.9). The
 * pulsing mint ring glow decoration is KEPT (§23.3: "keep any glow decoration
 * that still reads") — it sits just in front of the GLB's driver face and pulses
 * when BGM is on. The Hotspot id/hit-proxy/ANCHOR are untouched.
 *
 * rotY was found visually so the driver/front reads toward the viewer (+X). The
 * ring lives on the wrapper group (NOT inside the normalised GLB) so its animated
 * scale/emissive stay independent of the model.
 */
useGLTF.preload(modelUrl('speaker'))

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
    <Hotspot id="speaker" hit={{ size: [0.5, 1.24, 0.5], position: [-1.95, 0.6, 1.95] }}>
      {/* Left wall (−X), front — the group faces +X toward the room. */}
      <group position={[-2.0, 0, 1.95]} rotation={[0, Math.PI / 2, 0]}>
        {/* §23.3: owner-image GLB speaker, height 0.9. Suspends locally so the
            loading GLB can't blank the canvas (§23.1). rotY turns the driver face
            toward +X (found visually). */}
        <Suspense fallback={null}>
          <GlbModel slug="speaker" height={0.9} rotY={-Math.PI / 2} />
        </Suspense>
        {/* Pulsing mint ring in front of the driver (visible only when BGM on).
            Kept decoration (§23.3). y≈0.55 sits over the woofer height; +Z 0.24
            floats just in front of the GLB face (local +Z == world +X). */}
        <mesh ref={ringRef} position={[0, 0.55, 0.24]} rotation={[0, 0, 0]}>
          <ringGeometry args={[0.17, 0.2, 32]} />
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
