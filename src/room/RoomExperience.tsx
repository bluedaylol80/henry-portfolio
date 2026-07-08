import { useRef } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom, SSAO } from '@react-three/postprocessing'
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
 * Renderer: ACES filmic tone mapping (exposure ~1.1) + soft PCF shadows on the
 * full tier (lite: shadows off, ContactShadows only). Navy fog. PostFX on full:
 * subtle SSAO (corner/contact darkening) + a low-intensity Bloom for the neon
 * accents. Camera starts at a high isometric (5.8, 4.7, 5.8) looking at
 * (0, 0.9, 0) with fov 38 so the whole diorama and the wood floor read clearly;
 * the mouse WHEEL zooms the orbit radius (RoomCamera §14.1).
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
        gl.toneMappingExposure = 1.28
      }}
    >
      <color attach="background" args={['#0A1931']} />
      <fog attach="fog" args={['#0A1931', 10, 24]} />

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

      {full && (
        <EffectComposer multisampling={4} enableNormalPass>
          <SSAO
            samples={16}
            rings={4}
            distanceThreshold={0.5}
            distanceFalloff={0.1}
            rangeThreshold={0.5}
            rangeFalloff={0.1}
            luminanceInfluence={0.6}
            radius={0.28}
            intensity={22}
            bias={0.03}
            color={new THREE.Color('#020610')}
          />
          <Bloom mipmapBlur intensity={0.35} luminanceThreshold={0.45} luminanceSmoothing={0.85} />
        </EffectComposer>
      )}
    </Canvas>
  )
}
