import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { m, useInView, useReducedMotion, useScroll, useSpring } from 'framer-motion'
import { home, work, skills, contact } from '../content/profile'
import { phases, hub, timeline } from '../content/journey'
import { useLang, useT } from '../lib/i18n'
import { getLenis } from '../lib/scroll'
import { onReady } from '../lib/appState'
import ArchDiagram from '../components/ArchDiagram'
import WorkLoop from '../components/WorkLoop'

/**
 * v21 front door (SDD §3) — 홈이 섹션 나열이 아니라 **Act 0~5로 진행되는 한 편의
 * 서사**가 된다. v20의 콘텐츠·디자인 시스템·성능 예산은 전부 계승하고, 배치와
 * 리듬만 다시 짠다.
 *
 *   Act 0  히어로 — 스크롤하지 않아도 6초 안에 "누구·19년·강점"이 읽히는 정적 완결
 *   Act 1  1층부터 — 연도가 2006→2026으로 오르고 회사 워드마크가 순서대로 점등(잔잔)
 *   Act 2  지표가 의사결정이 되는 곳 — ★유일한 핀 구간: 문제→결정→결과 3비트 + 카운트업
 *   Act 3  전환(2024) — 짧고 강한 한 비트 + 운영 문법 → AI 대응표
 *   Act 4  컨트롤 룸 — 시그니처 다이어그램 · 위임/검증 루프 · 일하는 방식
 *   Act 5  함께 일하기 — 연락 + 무대 뒤(/room) 입구
 *
 * 엔진 규칙(SDD §5, v20 교훈 ⭐): Home은 크리티컬 번들에 있으므로 gsap을 여기서
 * import하면 eager 세트로 역류한다. 스크롤 연출은 `home/homeScrolly`를 **동적
 * import**로만 부르고, 동작 최소화일 때는 아예 부르지 않는다.
 *
 * 접근성: 마크업의 정지 상태가 곧 완성 상태다. 3비트는 원래 세로로 다 읽히고
 * 결과 숫자도 최종값으로 렌더된다 — 연출은 거기서 시작해 감출 뿐이므로, JS가
 * 늦거나 실패해도 정보가 사라지지 않는다.
 */

type StatN = { value: number; prefix?: string; suffix?: string; decimals?: number }

function fmt(s: StatN): string {
  const v = s.decimals ? s.value.toFixed(s.decimals) : String(s.value)
  return `${s.prefix ?? ''}${v}${s.suffix ?? ''}`
}

/** amber count-up on checkable numbers — instant under reduced motion (⑤). */
function CountUp({ value, decimals = 0, prefix = '', suffix = '' }: StatN) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const [n, setN] = useState(reduce ? value : 0)
  useEffect(() => {
    if (reduce) return setN(value)
    if (!inView) return
    let raf = 0
    const dur = 1100
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur)
      setN(value * (1 - Math.pow(1 - p, 4)))
      if (p < 1) raf = requestAnimationFrame(tick)
      else setN(value)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, reduce])
  const shown = decimals > 0 ? n.toFixed(decimals) : String(Math.round(n))
  return (
    <span ref={ref} className="u-fig">
      {prefix}
      {shown}
      {suffix}
    </span>
  )
}

function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion()
  return (
    <m.div
      className={className}
      initial={reduce ? { opacity: 1 } : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: reduce ? 0 : 0.6, ease: [0.22, 1, 0.36, 1], delay: reduce ? 0 : delay }}
    >
      {children}
    </m.div>
  )
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.2 })
  return <m.div style={{ scaleX }} className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-amber/70" aria-hidden />
}

/** Phase-spine ramp — warm→cool, held inside the era hard-zone (never amber). */
const PHASE_SPINE = ['#E67E22', '#C58C50', '#6FA79A', '#54C3BE', '#4FD1C5'] as const

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-amber">{children}</p>
}

/** Act 라벨 — 서사의 진행을 표시하는 유일한 구조 장치. */
function ActLabel({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-amber">
      <span aria-hidden className="mr-2.5 inline-block h-px w-6 translate-y-[-4px] bg-amber/60" />
      {children}
    </p>
  )
}

