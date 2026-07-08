import Hotspot from '../Hotspot'
import { PAL, PHASE_COLORS } from '../palette'

/**
 * 책장 — the career hotspot (→ /career). A wall shelf holding 5 book boxes whose
 * spines run through the five phase colours (gold → mint), matching the career
 * journey's chapter palette.
 */
export default function Bookshelf() {
  return (
    <Hotspot id="bookshelf">
      <group position={[-2.0, 1.7, -0.4]}>
        {/* Shelf plank */}
        <mesh position={[0, -0.35, 0]}>
          <boxGeometry args={[0.28, 0.04, 1.7]} />
          <meshStandardMaterial color={PAL.elev} roughness={0.7} metalness={0.15} />
        </mesh>
        {/* Top plank */}
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[0.28, 0.04, 1.7]} />
          <meshStandardMaterial color={PAL.elev} roughness={0.7} metalness={0.15} />
        </mesh>
        {/* Back panel */}
        <mesh position={[-0.13, 0.02, 0]}>
          <boxGeometry args={[0.02, 0.75, 1.7]} />
          <meshStandardMaterial color={PAL.wallB} roughness={0.9} />
        </mesh>
        {/* 5 books, spines in phase colours, slight lean variation */}
        {PHASE_COLORS.map((c, i) => {
          const z = -0.62 + i * 0.31
          const lean = i === 3 ? 0.14 : 0
          const h = 0.6 - (i % 2) * 0.05
          return (
            <mesh key={i} position={[0, -0.05 + h / 2, z]} rotation={[0, 0, lean]}>
              <boxGeometry args={[0.2, h, 0.24]} />
              <meshStandardMaterial
                color={c}
                emissive={c}
                emissiveIntensity={0.35}
                roughness={0.55}
                toneMapped={false}
                userData={{ baseEmissive: 0.35 }}
              />
            </mesh>
          )
        })}
      </group>
    </Hotspot>
  )
}
