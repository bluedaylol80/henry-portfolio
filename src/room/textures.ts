import * as THREE from 'three'
import { PAL } from './palette'

/**
 * Procedural CanvasTextures for the room's baked-look pass (SPEC §13.3).
 *
 * We cannot ship Blender bakes, so the "warm walnut floor" and soft glows are
 * painted at runtime into offscreen canvases and cached at module scope (built
 * once, reused for the app lifetime). `disposeRoomTextures()` frees every GPU
 * texture — RoomShell calls it on unmount so nothing leaks between route
 * visits. All maps use SRGB where they carry colour and Linear where they carry
 * data (roughness).
 */

let _wood: THREE.CanvasTexture | null = null
let _woodRough: THREE.CanvasTexture | null = null
let _glow: THREE.CanvasTexture | null = null
let _slats: THREE.CanvasTexture | null = null
let _rug: THREE.CanvasTexture | null = null
let _wallWarm: THREE.CanvasTexture | null = null
let _wallCool: THREE.CanvasTexture | null = null

// small deterministic PRNG so the plank pattern is stable across reloads
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Blend two hex colours (0..1) and return an rgb() string. */
function mix(aHex: string, bHex: string, t: number): string {
  const a = new THREE.Color(aHex)
  const b = new THREE.Color(bHex)
  a.lerp(b, t)
  return `rgb(${Math.round(a.r * 255)},${Math.round(a.g * 255)},${Math.round(a.b * 255)})`
}

/**
 * Warm walnut plank floor + a matching roughness map (planks slightly rougher
 * than their seams so the light catches the boards). Planks run vertically in
 * UV; the floor mesh is rotated 45° so they read diagonal like the reference.
 */
