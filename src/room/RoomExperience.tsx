import { useRef } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import RoomShell from './objects/RoomShell'
import Desk from './objects/Desk'
import Tv from './objects/Tv'
import Bookshelf from './objects/Bookshelf'
import Server from './objects/Server'
import Coffee from './objects/Coffee'
import Speaker from './objects/Speaker'
import Frame from './objects/Frame'
import RoomCamera, { type RoomCameraHandle } from './RoomCamera'
import InteractionManager from './InteractionManager'
import TourDriver from './TourDriver'
import type { RoomAction } from '../content/room'

/**
 * The room scene (SPEC §13.3) — a warm, soft, "baked-looking" corner diorama.
 *
 * Renderer: ACES filmic tone mapping (exposure 1.40) + soft PCF shadows on the
 * full tier (lite: shadows off, ContactShadows only). Navy fog (near 12 so the
 * finite §17.3 diorama shell ends crisply before fog). PostFX on full: subtle
 * SSAO (corner/contact darkening) + a low-intensity Bloom (threshold raised so
 * the v10 lifted albedos don't bloom) + a cinematic Vignette (§17.4). Camera
 * starts at a high isometric (5.8, 4.7, 5.8) looking at (0, 0.9, 0) with fov 38
 * so the whole diorama and the wood floor read clearly; the mouse WHEEL zooms
 * the orbit radius (RoomCamera §14.1).
 *
 * v7 reference composition (§14.2): bookshelf + TV on the LEFT wall, desk +
 * chair on the BACK wall (center-left), the frame on the BACK wall (right) with
 * a window + plant beside it, a sofa facing the frame with a coffee table + mug
 * hotspot in the CENTRE, and the server rack in the back-right corner. All seven
 * hotspots (desk/tv/bookshelf/server/coffee/speaker/frame) keep content-driven
 * ids; the DOM overlays (Legend / Tooltip / coach) live in RoomPage above this
 * canvas.
 */
export default function RoomExperience({
  tier,
  reduced,
  onAction,
}: {
  tier: 'full' | 'lite'
  reduced: boolean
  onAction: (id: string, action: RoomAction) => void
}) {
  const full = tier === 'full'
  const dpr: [number, number] = full ? [1, 1.75] : [1, 1.25]
  const cameraHandle = useRef<RoomCameraHandle | null>(null)

  return (
    <Canvas
      className="absolute inset-0"
      dpr={dpr}
      frameloop="always"
      shadows={full ? 'soft' : false}
      camera={{ fov: 38, position: [5.8, 4.7, 5.8], near: 0.1, far: 100 }}
      gl={{ antialias: full, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.4
      }}
    >
      <color attach="background" args={['#0A1931']} />
      {/* fog near 10 → 12 (§17.3): the finite slab ends crisply before fog. */}
      <fog attach="fog" args={['#0A1931', 12, 24]} />

      <RoomCamera reduced={reduced} handleRef={cameraHandle} />
      <InteractionManager cameraHandle={cameraHandle} onAction={onAction} />
      <TourDriver />

      <RoomShell full={full} />
      <Desk />
      <Tv />
      <Bookshelf />
      <Server />
      <Coffee />
      <Speaker />
      <Frame />

      {/* SSAO was REMOVED here (v10 amendment): the unblurred SSAO pass dithered
          the dark walls with salt-and-pepper speckle (A/B proven — lite tier
          renders clean). Its AO role is baked into the wall/floor textures
          (§17.2) + ContactShadows; dropping it also removes the §15.6 phone
          artifact suspect and the most expensive GPU pass. */}
      {full && (
        <EffectComposer multisampling={4}>
          {/* threshold 0.45 → 0.55 so the lifted albedos (§17.1) don't bloom. */}
          <Bloom mipmapBlur intensity={0.35} luminanceThreshold={0.55} luminanceSmoothing={0.85} />
          {/* cinematic edge falloff like the reference (§17.4 spec values —
              affordable again now that SSAO no longer darkens the scene). */}
          <Vignette offset={0.28} darkness={0.42} />
        </EffectComposer>
      )}
    </Canvas>
  )
}
