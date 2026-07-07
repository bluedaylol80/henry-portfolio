import type { Variants } from 'framer-motion'

/** Shared GSAP eases/durations — keep animation language consistent across sections. */
export const EASE = {
  out: 'power3.out',
  inOut: 'power2.inOut',
  expo: 'expo.out',
} as const

export const DUR = { s: 0.5, m: 0.9, l: 1.4 } as const

export const STAGGER = 0.08

/** Framer Motion shared variants */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
}

export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: STAGGER, delayChildren: 0.1 } },
}
