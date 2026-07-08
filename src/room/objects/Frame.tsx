import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import Hotspot from '../Hotspot'
import { PAL } from '../palette'
import { getGlowTexture } from '../textures'
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
  const glowTex = getGlowTexture()

  return (
    <Hotspot id="frame">
      <group position={[-1.55, 2.2, -2.15]}>
        {/* soft warm halo around the lit frame */}
        <sprite position={[0, 0, -0.05]} scale={[2.4, 1.8, 1]}>
          <spriteMaterial
            map={glowTex}
            color={PAL.gold}
            transparent
            opacity={0.22}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </sprite>
        {/* Frame border (rounded) */}
        <RoundedBox args={[1.5, 0.94, 0.05]} radius={0.02} smoothness={2} position={[0, 0, 0]} castShadow>
          <meshStandardMaterial color={PAL.elev} roughness={0.45} metalness={0.25} />
        </RoundedBox>
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
