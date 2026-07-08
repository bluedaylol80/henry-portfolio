/**
 * Smart Office palette (SPEC §12) for the room's 3D materials.
 * ONLY these hexes — no legacy tokens.
 *
 * v6 baked-look pass (§13.3): the room is lit warm and soft like the
 * my-room-in-3d reference, so alongside the neon accents we add warmer wall
 * navies, walnut wood tones for the floor, a deep-navy rug, and glow colours.
 *
 * v10-A albedo lift (§17.1): dark albedo × ACES tone mapping crushes to black no
 * light can rescue — the diorama read as an underexposed silhouette. Every
 * surface albedo below is lifted ~40–60% in LIGHTNESS keeping the SAME hue (the
 * navy family stays — the page backdrop is still #0A1931; the owner hates
 * light/washed backgrounds). Only the diorama's own surfaces move; the accent
 * neons (gold/mint/cyan) and the structural base/elev tokens are untouched.
 */
export const PAL = {
  // structural darks (deep corporate navy family)
  base: '#0A1931',
  elev: '#1A2B4C',
  floor: '#16294F',
  // walls — lifted warm dark navy (§17.1) so surfaces read, not silhouette
  wall: '#3A4E74', // back wall (the lit one)
  wallB: '#2A3A5C', // side wall (in shadow)
  baseboard: '#1B2A4A',
  // wood floor (walnut planks) — lifted so the boards catch light (§17.1)
  woodDark: '#6E4C30',
  woodMid: '#8A6240',
  woodLight: '#B08050',
  woodGrain: '#5C3E26',
  // rug (deep navy fabric) — lifted (§17.1)
  rugTone: '#1E3A5F',
  rugEdge: '#2C5488',
  // props — lifted (§17.1)
  plantPot: '#4E3A2A',
  leaf: '#3A6350',
  leafLight: '#4F8A6E',
  sofa: '#35507A',
  sofaCushion: '#3E6FA3',
  // warm (game era)
  gold: '#F5B041',
  goldDeep: '#F39C12',
  burnt: '#E67E22',
  // cool (AI era)
  cyan: '#4FACFE',
  mint: '#00F2FE',
  ink: '#F8F9FA',
  // light colours
  windowLight: '#BCD4FF', // cool blue-white directional
  deskWarm: '#FFD59B', // warm gold desk spot
} as const

/** The five phase spine colours: gold → mint (career book shelf). */
export const PHASE_COLORS = ['#F5B041', '#F39C12', '#E67E22', '#4FACFE', '#00F2FE'] as const
