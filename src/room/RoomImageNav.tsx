import { useT } from '../lib/i18n'
import { hotspots, type RoomAction } from '../content/room'

/**
 * Static-image room navigator (SPEC §24, 2026-07-12) — replaces the real-time
 * R3F/GLB scene on `/`. The owner's furniture GLBs (TripoSR reconstructions from
 * single images) hit a mesh-quality ceiling that no amount of placement fixing
 * clears, so the room is now a SINGLE high-quality rendered hero image with the
 * seven hotspots as absolutely-positioned button pins over it. This removes the
 * entire real-time-3D surface (raycast proxies, per-object calibration, ~2MB of
 * GLBs, the postFX passes) and every interaction bug that came with it, and works
 * identically on every device including reduced-motion. The bottom Legend bar
 * (kept in RoomPage) is the always-visible text menu, so navigation never depends
 * on hitting a pin.
 *
 * Robust fitting: the <img> defines its own box (max-width/height, width/height
 * auto → contain), the wrapper shrinks to it, and pins are positioned as a % of
 * that wrapper. So the pin coordinates are fractions of the IMAGE and stay locked
 * to their object at any viewport size WITHOUT needing the image's pixel size.
 *
 * Swapping the hero image: drop a new file in public/room/, point HERO at it, and
 * RE-MEASURE the PINS below (they are fractions of THIS image; a different render
 * puts the furniture elsewhere). Everything else is image-independent.
 */

// Current hero: room-hero-b.webp (FLUX isometric diorama, 2026-07-12). Candidates
// a/c also live in public/room/ for the owner to compare.
const HERO = import.meta.env.BASE_URL + 'room/room-hero-b.webp'

/** Pin position per hotspot id — {x,y} are fractions (0–1) of the hero image,
 *  measured against room-hero-b.webp. Re-measure if HERO changes. */
const PINS: Record<string, { x: number; y: number }> = {
  frame: { x: 0.157, y: 0.415 }, // framed poster, left wall (→ 대표 성과)
  bookshelf: { x: 0.216, y: 0.595 }, // tall bookshelf, left (→ 커리어)
  speaker: { x: 0.336, y: 0.388 }, // studio speaker on the shelf (→ 배경 음악)
  desk: { x: 0.372, y: 0.535 }, // desk + glowing monitor (→ 소개)
  tv: { x: 0.612, y: 0.458 }, // wall TV, right (→ 상세 이력)
  server: { x: 0.74, y: 0.52 }, // server rack tower, back-right (→ AI 챕터)
  coffee: { x: 0.633, y: 0.685 }, // right side-table with the coffee mug (→ 커피챗;
  // owner 2026-07-12: the coffee-chat spot is the sofa, but the PIN sits on the
  // right round side table where the mug is, not on the sofa itself)
}

export default function RoomImageNav({
  onAction,
  reduced,
}: {
  onAction: (id: string, action: RoomAction) => void
  reduced: boolean
}) {
  const t = useT()

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* wrapper shrinks to the rendered image; pins are % of it */}
      <div className="relative">
        <img
          src={HERO}
          alt={t({ ko: '헨리의 작업실 — 사물을 눌러 이동', en: "Henry's studio — click an object to navigate" })}
          className="block h-auto max-h-[100svh] w-auto max-w-[100vw] select-none"
          draggable={false}
        />

        {hotspots.map((h) => {
          const p = PINS[h.id]
          if (!p) return null
          return (
            <button
              key={h.id}
              type="button"
              onClick={() => onAction(h.id, h.action)}
              aria-label={`${t(h.label)} — ${t(h.hint)}`}
              className="group absolute z-10 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
              style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
            >
              {/* soft hover ring (fills the 44px hit target) */}
              <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-amber/0 ring-1 ring-amber/0 transition-all duration-300 group-hover:bg-amber/10 group-hover:ring-amber/40 group-focus-visible:bg-amber/10 group-focus-visible:ring-amber/40"
              />
              {/* the pin dot — gently pulses so the objects read as interactive */}
              <span
                aria-hidden
                className={`relative block h-3.5 w-3.5 rounded-full bg-amber shadow-[0_0_12px_2px_rgba(245,176,65,0.55)] ring-2 ring-white/70 transition-transform duration-300 group-hover:scale-125 ${
                  reduced ? '' : 'animate-pulse-slow'
                }`}
              />
              {/* label chip — revealed on hover/focus, above the pin (v20 tokens) */}
              <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                <span className="block rounded-xl border border-line bg-night/90 px-3 py-1.5 text-center backdrop-blur-sm">
                  <span className="block text-sm font-medium leading-tight text-ink">{t(h.label)}</span>
                  <span className="block text-[11px] leading-tight text-ink-dim">{t(h.hint)}</span>
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
