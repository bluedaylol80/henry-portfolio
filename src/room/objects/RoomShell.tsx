import { ContactShadows } from '@react-three/drei'
import { PAL } from '../palette'

/**
 * Corner diorama: a floor + two walls in deep-navy matte, plus modest baked-look
 * lighting (low ambient + a warm gold key over the desk + a cool mint fill over
 * the server) and a soft ContactShadows plane. No real-time shadow maps.
 */
export default function RoomShell({ full }: { full: boolean }) {
  return (
    <group>
      {/* Lights — modest intensities; the "baked" glow comes from emissive accents. */}
      <ambientLight intensity={0.55} color="#4a5f8a" />
      {/* warm gold key over the desk area (left) */}
      <pointLight position={[-1.4, 2.6, 0.4]} color={PAL.gold} intensity={22} distance={11} decay={2} />
      {/* cool mint fill over the server area (right) */}
      <pointLight position={[2.2, 2.4, 0.8]} color={PAL.mint} intensity={16} distance={10} decay={2} />
      {/* soft top ambient bounce so darks are not crushed */}
      <hemisphereLight args={[PAL.elev, PAL.base, 0.35]} />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow={false}>
        <planeGeometry args={[9, 9]} />
        <meshStandardMaterial color={PAL.floor} roughness={0.92} metalness={0.05} />
      </mesh>

      {/* Back wall (−Z) */}
      <mesh position={[0, 2.5, -2.2]}>
        <planeGeometry args={[9, 5]} />
        <meshStandardMaterial color={PAL.wall} roughness={0.95} metalness={0.02} />
      </mesh>

      {/* Left wall (−X) */}
      <mesh position={[-2.2, 2.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[9, 5]} />
        <meshStandardMaterial color={PAL.wallB} roughness={0.95} metalness={0.02} />
      </mesh>

      {/* Thin baseboard glow lines where walls meet floor (baked-look accents) */}
      <mesh position={[0, 0.03, -2.18]}>
        <boxGeometry args={[9, 0.04, 0.02]} />
        <meshStandardMaterial
          color={PAL.cyan}
          emissive={PAL.cyan}
          emissiveIntensity={0.6}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[-2.18, 0.03, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[9, 0.04, 0.02]} />
        <meshStandardMaterial
          color={PAL.burnt}
          emissive={PAL.burnt}
          emissiveIntensity={0.5}
          toneMapped={false}
        />
      </mesh>

      {/* Soft contact shadow under the whole scene (single plane, no shadow maps). */}
      <ContactShadows
        position={[0, 0.02, 0]}
        scale={9}
        resolution={full ? 512 : 256}
        blur={2.6}
        opacity={0.5}
        far={4}
        color="#020610"
        frames={full ? Infinity : 1}
      />
    </group>
  )
}
