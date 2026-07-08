/**
 * Shared math + deterministic RNG for the 3D scene.
 * No per-frame allocations here — these are pure helpers.
 */

/** Deterministic seeded PRNG. Returns a function producing floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function clamp(x: number, min: number, max: number): number {
  return x < min ? min : x > max ? max : x
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** GLSL-style smoothstep with clamping. */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ]
}

/** Era color story (§12 Smart Office): gold → gold → burnt-orange → cyan-blue → mint → cyan-blue. */
export const COLOR_HEX = ['#F5B041', '#F39C12', '#E67E22', '#4FACFE', '#00F2FE', '#4FACFE'] as const
export const COLOR_STOPS: [number, number, number][] = COLOR_HEX.map(hexToRgb)

/** Sections whose scroll progress drives the particle phase (0..5). */
export const PHASE_IDS = ['about', 'career', 'work', 'ai', 'contact'] as const

export const TAU = Math.PI * 2
