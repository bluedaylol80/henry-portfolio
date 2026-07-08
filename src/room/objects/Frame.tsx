import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import Hotspot from '../Hotspot'
import { PAL } from '../palette'
import { useLang } from '../../lib/i18n'

/**
 * 벽 액자 — the about hotspot (→ /#about). A wall frame showing the wordmark
 * "기획자의 진화" (or "The Evolution of a Planner" in EN) with a gold→mint
 * gradient feel, painted onto a canvas texture (reliable Hangul rendering vs.
 * drei Text's default latin font). Texture is disposed on unmount / lang change.
 */
const TEXT = {
  ko: ['기획자의', '진화'],
  en: ['The Evolution', 'of a Planner'],
} as const

export default function Frame() {
  const { lang } = useLang()

  const texture = useMemo(() => {
    const w = 512
    const h = 320
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    // dark backing
    ctx.fillStyle = '#0a1526'
    ctx.fillRect(0, 0, w, h)

    const lines = TEXT[lang]
    // gold → mint vertical gradient text
    const grad = ctx.createLinearGradient(0, 40, 0, h - 40)
    grad.addColorStop(0, PAL.gold)
    grad.addColorStop(0.5, PAL.burnt)
    grad.addColorStop(1, PAL.mint)
    ctx.fillStyle = grad
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const fontSize = lang === 'ko' ? 96 : 62
    ctx.font = `700 ${fontSize}px "Pretendard Variable", Pretendard, sans-serif`
    const lineH = fontSize * 1.15
    const startY = h / 2 - ((lines.length - 1) * lineH) / 2
    lines.forEach((ln, i) => {
      ctx.fillText(ln, w / 2, startY + i * lineH)
    })

    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 4
    return tex
  }, [lang])

  useEffect(() => () => texture.dispose(), [texture])

  return (
    <Hotspot id="frame">
      <group position={[-1.55, 2.2, -2.15]}>
        {/* Frame border */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.5, 0.94, 0.05]} />
          <meshStandardMaterial color={PAL.elev} roughness={0.5} metalness={0.3} />
        </mesh>
        {/* Canvas art */}
        <mesh position={[0, 0, 0.03]}>
          <planeGeometry args={[1.36, 0.82]} />
          <meshStandardMaterial
            map={texture}
            emissiveMap={texture}
            emissive="#ffffff"
            emissiveIntensity={0.5}
            toneMapped={false}
            userData={{ baseEmissive: 0.5 }}
          />
        </mesh>
      </group>
    </Hotspot>
  )
}
