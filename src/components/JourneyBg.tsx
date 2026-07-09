import type { PhaseColor } from '../content/journey'

/**
 * Ambient, fixed z-0 background for the journey (deep-dive) pages.
 * Tinted by the current phase color; the hub (no color) uses a violet→cyan blend.
 * Premium even when static — the global reduced-motion rule freezes the drift.
 */

// Phase color tokens → era hexes (from tailwind.config `era.*`).
const ERA_HEX: Record<PhaseColor, string> = {
  amber: '#F5B041',
  coral: '#F39C12',
  violet: '#E67E22',
  cyan: '#4FACFE',
  sky: '#00F2FE',
}

function rgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export default function JourneyBg({ color }: { color?: PhaseColor }) {
  // Hub variant: violet → cyan blend. Phase variant: one dominant tint + a cool anchor.
  const primary = color ? ERA_HEX[color] : ERA_HEX.violet
  const secondary = color ? ERA_HEX.cyan : ERA_HEX.cyan

  // One large radial tinted by the phase (top area) + a cooler anchor lower-right,
  // both at 8–12% opacity, layered over the base bg.
  const radialLayer =
    `radial-gradient(1100px 820px at 22% 8%, ${rgba(primary, 0.07)}, transparent 62%),` +
    `radial-gradient(1000px 900px at 82% 78%, ${rgba(secondary, 0.05)}, transparent 60%)`

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-abyss" aria-hidden="true">
      {/* Drifting radial wash */}
      <div
        className="animate-bg-drift absolute inset-[-10%]"
        style={{ background: radialLayer }}
      />
      {/* Flat dim layer — pushes the gradients back so journey text pops (SPEC §10.2). */}
      <div className="absolute inset-0 bg-abyss/35" />
      {/* Vignette — keeps content legible, adds depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(130% 120% at 50% 35%, transparent 55%, rgba(10,25,49,0.8) 100%)',
        }}
      />
    </div>
  )
}
