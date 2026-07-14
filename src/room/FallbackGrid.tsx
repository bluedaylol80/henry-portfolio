import { Link } from 'react-router-dom'
import { useT } from '../lib/i18n'
import { hotspots, fallback, fallbackChrome, type RoomAction } from '../content/room'

/**
 * Non-3D fallback (reduced-motion low-end / fallback tier): a plain menu grid with
 * the same seven destinations as cards. Each card performs the same action as its
 * hotspot pin. Re-skinned to the v20 CONTROL ROOM system.
 */
export default function FallbackGrid({ onAction }: { onAction: (id: string, action: RoomAction) => void }) {
  const t = useT()

  return (
    <div className="relative flex min-h-[100svh] flex-col justify-center px-6 pb-16 pt-28 md:px-10">
      <div className="mx-auto w-full max-w-[1100px]">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-amber">{t(fallbackChrome.heading)}</p>
        <h1 className="u-display mt-4 break-keep text-4xl font-semibold text-ink md:text-6xl">{t(fallback.title)}</h1>
        <p className="mt-4 max-w-2xl break-keep text-base text-ink-soft md:text-lg">{t(fallback.lede)}</p>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hotspots.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => onAction(h.id, h.action)}
              className="group flex flex-col items-start rounded-2xl border border-line bg-elev/40 p-6 text-left transition-colors duration-200 hover:border-amber/40"
            >
              <span className="u-display text-lg font-semibold text-ink md:text-xl">{t(h.label)}</span>
              <span className="mt-2 text-sm text-ink-soft">{t(h.hint)}</span>
              <span aria-hidden className="mt-4 text-amber transition-transform duration-200 group-hover:translate-x-1">
                →
              </span>
            </button>
          ))}
        </div>

        <div className="mt-10">
          <Link
            to="/"
            className="font-mono text-sm uppercase tracking-[0.1em] text-amber underline-offset-4 transition-colors duration-200 hover:text-amber-deep hover:underline"
          >
            {t(fallbackChrome.storyCta)}
          </Link>
        </div>
      </div>
    </div>
  )
}
