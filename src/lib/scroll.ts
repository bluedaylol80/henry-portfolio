import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

/**
 * Mutable scroll state read per-frame by the 3D scene (no React re-renders).
 * - progress: 0..1 across the whole page
 * - sections[id]: 0..1 while section `id` crosses the viewport
 */
export const scrollState = {
  progress: 0,
  velocity: 0,
  sections: {} as Record<string, number>,
}

let lenis: Lenis | null = null

export function getLenis(): Lenis | null {
  return lenis
}

/** App calls this once. `enabled=false` skips Lenis (reduced motion) but keeps progress tracking. */
export function initSmoothScroll(enabled: boolean): () => void {
  const pageTrigger = ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      scrollState.progress = self.progress
      scrollState.velocity = self.getVelocity() / 1000
    },
  })

  if (!enabled) {
    return () => pageTrigger.kill()
  }

  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, touchMultiplier: 1.5 })
  lenis.on('scroll', ScrollTrigger.update)

  const raf = (time: number) => {
    lenis?.raf(time * 1000)
  }
  gsap.ticker.add(raf)
  gsap.ticker.lagSmoothing(0)

  return () => {
    pageTrigger.kill()
    gsap.ticker.remove(raf)
    lenis?.destroy()
    lenis = null
  }
}

/** SectionShell calls this on mount; returns cleanup. */
export function registerSection(id: string, el: HTMLElement): () => void {
  scrollState.sections[id] = 0
  const st = ScrollTrigger.create({
    trigger: el,
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: (self) => {
      scrollState.sections[id] = self.progress
    },
  })
  return () => {
    st.kill()
    delete scrollState.sections[id]
  }
}
