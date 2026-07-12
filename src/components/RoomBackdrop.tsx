/**
 * Shared "sleeping room" backdrop for every detail route (/story, /career,
 * /brief, /career/:slug). Reuses the live room diorama (room-hero-b.webp) pushed
 * deep into the dark — dimmed, softly blurred and heavily vignetted — so each
 * detail page reads as "further inside the same midnight study" rather than a
 * separate site (redesign concept "이 방의 조명이 옮겨간다", 2026-07-13).
 *
 * Mounted ONCE at the shell level (App → ShellBackdrop) on non-room routes,
 * replacing the old per-page particle background (/story) and the abstract
 * JourneyBg gradient (/career, /brief). A very slow ken-burns drift (the shared
 * `bg-drift` keyframe in index.css, auto-frozen under prefers-reduced-motion)
 * makes the room appear to breathe; the deep vignette keeps text readable and
 * lets each section's own lighting read as a spotlight.
 */
const HERO = import.meta.env.BASE_URL + 'room/room-hero-b.webp'

export default function RoomBackdrop() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-abyss" aria-hidden="true">
      {/* the diorama, sunk into the dark; inset gives the drift room to move
          without ever exposing a hard edge */}
      <div
        className="absolute inset-[-6%] animate-bg-drift bg-cover bg-center will-change-transform"
        style={{
          backgroundImage: `url(${HERO})`,
          filter: 'brightness(0.32) saturate(0.9) blur(7px)',
        }}
      />
      {/* warm desk-lamp glow near the top so the room feels lit, not just dark */}
      <div className="absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_16%,rgba(245,176,65,0.12),transparent_60%)]" />
      {/* deep framing vignette — edges fall to the base tone so content pops */}
      <div className="absolute inset-0 bg-[radial-gradient(130%_130%_at_50%_45%,transparent_46%,rgba(10,25,49,0.94))]" />
    </div>
  )
}