export default function Home() {
  const t = useT()
  const { lang } = useLang()
  const { hash } = useLocation()
  const reduce = useReducedMotion()
  const rootRef = useRef<HTMLElement>(null)
  const acts = home.acts

  // Act 2 케이스의 결과 숫자 = 기존 검증 콘텐츠(work.items)에서 그대로. 첫 NEXON
  // 항목 = 린: 더 라이트브링어. 여기서 새로 만드는 수치는 없다.
  const heroCase = work.items.find((it) => it.tag === 'NEXON') ?? work.items[0]
  const heroStat = heroCase.stat[lang]
  const restCases = work.items.filter((it) => it !== heroCase)

  // Hash arrival (/#work, /#contact) — scroll once the preloader settles.
  useEffect(() => {
    if (!hash) return
    const id = hash.replace(/^#/, '')
    if (!id) return
    const unsub = onReady(() => {
      let tries = 0
      const tick = () => {
        const el = document.getElementById(id)
        if (el) {
          const lenis = getLenis()
          if (lenis) {
            lenis.start()
            lenis.resize()
            lenis.scrollTo(el, { offset: 0, duration: 1.1 })
          } else el.scrollIntoView({ behavior: 'smooth' })
          return
        }
        if (tries++ < 40) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    return unsub
  }, [hash])

  // 스크롤 연출은 첫 페인트 이후에 별도 청크로 들어온다(예산 유지). 동작 최소화면
  // 아예 로드하지 않는다 — 마크업이 이미 완성 상태이므로 붙일 게 없다.
  useEffect(() => {
    if (reduce) return
    const root = rootRef.current
    if (!root) return
    let dispose: (() => void) | undefined
    let cancelled = false
    const unsub = onReady(() => {
      import('../home/homeScrolly')
        .then((mod) => {
          if (cancelled || !rootRef.current) return
          dispose = mod.mountHomeScrolly(rootRef.current)
        })
        .catch(() => {
          /* 연출 청크 실패 = 정적 완성 상태 유지. 정보 손실 없음. */
        })
    })
    return () => {
      cancelled = true
      unsub()
      dispose?.()
    }
  }, [reduce, lang])

  return (
    <>
      <ScrollProgress />
      <main id="main" ref={rootRef} className="relative z-10">
        {/* ══ ACT 0 · HERO — 스크롤 없이도 완결되는 6초 스캔 ═══════════════ */}
        <section className="ambient-field relative flex min-h-[92vh] items-center overflow-hidden">
          <div className="container-std w-full py-24">
            <Reveal>
              <Eyebrow>{t(home.eyebrow)}</Eyebrow>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="u-display mt-5 max-w-4xl whitespace-pre-line break-keep text-4xl font-semibold leading-[1.12] text-ink sm:text-5xl md:text-6xl">
                {t(home.h1)}
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-6 max-w-2xl break-keep text-base leading-relaxed text-ink-soft md:text-lg">{t(home.sub)}</p>
            </Reveal>

            {/* proof strip — checkable numbers only */}
            <Reveal delay={0.15}>
              <div className="mt-9 flex flex-wrap gap-x-10 gap-y-5">
                {home.proof.map((p, i) => {
                  const s = p[lang]
                  return (
                    <div key={i} className="min-w-[7rem]">
                      <div className="text-3xl font-semibold leading-none text-amber md:text-4xl">
                        <CountUp value={s.value} decimals={s.decimals} prefix={s.prefix} suffix={s.suffix} />
                      </div>
                      <div className="mt-2 max-w-[11rem] break-keep font-mono text-[11px] uppercase tracking-[0.12em] text-ink-dim">
                        {t(p.label)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-5 max-w-2xl break-keep text-sm text-ink-dim">{t(home.proofReceipt)}</p>
            </Reveal>

            {/* CTA row + Now */}
            <Reveal delay={0.25}>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <a
                  href={`mailto:${contact.email}`}
                  className="inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 font-mono text-sm font-semibold uppercase tracking-[0.1em] text-night transition-colors duration-200 hover:bg-amber-deep"
                >
                  {t(home.ctaPrimary)}
                </a>
                <Link to="/brief" className="font-mono text-sm uppercase tracking-[0.1em] text-ink-soft transition-colors hover:text-amber">
                  {t(home.ctaBrief)}
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.3}>
              <p className="mt-8 flex items-center gap-2.5 break-keep text-sm text-ink-soft">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-amber" />
                {t(home.now)}
              </p>
            </Reveal>
            <Reveal delay={0.35}>
              <p aria-hidden className="mt-12 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-dim">
                <span className="h-px w-8 bg-ink-dim/50" />
                {t(acts.scrollCue)}
              </p>
            </Reveal>
          </div>
        </section>

        {/* ══ ACT 1 · 1층부터 — 연도가 오르고, 회사가 순서대로 켜진다 ═════ */}
        <section data-scrolly="act1" className="relative border-t border-line">
          <div className="container-std pt-20 md:pt-28">
            <Reveal>
              <ActLabel>{t(acts.a1.eyebrow)}</ActLabel>
              <h2 className="u-display mt-4 max-w-3xl break-keep text-3xl font-semibold leading-tight text-ink md:text-4xl">
                {t(acts.a1.title)}
              </h2>
              <p className="mt-5 max-w-2xl break-keep text-base leading-relaxed text-ink-soft">{t(acts.a1.body)}</p>
            </Reveal>
          </div>

          <div className="container-std grid gap-12 py-16 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:py-24">
            {/* 왼쪽 — 연도 계기판. CSS sticky이지 핀이 아니다(네이티브 스크롤 유지).
                이 컬럼은 자기 그리드 행을 벗어나지 못하므로, 행 높이를 정하는 건
                오른쪽 회사 목록의 간격이다. */}
            <div className="md:sticky md:top-28 md:self-start">
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-ink-dim">{t(timeline.eyebrow)}</p>
              <div className="mt-4 leading-none">
                {/* 정지 상태 = 완성 상태: 연출이 없으면 도착 연도(2026)를 그대로
                    보여준다. 컨트롤러가 붙을 때만 2006으로 되돌려 스크럽을 시작한다. */}
                <span data-scrolly="year" className="u-fig text-7xl font-semibold text-amber md:text-8xl">
                  2026
                </span>
              </div>
              <ul className="mt-8 space-y-2.5">
                {phases.map((p, i) => (
                  <li key={p.slug} className="flex items-center gap-2.5">
                    <span aria-hidden className="h-1.5 w-5 shrink-0 rounded-full" style={{ backgroundColor: PHASE_SPINE[i] }} />
                    <span className="break-keep font-mono text-[11px] text-ink-dim">
                      {p.period} · {t(p.name)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 오른쪽 — 회사 워드마크(상표 로고 아님), 시기 순 점등 */}
            <ul aria-label={t(home.companiesWall.eyebrow)} className="space-y-7 md:space-y-[4.75rem]">
              {home.companiesWall.items.map((c, i) => (
                <li key={i} className="hm-company flex items-center gap-4">
                  <span aria-hidden className="hm-dot h-2.5 w-2.5 shrink-0 rounded-full bg-amber" />
                  <span className="u-display break-keep text-2xl font-semibold tracking-wide text-ink md:text-4xl">{t(c)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── ACT 1 후반 · 네 개의 층 (딥다이브 입구) ────────────────────── */}
        <section className="relative border-t border-line bg-night/40">
          <div className="container-std py-20 md:py-28">
            <Reveal>
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-ink-dim">{t(acts.a1.layersTitle)}</p>
              <h3 className="u-display mt-4 break-keep text-2xl font-semibold leading-tight text-ink md:text-3xl">
                {t(home.foundationIntro.title)}
              </h3>
            </Reveal>
            <ol className="mt-9 space-y-3">
              {phases.map((p, i) => (
                <Reveal key={p.slug} delay={i * 0.04}>
                  <li>
                    <Link
                      to={`/career/${p.slug}`}
                      className="group flex items-center gap-4 rounded-2xl border border-line bg-elev/30 px-5 py-4 transition-colors duration-300 hover:border-ink/25"
                    >
                      <span className="u-fig text-xs text-ink-dim">{p.num}</span>
                      <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: PHASE_SPINE[i] }} />
                      <span className="w-24 shrink-0 break-keep font-mono text-[11px] uppercase tracking-[0.12em] text-ink-dim">{p.period}</span>
                      <span className="min-w-0 flex-1">
                        <span className="u-display text-base font-semibold text-ink group-hover:text-amber sm:text-lg">{t(p.name)}</span>
                        <span className="ml-3 break-keep text-sm text-ink-soft">{t(p.tagline)}</span>
                      </span>
                      <span aria-hidden className="hidden shrink-0 text-ink-dim transition-transform group-hover:translate-x-1 sm:block">→</span>
                    </Link>
                  </li>
                </Reveal>
              ))}
            </ol>
            <Reveal delay={0.1} className="mt-8">
              <Link
                to="/career"
                className="inline-flex items-center gap-2 font-mono text-sm uppercase tracking-[0.1em] text-amber transition-colors hover:text-amber-deep"
              >
                {t(home.foundationIntro.cta)}
                <span aria-hidden>→</span>
              </Link>
            </Reveal>
          </div>
        </section>

        {/* ══ ACT 2 · 지표가 의사결정이 되는 곳 — 유일한 핀 구간 ═══════════ */}
        <section id="work" data-scrolly="act2" className="relative scroll-mt-24 border-t border-line">
          <div data-scrolly="panel" className="w-full md:flex md:min-h-screen md:items-center">
            <div className="container-std w-full py-16 md:py-20">
              <ActLabel>{t(acts.a2.eyebrow)}</ActLabel>
              <h2 className="u-display mt-4 max-w-2xl break-keep text-2xl font-semibold leading-tight text-ink md:text-3xl">
                {t(acts.a2.title)}
              </h2>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-dim">{t(acts.a2.caseTag)}</p>

              {/* 3비트 — 기본은 세로로 다 읽히는 상태. 데스크톱에서만 컨트롤러가
                  겹쳐 놓고 교차 전환한다. */}
              <div className="relative mt-10 md:mt-14 md:min-h-[19rem]">
                <div className="hm-beat">
                  <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-ink-dim">{t(acts.a2.beats[0].label)}</span>
                  <p className="mt-4 max-w-2xl break-keep text-2xl font-medium leading-relaxed text-ink md:text-4xl md:leading-[1.3]">
                    {t(acts.a2.beats[0].body!)}
                  </p>
                </div>

                <div className="hm-beat mt-12">
                  <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-ink-dim">{t(acts.a2.beats[1].label)}</span>
                  <p className="mt-4 max-w-2xl break-keep text-2xl font-medium leading-relaxed text-ink md:text-4xl md:leading-[1.3]">
                    {t(acts.a2.beats[1].body!)}
                  </p>
                </div>

                <div className="hm-beat mt-12">
                  <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-ink-dim">{t(acts.a2.beats[2].label)}</span>
                  <div className="mt-4 flex flex-wrap items-baseline gap-x-5 gap-y-2">
                    <span
                      data-scrolly="count"
                      data-value={heroStat.value}
                      data-prefix={heroStat.prefix ?? ''}
                      data-suffix={heroStat.suffix ?? ''}
                      data-decimals={heroStat.decimals ?? 0}
                      className="u-fig text-6xl font-semibold leading-none text-amber md:text-8xl"
                    >
                      {fmt(heroStat)}
                    </span>
                    <span className="break-keep text-lg font-medium text-ink md:text-2xl">{t(heroCase.label)}</span>
                  </div>
                  {heroCase.sub && <p className="mt-4 break-keep text-sm text-ink-dim md:text-base">{t(heroCase.sub)}</p>}
                  {heroCase.footnote && (
                    <p className="mt-3 break-keep font-mono text-[10px] leading-relaxed text-ink-dim">{t(heroCase.footnote)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 핀이 풀린 뒤 — 같은 방식으로 남은 숫자들 */}
          <div className="container-std pb-20 md:pb-28">
            <Reveal>
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-ink-dim">{t(acts.a2.restTitle)}</p>
              <p className="mt-3 max-w-2xl break-keep text-sm text-ink-soft">{t(home.workIntro.sub)}</p>
            </Reveal>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {restCases.map((it, i) => (
                <Reveal key={i} delay={(i % 3) * 0.05}>
                  <article
                    className={`flex h-full flex-col rounded-2xl border bg-elev/40 p-5 transition-colors duration-300 hover:border-amber/40 ${
                      it.emphasis ? 'border-amber/25' : 'border-line'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-dim">{it.tag}</span>
                      {it.emphasis && <span className="h-1.5 w-1.5 rounded-full bg-amber" aria-hidden />}
                    </div>
                    <div className="mt-4 text-3xl font-semibold leading-none text-amber">{fmt(it.stat[lang])}</div>
                    <div className="mt-2 break-keep text-sm font-medium text-ink">{t(it.label)}</div>
                    <div className="mt-2 break-keep text-sm text-ink-soft">{t(it.title)}</div>
                    {it.sub && <div className="mt-2 break-keep text-[13px] text-ink-dim">{t(it.sub)}</div>}
                    {it.footnote && (
                      <div className="mt-auto break-keep pt-4 font-mono text-[10px] leading-relaxed text-ink-dim">{t(it.footnote)}</div>
                    )}
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ ACT 3 · 전환 (2024) — 짧고 강하게 한 비트 ═══════════════════ */}
        <section className="relative border-t border-line bg-night/40">
          <div className="container-std py-20 md:py-28">
            <Reveal>
              <ActLabel>{t(acts.a3.eyebrow)}</ActLabel>
              <h2 className="u-display mt-5 max-w-3xl break-keep text-3xl font-semibold leading-[1.2] text-ink md:text-5xl">
                {t(acts.a3.title)}
              </h2>
              <p className="mt-6 max-w-2xl break-keep text-base leading-relaxed text-ink-soft md:text-lg">{t(acts.a3.body)}</p>
            </Reveal>

            <Reveal delay={0.1} className="mt-12">
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-ink-dim">{t(home.manifesto.bridgeTitle)}</p>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {home.manifesto.bridge.map((b, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-2xl border border-line bg-elev/40 px-4 py-3.5">
                    <span className="font-mono text-sm text-ink-soft">{t(b.from)}</span>
                    <span aria-hidden className="text-amber">→</span>
                    <span className="min-w-0 flex-1 break-keep text-sm text-ink">{t(b.to)}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        {/* ══ ACT 4 · 컨트롤 룸 — 지금 돌아가고 있는 것 ═══════════════════ */}
        <section className="relative border-t border-line">
          <div className="container-std py-20 md:py-28">
            <Reveal>
              <ActLabel>{t(acts.a4.eyebrow)}</ActLabel>
              <h2 className="u-display mt-4 max-w-3xl break-keep text-3xl font-semibold leading-tight text-ink md:text-4xl">
                {t(acts.a4.title)}
              </h2>
            </Reveal>

            <div className="mt-10 grid gap-10 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <Reveal className="md:pt-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-amber">{t(home.aiTeaser.eyebrow)}</p>
                <h3 className="u-display mt-4 break-keep text-2xl font-semibold leading-tight text-ink md:text-3xl">
                  {t(home.aiTeaser.title)}
                </h3>
                <p className="mt-5 max-w-md break-keep text-base leading-relaxed text-ink-soft">{t(home.aiTeaser.body)}</p>
                <Link
                  to="/work/ai-os"
                  className="mt-7 inline-flex items-center gap-2 rounded-full border border-amber/50 px-5 py-2.5 font-mono text-sm uppercase tracking-[0.1em] text-amber transition-colors hover:bg-amber/10"
                >
                  {t(home.aiTeaser.cta)}
                  <span aria-hidden>→</span>
                </Link>
              </Reveal>
              <div>
                <ArchDiagram variant="teaser" />
              </div>
            </div>

            {/* 위임·검증 루프 + 19년을 관통한 상수들 */}
            <Reveal className="mt-16">
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-ink-dim">{t(home.workstyleIntro.eyebrow)}</p>
              <h3 className="u-display mt-4 max-w-3xl break-keep text-2xl font-semibold leading-tight text-ink md:text-3xl">
                {t(home.workstyleIntro.title)}
              </h3>
            </Reveal>
            <div className="mt-8">
              <WorkLoop />
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {hub.workstyle.map((w, i) => (
                <Reveal key={i} delay={(i % 3) * 0.05}>
                  <div className="flex h-full flex-col rounded-2xl border border-line bg-elev/30 p-5">
                    <span className="u-fig text-xs text-ink-dim">0{i + 1}</span>
                    <h4 className="u-display mt-2 break-keep text-lg font-semibold text-ink">{t(w.title)}</h4>
                    <p className="mt-2 break-keep text-sm leading-relaxed text-ink-soft">{t(w.body)}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={0.1} className="mt-8 flex flex-wrap gap-2">
              {skills.hard.map((h, i) => (
                <span
                  key={i}
                  className={`rounded-full border px-3 py-1 font-mono text-[11px] tracking-wide ${
                    h.isNew ? 'border-amber/40 text-amber' : 'border-line text-ink-dim'
                  }`}
                >
                  {t(h.name)}
                </span>
              ))}
            </Reveal>
          </div>
        </section>

        {/* ══ ACT 5 · 함께 일하기 ═════════════════════════════════════════ */}
        <section id="contact" className="relative scroll-mt-24 border-t border-line bg-night/40">
          <div className="container-std py-20 md:py-28">
            <Reveal>
              <ActLabel>{t(acts.a5.eyebrow)}</ActLabel>
              <h2 className="u-display mt-4 break-keep text-4xl font-semibold leading-tight text-ink md:text-5xl">
                {t(home.contactIntro.title)}
              </h2>
              <p className="mt-5 max-w-xl break-keep text-base leading-relaxed text-ink-soft">{t(home.contactIntro.body)}</p>
            </Reveal>
            <Reveal delay={0.1} className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href={`mailto:${contact.email}`}
                className="inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 font-mono text-sm font-semibold uppercase tracking-[0.1em] text-night transition-colors hover:bg-amber-deep"
              >
                {t(home.ctaPrimary)}
              </a>
              <a
                href={contact.calendly}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 font-mono text-sm uppercase tracking-[0.1em] text-ink-soft transition-colors hover:border-amber/50 hover:text-amber"
              >
                {t(contact.calendlyLabel)}
              </a>
              <Link
                to="/brief"
                className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 font-mono text-sm uppercase tracking-[0.1em] text-ink-soft transition-colors hover:border-amber/50 hover:text-amber"
              >
                {t(contact.notionNavLabel)}
              </Link>
            </Reveal>
            <Reveal delay={0.15} className="mt-6 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[12px] text-ink-dim">
              <span>{contact.email}</span>
              <span>KakaoTalk · {contact.kakao}</span>
              <span>{t(contact.note)}</span>
            </Reveal>

            {/* 무대 뒤 — 콘텐츠 게이트가 아니라 호기심 동선(SDD §2). */}
            <Reveal delay={0.2} className="mt-14 border-t border-line pt-8">
              <div className="flex flex-wrap items-end justify-between gap-6">
                <div>
                  <h3 className="u-display break-keep text-xl font-semibold text-ink md:text-2xl">{t(acts.a5.roomTitle)}</h3>
                  <p className="mt-3 max-w-xl break-keep text-sm leading-relaxed text-ink-soft">{t(acts.a5.roomBody)}</p>
                </div>
                <Link
                  to="/room"
                  className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 font-mono text-sm uppercase tracking-[0.1em] text-ink-soft transition-colors hover:border-amber/50 hover:text-amber"
                >
                  {t(acts.a5.roomCta)}
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
    </>
  )
}
