import { Link } from 'react-router-dom'
import { useT } from '../lib/i18n'
import { hotspots, fallback, type RoomAction } from '../content/room'

/**
 * Non-3D fallback (reduced-motion / fallback tier): a simple menu grid with the
 * same 7 destinations as cards. Each card performs the same action as its 3D
 * hotspot. No camera motion, no canvas.
 */
export default function FallbackGrid({
  onAction,
}: {
  onAction: (id: string, action: RoomAction) => void
}) {
  const t = useT()

  return (
    <div className="relative flex min-h-[100svh] flex-col justify-center px-6 pb-16 pt-28 md:px-10">
      <div className="mx-auto w-full max-w-[1100px]">
        <p className="eyebrow">THE ROOM</p>
        <h1 className="mt-4 break-keep font-display text-4xl font-bold text-ink md:text-6xl">
          {t(fallback.title)}
        </h1>
        <p className="mt-4 max-w-2xl break-keep text-base text-ink-dim md:text-lg">
          {t(fallback.lede)}
        </p>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hotspots.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => onAction(h.id, h.action)}
              className="glass glass-shine group flex flex-col items-start rounded-3xl p-6 text-left transition-colors duration-200 hover:border-white/25"
            >
              <span className="font-display text-lg font-semibold text-ink md:text-xl">
                {t(h.label)}
              </span>
              <span className="mt-2 text-sm text-ink-dim">{t(h.hint)}</span>
              <span
                aria-hidden
                className="mt-4 text-era-cyan transition-transform duration-200 group-hover:translate-x-1"
              >
                →
              </span>
            </button>
          ))}
        </div>

        <div className="mt-10">
          <Link
            to="/"
            className="text-sm text-ink-dim underline-offset-4 transition-colors duration-200 hover:text-ink hover:underline"
          >
            ← {t({ ko: '메인으로', en: 'Home' })}
          </Link>
        </div>
      </div>
    </div>
  )
}
