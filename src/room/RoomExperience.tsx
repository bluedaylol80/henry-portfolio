import { useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import RoomShell from './objects/RoomShell'
import Desk from './objects/Desk'
import Arcade from './objects/Arcade'
import Bookshelf from './objects/Bookshelf'
import Server from './objects/Server'
import Coffee from './objects/Coffee'
import Speaker from './objects/Speaker'
import Frame from './objects/Frame'
import RoomCamera, { type RoomCameraHandle } from './RoomCamera'
import InteractionManager from './InteractionManager'
import type { RoomAction } from '../content/room'

/**
 * The room scene: a corner diorama with 7 hotspot objects (= the menu), a
 * restricted drag-orbit camera, and a central raycast interaction manager.
 * Bloom on the full tier only. Rendered by RoomPage inside a full-viewport
 * container; the DOM overlays (Legend / Tooltip / coach / back link) live in
 * RoomPage above this canvas.
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
      camera={{ fov: 42, position: [4.8, 3.6, 4.8], near: 0.1, far: 100 }}
      gl={{ antialias: !full ? false : true, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#0A1931']} />
      <fog attach="fog" args={['#0A1931', 9, 20]} />

      <RoomCamera reduced={reduced} handleRef={cameraHandle} />
      <InteractionManager cameraHandle={cameraHandle} onAction={onAction} />

      <RoomShell full={full} />
      <Desk />
      <Arcade />
      <Bookshelf />
      <Server />
      <Coffee />
      <Speaker />
      <Frame />

      {full && (
        <EffectComposer multisampling={4}>
          <Bloom mipmapBlur intensity={0.6} luminanceThreshold={0.35} luminanceSmoothing={0.85} />
        </EffectComposer>
      )}
    </Canvas>
  )
}
