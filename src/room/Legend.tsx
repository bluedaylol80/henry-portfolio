import { useT } from '../lib/i18n'
import { hotspots } from '../content/room'
import { roomState, activateHotspot } from './roomState'

/**
 * Always-visible bottom legend bar — the room's menu (owner directive: menu
 * discoverability is priority; primary nav on touch). 7 glass chips mirroring
 * the hotspots: hover highlights the 3D object (writes roomState.hoverId),
 * click triggers the same action as clicking the object (via activateHotspot).
 * Horizontally scrollable on mobile, centred on desktop.
 */
export default function Legend() {
  const t = useT()

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-4 md:pb-6">
      <div
        className="glass pointer-events-auto flex max-w-full items-center gap-1.5 overflow-x-auto rounded-full px-2 py-2 md:gap-2 md:px-3"
        style={{ scrollbarWidth: 'none' }}
      >
        {hotspots.map((h) => (
          <button
            key={h.id}
            type="button"
            onMouseEnter={() => {
              roomState.hoverId = h.id
            }}
            onMouseLeave={() => {
              if (roomState.hoverId === h.id) roomState.hoverId = null
            }}
            onFocus={() => {
              roomState.hoverId = h.id
            }}
            onBlur={() => {
              if (roomState.hoverId === h.id) roomState.hoverId = null
            }}
            onClick={() => activateHotspot(h.id, h.action, true)}
            className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium text-ink-dim transition-colors duration-200 hover:bg-white/10 hover:text-ink md:text-sm"
          >
            <span className="text-ink">{t(h.label)}</span>
            <span className="ml-1.5 hidden text-ink-mute sm:inline">· {t(h.hint)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
