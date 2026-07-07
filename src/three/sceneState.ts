/**
 * Mutable scene state read/written per-frame by the 3D components.
 * Mirrors the `scrollState` pattern from lib/scroll — NEVER React state in the frame loop.
 */
export const sceneState = {
  /** Damped continuous phase 0..5 (matches the six keyframe formations). */
  phase: 0,
  /** Instant target phase derived from scroll (before damping). */
  target: 0,
  /** Accumulated scene time (paused when the tab is hidden). */
  time: 0,
  /** Smoothed pointer, normalized to [-1, 1]. */
  mouseX: 0,
  mouseY: 0,
}

/** Raw pointer target written by the window pointermove listener. */
export const pointer = { x: 0, y: 0 }
