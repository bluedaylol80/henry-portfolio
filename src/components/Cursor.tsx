import { useEffect, useRef } from 'react'

/**
 * Full-tier custom cursor: an instant dot + a lerp-trailing ring, blended with
 * `mix-blend-difference`. The ring grows and fills when hovering interactive
 * elements. Driven entirely by a rAF loop writing to refs — no React state per
 * frame. Returns null on touch devices or when disabled (App passes
 * `enabled = tier === 'full'`, so this only mounts when motion is allowed).
 */
export default function Cursor({ enabled }: { enabled: boolean }) {
  const disabled =
    !enabled ||
    (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches)

  const rootRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (disabled) return
    const root = rootRef.current
    const dot = dotRef.current
    const ring = ringRef.current
    if (!root || !dot || !ring) return

    // Hide the OS cursor everywhere while the custom cursor is active.
    const styleEl = document.createElement('style')
    styleEl.textContent = 'body.henry-cursor-none,body.henry-cursor-none *{cursor:none!important}'
    document.head.appendChild(styleEl)
    document.body.classList.add('henry-cursor-none')

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const pos = { x: target.x, y: target.y }
    let scale = 1
    let scaleTarget = 1
    let visible = false
    let raf = 0

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    const loop = () => {
      pos.x = lerp(pos.x, target.x, 0.2)
      pos.y = lerp(pos.y, target.y, 0.2)
      scale = lerp(scale, scaleTarget, 0.2)
      dot.style.transform = `translate3d(${target.x}px,${target.y}px,0) translate(-50%,-50%)`
      ring.style.transform = `translate3d(${pos.x}px,${pos.y}px,0) translate(-50%,-50%) scale(${scale})`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX
      target.y = e.clientY
      if (!visible) {
        visible = true
        root.style.opacity = '1'
      }
    }
    const onOver = (e: MouseEvent) => {
      const el = e.target as Element | null
      const hot = !!el?.closest?.('a,button,[data-cursor],input,textarea,select,label')
      scaleTarget = hot ? 1.8 : 1
      ring.classList.toggle('bg-white/10', hot)
    }
    const onLeave = () => {
      visible = false
      root.style.opacity = '0'
    }
    const onEnter = () => {
      visible = true
      root.style.opacity = '1'
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseover', onOver, { passive: true })
    document.addEventListener('mouseleave', onLeave)
    document.addEventListener('mouseenter', onEnter)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('mouseenter', onEnter)
      document.body.classList.remove('henry-cursor-none')
      styleEl.remove()
    }
  }, [disabled])

  if (disabled) return null

  return (
    <div
      ref={rootRef}
      className="pointer-events-none fixed inset-0 z-[70] opacity-0 mix-blend-difference"
      aria-hidden="true"
    >
      <div ref={dotRef} className="absolute left-0 top-0 h-1.5 w-1.5 rounded-full bg-ink" />
      <div
        ref={ringRef}
        className="absolute left-0 top-0 h-9 w-9 rounded-full border border-white/40 transition-colors duration-200"
      />
    </div>
  )
}