function buildWood(): { map: THREE.CanvasTexture; rough: THREE.CanvasTexture } {
  const S = 1024
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = S
  const ctx = canvas.getContext('2d')!

  const roughCanvas = document.createElement('canvas')
  roughCanvas.width = roughCanvas.height = S
  const rctx = roughCanvas.getContext('2d')!

  const rnd = mulberry32(20260708)

  // base fill
  ctx.fillStyle = PAL.woodMid
  ctx.fillRect(0, 0, S, S)
  rctx.fillStyle = 'rgb(150,150,150)' // mid roughness base
  rctx.fillRect(0, 0, S, S)

  const plankW = S / 6 // 6 planks across
  const rowH = S / 4 // staggered courses down
  for (let col = 0; col < 6; col++) {
    // per-plank colour variation between the walnut stops
    for (let row = -1; row < 4; row++) {
      const off = ((col % 2) * rowH) / 2 // brick-stagger
      const x = col * plankW
      const y = row * rowH + off
      const t = rnd()
      const boardCol =
        t < 0.5 ? mix(PAL.woodDark, PAL.woodMid, t * 2) : mix(PAL.woodMid, PAL.woodLight, (t - 0.5) * 2)
      ctx.fillStyle = boardCol
      ctx.fillRect(x, y, plankW, rowH)

      // subtle long grain streaks
      const grainN = 14 + Math.floor(rnd() * 10)
      for (let g = 0; g < grainN; g++) {
        const gx = x + rnd() * plankW
        ctx.strokeStyle = mix(boardCol, PAL.woodGrain, 0.25 + rnd() * 0.4)
        ctx.globalAlpha = 0.12 + rnd() * 0.18
        ctx.lineWidth = 0.6 + rnd() * 1.4
        ctx.beginPath()
        ctx.moveTo(gx, y)
        // gentle wobble down the board
        let cy = y
        let cx = gx
        while (cy < y + rowH) {
          cy += 8 + rnd() * 12
          cx += (rnd() - 0.5) * 3
          ctx.lineTo(cx, cy)
        }
        ctx.stroke()
      }
      ctx.globalAlpha = 1

      // roughness: board interior mid-rough with a little noise
      const rv = 140 + Math.floor(rnd() * 40)
      rctx.fillStyle = `rgb(${rv},${rv},${rv})`
      rctx.fillRect(x, y, plankW, rowH)
    }

    // vertical seam line between columns (darker groove) — both maps
    ctx.strokeStyle = mix(PAL.woodDark, '#000000', 0.35)
    ctx.globalAlpha = 0.85
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(col * plankW, 0)
    ctx.lineTo(col * plankW, S)
    ctx.stroke()
    ctx.globalAlpha = 1
    // seams are smoother (lower roughness → brighter grooves catch light)
    rctx.strokeStyle = 'rgb(90,90,90)'
    rctx.lineWidth = 3
    rctx.beginPath()
    rctx.moveTo(col * plankW, 0)
    rctx.lineTo(col * plankW, S)
    rctx.stroke()
  }

  // horizontal course seams
  ctx.strokeStyle = mix(PAL.woodDark, '#000000', 0.3)
  ctx.lineWidth = 1.6
  for (let col = 0; col < 6; col++) {
    const off = ((col % 2) * rowH) / 2
    for (let row = 0; row < 5; row++) {
      const y = row * rowH + off
      ctx.beginPath()
      ctx.moveTo(col * (S / 6), y)
      ctx.lineTo((col + 1) * (S / 6), y)
      ctx.stroke()
    }
  }

  // fine speckle grain noise across the whole floor
  const img = ctx.getImageData(0, 0, S, S)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const n = (rnd() - 0.5) * 14
    d[i] = Math.min(255, Math.max(0, d[i] + n))
    d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n))
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n))
  }
  ctx.putImageData(img, 0, 0)

  // ── Bake lighting INTO the floor (§17.2) ──────────────────────
  // Additive/screen pools read as LIGHT painted onto the wood, whereas the
  // additive glow planes over dark wood read as fog — so we bake here and
  // dial the RoomShell floor pools way down. (The map is 45°-rotated on the
  // mesh; the wood repeats 1.6× so pools are approximate, not pixel-precise —
  // soft washes are exactly what we want.)
  ctx.globalCompositeOperation = 'screen'
  // 1) large soft radial brighten centred room-middle: +55% at centre → 0 edge
  const center = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S * 0.72)
  center.addColorStop(0, 'rgba(190,176,150,0.55)')
  center.addColorStop(0.55, 'rgba(150,136,116,0.24)')
  center.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = center
  ctx.fillRect(0, 0, S, S)
  // 2) warm gold pool under the desk zone (back-center-left → upper-left of UV)
  const warm = ctx.createRadialGradient(S * 0.3, S * 0.28, 0, S * 0.3, S * 0.28, S * 0.36)
  warm.addColorStop(0, 'rgba(255,208,155,0.42)')
  warm.addColorStop(0.6, 'rgba(255,208,155,0.16)')
  warm.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = warm
  ctx.fillRect(0, 0, S, S)
  // 3) cool mint hint at the server corner (back-right → upper-right of UV)
  const mint = ctx.createRadialGradient(S * 0.74, S * 0.3, 0, S * 0.74, S * 0.3, S * 0.28)
  mint.addColorStop(0, 'rgba(120,220,230,0.16)')
  mint.addColorStop(0.6, 'rgba(120,220,230,0.06)')
  mint.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = mint
  ctx.fillRect(0, 0, S, S)
  ctx.globalCompositeOperation = 'source-over'

  const map = new THREE.CanvasTexture(canvas)
  map.colorSpace = THREE.SRGBColorSpace
  map.wrapS = map.wrapT = THREE.RepeatWrapping
  map.anisotropy = 8

  const rough = new THREE.CanvasTexture(roughCanvas)
  rough.colorSpace = THREE.NoColorSpace
  rough.wrapS = rough.wrapT = THREE.RepeatWrapping
  rough.anisotropy = 4

  return { map, rough }
}

