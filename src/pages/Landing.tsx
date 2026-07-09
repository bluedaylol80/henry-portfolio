import { Suspense, lazy, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import type { QualityTier } from '../lib/quality'
import { prefersReducedMotion } from '../lib/quality'
import FallbackBg from '../components/FallbackBg'
import Hero from '../sections/Hero'
import About from '../sections/About'
import Career from '../sections/Career'
import Achievements from '../sections/Achievements'
import AIChapter from '../sections/AIChapter'
import Skills from '../sections/Skills'
import Contact from '../sections/Contact'

const Experience = lazy(() => import('../three/Experience'))

/** Darkened-state opacity once the hero effect has played (SPEC §10.2). */
const SCRIM_MAX = 0.45

/**
 * The v1 landing composition. The 3D `Experience` (and its `FallbackBg`
 * suspense fallback) mount ONLY here so journey pages stay lightweight.
 * Preloader, Nav, Cursor, Footer and smooth-scroll live at the shell level.
 *
 * §10.2 — background dim: a fixed z-[5] scrim (above canvas z-0, below content
 * z-10) stays transparent while the hero effect is on screen, then fades in to
 * SCRIM_MAX as the hero scrolls past so downstream sections read against a
 * darker backdrop. Fonts/colors are untouched.
 */
export default function Landing({ tier }: { tier: QualityTier }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const scrimRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const scrim = scrimRef.current
      if (!scrim) return
      const reduce = prefersReducedMotion()

      // Reduced motion: no tween — snap opacity by scroll position. Mirror the
      // animated path's enter/leaveBack so the scrim is dimmed for ALL sections
      // past the hero and clears only when scrolled back above hero-centre.
      // (onToggle/isActive left the scrim at 0 once scrolled well past hero.)
      if (reduce) {
        ScrollTrigger.create({
          trigger: '#hero',
          start: 'center center',
          onEnter: () => gsap.set(scrim, { opacity: SCRIM_MAX }),
          onLeaveBack: () => gsap.set(scrim, { opacity: 0 }),
        })
        return
      }

      // Smooth 0.5s toggle-tween: dim in once the hero passes center, reverse up.
      const tween = gsap.to(scrim, {
        opacity: SCRIM_MAX,
        duration: 0.5,
        ease: 'power2.out',
        paused: true,
      })
      ScrollTrigger.create({
        trigger: '#hero',
        start: 'center center',
        onEnter: () => tween.play(),
        onLeaveBack: () => tween.reverse(),
      })
    },
    { scope: rootRef },
  )

  return (
    <div ref={rootRef}>
      {tier === 'fallback' ? (
        <FallbackBg />
      ) : (
        <Suspense fallback={<FallbackBg />}>
          <Experience tier={tier} />
        </Suspense>
      )}
      {/* Background dim scrim — starts transparent, fades in past the hero. */}
      <div
        ref={scrimRef}
        data-scrim
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[5] bg-abyss"
        style={{ opacity: 0 }}
      />
      <main id="main" className="relative z-10">
        <Hero />
        <About />
        <Career />
        <Achievements />
        <AIChapter />
        <Skills />
        <Contact />
      </main>
    </div>
  )
}
