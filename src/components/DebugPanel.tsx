import { useEffect, useRef, useState } from 'react'
import { detectTier } from '../lib/quality'
import { sceneState } from '../three/sceneState'

/**
 * `#debug` tuning overlay (SPEC §10.8), a nod to bruno-simon.com/#debug.
 *
 * Renders only when `location.hash === '#debug'`. Shows a live readout —
 * FPS (rAF-counted over a 500ms window), quality tier, the damped scene
 * `phase` (landing only; stays ~0 on journey routes), and the current
 * background-scrim opacity if a `[data-scrim]` element is present — plus
 * quick scrim on/off buttons.
 *
 * All hot values are written into refs and painted into the DOM at 2Hz, so
 * there is no per-frame React state churn.
 */
export default function DebugPanel() {
  const [visible, setVisible] = useState(
    () => typeof window !== 'undefined' && window.location.hash === '#debug',
  )

  const fpsRef = useRef<HTMLSpanElement>(null)
  const tierRef = useRef<HTMLSpanElement>(null)
  const phaseRef = useRef<HTMLSpanElement>(null)
  const scrimRef = useRef<HTMLSpanElement>(null)

  // Toggle on hashchange.
  useEffect(() => {
    const onHash = () => setVisible(window.location.hash === '#debug')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // rAF FPS counter + 2Hz text painter (no React state per frame).
  useEffect(() => {
    if (!visible) return

    let raf = 0
    let frames = 0
    let windowStart = performance.now()
    let fps = 0
    let lastPaint = 0

    const readScrim = (): string => {
      const el = document.querySelector('[data-scrim]')
      if (!el) return '—'
      const op = getComputedStyle(el).opacity
      const n = Number(op)
      return Number.isFinite(n) ? n.toFixed(2) : op
    }

    const paint = () => {
      if (fpsRef.current) fpsRef.current.textContent = String(fps)
      if (tierRef.current) tierRef.current.textContent = detectTier()
      if (phaseRef.current) phaseRef.current.textContent = sceneState.phase.toFixed(2)
      if (scrimRef.current) scrimRef.current.textContent = readScrim()
    }

    const loop = (now: number) => {
      frames++
      const elapsed = now - windowStart
      if (elapsed >= 500) {
        fps = Math.round((frames * 1000) / elapsed)
        frames = 0
        windowStart = now
      }
      if (now - lastPaint >= 500) {
        lastPaint = now
        paint()
      }
      raf = requestAnimationFrame(loop)
    }

    paint()
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [visible])

  function setScrim(target: number) {
    const el = document.querySelector<HTMLElement>('[data-scrim]')
    if (el) el.style.opacity = String(target)
  }

  if (!visible) return null

  const btn =
    'rounded border border-white/15 px-2 py-0.5 text-[11px] text-ink-dim transition-colors duration-150 hover:border-white/30 hover:text-ink'

  return (
    <div className="fixed bottom-4 left-4 z-50 select-none rounded-lg border border-white/10 bg-black/70 px-4 py-3 font-display text-xs tabular-nums text-ink-dim backdrop-blur-md">
      <div className="mb-2 text-[10px] uppercase tracking-[0.3em] text-ink-mute">debug</div>
      <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-1">
        <dt className="text-ink-mute">fps</dt>
        <dd className="text-right text-ink">
          <span ref={fpsRef}>0</span>
        </dd>
        <dt className="text-ink-mute">tier</dt>
        <dd className="text-right text-ink">
          <span ref={tierRef}>—</span>
        </dd>
        <dt className="text-ink-mute">phase</dt>
        <dd className="text-right text-ink">
          <span ref={phaseRef}>0.00</span>
        </dd>
        <dt className="text-ink-mute">scrim</dt>
        <dd className="text-right text-ink">
          <span ref={scrimRef}>—</span>
        </dd>
      </dl>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest text-ink-mute">scrim</span>
        <button type="button" onClick={() => setScrim(0)} className={btn}>
          off
        </button>
        <button type="button" onClick={() => setScrim(0.45)} className={btn}>
          on
        </button>
      </div>
    </div>
  )
}
