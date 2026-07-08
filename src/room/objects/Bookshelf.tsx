import { RoundedBox } from '@react-three/drei'
import Hotspot from '../Hotspot'
import { PAL, PHASE_COLORS } from '../palette'

/**
 * 책장 — the career hotspot (→ /career). A TALL floor-standing bookshelf against
 * the LEFT wall (−X): two shelf levels, the upper one holding the five career
 * "chapter" books whose spines run through the five phase colours (gold → mint).
 * Rounded edges + soft shadows for the baked look. A guitar prop leans beside it
 * (see RoomShell). Mesh-lean to respect the ≤95 budget.
 */
export default function Bookshelf() {
  return (
    <Hotspot id="bookshelf">
      {/* Anchored to the left wall; the unit runs along Z beside the wall. */}
      <group position={[-2.06, 0, -1.15]}>
        {/* Side panels + back + top cap */}
        <RoundedBox args={[0.42, 2.5, 0.06]} radius={0.02} smoothness={2} position={[0, 1.25, -0.82]} castShadow receiveShadow>
          <meshStandardMaterial color={PAL.elev} roughness={0.62} metalness={0.12} />
        </RoundedBox>
        <RoundedBox args={[0.42, 2.5, 0.06]} radius={0.02} smoothness={2} position={[0, 1.25, 0.82]} castShadow receiveShadow>
          <meshStandardMaterial color={PAL.elev} roughness={0.62} metalness={0.12} />
        </RoundedBox>
        <mesh position={[-0.19, 1.25, 0]} receiveShadow>
          <boxGeometry args={[0.03, 2.5, 1.62]} />
          <meshStandardMaterial color={PAL.wallB} roughness={0.9} />
        </mesh>
        <RoundedBox args={[0.42, 0.06, 1.7]} radius={0.02} smoothness={2} position={[0, 2.52, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={PAL.elev} roughness={0.6} metalness={0.12} />
        </RoundedBox>

        {/* Two shelf planks (upper = books, lower = a storage box) */}
        <RoundedBox args={[0.4, 0.05, 1.62]} radius={0.015} smoothness={2} position={[0, 1.5, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={PAL.baseboard} roughness={0.6} metalness={0.14} />
        </RoundedBox>
        <RoundedBox args={[0.4, 0.05, 1.62]} radius={0.015} smoothness={2} position={[0, 0.65, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={PAL.baseboard} roughness={0.6} metalness={0.14} />
        </RoundedBox>

        {/* 5 chapter books on the upper shelf, spines in phase colours. */}
        {PHASE_COLORS.map((c, i) => {
          const z = -0.62 + i * 0.31
          const lean = i === 3 ? 0.16 : 0
          const h = 0.56 - (i % 2) * 0.06
          return (
            <mesh key={i} position={[0, 1.55 + h / 2, z]} rotation={[0, 0, lean]} castShadow>
              <boxGeometry args={[0.2, h, 0.22]} />
              <meshStandardMaterial
                color={c}
                emissive={c}
                emissiveIntensity={0.26}
                roughness={0.6}
                toneMapped={false}
                userData={{ baseEmissive: 0.26 }}
              />
            </mesh>
          )
        })}

        {/* A wide storage box spanning the lower shelf */}
        <mesh position={[0, 0.86, 0]} castShadow>
          <boxGeometry args={[0.24, 0.36, 1.4]} />
          <meshStandardMaterial color={PAL.sofa} roughness={0.7} metalness={0.08} />
        </mesh>
      </group>
    </Hotspot>
  )
}
