import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import evidence from '../content/aiosEvidence.json'
import { workAiOs } from '../content/profile'
import { useLang, useT, type Bi } from '../lib/i18n'

/**
 * v21 P3 — 실측 카운터 + 리플레이 데모 (SDD §4).
 *
 * 증거 위계에서 1위는 "조작 가능한 라이브 데모"지만, 이 사이트는 정적 호스팅이라
 * 진짜 AI 호출을 붙일 수 없다(키 노출·비용·악용). 그래서 **실제로 있었던 실행을
 * 재생**한다. 그 대신 지켜야 하는 게 정직성이다:
 *   - 화면에 "실제 운영 기록 재생 · 기록 일시"를 항상 붙인다. 라이브인 척 금지.
 *   - 단계·시각·소요시간은 전부 `aiosEvidence.json`(집계 스크립트 산출물)에서만
 *     온다. 이 컴포넌트는 숫자를 만들지 않는다.
 *
 * 엔진 규칙: 데모는 React state로만 움직인다(gsap 아님) — 예산 경계를 건드리지
 * 않는다. 동작 최소화에서는 자동 재생 없이 전 단계가 처음부터 펼쳐진 상태다.
 */

type Step = { offsetMs: number; label: Bi; detail: Bi | null; tone: string }
type Scenario = {
  key: string
  name: Bi
  intent: Bi
  recordedOn: string
  startedAt: string
  elapsedMs: number
  steps: Step[]
}

const scenarios = evidence.scenarios as Scenario[]
const counters = evidence.counters

/** 실제 경과시간을 사람 말로 — 0초짜리 한 단계짜리 기록도 정직하게 표기한다. */
function humanMs(ms: number, lang: 'ko' | 'en'): string {
  if (ms <= 0) return lang === 'ko' ? '0초' : '0s'
  if (ms < 1000) return lang === 'ko' ? '1초 미만' : 'under 1s'
  const s = Math.round(ms / 1000)
  if (s < 60) return lang === 'ko' ? `${s}초` : `${s}s`
  const m = Math.floor(s / 60)
  const r = s % 60
  if (lang === 'ko') return r ? `${m}분 ${r}초` : `${m}분`
  return r ? `${m}m ${r}s` : `${m}m`
}