/**
 * Baked wall light gradient (§17.2) — replaces the flat wall colours so the
 * walls read as lit surfaces, not silhouettes. Painted per wall:
 *   - vertical gradient: darker toward the ceiling (top 25%), lit mid,
 *     a slight warm floor-bounce at the bottom,
 *   - one or two soft radial light pools (warm=back wall gets a gold pool
 *     behind the desk zone + a cool blue pool near the window end; the left
 *     wall gets a single warm pool behind the TV),
 *   - corner AO: the outermost 8% on the edge that meets the other wall is
 *     darkened,
 *   - subtle paper-grain noise (like buildRug).
 * `warm` selects the BACK wall (true) vs the LEFT wall (false). Built once,
 * SRGB, cached, disposed in disposeRoomTextures.
 */
function buildWallTexture(warm: boolean): THREE.CanvasTexture {
  // Walls span 5.2 wide × 3.3 tall (§17.3); use a ~2:1.3 canvas to match.
  const W = 1024
  const H = 640
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  const rnd = mulberry32(warm ? 424242 : 313131)

  const baseHex = warm ? PAL.wall : PAL.wallB

  // 1) base fill
  ctx.fillStyle = baseHex
  ctx.fillRect(0, 0, W, H)

  // 2) vertical gradient — ceiling darker, mid lit, warm floor-bounce bottom.
  //    (Canvas y=0 is the TOP of the wall; y=H is where it meets the floor.)
  const vg = ctx.createLinearGradient(0, 0, 0, H)
  vg.addColorStop(0, 'rgba(0,0,0,0.22)') // ceiling shade
  vg.addColorStop(0.22, 'rgba(255,255,255,0.1)')
  vg.addColorStop(0.55, 'rgba(255,255,255,0.24)') // lit mid
  vg.addColorStop(0.9, 'rgba(255,228,190,0.2)') // warm floor bounce
  vg.addColorStop(1, 'rgba(255,222,180,0.28)')
  ctx.fillStyle = vg
  ctx.fillRect(0, 0, W, H)

  // 3) soft radial light pools (screen composite so they add light).
  ctx.globalCompositeOperation = 'screen'
  const pool = (cx: number, cy: number, r: number, rgb: string, a: number) => {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    g.addColorStop(0, `rgba(${rgb},${a})`)
    g.addColorStop(0.55, `rgba(${rgb},${a * 0.4})`)
    g.addColorStop(1, `rgba(${rgb},0)`)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
  }
  if (warm) {
    // back wall: warm gold pool behind the desk zone (left-of-centre) +
    // cool blue pool near the window end (right side).
    pool(W * 0.34, H * 0.48, W * 0.44, '255,210,160', 0.66)
    pool(W * 0.8, H * 0.42, W * 0.36, '165,200,255', 0.5)
  } else {
    // left wall: single warm pool behind the TV (lower-front of the wall).
    pool(W * 0.62, H * 0.5, W * 0.46, '255,208,155', 0.62)
  }
  ctx.globalCompositeOperation = 'source-over'

  // 4) corner AO — darken the outermost 8% on the edge meeting the other wall.
  //    Back wall inner face runs +X→−X; left wall inner face runs −Z→+Z. On
  //    both maps the shared corner sits at the LEFT edge of the canvas (u=0)
  //    given how the box UVs land, so shade that edge either way.
  const aoW = W * 0.08
  const ao = ctx.createLinearGradient(0, 0, aoW, 0)
  ao.addColorStop(0, 'rgba(0,0,0,0.5)')
  ao.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = ao
  ctx.fillRect(0, 0, aoW, H)

  // 5) subtle paper-grain noise (like buildRug). Kept LOW-amplitude (±2):
  //    the desk spot + SSAO + ACES amplify per-pixel noise in lit mid-tones,
  //    so anything stronger reads as sprayed dirt around the lamp glow.
  const img = ctx.getImageData(0, 0, W, H)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const n = (rnd() - 0.5) * 4
    d[i] = Math.min(255, Math.max(0, d[i] + n))
    d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n))
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n))
  }
  ctx.putImageData(img, 0, 0)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

