import { gsap, ScrollTrigger } from '../lib/scrollTriggerBridge'
import { EASE } from '../lib/motion'

/**
 * v21 Act 서사 컨트롤러 (SDD §3/§5) — 홈의 스크롤 연출만 담당한다.
 *
 * 이 모듈은 Home에서 **동적 import**로만 불린다. Home 자체는 크리티컬 번들에
 * 있으므로, 여기서 gsap을 정적으로 import하면 gsap이 eager 세트로 역류한다
 * (v20에서 얻은 137KB를 그대로 날리는 경로 ⭐). 첫 페인트 이후 idle에 로드된다.
 *
 * 계약: DOM은 Home이 소유하고, 이 모듈은 data-scrolly 속성으로만 접근한다.
 *   [data-scrolly="act1"]   Act 1 섹션 (연도 스크럽의 기준 구간)
 *   [data-scrolly="year"]   연도 숫자 (2006 → 2026)
 *   .hm-company / .hm-dot   회사 워드마크 행 · 점등 도트
 *   [data-scrolly="act2"]   Act 2 섹션 (핀의 트리거)
 *   [data-scrolly="panel"]  핀으로 고정될 패널
 *   .hm-beat                문제 → 결정 → 결과 3비트
 *   [data-scrolly="count"]  결과 숫자 (data-value/prefix/suffix/decimals)
 *
 * 중요: **정지 상태가 곧 완성 상태**다. 마크업은 아무 연출 없이도 3비트가 모두
 * 읽히고 숫자가 최종값으로 렌더된 상태이며, 이 컨트롤러는 거기서 시작해 감춘다.
 * 그래서 JS가 늦거나, 청크가 실패하거나, 동작 최소화가 켜져 있어도 정보 손실이
 * 없다(SDD §5 접근성 — 연출은 정보의 관문이 아니다).
 */

const YEAR_FROM = 2006
const YEAR_TO = 2026
/** 연도는 Act 1이 끝나기 전에 완주해야 한다 — 자기 구간 스크롤의 85% 지점. */
const YEAR_DONE_AT = 0.85

/** 도트 색: 꺼짐(네이비) → 켜짐(amber). 액센트는 amber 하나만 쓴다. */
const DOT_OFF = '#22345C'
const DOT_ON = '#F5B041'

type CountSpec = { value: number; prefix: string; suffix: string; decimals: number }

function readCount(el: HTMLElement): CountSpec {
  return {
    value: parseFloat(el.dataset.value ?? '0') || 0,
    prefix: el.dataset.prefix ?? '',
    suffix: el.dataset.suffix ?? '',
    decimals: parseInt(el.dataset.decimals ?? '0', 10) || 0,
  }
}

const format = (s: CountSpec, v: number) =>
  `${s.prefix}${s.decimals > 0 ? v.toFixed(s.decimals) : Math.round(v)}${s.suffix}`

/**
 * 홈 스크롤 연출을 붙이고, 해제 함수를 돌려준다.
 * 동작 최소화(reduced motion)일 때는 아예 호출되지 않는다 — 정적 완성 상태 유지.
 */
