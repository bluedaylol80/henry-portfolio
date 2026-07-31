import { useT } from '../lib/i18n'
import { hotspots } from '../content/room'
import { PINS } from './pins'

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

/** 핀 좌표는 `room/pins.ts` — RoomPage도 읽으므로 컴포넌트 파일 밖에 둔다. */

export default function RoomImageNav({
  onOpen,
  openId,
  seen,
  reduced,
}: {
  /** v21 P4: 핀은 더 이상 이동을 실행하지 않는다 — 사물 카드를 연다. */
  onOpen: (id: string) => void
  openId: string | null
  /** 이미 열어본 사물 — 다 둘러봤는지 방문자가 알 수 있게 표시를 남긴다. */
  seen: ReadonlySet<string>
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
          const isOpen = openId === h.id
          const isSeen = seen.has(h.id)
          return (
            <button
              key={h.id}
              type="button"
              data-pin={h.id}
              onClick={() => onOpen(h.id)}
              aria-expanded={isOpen}
              aria-label={`${t(h.label)} — ${t(h.hint)}`}
              className="group absolute z-10 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
              style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
            >
              {/* soft hover ring (fills the 44px hit target) */}
              <span
                aria-hidden
                className={`absolute inset-0 rounded-full transition-all duration-300 group-hover:bg-amber/10 group-hover:ring-amber/40 group-focus-visible:bg-amber/10 group-focus-visible:ring-amber/40 ${
                  isOpen ? 'bg-amber/15 ring-1 ring-amber/60' : 'bg-amber/0 ring-1 ring-amber/0'
                }`}
              />
              {/* 핀 점 — 열려 있으면 커진 채로 유지, 이미 본 사물은 맥박을 멈춘다
                  (무엇이 남았는지 눈으로 구분되게). */}
              <span
                aria-hidden
                className={`relative block h-3.5 w-3.5 rounded-full bg-amber shadow-[0_0_12px_2px_rgba(245,176,65,0.55)] ring-2 transition-transform duration-300 group-hover:scale-125 ${
                  isOpen ? 'scale-125 ring-white' : isSeen ? 'ring-white/40' : 'ring-white/70'
                } ${reduced || isSeen || isOpen ? '' : 'animate-pulse-slow'}`}
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
