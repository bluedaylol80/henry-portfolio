import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { detectTier, prefersReducedMotion } from '../lib/quality'
import { toggleSound } from '../lib/sound'
import { useT, useLang } from '../lib/i18n'
import { contact } from '../content/profile'
import { coach, explore, hotspots, type RoomAction } from '../content/room'
import RoomImageNav from '../room/RoomImageNav'
import { PINS } from '../room/pins'
import RoomDetail from '../room/RoomDetail'
import FallbackGrid from '../room/FallbackGrid'
import Legend from '../room/Legend'

/**
 * /room — opt-in static "control room" (LOCKED §5.5). A single rendered hero image
 * whose objects are hotspot pins that jump to the real sections; the bottom Legend
 * mirrors them as an accessible text menu. A secondary destination only — reached
 * via the footer link, never a content gate. The single Header (shell) supplies nav,
 * identity and the escape hatch, so the room carries no chrome of its own. On the
 * fallback tier (or a low-end reduced-motion device) a plain menu grid renders.
 */
export default function RoomPage() {
  const t = useT()
  const { lang } = useLang()
  const navigate = useNavigate()
  const tier = useMemo(() => detectTier(), [])
  const reduced = useMemo(() => prefersReducedMotion(), [])
  const useRoom = tier !== 'fallback'

  // v21 P4 — 탐험 상태. 저장하지 않는다(방문 기록을 남길 이유가 없다):
  // 열려 있는 사물과, 이번 방문에서 열어본 사물만 기억한다.
  const [openId, setOpenId] = useState<string | null>(null)
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set())
  const open = useCallback((id: string) => {
    setOpenId((cur) => (cur === id ? null : id))
    setSeen((s) => (s.has(id) ? s : new Set(s).add(id)))
  }, [])
  const openIndex = hotspots.findIndex((h) => h.id === openId)
  const openHotspot = openIndex >= 0 ? hotspots[openIndex] : null

  // 키보드 탐험: ← → 로 옆 사물, Esc 로 닫기. 카드가 열려 있을 때만 가로챈다.
  useEffect(() => {
    if (!useRoom) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openId) {
        setOpenId(null)
        return
      }
      if (openIndex < 0) return
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      e.preventDefault()
      const next = (openIndex + (e.key === 'ArrowRight' ? 1 : hotspots.length - 1)) % hotspots.length
      open(hotspots[next].id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openId, openIndex, open, useRoom])

  // Central dispatcher shared by the image pins and the legend chips.
  const runAction = useCallback(
    (_id: string, action: RoomAction) => {
      switch (action) {
        case 'about':
          navigate('/')
          break
        case 'career':
          navigate('/career')
          break
        case 'work':
          navigate('/#work')
          break
        case 'ai':
          navigate('/work/ai-os')
          break
        case 'contact':
          navigate('/#contact')
          break
        case 'notion':
          window.open(contact.notion, '_blank', 'noopener,noreferrer')
          break
        case 'sound':
          toggleSound()
          break
      }
    },
    [navigate],
  )
  const actionRef = useRef(runAction)
  actionRef.current = runAction
  const onAction = useCallback((id: string, action: RoomAction) => actionRef.current(id, action), [])

  if (!useRoom) {
    return (
      <main id="main" className="relative min-h-[100svh] overflow-hidden bg-night">
        <FallbackGrid onAction={onAction} />
      </main>
    )
  }

  const allSeen = seen.size >= hotspots.length
  const progress = explore.progress[lang].replace('{n}', String(seen.size)).replace('{total}', String(hotspots.length))

  return (
    <main id="main" className="relative h-[100svh] overflow-hidden bg-night" style={{ touchAction: 'none' }}>
      <RoomImageNav onOpen={open} openId={openId} seen={seen} reduced={reduced} />

      {/* 둘러본 정도 — 방에 머무는 동안만 유지되는 가벼운 표시. */}
      <div className="pointer-events-none fixed left-1/2 top-20 z-30 -translate-x-1/2 md:left-auto md:right-8 md:translate-x-0">
        <span className="rounded-full border border-line bg-night/80 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim backdrop-blur-sm">
          {progress}
        </span>
      </div>

      {openHotspot && (
        <RoomDetail
          hotspot={openHotspot}
          side={(PINS[openHotspot.id]?.x ?? 0.5) > 0.5 ? 'left' : 'right'}
          onClose={() => setOpenId(null)}
          onAction={onAction}
        />
      )}

      {/* 한 줄 안내 — 다 둘러보면 "여기 있는 건 전부 본문에도 있다"로 바뀐다.
          방은 끝까지 콘텐츠의 관문이 아니다(LOCKED §5.5). */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[4.5rem] z-30 flex justify-center px-6 md:bottom-20">
        <span className="max-w-[34rem] break-keep rounded-full border border-line bg-night/80 px-4 py-2 text-center text-xs text-ink-dim backdrop-blur-sm">
          {allSeen ? t(explore.allSeen) : t(coach)}
        </span>
      </div>

      <Legend onAction={onAction} />
    </main>
  )
}
