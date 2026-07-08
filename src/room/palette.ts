/**
 * Smart Office palette (SPEC §12) for the room's 3D materials.
 * ONLY these hexes — no legacy tokens.
 */
export const PAL = {
  // structural darks (deep corporate navy family)
  base: '#0A1931',
  elev: '#1A2B4C',
  floor: '#16294F',
  wall: '#13233F',
  wallB: '#0F1D36',
  // warm (game era)
  gold: '#F5B041',
  goldDeep: '#F39C12',
  burnt: '#E67E22',
  // cool (AI era)
  cyan: '#4FACFE',
  mint: '#00F2FE',
  ink: '#F8F9FA',
} as const

/** The five phase spine colours: gold → mint (career book shelf). */
export const PHASE_COLORS = ['#F5B041', '#F39C12', '#E67E22', '#4FACFE', '#00F2FE'] as const
