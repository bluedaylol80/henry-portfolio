/**
 * Smart Office palette (SPEC §12) for the room's 3D materials.
 * ONLY these hexes — no legacy tokens.
 *
 * v6 baked-look pass (§13.3): the room is lit warm and soft like the
 * my-room-in-3d reference, so alongside the neon accents we add warmer wall
 * navies, walnut wood tones for the floor, a deep-navy rug, and glow colours.
 */
export const PAL = {
  // structural darks (deep corporate navy family)
  base: '#0A1931',
  elev: '#1A2B4C',
  floor: '#16294F',
  // walls — slightly WARMER dark navy so the gold light reads warm on them
  wall: '#22314d', // back wall (the lit one)
  wallB: '#16233d', // side wall (in shadow)
  baseboard: '#0C1830',
  // wood floor (walnut planks)
  woodDark: '#5A3D26',
  woodMid: '#6B4A2F',
  woodLight: '#8B6242',
  woodGrain: '#4A301D',
  // rug (deep navy fabric)
  rugTone: '#132844',
  rugEdge: '#1C3A63',
  // props
  plantPot: '#3A2A1E',
  leaf: '#2C4A3A',
  leafLight: '#3E6552',
  sofa: '#20304E',
  sofaCushion: '#28527A',
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
