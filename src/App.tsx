import { useEffect, useMemo } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { LanguageProvider } from './lib/i18n'
import { detectTier, type QualityTier } from './lib/quality'
import { getLenis, initSmoothScroll } from './lib/scroll'
import { onReady } from './lib/appState'
import { meta } from './content/profile'
import { phases } from './content/journey'
import Preloader from './components/Preloader'
import Nav from './components/Nav'
import Cursor from './components/Cursor'
import Footer from './components/Footer'
import IntroVideo from './components/IntroVideo'
import DebugPanel from './components/DebugPanel'
import Landing from './pages/Landing'
import CareerHub from './pages/CareerHub'
import PhasePage from './pages/PhasePage'

/** Reset scroll position instantly, respecting Lenis when it is active. */
function scrollToTop() {
  getLenis()?.scrollTo(0, { immediate: true })
  window.scrollTo(0, 0)
}

/** Resolves the document title for the current route per SPEC §9. */
function useDocumentTitle(pathname: string) {
  useEffect(() => {
    let title = meta.title
    if (pathname === '/career') {
      title = 'Career Journey — Henry Lim'
    } else if (pathname.startsWith('/career/')) {
      const slug = pathname.slice('/career/'.length)
      const phase = phases.find((p) => p.slug === slug)
      if (phase) title = `Phase ${phase.num} · ${phase.name.en} — Henry Lim`
    }
    document.title = title
  }, [pathname])
}

/**
 * Drives route-change side effects:
 *  - scroll to top instantly on pathname change
 *  - keep document.title in sync
 *  - on Landing arrival with a `#section` hash, scroll there once ready
 */
function RouteEffects() {
  const { pathname, hash } = useLocation()
  useDocumentTitle(pathname)

  // Scroll to top on every path change (hash navigation handled separately).
  useEffect(() => {
    scrollToTop()
  }, [pathname])

  // Landing hash arrival: after the preloader is ready, scroll to the section.
  useEffect(() => {
    if (pathname !== '/' || !hash) return
    const id = hash.replace(/^#/, '')
    if (!id) return
    return onReady(() => {
      const el = document.getElementById(id)
      if (!el) return
      const lenis = getLenis()
      if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.2 })
      else el.scrollIntoView({ behavior: 'smooth' })
    })
  }, [pathname, hash])

  return null
}

/** Redirects unknown phase slugs back to the hub, else renders the phase page. */
function PhaseRoute() {
  const { slug } = useParams<{ slug: string }>()
  const known = phases.some((p) => p.slug === slug)
  if (!known) return <Navigate to="/career" replace />
  return <PhasePage />
}

export default function App() {
  const tier = useMemo<QualityTier>(() => detectTier(), [])

  // Smooth scroll lives at the shell level so it survives route changes.
  useEffect(() => initSmoothScroll(tier !== 'fallback'), [tier])

  return (
    <LanguageProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Preloader />
        <IntroVideo />
        <div className="noise-overlay" aria-hidden="true" />
        <Cursor enabled={tier === 'full'} />
        <DebugPanel />
        <RouteEffects />
        <Nav />
        <Routes>
          <Route path="/" element={<Landing tier={tier} />} />
          <Route path="/career" element={<CareerHub />} />
          <Route path="/career/:slug" element={<PhaseRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </LanguageProvider>
  )
}
