import { RoundedBox } from '@react-three/drei'
import Hotspot from '../Hotspot'
import { PAL, PHASE_COLORS } from '../palette'

/**
 * 책장 — the career hotspot (→ /career). A wall shelf holding 5 book boxes whose
 * spines run through the five phase colours (gold → mint), matching the career
 * journey's chapter palette. Rounded edges + soft shadows for the baked look.
 */
export default function Bookshelf() {
  return (
    <Hotspot id="bookshelf">
      <group position={[-2.0, 1.7, -0.4]}>
        {/* Shelf plank (bottom) */}
        <RoundedBox args={[0.28, 0.04, 1.7]} radius={0.015} smoothness={2} position={[0, -0.35, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={PAL.elev} roughness={0.6} metalness={0.12} />
        </RoundedBox>
        {/* Top plank */}
        <RoundedBox args={[0.28, 0.04, 1.7]} radius={0.015} smoothness={2} position={[0, 0.4, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={PAL.elev} roughness={0.6} metalness={0.12} />
        </RoundedBox>
        {/* Back panel */}
        <mesh position={[-0.13, 0.02, 0]} receiveShadow>
          <boxGeometry args={[0.02, 0.75, 1.7]} />
          <meshStandardMaterial color={PAL.wallB} roughness={0.9} />
        </mesh>
        {/* 5 books, spines in phase colours, slight lean variation */}
        {PHASE_COLORS.map((c, i) => {
          const z = -0.62 + i * 0.31
          const lean = i === 3 ? 0.14 : 0
          const h = 0.6 - (i % 2) * 0.05
          return (
            <mesh key={i} position={[0, -0.05 + h / 2, z]} rotation={[0, 0, lean]} castShadow>
              <boxGeometry args={[0.2, h, 0.24]} />
              <meshStandardMaterial
                color={c}
                emissive={c}
                emissiveIntensity={0.28}
                roughness={0.6}
                toneMapped={false}
                userData={{ baseEmissive: 0.28 }}
              />
            </mesh>
          )
        })}
      </group>
    </Hotspot>
  )
}
