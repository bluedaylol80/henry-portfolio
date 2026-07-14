/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── v20 "CONTROL ROOM" navy — real 5-tone graded base (LOCKED §3.1) ──
        night: '#060E1C', // deepest sink / page base (true near-black navy)
        abyss: '#0A1931', // primary background (owner-locked base)
        elev: '#132444', // raised surface (synthesis-refined from #1A2B4C)
        raise: '#1B2E52', // card / hover
        line: '#22345C', // hairline / blueprint grid — stroke only
        ink: {
          DEFAULT: '#F8F9FA', // primary text (AA on abyss)
          soft: '#D3DBEC', // secondary body text — load-bearing, AA 4.5:1
          dim: '#AAB8D0', // tertiary labels / decoration — NOT load-bearing
          mute: '#7C90B8', // legacy alias (removed once old sections are rebuilt)
        },
        amber: {
          DEFAULT: '#F5B041', // single primary accent — CTA / proof / focus
          deep: '#E09A2E', // amber hover / active
        },
        brass: '#C6A15B', // hairline detail / human warmth — decorative only
        cobalt: '#3B6FE5', // DATA ONLY — architecture-diagram nodes/strokes
        'era-orange': '#E67E22', // phase-spine marker only (hard-zoned)
        'era-cyan': '#4FD1C5', // phase-spine marker only (hard-zoned)
        // ── legacy era.* palette — retained until /story, /career and /brief are
        //    rebuilt on the new tokens; removed in the v20 cleanup pass. ──
        era: {
          amber: '#F5B041',
          coral: '#F39C12',
          violet: '#E67E22',
          cyan: '#4FACFE',
          sky: '#00F2FE',
        },
      },
      transitionTimingFunction: {
        // High-end motion curves (LOCKED §3.3) — no ease-in-out/linear.
        // `lux` = expensive weighted ease; `out4` = overshoot-free out-quart.
        lux: 'cubic-bezier(0.32,0.72,0,1)',
        out4: 'cubic-bezier(0.22,1,0.36,1)',
      },
      keyframes: {
        // §24 image-nav pin: a soft opacity-only breathe so hotspot dots read as
        // interactive without moving (transform left free for hover scale).
        'pin-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
      animation: {
        'pulse-slow': 'pin-pulse 2.4s cubic-bezier(0.22,1,0.36,1) infinite',
      },
      fontFamily: {
        // EN body / UI — Geist Variable; KO falls per-glyph to Pretendard.
        sans: [
          '"Geist Variable"',
          '"Pretendard Variable"',
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif',
        ],
        // EN display — Fraunces Variable (opsz optical sizing). KO display is
        // promoted to Pretendard 900 via `:lang(ko) .u-display` (index.css §3.2).
        display: ['"Fraunces Variable"', '"Pretendard Variable"', 'Pretendard', 'serif'],
        // Labels / tabular proof numbers — IBM Plex Mono.
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
}
