import { useState } from 'react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { useT, type Bi } from '../lib/i18n'

/**
 * THE signature (LOCKED §5.4 / §8) — the live 3-tier AI operating system drawn in
 * code, not a photo. Orchestrator → Executors → Verifier with a return "verify
 * loop"; the real system scale (20 agents · 65 skills · 31 rules) lives INSIDE the
 * diagram as data, never a hero stat strip (§4.3-2).
 *
 * Colour hard-zones (§3.4-3): cobalt = data/dispatch flow ONLY · amber = decision /
 * human intent · brass = guardrail. A legend is mandatory for colour-coded visuals
 * (mistakes_log #9). One orchestrated in-view stagger, reduced-motion aware (⑤).
 *
 * `variant="teaser"` (home) trims the copy; `"full"` (→ /work/ai-os) keeps every
 * row. Both share this one component so the signature reads identically everywhere.
 */

type Tier = {
  n: string
  name: Bi
  role: Bi
  detail: Bi
  accent: 'amber' | 'cobalt' | 'brass'
}

const TIERS: Tier[] = [
  {
    n: '01',
    name: { ko: '오케스트레이터 · 임실장', en: 'Orchestrator' },
    role: { ko: '본부장의 의도를 작업으로 라우팅', en: 'Routes human intent into tasks' },
    detail: {
      ko: '한 줄 지시 → 도메인 판별 → 3레벨 프로토콜로 분해·위임',
      en: 'One-line intent → domain routing → decompose & delegate via a 3-level protocol',
    },
    accent: 'amber',
  },
  {
    n: '02',
    name: { ko: '실행자', en: 'Executors' },
    role: { ko: '서브에이전트가 스킬을 조합해 실행', en: 'Sub-agents compose skills to execute' },
    detail: {
      ko: '20개 에이전트가 65개 스킬을 호출해 병렬 작업 — 승인 게이트 통과분만 반영',
      en: '20 agents call 65 skills in parallel — only approval-gated output lands',
    },
    accent: 'cobalt',
  },
  {
    n: '03',
    name: { ko: '검증자', en: 'Verifier' },
    role: { ko: '블라인드 채점 · 교차 계열 · 6축 QG', en: 'Blind grading · cross-family · 6-axis QG' },
    detail: {
      ko: '다른 모델 계열이 근거를 달아 채점 — “만든 자 ≠ 검증자”를 구조로 강제',
      en: 'A different model family grades with evidence — “maker ≠ verifier”, enforced structurally',
    },
    accent: 'brass',
  },
]

const COPY = {
  eyebrow: { ko: '라이브 아키텍처', en: 'LIVE ARCHITECTURE' } as Bi,
  title: {
    ko: '실제로 돌아가는 3계층 AI 운영체제',
    en: 'A 3-tier AI operating system — actually running',
  } as Bi,
  loop: {
    ko: '검증 실패 → 근거와 함께 반려 → 자동 재시도',
    en: 'FAIL → rejected with evidence → auto-retry',
  } as Bi,
  guardrail: {
    ko: '킬스위치(LLM 미경유) · 31개 규칙 · 6축 품질 게이트',
    en: 'Kill-switch (bypasses the LLM) · 31 rules · 6-axis quality gate',
  } as Bi,
  scaleLabel: { ko: '시스템 스케일 · 100% 본인 IP', en: 'System scale · 100% own IP' } as Bi,
}

const SCALE: { value: string; label: Bi }[] = [
  { value: '20', label: { ko: '에이전트', en: 'agents' } },
  { value: '65', label: { ko: '스킬', en: 'skills' } },
  { value: '31', label: { ko: '규칙', en: 'rules' } },
]

const LEGEND: { swatch: string; label: Bi }[] = [
  { swatch: 'bg-cobalt', label: { ko: '데이터 흐름', en: 'Data flow' } },
  { swatch: 'bg-amber', label: { ko: '결정 · 사람의 의도', en: 'Decision · human intent' } },
  { swatch: 'bg-brass', label: { ko: '가드레일', en: 'Guardrail' } },
]

const ACCENT_RING: Record<Tier['accent'], string> = {
  amber: 'hover:border-amber/60 data-[on=true]:border-amber/60',
  cobalt: 'hover:border-cobalt/60 data-[on=true]:border-cobalt/60',
  brass: 'hover:border-brass/60 data-[on=true]:border-brass/60',
}
const ACCENT_DOT: Record<Tier['accent'], string> = {
  amber: 'bg-amber',
  cobalt: 'bg-cobalt',
  brass: 'bg-brass',
}

