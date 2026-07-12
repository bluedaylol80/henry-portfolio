import { useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { setReady } from '../lib/appState'
import { getLenis } from '../lib/scroll'
import { prefersReducedMotion } from '../lib/quality'

const WORDMARK = 'HENRY LIM'

/**
 * Opening curtain. Staggers the HENRY LIM wordmark in, runs a 0→100 counter +
 * progress bar, waits for fonts + window load (raced against a 3.5s failsafe),
 * then lifts away. Calls setReady() exactly once and always within ~4s, and
 * locks scroll while visible. Unmounts itself when done.
 */
export default function Preloader() {
  const [mounted, setMounted] = useState(true)
  const rootRef = useRef<HTMLDivElement>(null)
  const metaRef = useRef<HTMLDivElement>(null)
  const counterRef = useRef<HTMLSpanElement>(null)
  const barRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
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
      const finish = () => {
        setReady()
        unlock()
        setMounted(false)
      }

      let done = false
      const timers: number[] = []
      let onLoad: (() => void) | null = null

      // Hard guarantee: readiness is signalled within 4s no matter what.
      timers.push(window.setTimeout(() => setReady(), 3700))

      // ── reduced motion: quick fade, no choreography ──
      if (reduce) {
        gsap.set('[data-pl-letter]', { yPercent: 0, opacity: 1 })
        if (counterRef.current) counterRef.current.textContent = '100'
        if (barRef.current) barRef.current.style.transform = 'scaleX(1)'
        gsap.to(root, {
          autoAlpha: 0,
          duration: 0.3,
          delay: 0.3,
          ease: 'power2.out',
          onComplete: finish,
        })
        return () => {
          timers.forEach(window.clearTimeout)
          unlock()
        }
      }

      // ── wordmark reveal ──
      gsap.from('[data-pl-letter]', {
        yPercent: 120,
        opacity: 0,
        duration: 0.7,
        ease: 'power4.out',
        stagger: 0.05,
      })

      // ── progress counter + bar ──
      const prog = { v: 0 }
      const render = () => {
        if (counterRef.current) counterRef.current.textContent = String(Math.round(prog.v))
        if (barRef.current) barRef.current.style.transform = `scaleX(${prog.v / 100})`
      }
      const creep = gsap.to(prog, { v: 90, duration: 1.4, ease: 'power1.out', onUpdate: render })

      const complete = () => {
        if (done) return
        done = true
        creep.kill()
        gsap.to(prog, {
          v: 100,
          duration: 0.4,
          ease: 'power2.out',
          onUpdate: render,
          onComplete: () => {
            const tl = gsap.timeline({ onComplete: finish })
            if (metaRef.current) {
              tl.to(metaRef.current, { autoAlpha: 0, duration: 0.3, ease: 'power2.out' })
            }
            tl.to(root, { yPercent: -100, duration: 0.9, ease: 'power4.inOut' }, '-=0.05')
          },
        })
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
        if (onLoad) window.removeEventListener('load', onLoad)
        unlock()
      }
    },
    { scope: rootRef },
  )

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
              <span data-pl-letter className="inline-block">
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
            className="h-full w-full origin-left scale-x-0 bg-gradient-to-r from-era-amber via-era-violet to-era-coral"
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
