import { useT } from '../lib/i18n'
import { hotspots, type RoomAction } from '../content/room'

/**
 * Always-visible bottom legend — the room's accessible text menu, mirroring the
 * seven hotspot pins. Dispatches through the same `onAction` as the pins (the old
 * roomState.activateHotspot bus lost its subscriber when the 3D interaction manager
 * was removed). Horizontally scrollable on mobile, centred on desktop.
 */
export default function Legend({ onAction }: { onAction: (id: string, action: RoomAction) => void }) {
  const t = useT()

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-4 md:pb-6">
      <div
        className="pointer-events-auto flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full border border-line bg-night/85 px-2 py-2 backdrop-blur-sm md:gap-1 md:px-3"
        style={{ scrollbarWidth: 'none' }}
      >
        {hotspots.map((h) => (
          <button
            key={h.id}
            type="button"
            onClick={() => onAction(h.id, h.action)}
            aria-label={`${t(h.label)} — ${t(h.hint)}`}
            className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors duration-200 hover:bg-white/10 hover:text-amber md:text-sm"
          >
            {t(h.label)}
          </button>
        ))}
      </div>
    </div>
  )
}