export default function ArchDiagram({ variant = 'teaser' }: { variant?: 'teaser' | 'full' }) {
  const t = useT()
  const reduce = useReducedMotion()
  const [active, setActive] = useState<number | null>(null)

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.12, delayChildren: reduce ? 0 : 0.05 } },
  }
  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 18 },
    show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] } },
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      className="relative overflow-hidden rounded-[20px] border border-line bg-gradient-to-b from-elev/70 to-night/80 p-5 sm:p-8"
    >
      {/* blueprint grid wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(34,52,92,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(34,52,92,0.35) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(120% 90% at 50% 0%, black 40%, transparent 90%)',
        }}
      />

      {/* header + scale readout */}
      <motion.div variants={item} className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-cobalt">{t(COPY.eyebrow)}</p>
          <h3 className="u-display mt-2 max-w-md text-xl font-semibold leading-tight text-ink sm:text-2xl">
            {t(COPY.title)}
          </h3>
        </div>
        <div className="flex items-end gap-5">
          {SCALE.map((s) => (
            <div key={s.value} className="text-right">
              <div className="u-fig text-3xl font-semibold leading-none text-ink sm:text-4xl">{s.value}</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-cobalt">{t(s.label)}</div>
            </div>
          ))}
        </div>
      </motion.div>
      <motion.p variants={item} className="relative mt-1 font-mono text-[10px] uppercase tracking-[0.24em] text-ink-dim">
        {t(COPY.scaleLabel)}
      </motion.p>

      {/* the 3-tier flow */}
      <div className="relative mt-7 flex flex-col">
        {TIERS.map((tier, i) => (
          <div key={tier.n}>
            <motion.button
              type="button"
              variants={item}
              data-on={active === i}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              className={`group flex w-full items-start gap-4 rounded-2xl border border-line bg-night/40 p-4 text-left transition-colors duration-300 ${ACCENT_RING[tier.accent]}`}
            >
              <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${ACCENT_DOT[tier.accent]}`} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-3">
                  <span className="u-fig text-xs text-ink-dim">{tier.n}</span>
                  <span className="u-display text-base font-semibold text-ink sm:text-lg">{t(tier.name)}</span>
                </span>
                <span className="mt-1 block text-sm text-ink-soft">{t(tier.role)}</span>
                {variant === 'full' || active === i ? (
                  <span className="mt-1.5 block break-keep text-[13px] leading-relaxed text-ink-dim">{t(tier.detail)}</span>
                ) : null}
              </span>
            </motion.button>

            {/* cobalt data conduit between tiers */}
            {i < TIERS.length - 1 && (
              <motion.div variants={item} className="relative flex h-9 justify-start pl-[1.4rem]" aria-hidden>
                <span className="relative block w-px bg-gradient-to-b from-cobalt/70 to-cobalt/20">
                  {!reduce && <span className="conduit-pulse absolute left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-cobalt shadow-[0_0_8px_rgba(59,111,229,0.9)]" />}
                </span>
              </motion.div>
            )}
          </div>
        ))}

        {/* verify loop — feedback back to the top */}
        <motion.div variants={item} className="relative mt-3 flex items-center gap-3 rounded-xl border border-dashed border-brass/40 bg-night/30 px-4 py-2.5">
          <span aria-hidden className="font-mono text-sm text-brass">↺</span>
          <span className="break-keep font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim">{t(COPY.loop)}</span>
        </motion.div>
      </div>

      {/* guardrail rail */}
      <motion.div variants={item} className="relative mt-5 flex items-center gap-2.5 rounded-xl border border-brass/25 bg-brass/[0.06] px-4 py-2.5">
        <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-brass" />
        <span className="break-keep text-[13px] text-ink-soft">{t(COPY.guardrail)}</span>
      </motion.div>

      {/* legend (mandatory for colour-coded visuals — mistakes_log #9) */}
      <motion.ul variants={item} className="relative mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-4">
        {LEGEND.map((l) => (
          <li key={l.swatch} className="flex items-center gap-2">
            <span aria-hidden className={`h-2 w-2 rounded-[3px] ${l.swatch}`} />
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">{t(l.label)}</span>
          </li>
        ))}
      </motion.ul>
    </motion.div>
  )
}
