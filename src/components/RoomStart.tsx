import { useCallback, useRef, useState } from 'react'
import { useT } from '../lib/i18n'
import { prefersReducedMotion } from '../lib/quality'
import { enterRoom } from '../room/roomState'

/**
 * `/` start gate (SPEC §19.1) — the bruno-simon-style handwritten "CLICK TO MENU"
 * overlay that teases the live room through a dimmed scrim, mounted in RoomPage's
 * 3D branch ONLY (z-40, above every room overlay). The whole overlay is one big
 * button: a click anywhere runs a 600ms ease-lux fade, then sets the session flag
 * + `enterRoom()` (the entry bus already lives in roomState.ts) and unmounts.
 *
 * Look = `shots-ref/owner-ref-clicktostart.png`: white marker headline at a slight
 * −2° tilt with a gentle pulse (static under reduced motion), a single hand-drawn
 * curved arrow pointing down toward the room, and a KO 필기체 subline. Fonts:
 * font-hand (Permanent Marker) / font-hand-ko (Nanum Pen Script), imported in
 * main.tsx. Gating (sessionStorage `henry.roomEntered`) lives in RoomPage; this
 * component only renders when the gate is unseen and reports back via `onEnter`.
 */

const STORAGE_KEY = 'henry.roomEntered'

export default function RoomStart({ onEnter }: { onEnter: () => void }) {
  const t = useT()
  const reduced = prefersReducedMotion()
  const [leaving, setLeaving] = useState(false)
  // Guard so a double-click can't fire the fade (and enterRoom) twice.
  const doneRef = useRef(false)

  const dismiss = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    try {
      sessionStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // sessionStorage may be unavailable (privacy mode) — enter anyway.
    }
    // Fire the entry bus on the CLICK itself (§19.1) — NOT after the fade. This
    // arms TourDriver so its 900ms delay counts from the click, and the label
    // tour chip appears ≈0.9s after the entry click (§19.7), not ≈1.5s. The 600ms
    // fade below still gates the DOM bottom stack via onEnter(), so the start
    // screen stays minimal while the overlay dissolves.
    enterRoom()
    setLeaving(true)
    const id = window.setTimeout(() => {
      onEnter()
    }, 600)
    // No cleanup subscription needed: the node unmounts only via onEnter after
    // this timer fires, so the timer can never outlive the component.
    void id
  }, [onEnter])

  return (
    <button
      type="button"
      onClick={dismiss}
      aria-label={t({
        ko: '방으로 들어가기 — 이 방의 모든 사물이 메뉴입니다',
        en: 'Enter the room — every object here is a menu',
      })}
      className={`fixed inset-0 z-40 flex cursor-pointer flex-col items-center justify-center bg-abyss/70 px-6 backdrop-blur-[2px] transition-opacity duration-[600ms] ease-lux ${
        leaving ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      {/* Headline — white marker caps, slight −2° tilt, gentle breathe pulse
          (static under reduced motion; the global RM killswitch also stops it). */}
      <span
        className={`select-none font-hand text-[clamp(2.2rem,6vw,4.5rem)] leading-none tracking-wide text-ink drop-shadow-[0_2px_18px_rgba(10,25,49,0.85)] ${
          reduced ? '' : 'animate-room-start'
        }`}
        style={{ transform: 'rotate(-2deg)' }}
      >
        CLICK TO MENU
      </span>

      {/* Hand-drawn curved arrow pointing down toward the room (single round
          stroke, like the reference). Decorative. */}
      <svg
        aria-hidden
        viewBox="0 0 120 96"
        className="mt-6 h-20 w-24 text-ink/90 drop-shadow-[0_2px_12px_rgba(10,25,49,0.8)] md:mt-8 md:h-24 md:w-28"
        fill="none"
        stroke="currentColor"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* curved shaft, sweeping down-and-in */}
        <path d="M96 10C104 40 92 66 60 78" />
        {/* arrowhead */}
        <path d="M46 66 60 80 74 70" />
      </svg>

      {/* KO 필기체 sublines — the explicit "touch the screen to enter" instruction
          (owner 2026-07-12: revive it) + the room-as-menu concept underneath. */}
      <span className="mt-3 select-none font-hand-ko text-2xl leading-tight text-ink md:text-3xl">
        {t({ ko: '화면을 눌러 방으로 들어가기', en: 'Touch the screen to enter' })}
      </span>
      <span className="mt-1 select-none font-hand-ko text-lg text-ink-dim md:text-xl">
        {t({ ko: '방 안의 모든 사물이 메뉴입니다', en: 'Every object in the room is a menu' })}
      </span>
    </button>
  )
}
