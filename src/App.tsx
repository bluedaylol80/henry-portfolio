import { Suspense, lazy, useEffect, useMemo } from 'react'
import { LanguageProvider } from './lib/i18n'
import { detectTier, type QualityTier } from './lib/quality'
import { initSmoothScroll } from './lib/scroll'
import Preloader from './components/Preloader'
import Nav from './components/Nav'
import Cursor from './components/Cursor'
import Footer from './components/Footer'
import FallbackBg from './components/FallbackBg'
import Hero from './sections/Hero'
import About from './sections/About'
import Career from './sections/Career'
import Achievements from './sections/Achievements'
import AIChapter from './sections/AIChapter'
import Skills from './sections/Skills'
import Contact from './sections/Contact'

const Experience = lazy(() => import('./three/Experience'))

export default function App() {
  const tier = useMemo<QualityTier>(() => detectTier(), [])

  useEffect(() => initSmoothScroll(tier !== 'fallback'), [tier])

  return (
    <LanguageProvider>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Preloader />
      {tier === 'fallback' ? (
        <FallbackBg />
      ) : (
        <Suspense fallback={<FallbackBg />}>
          <Experience tier={tier} />
        </Suspense>
      )}
      <div className="noise-overlay" aria-hidden="true" />
      <Cursor enabled={tier === 'full'} />
      <Nav />
      <main id="main" className="relative z-10">
        <Hero />
        <About />
        <Career />
        <Achievements />
        <AIChapter />
        <Skills />
        <Contact />
      </main>
      <Footer />
    </LanguageProvider>
  )
}