/** 템플릿 치환({from} 등) — 문장은 콘텐츠 파일이, 값은 스냅샷이 소유한다. */
const fill = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`))

/** 재생 총 길이: 실제 소요와 무관하게 이 정도로 압축한다(대기 시간 관람 금지). */
const PLAYBACK_MS = 3600

export default function OpsEvidence() {
  const t = useT()
  const { lang } = useLang()
  const reduce = useReducedMotion()
  const c = workAiOs.evidence
  const [activeKey, setActiveKey] = useState(scenarios[0]?.key ?? '')
  const active = useMemo(() => scenarios.find((s) => s.key === activeKey) ?? scenarios[0], [activeKey])
  const total = active?.steps.length ?? 0

  // 동작 최소화면 처음부터 전부 펼쳐 둔다(연출은 정보의 관문이 아니다).
  const [shown, setShown] = useState(reduce ? total : 0)
  const [playing, setPlaying] = useState(false)
  const timers = useRef<number[]>([])

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }, [])

  const play = useCallback(() => {
    if (!active) return
    clearTimers()
    if (reduce) {
      setShown(active.steps.length)
      return
    }
    setShown(0)
    setPlaying(true)
    const span = active.elapsedMs || 1
    active.steps.forEach((step, i) => {
      // 실제 간격의 비율은 유지하되 전체를 PLAYBACK_MS로 압축한다.
      const at = Math.round((step.offsetMs / span) * PLAYBACK_MS) + i * 90
      timers.current.push(window.setTimeout(() => setShown(i + 1), at))
    })
    timers.current.push(window.setTimeout(() => setPlaying(false), PLAYBACK_MS + active.steps.length * 90 + 120))
  }, [active, reduce, clearTimers])

  // 시나리오를 바꾸면 처음부터. 자동 재생은 하지 않는다(방문자가 누른 것만 움직인다).
  useEffect(() => {
    clearTimers()
    setPlaying(false)
    setShown(reduce ? total : 0)
  }, [activeKey, reduce, total, clearTimers])

  useEffect(() => clearTimers, [clearTimers])

  if (!active) return null

  const counterRows = [
    { key: 'runs', value: counters.runs.toLocaleString(lang === 'ko' ? 'ko-KR' : 'en-US'), tight: false },
    { key: 'routines', value: String(counters.routines), tight: false },
    { key: 'notifications', value: counters.notifications.toLocaleString(lang === 'ko' ? 'ko-KR' : 'en-US'), tight: false },
    // 세 숫자가 한 칸에 들어가므로 줄바꿈되지 않게 한 급 작게 잡는다.
    { key: 'scale', value: `${counters.agents} · ${counters.skills} · ${counters.rules}`, tight: true },
  ]

  return (
    <div>
      {/* ── 실측 카운터 ─────────────────────────────────────────────── */}
      <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-amber">{t(c.eyebrow)}</p>
      <h2 className="u-display mt-3 break-keep text-2xl font-semibold leading-tight text-ink md:text-3xl">{t(c.title)}</h2>
      <p className="mt-4 max-w-2xl break-keep text-base leading-relaxed text-ink-soft">{t(c.lede)}</p>

      <dl className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {counterRows.map((row) => (
          <div key={row.key} className="bg-elev/50 px-5 py-5">
            <dd
              className={`u-fig whitespace-nowrap font-semibold leading-none text-amber ${
                row.tight ? 'text-2xl md:text-3xl' : 'text-3xl md:text-4xl'
              }`}
            >
              {row.value}
            </dd>
            <dt className="mt-2.5 break-keep font-mono text-[11px] uppercase tracking-[0.12em] text-ink-dim">{t(c.counters[row.key])}</dt>
          </div>
        ))}
      </dl>
      <p className="mt-4 break-keep font-mono text-[11px] leading-relaxed text-ink-dim">
        {fill(c.windowNote[lang], {
          from: evidence.window.from,
          to: evidence.window.to,
          days: evidence.window.activeDays,
          asOf: evidence.asOf,
        })}
      </p>
      <p className="mt-2 max-w-2xl break-keep text-[13px] leading-relaxed text-ink-dim">{t(c.sourceNote)}</p>

      {/* ── 리플레이 데모 ───────────────────────────────────────────── */}
      <div className="mt-12 rounded-[20px] border border-line bg-night/40 p-5 md:p-7">
        <h3 className="u-display break-keep text-xl font-semibold text-ink md:text-2xl">{t(c.replayTitle)}</h3>
        <p className="mt-3 max-w-2xl break-keep text-sm leading-relaxed text-ink-soft">{t(c.replayLede)}</p>

        <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
          {/* 시나리오 선택 — 평범한 버튼이라 키보드로 그대로 조작된다 */}
          <div role="group" aria-label={t(c.replayTitle)} className="flex flex-col gap-2">
            {scenarios.map((s) => {
              const on = s.key === active.key
              return (
                <button
                  key={s.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setActiveKey(s.key)}
                  className={`rounded-xl border px-4 py-3 text-left transition-colors duration-200 ${
                    on ? 'border-amber/50 bg-amber/10 text-ink' : 'border-line bg-elev/30 text-ink-soft hover:border-ink/25 hover:text-ink'
                  }`}
                >
                  <span className="block break-keep text-sm font-semibold">{t(s.name)}</span>
                  <span className="mt-1 block break-keep font-mono text-[11px] uppercase tracking-[0.12em] text-ink-dim">
                    {s.recordedOn} · {s.steps.length} {t(c.stepsLabel)}
                  </span>
                </button>
              )
            })}
          </div>

          {/* 타임라인 */}
          <div className="min-w-0">
            {/* ★ 정직성 라벨 — 라이브인 척 금지(SDD §4). 항상 보인다. */}
            <p className="flex flex-wrap items-center gap-2 break-keep font-mono text-[11px] uppercase tracking-[0.14em] text-brass">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brass" />
              {fill(c.liveDisclaimer[lang], { date: active.recordedOn, time: active.startedAt })}
            </p>

            <p className="mt-3 break-keep text-sm text-ink-soft">{t(active.intent)}</p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={play}
                className="inline-flex items-center gap-2 rounded-full bg-amber px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-night transition-colors hover:bg-amber-deep"
              >
                <span aria-hidden>▶</span>
                {playing ? t(c.playing) : shown > 0 ? t(c.replay) : t(c.play)}
              </button>
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-dim">
                {t(c.elapsedLabel)} {humanMs(active.elapsedMs, lang)}
              </span>
            </div>

            <ol aria-live="polite" className="mt-5 space-y-0">
              {active.steps.map((step, i) => {
                const on = i < shown
                return (
                  <li key={i} className="flex gap-4">
                    {/* 진행 레일 */}
                    <div className="flex flex-col items-center">
                      <span
                        aria-hidden
                        className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full transition-colors duration-300 ${
                          on ? (step.tone === 'warn' ? 'bg-brass' : 'bg-amber') : 'bg-line'
                        }`}
                      />
                      {i < active.steps.length - 1 && (
                        <span aria-hidden className={`w-px flex-1 transition-colors duration-300 ${on ? 'bg-amber/30' : 'bg-line'}`} />
                      )}
                    </div>
                    <div className={`min-w-0 flex-1 pb-5 transition-opacity duration-300 ${on ? 'opacity-100' : 'opacity-30'}`}>
                      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim">
                        +{humanMs(step.offsetMs, lang)}
                      </p>
                      <p className="mt-1 break-keep text-sm text-ink md:text-[15px]">{t(step.label)}</p>
                      {step.detail && <p className="mt-1 break-keep font-mono text-[11px] text-ink-dim">{t(step.detail)}</p>}
                    </div>
                  </li>
                )
              })}
            </ol>

            <p className="break-keep text-[12px] leading-relaxed text-ink-dim">{t(c.whyNotLive)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
