import { useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { scrollState } from '../lib/scroll'
import { prefersReducedMotion } from '../lib/quality'
import { buildSceneData } from './keyframes'
import { pointer, sceneState } from './sceneState'
import { PHASE_IDS, smoothstep } from './util'
import ParticleField from './ParticleField'
import Artifacts from './Artifacts'
import NetworkLines from './NetworkLines'
import CameraRig from './CameraRig'

/**
 * Persistent fullscreen transparent 3D world behind the DOM.
 * A particle field morphs through six scroll-driven keyframes while the
 * camera dollies cinematically. Bloom + artifacts on the full tier only.
 */

/** Computes the damped phase + smoothed mouse once per frame (mounted first). */
function PhaseDriver({ reduced }: { reduced: boolean }) {
  useFrame((_, delta) => {
    if (document.hidden) return
    const dt = Math.min(delta, 0.05)

    // smooth pointer toward its raw target
    const mk = Math.min(1, dt * 4)
    sceneState.mouseX += (pointer.x - sceneState.mouseX) * mk
    sceneState.mouseY += (pointer.y - sceneState.mouseY) * mk

    // target phase = Σ smoothstep over the driving sections → 0..5
    const s = scrollState.sections
    let target = 0
    for (let i = 0; i < PHASE_IDS.length; i++) {
      target += smoothstep(0.12, 0.62, s[PHASE_IDS[i]] ?? 0)
    }
    sceneState.target = target

    if (reduced) {
      sceneState.phase = target
    } else {
      sceneState.phase += (target - sceneState.phase) * Math.min(1, dt * 3)
    }
    sceneState.time += dt
  })
  return null
}

function Postfx() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom mipmapBlur intensity={0.55} luminanceThreshold={0.25} luminanceSmoothing={0.9} />
    </EffectComposer>
  )
}

export default function Experience({ tier }: { tier: 'full' | 'lite' }) {
  const full = tier === 'full'
  const reduced = prefersReducedMotion()
  const count = full ? 6000 : 2200
  const dpr: [number, number] = full ? [1, 1.75] : [1, 1.25]

  const data = useMemo(() => buildSceneData(count), [count])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden>
      <Canvas
        flat
        dpr={dpr}
        frameloop="always"
        camera={{ fov: 45, position: [0, 0, 11] }}
        gl={{ antialias: false, powerPreference: 'high-performance', alpha: true }}
        onCreated={({ gl }) => gl.setClearAlpha(0)}
      >
        <PhaseDriver reduced={reduced} />
        <CameraRig full={full} reduced={reduced} />

        <ambientLight intensity={0.5} />
        <directionalLight position={[2, 4, 5]} intensity={1.2} />
        <pointLight position={[-3, 1.5, 4]} color="#4FACFE" intensity={25} distance={26} decay={2} />

        <ParticleField data={data} />
        {full && <Artifacts reduced={reduced} />}
        <NetworkLines data={data} />

        {full && <Postfx />}
      </Canvas>
    </div>
  )
}
