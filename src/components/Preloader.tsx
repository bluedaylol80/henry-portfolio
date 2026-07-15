import { useEffect, useRef, useState } from 'react'
import { setReady } from '../lib/appState'
import { getLenis } from '../lib/scroll'
import { prefersReducedMotion } from '../lib/quality'

const WORDMARK = 'HENRY LIM'

// Ease approximations of the retired gsap curves (F2: the preloader is the one
// animation that must run at t=0, so it rides CSS/rAF instead of shipping gsap
// in the critical bundle). power4.inOut ≈ (0.76,0,0.24,1) lives in index.css.
const easeOutQuad = (p: number) => p * (2 - p)

/**
 * Opening curtain. Staggers the HENRY LIM wordmark in (CSS keyframes), runs a
 * 0→100 counter + progress bar (rAF), waits for fonts + window load (raced
 * against a 3.5s failsafe), then lifts away. Calls setReady() exactly once and
 * always within ~4s, and locks scroll while visible. Unmounts itself when done.
 */
export default function Preloader() {
  const [mounted, setMounted] = useState(true)
  const rootRef = useRef<HTMLDivElement>(null)
  const metaRef = useRef<HTMLDivElement>(null)
  const counterRef = useRef<HTMLSpanElement>(null)
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const reduce = prefersReducedMotion()

    // ── lock scroll while visible ──
    getLenis()?.stop()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const unlock = () => {
      getLenis()?.start()
      document.body.style.overflow = prevOverflow
    }

    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      setReady()
      unlock()
      setMounted(false)
    }

    let done = false
    const timers: number[] = []
    const rafs: number[] = []
    let onLoad: (() => void) | null = null

    // Hard guarantee: readiness is signalled within 4s no matter what.
    timers.push(window.setTimeout(() => setReady(), 3700))

    const render = (v: number) => {
      if (counterRef.current) counterRef.current.textContent = String(Math.round(v))
      if (barRef.current) barRef.current.style.transform = `scaleX(${v / 100})`
    }

    // ── reduced motion: quick fade, no choreography ──
    if (reduce) {
      render(100)
      timers.push(
        window.setTimeout(() => {
          root.style.transition = 'opacity 0.3s ease-out'
          root.style.opacity = '0'
          timers.push(window.setTimeout(finish, 320))
        }, 300),
      )
      return () => {
        timers.forEach(window.clearTimeout)
        unlock()
      }
    }

    // ── progress counter + bar: creep to 90 over 1.4s, then sprint to 100 ──
    let progress = 0
    const creepStart = performance.now()
    const creep = (now: number) => {
      if (done) return
      const p = Math.min(1, (now - creepStart) / 1400)
      progress = 90 * easeOutQuad(p)
      render(progress)
      if (p < 1) rafs.push(requestAnimationFrame(creep))
    }
    rafs.push(requestAnimationFrame(creep))

    const complete = () => {
      if (done) return
      done = true
      const from = progress
      const t0 = performance.now()
      const sprint = (now: number) => {
        const p = Math.min(1, (now - t0) / 400)
        progress = from + (100 - from) * easeOutQuad(p)
        render(progress)
        if (p < 1) {
          rafs.push(requestAnimationFrame(sprint))
          return
        }
        // exit choreography: meta fades, then the curtain lifts
        if (metaRef.current) {
          metaRef.current.style.transition = 'opacity 0.3s ease-out'
          metaRef.current.style.opacity = '0'
        }
        timers.push(
          window.setTimeout(() => {
            root.style.transition = 'transform 0.9s cubic-bezier(0.76, 0, 0.24, 1)'
            root.style.transform = 'translateY(-100%)'
            root.addEventListener('transitionend', finish, { once: true })
            timers.push(window.setTimeout(finish, 1300)) // transitionend failsafe
          }, 250),
        )
      }
      rafs.push(requestAnimationFrame(sprint))
    }

    // ── wait for fonts + window load, raced with a 3.5s failsafe ──
    const fonts = document.fonts ? document.fonts.ready : Promise.resolve()
    const load =
      document.readyState === 'complete'
        ? Promise.resolve()
        : new Promise<void>((res) => {
            onLoad = () => res()
            window.addEventListener('load', onLoad, { once: true })
          })
    const assets = Promise.all([fonts, load])
    const failsafe = new Promise<void>((res) => {
      timers.push(window.setTimeout(() => res(), 3500))
    })

    const startedAt = performance.now()
    Promise.race([assets, failsafe]).then(() => {
      // keep the intro on screen for a graceful minimum so the bar can breathe
      const wait = Math.max(0, 800 - (performance.now() - startedAt))
      timers.push(window.setTimeout(() => complete(), wait))
    })

    return () => {
      timers.forEach(window.clearTimeout)
      rafs.forEach(cancelAnimationFrame)
      if (onLoad) window.removeEventListener('load', onLoad)
      unlock()
    }
  }, [])

  if (!mounted) return null

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-abyss"
      aria-hidden="true"
    >
      <div className="flex items-end font-display text-4xl font-bold tracking-[0.18em] text-ink md:text-6xl">
        {WORDMARK.split('').map((ch, i) =>
          ch === ' ' ? (
            <span key={i} className="inline-block w-3 md:w-5" />
          ) : (
            <span key={i} className="inline-block overflow-hidden">
              <span
                data-pl-letter
                className="inline-block"
                style={{ animation: 'pl-rise 0.7s cubic-bezier(0.25, 1, 0.5, 1) both', animationDelay: `${i * 0.05}s` }}
              >
                {ch}
              </span>
            </span>
          ),
        )}
      </div>

      <div ref={metaRef} className="mt-8 flex items-center gap-4">
        <div className="h-px w-40 overflow-hidden bg-white/10 md:w-56">
          <div
            ref={barRef}
            className="h-full w-full origin-left scale-x-0 bg-gradient-to-r from-amber to-amber-deep"
          />
        </div>
        <div className="flex items-baseline font-display text-sm tabular-nums tracking-widest text-ink-dim">
          <span ref={counterRef}>0</span>
          <span className="ml-0.5 text-ink-dim">%</span>
        </div>
      </div>
    </div>
  )
}
