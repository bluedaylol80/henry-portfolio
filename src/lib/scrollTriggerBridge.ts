import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { addScrollListener } from './scroll'

/**
 * Lenis ↔ ScrollTrigger sync, owned by the lazy career chunk so gsap stays out
 * of the critical bundle. Importing this module registers the plugin and keeps
 * trigger positions in step with Lenis frames; under reduced motion (no Lenis)
 * ScrollTrigger falls back to native scroll events by itself.
 */
gsap.registerPlugin(ScrollTrigger)
gsap.ticker.lagSmoothing(0)
addScrollListener(ScrollTrigger.update)

export { gsap, ScrollTrigger }
