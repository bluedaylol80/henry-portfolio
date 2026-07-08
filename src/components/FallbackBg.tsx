/**
 * Static/premium ambient background used when the WebGL scene is unavailable
 * (reduced-motion / no-WebGL / low-power) and as the Suspense fallback.
 * Layered radial gradients (amber → violet → cyan) over the base color, with a
 * very slow drift (60s `bg-drift` keyframe from index.css — auto-frozen under
 * prefers-reduced-motion) and a framing vignette.
 */
export default function FallbackBg() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-base" aria-hidden="true">
      <div className="absolute inset-0 animate-bg-drift will-change-transform">
        <div className="absolute inset-0 bg-[radial-gradient(65%_55%_at_16%_14%,rgba(230,126,34,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_46%,rgba(79,172,254,0.14),transparent_62%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(66%_62%_at_84%_88%,rgba(0,242,254,0.12),transparent_60%)]" />
      </div>
      {/* framing vignette — stays fixed to the viewport */}
      <div className="absolute inset-0 bg-[radial-gradient(135%_135%_at_50%_50%,transparent_50%,rgba(10,25,49,0.92))]" />
    </div>
  )
}