/** Soft radial glow sprite (white core → transparent) for additive halos. */
function buildGlow(): THREE.CanvasTexture {
  const S = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = S
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.55)')
  g.addColorStop(0.7, 'rgba(255,255,255,0.12)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, S, S)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/**
 * Venetian-blind "window light" gobo — a vertical stack of soft horizontal
 * slats of light, transparent between them. Used on an additive plane on the
 * back wall to fake sunlight through blinds (like the reference's window).
 */
function buildSlats(): THREE.CanvasTexture {
  const W = 256
  const H = 512
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, W, H)
  const slats = 9
  const band = H / slats
  for (let i = 0; i < slats; i++) {
    const cy = i * band + band * 0.45
    const g = ctx.createLinearGradient(0, cy - band * 0.4, 0, cy + band * 0.4)
    g.addColorStop(0, 'rgba(190,212,255,0)')
    g.addColorStop(0.5, 'rgba(200,222,255,0.9)')
    g.addColorStop(1, 'rgba(190,212,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, cy - band * 0.4, W, band * 0.8)
  }
  // soft horizontal falloff at the edges so the patch has a shape
  const edge = ctx.createLinearGradient(0, 0, W, 0)
  edge.addColorStop(0, 'rgba(0,0,0,1)')
  edge.addColorStop(0.15, 'rgba(0,0,0,0)')
  edge.addColorStop(0.85, 'rgba(0,0,0,0)')
  edge.addColorStop(1, 'rgba(0,0,0,1)')
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = edge
  ctx.fillRect(0, 0, W, H)
  ctx.globalCompositeOperation = 'source-over'

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Deep-navy woven rug texture with a subtle border and fabric noise. */
function buildRug(): THREE.CanvasTexture {
  const S = 512
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = S
  const ctx = canvas.getContext('2d')!
  const rnd = mulberry32(778899)

  // rounded field
  ctx.fillStyle = PAL.rugTone
  ctx.fillRect(0, 0, S, S)

  // inner border stripe
  ctx.strokeStyle = PAL.rugEdge
  ctx.lineWidth = 10
  ctx.strokeRect(38, 38, S - 76, S - 76)
  ctx.lineWidth = 3
  ctx.strokeRect(58, 58, S - 116, S - 116)

  // woven fabric micro-noise
  const img = ctx.getImageData(0, 0, S, S)
  const d = img.data
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4
      // weave pattern + noise
      const weave = ((x + y) % 3 === 0 ? 8 : -6) + (rnd() - 0.5) * 10
      d[i] = Math.min(255, Math.max(0, d[i] + weave))
      d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + weave))
      d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + weave))
    }
  }
  ctx.putImageData(img, 0, 0)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

export function getWoodTextures(): { map: THREE.CanvasTexture; rough: THREE.CanvasTexture } {
  if (!_wood || !_woodRough) {
    const built = buildWood()
    _wood = built.map
    _woodRough = built.rough
  }
  return { map: _wood, rough: _woodRough }
}

export function getGlowTexture(): THREE.CanvasTexture {
  if (!_glow) _glow = buildGlow()
  return _glow
}

export function getSlatTexture(): THREE.CanvasTexture {
  if (!_slats) _slats = buildSlats()
  return _slats
}

export function getRugTexture(): THREE.CanvasTexture {
  if (!_rug) _rug = buildRug()
  return _rug
}

/** Baked wall light gradient (§17.2). `warm` → back wall, else left wall. */
export function getWallTexture(warm: boolean): THREE.CanvasTexture {
  if (warm) {
    if (!_wallWarm) _wallWarm = buildWallTexture(true)
    return _wallWarm
  }
  if (!_wallCool) _wallCool = buildWallTexture(false)
  return _wallCool
}

/** Free every cached GPU texture (RoomShell unmount). */
export function disposeRoomTextures(): void {
  _wood?.dispose()
  _woodRough?.dispose()
  _glow?.dispose()
  _slats?.dispose()
  _rug?.dispose()
  _wallWarm?.dispose()
  _wallCool?.dispose()
  _wood = _woodRough = _glow = _slats = _rug = _wallWarm = _wallCool = null
}
