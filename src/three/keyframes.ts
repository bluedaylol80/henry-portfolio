import { mulberry32, TAU } from './util'

/**
 * Deterministic geometry for the particle field + network lattice.
 * Everything is generated once from a fixed seed so layouts are reproducible.
 *
 * Keyframes (§4):
 *  K0 galaxy swarm  — sphere shell r≈4 + two tilted orbital rings
 *  K1 vortex        — swirling funnel, narrowing downward
 *  K2 helix path    — double-strand helix along x∈[-6,6], 2.5 turns
 *  K3 columns       — 6 columns of varied height (bar-chart metaphor)
 *  K4 lattice       — 3 horizontal layers of jittered grid nodes
 *  K5 starfield     — wide sparse flat box
 */
export interface SceneData {
  count: number
  /** Six position sets (each length count*3) → attributes aPos0..aPos5. */
  aPos: Float32Array[]
  /** Per-particle seed (length count) → attribute aSeed. */
  aSeed: Float32Array
  /** Network line segments for the AI era. */
  network: {
    position: Float32Array // length segCount*2*3
    along: Float32Array // 0 at start vertex, 1 at end vertex
    seed: Float32Array // per-segment pulse offset (shared by both verts)
    segCount: number
  }
}

const SEED = 1337

interface Node {
  x: number
  y: number
  z: number
}

/** Build the 3-layer lattice nodes that K4 particles cluster around + the network graph connects. */
function buildLattice(rng: () => number): { nodes: Node[]; segs: [number, number][] } {
  const layers = [2.2, 0, -2.2]
  const gridN = 7
  const span = 4.6
  const nodes: Node[] = []

  for (const ly of layers) {
    for (let gx = 0; gx < gridN; gx++) {
      for (let gz = 0; gz < gridN; gz++) {
        if (rng() < 0.14) continue // drop some for organic irregularity
        const x = -span + (gx / (gridN - 1)) * 2 * span + (rng() - 0.5) * 0.55
        const z = -span + (gz / (gridN - 1)) * 2 * span + (rng() - 0.5) * 0.55
        const y = ly + (rng() - 0.5) * 0.32
        nodes.push({ x, y, z })
      }
    }
  }

  // Connect nearby nodes, preferring layer-to-adjacent-layer links.
  const segs: [number, number][] = []
  const R = 2.45
  const MAX = 300
  for (let i = 0; i < nodes.length && segs.length < MAX; i++) {
    for (let j = i + 1; j < nodes.length && segs.length < MAX; j++) {
      const a = nodes[i]
      const b = nodes[j]
      const dx = a.x - b.x
      const dy = a.y - b.y
      const dz = a.z - b.z
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz)
      if (d > R) continue
      const sameLayer = Math.abs(a.y - b.y) < 1.0
      const prob = sameLayer ? 0.26 : 0.55
      if (rng() < prob) segs.push([i, j])
    }
  }

  return { nodes, segs }
}

