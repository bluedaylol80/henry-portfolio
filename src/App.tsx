import { useEffect, useMemo } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { LanguageProvider } from './lib/i18n'
import { detectTier, type QualityTier } from './lib/quality'
import { getLenis, initSmoothScroll } from './lib/scroll'
import { meta } from './content/profile'
import { phases } from './content/journey'
import Preloader from './components/Preloader'
import Header from './components/Header'
import Cursor from './components/Cursor'
import Footer from './components/Footer'
import DebugPanel from './components/DebugPanel'
import Home from './pages/Home'
import CareerHub from './pages/CareerHub'
import PhasePage from './pages/PhasePage'
import RoomPage from './pages/RoomPage'
import BriefPage from './pages/BriefPage'
import WorkAiOs from './pages/WorkAiOs'

/** Reset scroll position instantly, respecting Lenis when it is active. */
function scrollToTop() {
  getLenis()?.scrollTo(0, { immediate: true })
  window.scrollTo(0, 0)
}

/** Resolves the document title for the current route (v20 IA). */
function useDocumentTitle(pathname: string) {
  useEffect(() => {
    let title = meta.title // '/' — the content-first front door.
    if (pathname === '/brief') {
      title = '3분 요약 — Henry Lim'
    } else if (pathname === '/work/ai-os') {
      title = 'AI-OS · Flagship Case — Henry Lim'
    } else if (pathname === '/room') {
      title = 'The Room — Henry Lim'
    } else if (pathname === '/career') {
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
 * Route-change side effects (v20): keep document.title in sync and scroll to top
 * on pathname change. In-page hash scrolling (/#work, /#contact) is owned by Home;
 * the old `/#section → /story#section` back-compat redirect is retired (root now
 * IS the long-form).
 */
function RouteEffects() {
  const { pathname } = useLocation()
  useDocumentTitle(pathname)
  useEffect(() => {
    scrollToTop()
  }, [pathname])
  return null
}

/** `/story` (and any old deep link) now aliases the root, preserving the hash. */
function StoryRedirect() {
  const { hash } = useLocation()
  return <Navigate to={`/${hash}`} replace />
}

/** Redirects unknown phase slugs back to the hub, else renders the phase page. */
function PhaseRoute() {
  const { slug } = useParams<{ slug: string }>()
  const known = phases.some((p) => p.slug === slug)
  if (!known) return <Navigate to="/career" replace />
  return <PhasePage />
}

/** Single Header (LOCKED §4.2) on every route except the immersive room. */
function ShellHeader() {
  const { pathname } = useLocation()
  if (pathname === '/room') return null
  return <Header />
}

/** Footer everywhere except the immersive room (which owns its own chrome). */
function ShellFooter() {
  const { pathname } = useLocation()
  if (pathname === '/room') return null
  return <Footer />
}

/** Film-grain overlay — everywhere except the immersive room. */
function ShellNoise() {
  const { pathname } = useLocation()
  if (pathname === '/room') return null
  return <div className="noise-overlay" aria-hidden="true" />
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
        <ShellNoise />
        <Cursor enabled={tier === 'full'} />
        <DebugPanel />
        <RouteEffects />
        <ShellHeader />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/room" element={<RoomPage />} />
          <Route path="/brief" element={<BriefPage />} />
          <Route path="/work/ai-os" element={<WorkAiOs />} />
          <Route path="/career" element={<CareerHub />} />
          <Route path="/career/:slug" element={<PhaseRoute />} />
          {/* Back-compat: the old long-form root now lives at `/`. */}
          <Route path="/story" element={<StoryRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ShellFooter />
      </BrowserRouter>
    </LanguageProvider>
  )
}
