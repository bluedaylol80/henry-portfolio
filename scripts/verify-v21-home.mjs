/**
 * v21 P2 검증 — 홈(`/`)의 Act 0~5 서사를 프로덕션 프리뷰 빌드에서 실측한다.
 * verify-v21-poc.mjs와 같은 골격(puppeteer-core + 로컬 Chrome, 4173)이되 대상이
 * 홈이고, 서사 전용 체크가 붙는다:
 *
 *   1) Act 0가 스크롤 전에 이미 "누구·19년·강점"을 렌더하는가 (첫 화면 텍스트)
 *   2) 연도가 Act 1 안에서 2026까지 오르고, 그때 화면에 남아 있는가
 *   3) Act 2 핀 구간에서 3비트가 순서대로 바뀌고 결과 숫자가 최종값까지 가는가
 *   4) 데스크톱·모바일·동작최소화 3모드 모두 가로 넘침 0 · 콘솔 오류 0
 *
 * Usage: node scripts/verify-v21-home.mjs [baseUrl] [outDir]
 */
import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'

const BASE = (process.argv[2] ?? 'http://localhost:4173/henry-portfolio/').replace(/\/$/, '') + '/'
const OUT = process.argv[3] ?? 'shots-v21-home'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'

mkdirSync(OUT, { recursive: true })
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--force-device-scale-factor=1', '--hide-scrollbars'],
})

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const results = []

async function makePage({ width = 1440, height = 900, mobile = false, reduced = false, lang = 'ko' } = {}) {
  const page = await browser.newPage()
  await page.setViewport({ width, height, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 })
  if (reduced) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  const errors = []
  const failed = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('response', (r) => r.status() >= 400 && failed.push(`${r.status()} ${r.url()}`))
  page.on('requestfailed', (r) => failed.push(`FAILED ${r.url()}`))
  await page.evaluateOnNewDocument((l) => localStorage.setItem('henry.lang', l), lang)
  return { page, errors, failed }
}

const overflowOf = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

async function scrollToFrac(page, frac) {
  await page.evaluate((f) => {
    const y = Math.round((document.documentElement.scrollHeight - window.innerHeight) * f)
    window.scrollTo({ top: y, behavior: 'instant' })
  }, frac)
  await wait(1500) // 비트 전환 + 자체 카운트업(1.2s)이 끝나도록
}

/** 연도 계기판의 현재 값과 화면 노출 여부. */
const yearState = (page) =>
  page.evaluate(() => {
    const el = document.querySelector('[data-scrolly="year"]')
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { year: parseInt(el.textContent.trim(), 10), visible: r.bottom > 0 && r.top < window.innerHeight, top: Math.round(r.top) }
  })

/** 지금 보이는 비트의 인덱스(투명도 기준)와 결과 숫자 텍스트. */
const beatState = (page) =>
  page.evaluate(() => {
    const beats = [...document.querySelectorAll('.hm-beat')]
    const vis = beats.map((b) => parseFloat(getComputedStyle(b).opacity))
    const count = document.querySelector('[data-scrolly="count"]')
    return { visible: vis.map((v) => +v.toFixed(2)), count: count ? count.textContent.trim() : null }
  })

async function run(tag, opts, fracs, { shots = true } = {}) {
  const { page, errors, failed } = await makePage(opts)
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 })
  await wait(5200) // 프리로더 해제 + 첫 리빌 + 연출 청크 로드
  let maxOverflow = await overflowOf(page)

  // ① Act 0 — 스크롤 전 첫 화면에 핵심이 이미 있는가
  const above = await page.evaluate(() => {
    const inView = (el) => {
      const r = el.getBoundingClientRect()
      return r.top < window.innerHeight && r.bottom > 0
    }
    const h1 = document.querySelector('h1')
    const nums = [...document.querySelectorAll('main .text-amber')].filter(inView).map((e) => e.textContent.trim())
    return { h1: h1 && inView(h1) ? h1.textContent.trim().replace(/\s+/g, ' ') : null, amberInView: nums.slice(0, 6) }
  })

  const years = []
  const beats = []
  for (let i = 0; i < fracs.length; i++) {
    await scrollToFrac(page, fracs[i])
    const o = await overflowOf(page)
    if (o > maxOverflow) maxOverflow = o
    years.push(await yearState(page))
    beats.push(await beatState(page))
    if (shots) await page.screenshot({ path: `${OUT}/${tag}-${String(i).padStart(2, '0')}.png` })
  }
  results.push({ tag, above, overflow: maxOverflow, errors: [...new Set(errors)], failed: [...new Set(failed)], years, beats })
  await page.close()
}

