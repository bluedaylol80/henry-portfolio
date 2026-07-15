import Lenis from 'lenis'

/**
 * Smooth-scroll singleton. gsap-free on purpose (F2 budget): the shell drives
 * Lenis with a plain rAF loop, and the lazy career pages — the only ScrollTrigger
 * users — bind `ScrollTrigger.update` through `addScrollListener` from their own
 * chunk. `addScrollListener` is registration-order safe: callbacks added before
 * Lenis exists are attached when `initSmoothScroll` creates it.
 */

let lenis: Lenis | null = null
const scrollCallbacks = new Set<() => void>()

export function getLenis(): Lenis | null {
  return lenis
}

/** Attach a Lenis scroll listener now or as soon as Lenis is created. */
export function addScrollListener(cb: () => void): void {
  if (scrollCallbacks.has(cb)) return
  scrollCallbacks.add(cb)
  lenis?.on('scroll', cb)
}

/** App calls this once. `enabled=false` skips Lenis entirely (reduced motion / fallback). */
export function initSmoothScroll(enabled: boolean): () => void {
  if (!enabled) {
    return () => {}
  }

  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, touchMultiplier: 1.5 })
  scrollCallbacks.forEach((cb) => lenis?.on('scroll', cb))

  let raf = requestAnimationFrame(function loop(time: number) {
    lenis?.raf(time)
    raf = requestAnimationFrame(loop)
  })

  return () => {
    cancelAnimationFrame(raf)
    lenis?.destroy()
    lenis = null
  }
}
