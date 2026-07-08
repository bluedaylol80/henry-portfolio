import { useEffect, useState } from 'react'
import { intro } from '../content/profile'
import { useT } from '../lib/i18n'
import { isSoundOn, onSoundChange, toggleSound } from '../lib/sound'

/**
 * Background-music toggle for the Nav right cluster (SPEC §10.7).
 *
 * Thin view over the shared BGM singleton (`src/lib/sound.ts`) so the Nav
 * toggle and the room's speaker control the same audio. The singleton owns the
 * lazily-created <audio> element, fade tweens, and tab-visibility handling; this
 * component only mirrors on/off state and forwards clicks. Never autoplays.
 */
export default function SoundToggle() {
  const t = useT()
  const [on, setOn] = useState(isSoundOn)

  // Mirror the shared state; the singleton emits on every change.
  useEffect(() => onSoundChange(setOn), [])

  return (
    <button
      type="button"
      onClick={toggleSound}
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