export function buildSceneData(count: number): SceneData {
  const rng = mulberry32(SEED)

  // ── Lattice + network first (K4 particles cluster on these nodes) ──
  const { nodes, segs } = buildLattice(rng)

  // ── Column heights for K3 (bar chart) ──
  const cols = 6
  const colHeights = new Array<number>(cols)
  const colZ = new Array<number>(cols)
  for (let c = 0; c < cols; c++) {
    colHeights[c] = 1.5 + rng() * 3.5 // 1.5 → 5.0
    colZ[c] = (c % 2 === 0 ? -0.9 : 0.9) + (rng() - 0.5) * 0.4
  }

  const aPos: Float32Array[] = Array.from({ length: 6 }, () => new Float32Array(count * 3))
  const aSeed = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    const o = i * 3

    // ── K0 galaxy swarm ──
    {
      let x: number, y: number, z: number
      if (rng() < 0.72) {
        // sphere shell
        const u = rng() * 2 - 1
        const th = rng() * TAU
        const rad = 4.0 + (rng() - 0.5) * 0.7
        const s = Math.sqrt(1 - u * u)
        x = Math.cos(th) * s * rad
        y = u * rad
        z = Math.sin(th) * s * rad
      } else {
        // two tilted orbital rings
        const ringA = rng() < 0.5
        const a = rng() * TAU
        const rad = 4.5 + (rng() - 0.5) * 0.5
        let px = Math.cos(a) * rad
        let py = (rng() - 0.5) * 0.25
        let pz = Math.sin(a) * rad
        const tilt = ringA ? 0.5 : -0.7
        const ny = py * Math.cos(tilt) - pz * Math.sin(tilt)
        const nz = py * Math.sin(tilt) + pz * Math.cos(tilt)
        py = ny
        pz = nz
        if (!ringA) {
          const rx = px * Math.cos(0.6) - py * Math.sin(0.6)
          const ry = px * Math.sin(0.6) + py * Math.cos(0.6)
          px = rx
          py = ry
        }
        x = px
        y = py
        z = pz
      }
      aPos[0][o] = x
      aPos[0][o + 1] = y
      aPos[0][o + 2] = z
    }

    // ── K1 vortex funnel ──
    {
      const t = rng()
      const y = 3.2 - t * 6.4
      const rad = 0.35 + (1 - t) * 3.3
      const ang = t * TAU * 2.4 + (rng() - 0.5) * 0.3
      aPos[1][o] = Math.cos(ang) * rad + (rng() - 0.5) * 0.25
      aPos[1][o + 1] = y + (rng() - 0.5) * 0.25
      aPos[1][o + 2] = Math.sin(ang) * rad + (rng() - 0.5) * 0.25
    }

    // ── K2 double-strand helix ──
    {
      const t = rng()
      const strand = rng() < 0.5 ? 0 : Math.PI
      const ang = t * TAU * 2.5 + strand
      const rad = 1.7 + (rng() - 0.5) * 0.3
      aPos[2][o] = -6 + 12 * t
      aPos[2][o + 1] = Math.sin(ang) * rad + (rng() - 0.5) * 0.2
      aPos[2][o + 2] = Math.cos(ang) * rad + (rng() - 0.5) * 0.2
    }

    // ── K3 rising columns ──
    {
      const ci = Math.floor(rng() * cols)
      const colX = -5 + ci * 2 // -5,-3,-1,1,3,5
      aPos[3][o] = colX + (rng() - 0.5) * 0.7
      aPos[3][o + 1] = -3 + rng() * colHeights[ci]
      aPos[3][o + 2] = colZ[ci] + (rng() - 0.5) * 0.7
    }

    // ── K4 lattice (cluster around a network node) ──
    {
      const n = nodes[Math.floor(rng() * nodes.length)]
      aPos[4][o] = n.x + (rng() - 0.5) * 0.55
      aPos[4][o + 1] = n.y + (rng() - 0.5) * 0.4
      aPos[4][o + 2] = n.z + (rng() - 0.5) * 0.55
    }

    // ── K5 calm starfield ──
    {
      aPos[5][o] = (rng() * 2 - 1) * 8
      aPos[5][o + 1] = (rng() * 2 - 1) * 5
      aPos[5][o + 2] = rng() * 4 - 2
    }

    aSeed[i] = rng()
  }

  // ── Network buffers ──
  const segCount = segs.length
  const netPos = new Float32Array(segCount * 2 * 3)
  const netAlong = new Float32Array(segCount * 2)
  const netSeed = new Float32Array(segCount * 2)
  for (let s = 0; s < segCount; s++) {
    const [ia, ib] = segs[s]
    const a = nodes[ia]
    const b = nodes[ib]
    const base = s * 6
    netPos[base] = a.x
    netPos[base + 1] = a.y
    netPos[base + 2] = a.z
    netPos[base + 3] = b.x
    netPos[base + 4] = b.y
    netPos[base + 5] = b.z
    netAlong[s * 2] = 0
    netAlong[s * 2 + 1] = 1
    const seed = rng()
    netSeed[s * 2] = seed
    netSeed[s * 2 + 1] = seed
  }

  return {
    count,
    aPos,
    aSeed,
    network: { position: netPos, along: netAlong, seed: netSeed, segCount },
  }
}
