import { useCallback, useEffect, useRef, useState } from 'react'
import { useT } from '../lib/i18n'
import { prefersReducedMotion } from '../lib/quality'
import { sectionLabels, type GalleryItem } from '../content/journey'

/**
 * 작업 화면 갤러리 (PhasePage 의 Stories 와 Carried 사이에 삽입).
 * 항목이 비어 있으면(=아직 스크린샷 없음) 아무것도 렌더하지 않습니다.
 * 클릭 시 라이트박스: 배경 클릭 / ESC / X 버튼으로 닫힘, 열려 있는 동안 스크롤 잠금.
 */
export default function WorkGallery({
  items,
  label,
}: {
  items: GalleryItem[]
  label: string
}) {
  const t = useT()
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [shown, setShown] = useState(false)
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  const close = useCallback(() => setOpenIndex(null), [])

  // ESC 로 닫기 + 열린 동안 body 스크롤 잠금 + 닫기 버튼 포커스(focus trap-lite) + 페이드 인.
  useEffect(() => {
    if (openIndex === null) {
      setShown(false)
      return
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // 닫기 버튼으로 포커스 이동 (키보드 접근성).
    closeBtnRef.current?.focus()

    // 다음 프레임에 opacity → 1 (CSS 트랜지션 페이드). reduced-motion 은 전역 CSS 가 즉시 처리.
    const raf = requestAnimationFrame(() => setShown(true))

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [openIndex, close])

  if (!items || items.length === 0) return null

  const active = openIndex !== null ? items[openIndex] : null
  const base = import.meta.env.BASE_URL
  const reduce = prefersReducedMotion()

  return (
    <>
      <div
        role="list"
        aria-label={label}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-5"
      >
        {items.map((item, i) => (
          <figure key={i} role="listitem" className="m-0">
            {item.src ? (
              <button
                type="button"
                onClick={() => setOpenIndex(i)}
                aria-label={t(item.caption)}
                className="group block w-full overflow-hidden rounded-xl border border-line transition-colors duration-300 hover:border-brass/50"
              >
                <img
                  src={base + item.src}
                  alt={t(item.caption)}
                  loading="lazy"
                  className="aspect-video w-full rounded-xl object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                />
              </button>
            ) : (
              <div className="flex aspect-video w-full flex-col items-center justify-center rounded-xl border border-dashed border-brass/40 bg-elev/25 p-4 text-center">
                <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-full border border-brass/40 font-mono text-sm text-brass">◱</span>
                <span className="mt-2 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-dim">스크린샷 예정 · coming soon</span>
              </div>
            )}
            <figcaption className="mt-2 break-keep text-xs text-ink-dim">{t(item.caption)}</figcaption>
          </figure>
        ))}
      </div>

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t(active.caption)}
          onClick={close}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-abyss/90 p-6 backdrop-blur-md transition-opacity duration-300 ease-out md:p-10"
          style={{ opacity: reduce || shown ? 1 : 0 }}
        >
          <button
            ref={closeBtnRef}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              close()
            }}
            aria-label={t(sectionLabels.close)}
            className="absolute right-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-ink transition-colors duration-200 hover:border-white/35 hover:text-white"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.7}
              strokeLinecap="round"
              aria-hidden="true"
              className="h-5 w-5"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          <img
            src={base + active.src}
            alt={t(active.caption)}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-[92vw] rounded-lg object-contain"
          />
          <p
            onClick={(e) => e.stopPropagation()}
            className="max-w-[92vw] break-keep text-center text-sm text-ink-dim"
          >
            {t(active.caption)}
          </p>
        </div>
      )}
    </>
  )
}
