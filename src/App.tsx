import { useEffect, useMemo } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { LanguageProvider } from './lib/i18n'
import { detectTier, type QualityTier } from './lib/quality'
import { getLenis, initSmoothScroll } from './lib/scroll'
import { onReady } from './lib/appState'
import { meta } from './content/profile'
import { phases } from './content/journey'
import Preloader from './components/Preloader'
import Nav from './components/Nav'
import LegendHeader from './components/LegendHeader'
import Cursor from './components/Cursor'
import Footer from './components/Footer'
import IntroVideo from './components/IntroVideo'
import DebugPanel from './components/DebugPanel'
import Landing from './pages/Landing'
import CareerHub from './pages/CareerHub'
import PhasePage from './pages/PhasePage'
import RoomPage from './pages/RoomPage'
import BriefPage from './pages/BriefPage'

/** Reset scroll position instantly, respecting Lenis when it is active. */
function scrollToTop() {
  getLenis()?.scrollTo(0, { immediate: true })
  window.scrollTo(0, 0)
}

/** Section ids that used to live at `/#id` and now live on `/story#id`. */
const STORY_SECTION_IDS = new Set(['hero', 'about', 'career', 'work', 'ai', 'skills', 'contact'])

/** Resolves the document title for the current route per SPEC §13.1. */
function useDocumentTitle(pathname: string) {
  useEffect(() => {
    let title = meta.title // '/' — the room IS the site now.
    if (pathname === '/story') {
      title = 'Story — Henry Lim'
    } else if (pathname === '/brief') {
      title = '3분 요약 — Henry Lim'
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
 * Drives route-change side effects (SPEC §13.1):
 *  - back-compat: `/#section` (old shared links) → `/story#section` (replace)
 *  - scroll to top instantly on pathname change
 *  - keep document.title in sync
 *  - on `/story` arrival with a `#section` hash, scroll there once ready
 */
function RouteEffects() {
  const { pathname, hash } = useLocation()
  const navigate = useNavigate()
  useDocumentTitle(pathname)

  // Back-compat: a known section hash on the room root belongs to the story now.
  useEffect(() => {
    if (pathname !== '/' || !hash) return
    const id = hash.replace(/^#/, '')
    if (id && STORY_SECTION_IDS.has(id)) {
      navigate('/story' + hash, { replace: true })
    }
  }, [pathname, hash, navigate])

  // Scroll to top on every path change (hash navigation handled separately).
  useEffect(() => {
    scrollToTop()
  }, [pathname])

  // Story hash arrival: after the preloader is ready, scroll to the section.
  // On a fresh deep-link the preloader delays readiness until layout settles, so
  // one scroll lands. On SPA navigation (e.g. from the room menu → /story#work)
  // `onReady` fires synchronously while Landing is still mounting/measuring, so
  // Lenis has a stale document height and the first scrollTo is a no-op. We poll
  // a few frames until the target has a stable, non-zero offset before scrolling.
  useEffect(() => {
    if (pathname !== '/story' || !hash) return
    const id = hash.replace(/^#/, '')
    if (!id) return

    let raf = 0
    let cancelled = false

    const attemptScroll = () => {
      let lastTop = -1
      let stable = 0
      let tries = 0
      const tick = () => {
        if (cancelled) return
        const el = document.getElementById(id)
        // Wait for the element and a settled layout (top unchanged across frames).
        if (el) {
          const top = Math.round(el.getBoundingClientRect().top + window.scrollY)
          if (top === lastTop && top > 0) stable += 1
          else stable = 0
          lastTop = top
          if (stable >= 2 || tries > 40) {
            const lenis = getLenis()
            if (lenis) {
              // Arriving via SPA nav (e.g. room menu → /story#work), Lenis still
              // has the room's tiny scroll limit (0). Without a fresh measure its
              // scrollTo clamps to 0 and the section never comes into view. Force
              // a resize (and start, in case the menu left it stopped) first.
              lenis.start()
              lenis.resize()
              lenis.scrollTo(el, { offset: 0, duration: 1.2 })
            } else {
              el.scrollIntoView({ behavior: 'smooth' })
            }
            return
          }
        }
        tries += 1
        raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }

    const unsub = onReady(attemptScroll)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      unsub()
    }
  }, [pathname, hash])

  return null
}

/** Shell footer, hidden on the immersive single-viewport room root (`/`). */
function ShellFooter() {
  const { pathname } = useLocation()
  if (pathname === '/') return null
  return <Footer />
}

/**
 * Film-grain overlay, hidden on the room root (`/`) per SPEC §18.1: grain over
 * the dark 3D render read as sensor dirt. The room canvas owns its own texture,
 * so the overlay renders on every other route only.
 */
function ShellNoise() {
  const { pathname } = useLocation()
  if (pathname === '/') return null
  return <div className="noise-overlay" aria-hidden="true" />
}

/** Redirects unknown phase slugs back to the hub, else renders the phase page. */
function PhaseRoute() {
  const { slug } = useParams<{ slug: string }>()
  const known = phases.some((p) => p.slug === slug)
  if (!known) return <Navigate to="/career" replace />
  return <PhasePage />
}

/**
 * Content-page header. Per SPEC §14.4, `/story` and `/career*` now render the
 * LegendHeader (room-legend chips + wordmark + KO/EN + RoomMenu hamburger)
 * INSTEAD of the standard <Nav/>; the room root (`/`) renders nothing here (its
 * own top-right RoomMenu is the sole navigator). <Nav/> is kept in the repo but
 * no longer mounted anywhere.
 */
function ShellNav() {
  const { pathname } = useLocation()
  if (pathname === '/') return null
  return <LegendHeader />
}

// <Nav/> is retained for reference but intentionally unmounted (SPEC §14.4).
void Nav

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
        <ShellNoise />
        <Cursor enabled={tier === 'full'} />
        <DebugPanel />
        <RouteEffects />
        <ShellNav />
        <Routes>
          <Route path="/" element={<RoomPage />} />
          <Route path="/story" element={<Landing tier={tier} />} />
          <Route path="/brief" element={<BriefPage />} />
          <Route path="/career" element={<CareerHub />} />
          <Route path="/career/:slug" element={<PhaseRoute />} />
          {/* Back-compat: the old /room entry now lives at the root. */}
          <Route path="/room" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ShellFooter />
      </BrowserRouter>
    </LanguageProvider>
  )
}
