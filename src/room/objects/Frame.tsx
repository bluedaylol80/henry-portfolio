import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import Hotspot from '../Hotspot'
import { PAL } from '../palette'
import { getGlowTexture } from '../textures'
import { useLang } from '../../lib/i18n'

/**
 * 벽 액자 — the '대표 성과' hotspot (→ /story#work). A big wall frame on the LEFT
 * wall (−X), front (SPEC §19.2 — the reference's left-wall art, where the TV used
 * to be), its face turned into the room (+X). It shows the wordmark "기획자의 진화"
 * (or "The Evolution of a Planner") with a gold→mint gradient feel, painted onto
 * a canvas texture (reliable Hangul rendering vs. drei Text's default latin
 * font), and a warm gold glow wash on the wall behind it. Texture disposed on
 * unmount / lang change. The group is rotated so the face points +X.
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
    <Hotspot id="frame" hit={{ size: [0.16, 1.16, 1.82], position: [-2.3, 1.5, 1.05] }}>
      {/* Left wall (−X), front — the reference's art-wall position; faces +X. */}
      <group position={[-2.34, 1.5, 1.05]} rotation={[0, Math.PI / 2, 0]}>
        {/* broad warm gold wash on the wall behind the frame. noPick: this glow
            billboard is decorative and sits nearer the camera than the bookshelf
            behind it — without the flag its huge quad would shadow the bookshelf
            raycast and steal its hover/click (§19.2/§19.7). */}
        <sprite position={[0, -0.1, -0.03]} scale={[3.8, 3.0, 1]} userData={{ noPick: true }}>
          <spriteMaterial
            map={glowTex}
            color={PAL.gold}
            transparent
            opacity={0.3}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </sprite>
        {/* soft warm halo tight around the lit frame (decorative → noPick). */}
        <sprite position={[0, 0, -0.05]} scale={[2.6, 2.0, 1]} userData={{ noPick: true }}>
          <spriteMaterial
            map={glowTex}
            color={PAL.deskWarm}
            transparent
            opacity={0.24}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </sprite>
        {/* Frame border (rounded) — larger, reads from across the room */}
        <RoundedBox args={[1.78, 1.12, 0.06]} radius={0.025} smoothness={2} position={[0, 0, 0]} castShadow>
          <meshStandardMaterial color={PAL.elev} roughness={0.45} metalness={0.25} />
        </RoundedBox>
        {/* Canvas art */}
        <mesh position={[0, 0, 0.035]}>
          <planeGeometry args={[1.62, 0.98]} />
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
