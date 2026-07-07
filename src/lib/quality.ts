export type QualityTier = 'full' | 'lite' | 'fallback'

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export function detectTier(): QualityTier {
  if (typeof window === 'undefined') return 'fallback'
  if (prefersReducedMotion()) return 'fallback'
  if (!hasWebGL()) return 'fallback'

  const nav = navigator as Navigator & { deviceMemory?: number }
  const isMobileUA = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
  const isSmallTouch = (navigator.maxTouchPoints ?? 0) > 2 && window.innerWidth < 1024
  const lowMemory = (nav.deviceMemory ?? 8) <= 4
  const lowCores = (navigator.hardwareConcurrency ?? 8) <= 4

  if (isMobileUA || isSmallTouch || (lowMemory && lowCores)) return 'lite'
  return 'full'
}
