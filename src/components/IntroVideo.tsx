import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { intro } from '../content/profile'
import { useT } from '../lib/i18n'
import { getLenis } from '../lib/scroll'
import { prefersReducedMotion } from '../lib/quality'
import { onIntroRequest } from '../lib/introBus'

const SEEN_KEY = 'henry.introSeen'

function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, '1')
  } catch {
    /* private mode — best effort */
  }
}

/** Speaker icons for the in-overlay video sound toggle. */
function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 9v6h4l5 4V5L8 9H4z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {muted ? (
        <path d="M17 9l5 6M22 9l-5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      ) : (
        <>
          <path d="M16.5 8.5a5 5 0 010 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M19 6a8 8 0 010 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}

/**
 * Fullscreen intro-video overlay (SPEC §10.1, §15.2). Opens ONLY on demand via
 * the intro bus — the RoomPage first-visit badge, the LegendHeader 컴퓨터 chip,
 * the room desk hotspot, or the fallback grid card. The first-visit auto-open was
 * removed in v8 (§15.2): the room now shows immediately with no video overlay.
 *
 * On close it runs the owner's end sequence — dim to black → fade the overlay
 * out — then navigates to any afterNavigate target the opener passed (e.g.
 * '/story#about'), else smooth-scrolls to #about when opened via nav on /story.
 * The seen flag is always set on every close path, and scroll is locked while open.
 */
export default function IntroVideo() {
  const t = useT()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  // Surfaced when the browser rejects autoplay (a centered manual play button).
  const [needsPlayButton, setNeedsPlayButton] = useState(false)
  const [videoMuted, setVideoMuted] = useState(true)

  const rootRef = useRef<HTMLDivElement>(null)
  const dimRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const manualRef = useRef(false) // opened via nav → scroll to #about on close
  // Path to navigate to after the overlay closes (e.g. '/story#about'), when the
  // opener passed one (room desk / LegendHeader 컴퓨터 chip). Overrides the legacy
  // in-place '#about' scroll below.
  const afterNavigateRef = useRef<string | null>(null)
  const closingRef = useRef(false)

  // ── Open trigger: manual only (intro bus) ──
  // §15.2: the first-visit AUTO-open is removed entirely. The intro now opens
  // only on demand — the RoomPage badge, the LegendHeader 컴퓨터 chip, the room
  // desk hotspot, or the fallback grid card — all via the intro bus below (each
  // may pass an afterNavigate target). Every close path still sets henry.introSeen.
  useEffect(() => {
    // Manual open from anywhere (Nav / room). Always allowed, even after "seen".
    const off = onIntroRequest((opts) => {
      manualRef.current = true
      afterNavigateRef.current = opts?.afterNavigate ?? null
      setOpen(true)
    })
    return off
  }, [])

  // ── Scroll lock while open ──
  useEffect(() => {
    if (!open) return
    const lenis = getLenis()
    lenis?.stop()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      lenis?.start()
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  // ── Entrance + playback kickoff (fresh each time the overlay opens) ──
  useGSAP(
    () => {
      if (!open) return
      const root = rootRef.current
      const video = videoRef.current
      if (!root) return

      closingRef.current = false
      setNeedsPlayButton(false)
      setVideoMuted(true)

      const reduce = prefersReducedMotion()
      gsap.set(root, { autoAlpha: 1 })
      if (dimRef.current) gsap.set(dimRef.current, { opacity: 0 })
      if (!reduce) {
        gsap.from(root, { autoAlpha: 0, duration: 0.4, ease: 'power2.out' })
      }

      if (video) {
        video.muted = true
        video.currentTime = 0
        const p = video.play()
        if (p && typeof p.then === 'function') {
          p.catch(() => {
            // Autoplay rejected — surface a centered play button.
            setNeedsPlayButton(true)
          })
        }
      }
    },
    { scope: rootRef, dependencies: [open] },
  )

  // ── ESC to skip ──
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  /** Owner end sequence: dim-to-black → fade overlay out → optional scroll to #about. */
  function close() {
    if (closingRef.current) return
    closingRef.current = true
    markSeen()

    const wasManual = manualRef.current
    const afterNavigate = afterNavigateRef.current
    const root = rootRef.current
    const video = videoRef.current

    const finish = () => {
      // Pause to release the media element before unmount.
      if (video) {
        try {
          video.pause()
        } catch {
          /* ignore */
        }
      }
      setOpen(false)

      // Priority: an explicit afterNavigate (room desk / LegendHeader 컴퓨터 chip).
      // Navigation alone is enough — App's /story hash effect performs the scroll
      // (it already handles the Lenis resize/start timing on SPA arrival). This
      // works from ANY route and on ANY close path (ended / skip / ESC).
      if (afterNavigate) {
        navigate(afterNavigate)
        return
      }

      // Legacy: scroll to #about only for nav-opened intros, and only on the
      // story route (the former landing). BrowserRouter uses BASE_URL as basename.
      const strip = (s: string) => s.replace(/\/+$/, '')
      const onStory = strip(window.location.pathname) === strip((import.meta.env.BASE_URL || '/') + 'story')
      if (wasManual && onStory) {
        // Defer to the next tick: setOpen(false) releases the scroll-lock effect,
        // which restarts Lenis. A stopped Lenis ignores scrollTo, so we must run
        // AFTER start() — plus force:true as a belt-and-suspenders. window.scrollTo
        // is a fallback for the (already-restarted) native path.
        window.setTimeout(() => {
          const el = document.getElementById('about')
          if (!el) return
          const lenis = getLenis()
          if (lenis) {
            lenis.start()
            lenis.scrollTo(el, { offset: 0, duration: 1.2, force: true })
          } else {
            el.scrollIntoView({ behavior: 'smooth' })
          }
        }, 60)
      }
    }

    if (!root || prefersReducedMotion()) {
      finish()
      return
    }

    const tl = gsap.timeline({ onComplete: finish })
    if (dimRef.current) {
      tl.to(dimRef.current, { opacity: 1, duration: 0.6, ease: 'power2.inOut' })
    }
    tl.to(root, { autoAlpha: 0, duration: 0.8, ease: 'power2.inOut' }, dimRef.current ? '-=0.05' : 0)
  }

  function toggleVideoSound() {
    const video = videoRef.current
    if (!video) return
    const nextMuted = !video.muted
    video.muted = nextMuted
    setVideoMuted(nextMuted)
    // Unmuting may require an explicit play() to satisfy some browsers.
    if (!nextMuted) {
      const p = video.play()
      if (p && typeof p.then === 'function') p.catch(() => {})
    }
  }

  function handleManualPlay() {
    const video = videoRef.current
    if (!video) return
    const p = video.play()
    if (p && typeof p.then === 'function') {
      p.then(() => setNeedsPlayButton(false)).catch(() => {})
    } else {
      setNeedsPlayButton(false)
    }
  }

  if (!open) return null

  const chip =
    'flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-4 py-2 text-sm text-ink-dim backdrop-blur-md transition-colors duration-200 hover:border-white/30 hover:text-ink'

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={t(intro.ariaLabel)}
      className="fixed inset-0 z-[55] flex items-center justify-center bg-abyss"
    >
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        src={import.meta.env.BASE_URL + intro.videoSrc}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={close}
      />

      {/* Dim-to-black layer for the end sequence (over the video, under the controls). */}
      <div ref={dimRef} className="pointer-events-none absolute inset-0 bg-black opacity-0" aria-hidden="true" />

      {/* Skip — top-right */}
      <button
        type="button"
        onClick={close}
        className={`absolute right-5 top-5 md:right-8 md:top-8 ${chip}`}
      >
        {t(intro.skip)}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* Sound toggle — bottom-right (unmutes the video) */}
      <button
        type="button"
        onClick={toggleVideoSound}
        aria-label={t(videoMuted ? intro.soundOn : intro.soundOff)}
        className={`absolute bottom-5 right-5 md:bottom-8 md:right-8 ${chip}`}
      >
        <SpeakerIcon muted={videoMuted} />
        <span className="hidden sm:inline">{t(videoMuted ? intro.soundOn : intro.soundOff)}</span>
      </button>

      {/* Centered play button — shown only when autoplay was rejected */}
      {needsPlayButton && (
        <button
          type="button"
          onClick={handleManualPlay}
          aria-label={t(intro.ariaLabel)}
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/40"
        >
          <span className="flex h-20 w-20 items-center justify-center rounded-full border border-white/25 bg-white/10 text-ink backdrop-blur-md transition-transform duration-200 hover:scale-105">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  )
}