/**
 * 핀 구간만 촘촘히 훑는다. 페이지 전체 비율로 샘플링하면 핀(≈1화면 분량)이
 * 두 샘플 사이에 통째로 지나가 "결정" 비트를 놓친다.
 */
async function pinSweep(tag, opts) {
  const { page, errors, failed } = await makePage(opts)
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 })
  await wait(5200)
  const geom = await page.evaluate(() => {
    const act2 = document.querySelector('[data-scrolly="act2"]')
    const top = act2.getBoundingClientRect().top + window.scrollY
    return { top, len: Math.round(Math.min(1100, window.innerHeight * 1.15)) }
  })
  const seen = []
  for (const f of [0.05, 0.2, 0.4, 0.5, 0.6, 0.8, 0.95]) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), Math.round(geom.top + geom.len * f))
    await wait(1400)
    const b = await beatState(page)
    const idx = b.visible.findIndex((v) => v > 0.5)
    seen.push(`${(f * 100).toFixed(0)}%:beat${idx + 1}${idx === 2 ? '=' + b.count : ''}`)
    await page.screenshot({ path: `${OUT}/${tag}-${String(Math.round(f * 100)).padStart(2, '0')}.png` })
  }
  results.push({
    tag,
    above: null,
    overflow: await overflowOf(page),
    errors: [...new Set(errors)],
    failed: [...new Set(failed)],
    years: [],
    beats: [],
    sweep: seen,
  })
  await page.close()
}

async function fullPage(tag, opts) {
  const { page, errors, failed } = await makePage(opts)
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 })
  await wait(5200)
  const overflow = await overflowOf(page)
  const beats = [await beatState(page)]
  const years = [await yearState(page)]
  await page.screenshot({ path: `${OUT}/${tag}.png`, fullPage: true })
  results.push({ tag, above: null, overflow, errors: [...new Set(errors)], failed: [...new Set(failed)], years, beats })
  await page.close()
}

// 데스크톱 — Act 0 → 5를 10단계로 훑는다
await run('desktop-ko', { width: 1440, height: 900 }, [0, 0.08, 0.16, 0.24, 0.34, 0.42, 0.5, 0.62, 0.78, 0.94])
// 모바일 — 핀 없음(스크롤재킹 금지) 폴백
await run('mobile-ko', { width: 390, height: 844, mobile: true }, [0, 0.2, 0.4, 0.6, 0.8, 0.97])
// 동작 최소화 — 전부 정적 완성 상태여야 한다
await fullPage('reduced-desktop', { width: 1440, height: 900, reduced: true })
// 핀 구간 정밀 — 문제 → 결정 → 결과가 순서대로 나오는지
await pinSweep('pin-ko', { width: 1440, height: 900 })
// 영문
await run('desktop-en', { width: 1440, height: 900, lang: 'en' }, [0, 0.34, 0.94], { shots: true })

for (const r of results) {
  console.log(
    `[${r.tag}] overflow-x=${r.overflow}px consoleErrors=${r.errors.length} failedReqs=${r.failed.length}` +
      (r.above ? `\n  above-fold h1: ${r.above.h1?.slice(0, 60)}… | amber: ${r.above.amberInView.join(' / ')}` : '') +
      `\n  years: ${r.years.map((y) => (y ? `${y.year}${y.visible ? '' : '(off)'}` : '-')).join(' → ')}` +
      (r.beats.length ? `\n  beats: ${r.beats.map((b) => `[${b.visible.join(',')}]${b.count ? ' ' + b.count : ''}`).join(' → ')}` : '') +
      (r.sweep ? `\n  pin sweep: ${r.sweep.join(' → ')}` : '') +
      (r.failed.length ? '\n  failed: ' + r.failed.slice(0, 5).join(' | ') : '') +
      (r.errors.length ? '\n  console: ' + r.errors.slice(0, 4).join(' | ') : ''),
  )
}
await browser.close()
console.log('done → ' + OUT)