export function mountHomeScrolly(root: HTMLElement): () => void {
  const ctx = gsap.context(() => {
    const q = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)

    // ── Act 1 · 잔잔하게: 회사 워드마크가 시기 순으로 점등 ──────────────
    gsap.set('.hm-company', { autoAlpha: 0.28, y: 14 })
    gsap.set('.hm-dot', { backgroundColor: DOT_OFF })
    ScrollTrigger.batch('.hm-company', {
      start: 'top 88%',
      once: true,
      onEnter: (batch) => {
        gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.1, ease: EASE.out, overwrite: true })
        gsap.to(
          batch.map((el) => el.querySelector('.hm-dot')),
          { backgroundColor: DOT_ON, duration: 0.5, stagger: 0.1, ease: EASE.out, overwrite: true },
        )
      },
    })

    // ── Act 2 · 한 번 터지는 구간: 유일한 핀 + 3비트 + 카운트업 ─────────
    const act2 = q('[data-scrolly="act2"]')
    const panel = q('[data-scrolly="panel"]')
    const beats = gsap.utils.toArray<HTMLElement>('.hm-beat')
    const countEl = q<HTMLElement>('[data-scrolly="count"]')
    const mm = gsap.matchMedia()

    if (act2 && panel && beats.length === 3) {
      // 데스크톱: 패널을 짧게 고정하고 진행도 구간으로 비트를 전환한다. 스크럽으로
      // 묶지 않는 이유 — 중간에서 손을 떼면 비트가 반쯤 흐려진 채 얼어붙는다.
      mm.add('(min-width: 769px)', () => {
        const spec = countEl ? readCount(countEl) : null
        const writeNum = (v: number) => {
          if (countEl && spec) countEl.textContent = format(spec, v)
        }

        // 비트는 겹쳐 놓고 교차 전환. 정적 마크업은 세로로 쌓여 있으므로
        // 겹치기는 여기서만 켠다(연출이 없으면 원래대로 다 읽힌다).
        gsap.set(beats, { position: 'absolute', top: 0, left: 0, right: 0, marginTop: 0 })
        gsap.set(beats[0], { autoAlpha: 1, y: 0 })
        gsap.set([beats[1], beats[2]], { autoAlpha: 0, y: 24 })
        writeNum(0)

        // 결과 숫자는 스크롤에 매달지 않는다. 비트에 들어선 순간 1.2초 트윈을 한 번
        // 발사해 스스로 최종값까지 간다 — 스크롤을 멈춰도 반쯤에서 얼지 않는다.
        const counter = { n: 0 }
        let countTween: gsap.core.Tween | null = null
        let counting = false
        const startCount = () => {
          if (counting || !spec) return
          counting = true
          counter.n = 0
          writeNum(0)
          countTween = gsap.to(counter, {
            n: spec.value,
            duration: 1.2,
            ease: 'power2.out',
            onUpdate: () => writeNum(counter.n),
            onComplete: () => {
              counting = false
            },
          })
        }
        const resetCount = () => {
          countTween?.kill()
          counting = false
          counter.n = 0
          writeNum(0)
        }

        let cur = 0
        const showBeat = (idx: number) => {
          if (idx === cur) return
          cur = idx
          beats.forEach((b, i) => {
            gsap.to(b, {
              autoAlpha: i === idx ? 1 : 0,
              y: i === idx ? 0 : 24,
              duration: 0.45,
              ease: EASE.out,
              overwrite: true,
            })
          })
          if (idx === 2) startCount()
          else resetCount()
        }

        const st = ScrollTrigger.create({
          trigger: act2,
          start: 'top top',
          end: () => '+=' + Math.round(Math.min(1100, window.innerHeight * 1.15)),
          pin: panel,
          anticipatePin: 1,
          onUpdate: (self) => showBeat(self.progress < 0.34 ? 0 : self.progress < 0.67 ? 1 : 2),
          onLeaveBack: () => showBeat(0),
        })

        return () => {
          st.kill()
          countTween?.kill()
          // 겹치기 해제 — 데스크톱 폭을 벗어나면 원래의 세로 흐름으로 되돌린다.
          gsap.set(beats, { clearProps: 'position,top,left,right,marginTop,opacity,visibility,transform' })
          if (countEl && spec) countEl.textContent = format(spec, spec.value)
        }
      })

      // 모바일(≤768px): 핀 없음. 손가락 스크롤을 붙잡으면 멀미와 이탈이 난다.
      // 3비트는 흐름 그대로 쌓이고, 화면에 들어올 때 한 번씩 드러난다.
      mm.add('(max-width: 768px)', () => {
        const spec = countEl ? readCount(countEl) : null
        gsap.set(beats, { autoAlpha: 0, y: 22 })
        const triggers = beats.map((el) =>
          ScrollTrigger.create({
            trigger: el,
            start: 'top 85%',
            once: true,
            onEnter: () => gsap.to(el, { autoAlpha: 1, y: 0, duration: 0.6, ease: EASE.out, overwrite: true }),
          }),
        )
        let countTween: gsap.core.Tween | null = null
        if (countEl && spec) {
          const counter = { n: 0 }
          countEl.textContent = format(spec, 0)
          triggers.push(
            ScrollTrigger.create({
              trigger: beats[2],
              start: 'top 80%',
              once: true,
              onEnter: () => {
                countTween = gsap.to(counter, {
                  n: spec.value,
                  duration: 1.1,
                  ease: EASE.out,
                  onUpdate: () => {
                    countEl.textContent = format(spec, counter.n)
                  },
                })
              },
            }),
          )
        }
        return () => {
          triggers.forEach((t) => t.kill())
          countTween?.kill()
          gsap.set(beats, { clearProps: 'opacity,visibility,transform' })
          if (countEl && spec) countEl.textContent = format(spec, spec.value)
        }
      })
    }

    // ── Act 1 · 연도 스크럽 (2006 → 2026) ────────────────────────────────
    // Act 2의 핀 뒤에 선언하고 refreshPriority -1을 준다: 핀이 만드는 스페이서가
    // 문서 높이에 반영된 뒤에 이 구간이 계산되어야 목표 지점이 밀리지 않는다.
    const act1 = q('[data-scrolly="act1"]')
    const yearEl = q<HTMLElement>('[data-scrolly="year"]')
    if (act1 && yearEl) {
      // 모바일에서는 계기판이 sticky가 아니라 곧바로 화면을 벗어난다 — 보이지도
      // 않는 숫자를 굴리는 대신 도착 연도(2026)를 그대로 둔다.
      mm.add('(min-width: 769px)', () => {
        const runway = () => Math.max(1, Math.round((act1.offsetHeight - window.innerHeight) * YEAR_DONE_AT))
        const year = { v: YEAR_FROM }
        yearEl.textContent = String(YEAR_FROM)
        const tween = gsap.to(year, {
          v: YEAR_TO,
          ease: 'none',
          scrollTrigger: {
            trigger: act1,
            start: 'top top',
            end: () => '+=' + runway(),
            scrub: 0.6,
            invalidateOnRefresh: true,
            refreshPriority: -1,
          },
          onUpdate: () => {
            yearEl.textContent = String(Math.round(year.v))
          },
        })
        return () => {
          tween.scrollTrigger?.kill()
          tween.kill()
          yearEl.textContent = String(YEAR_TO)
        }
      })
    }

    ScrollTrigger.refresh()

    // 로드 시점에 이미 화면 안에 있는 회사 행은 batch가 잡지 못한다(진입 이벤트가
    // 없으므로) — 직접 한 번 점등해 준다.
    gsap.utils
      .toArray<HTMLElement>('.hm-company')
      .filter((el) => {
        const r = el.getBoundingClientRect()
        return r.top < window.innerHeight && r.bottom > 0
      })
      .forEach((el, i) => {
        gsap.to(el, { autoAlpha: 1, y: 0, duration: 0.6, delay: i * 0.08, ease: EASE.out, overwrite: true })
        gsap.to(el.querySelector('.hm-dot'), {
          backgroundColor: DOT_ON,
          duration: 0.5,
          delay: i * 0.08,
          ease: EASE.out,
          overwrite: true,
        })
      })

    return () => mm.revert()
  }, root)

  return () => ctx.revert()
}
