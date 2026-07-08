import { Suspense, lazy } from 'react'
import type { QualityTier } from '../lib/quality'
import FallbackBg from '../components/FallbackBg'
import Hero from '../sections/Hero'
import About from '../sections/About'
import Career from '../sections/Career'
import Achievements from '../sections/Achievements'
import AIChapter from '../sections/AIChapter'
import Skills from '../sections/Skills'
import Contact from '../sections/Contact'

const Experience = lazy(() => import('../three/Experience'))

/**
 * The v1 landing composition. The 3D `Experience` (and its `FallbackBg`
 * suspense fallback) mount ONLY here so journey pages stay lightweight.
 * Preloader, Nav, Cursor, Footer and smooth-scroll live at the shell level.
 */
export default function Landing({ tier }: { tier: QualityTier }) {
  return (
    <>
      {tier === 'fallback' ? (
        <FallbackBg />
      ) : (
        <Suspense fallback={<FallbackBg />}>
          <Experience tier={tier} />
        </Suspense>
      )}
      <main id="main" className="relative z-10">
        <Hero />
        <About />
        <Career />
        <Achievements />
        <AIChapter />
        <Skills />
        <Contact />
      </main>
    </>
  )
}
