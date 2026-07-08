import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { intro } from '../content/profile'
import { useT } from '../lib/i18n'

const TRACK_SRC = import.meta.env.BASE_URL + 'music/baguira.mp3'
const TARGET_VOLUME = 0.3
const FADE_DUR = 0.8

/**
 * Background-music toggle for the Nav right cluster (SPEC §10.7).
 *
 * Never autoplays: the looping <audio> element is created lazily on the first
 * enable. Enabling fades volume 0 → 0.3; disabling fades out then pauses.
 * Playback auto-pauses when the tab is hidden and resumes on return. Fully
 * self-contained (no props) so Nav can drop it in directly.
 */
export default function SoundToggle() {
  const t = useT()
  const [on, setOn] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fadeRef = useRef<gsap.core.Tween | null>(null)
  // Tracks user intent so visibility changes only resume what the user enabled.
  const wantOnRef = useRef(false)

  function ensureAudio(): HTMLAudioElement {
    if (!audioRef.current) {
      const el = new Audio(TRACK_SRC)
      el.loop = true
      el.volume = 0
      el.preload = 'auto'
      audioRef.current = el
    }
    return audioRef.current
  }

  function fadeTo(target: number, onDone?: () => void) {
    const el = audioRef.current
    if (!el) return
    fadeRef.current?.kill()
    fadeRef.current = gsap.to(el, {
      volume: target,
      duration: FADE_DUR,
      ease: 'power1.inOut',
      onComplete: onDone,
    })
  }

  function enable() {
    const el = ensureAudio()
    wantOnRef.current = true
    setOn(true)
    const p = el.play()
    if (p && typeof p.then === 'function') {
      p.then(() => fadeTo(TARGET_VOLUME)).catch(() => {
        // Playback blocked (e.g. no prior gesture on this element) — revert state.
        wantOnRef.current = false
        setOn(false)
      })
    } else {
      fadeTo(TARGET_VOLUME)
    }
  }

  function disable() {
    wantOnRef.current = false
    setOn(false)
    fadeTo(0, () => audioRef.current?.pause())
  }

  const toggle = () => (on ? disable() : enable())

  // Pause when the tab is hidden; resume (if the user had it on) when visible.
  useEffect(() => {
    const onVisibility = () => {
      const el = audioRef.current
      if (!el) return
      if (document.hidden) {
        fadeRef.current?.kill()
        el.pause()
      } else if (wantOnRef.current) {
        const p = el.play()
        if (p && typeof p.then === 'function') p.catch(() => {})
        fadeTo(TARGET_VOLUME)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  // Teardown on unmount.
  useEffect(() => {
    return () => {
      fadeRef.current?.kill()
      const el = audioRef.current
      if (el) {
        el.pause()
        el.src = ''
        audioRef.current = null
      }
    }
  }, [])

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={t(on ? intro.soundOff : intro.soundOn)}
      className="flex h-10 w-10 items-center justify-center text-ink-dim transition-colors duration-200 hover:text-ink"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 9v6h4l5 4V5L8 9H4z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        {on ? (
          <>
            <path d="M16.5 8.5a5 5 0 010 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M19 6a8 8 0 010 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </>
        ) : (
          <path d="M17 9l5 6M22 9l-5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        )}
      </svg>
    </button>
  )
}
