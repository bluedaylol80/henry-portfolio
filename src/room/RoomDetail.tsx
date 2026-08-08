import { useEffect, useRef } from 'react'
import { useT } from '../lib/i18n'
import { explore, type RoomHotspot, type RoomAction } from '../content/room'

/**
 * v21 P4 — 사물 카드. 방을 "메뉴"에서 "전시물"로 바꾸는 조각.
 *
 * 핀을 누르면 바로 이동하지 않고 이 카드가 먼저 뜬다. 둘러보다 실수로 페이지를
 * 떠나지 않게 하려는 것이고, 동시에 방에 머물 이유(읽을거리)를 만든다. 이동은
 * 카드 안의 버튼을 한 번 더 눌러야만 일어난다.
 *
 * 이 카드는 **콘텐츠의 관문이 아니다**(LOCKED §5.5 정신) — 여기 있는 내용은 전부
 * 본문에도 있고, 하단 Legend로 언제든 바로 이동할 수 있다.
 *
 * 레이아웃: 데스크톱은 우측 플로팅 패널, 모바일은 하단 시트(핀이 촘촘한 작은
 * 화면에서 카드가 대상 사물을 가리지 않게).
 */
export default function RoomDetail({
  hotspot,
  side,
  onClose,
  onAction,
}: {
  hotspot: RoomHotspot
  // 사물 순번은 일부러 표시하지 않는다 — 화면 우상단의 "둘러본 사물 n/7"(진행도)과
  // 숫자 모양이 같아서 두 개가 같이 있으면 의미가 헷갈린다.
  /** 카드가 대상 사물을 가리지 않도록, 핀의 반대쪽에 띄운다(데스크톱). */
  side: 'left' | 'right'
  onClose: () => void
  onAction: (id: string, action: RoomAction) => void
}) {
  const t = useT()
  const ref = useRef<HTMLDivElement>(null)

  // 카드가 열리면 포커스를 옮긴다 — 키보드 사용자가 카드를 "찾아다니지" 않게.
  useEffect(() => {
    ref.current?.focus()
  }, [hotspot.id])

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="dialog"
      aria-label={t(hotspot.label)}
      className={`pointer-events-auto fixed inset-x-3 bottom-[7.5rem] z-40 max-w-[26rem] rounded-2xl border border-line bg-night/95 p-5 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)] outline-none backdrop-blur-md focus-visible:ring-1 focus-visible:ring-amber/50 md:inset-x-auto md:bottom-auto md:top-1/2 md:-translate-y-1/2 ${
        side === 'left' ? 'md:left-8' : 'md:right-8'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-amber">{t(explore.cardEyebrow)}</p>
          <h2 className="u-display mt-2 break-keep text-lg font-semibold text-ink md:text-xl">{t(hotspot.label)}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t(explore.close)}
          className="-mr-1.5 -mt-1.5 rounded-full border border-line px-2.5 py-1 font-mono text-[11px] text-ink-dim transition-colors hover:border-ink/30 hover:text-ink"
        >
          ✕
        </button>
      </div>

      {hotspot.story && <p className="mt-3 break-keep text-sm leading-relaxed text-ink-soft">{t(hotspot.story)}</p>}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onAction(hotspot.id, hotspot.action)}
          className="inline-flex items-center gap-2 rounded-full bg-amber px-4 py-2 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-night transition-colors hover:bg-amber-deep"
        >
          {t(hotspot.go ?? hotspot.label)}
          <span aria-hidden>→</span>
        </button>
      </div>

      <p className="mt-4 hidden font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim md:block">{t(explore.hintKeys)}</p>
    </div>
  )
}
