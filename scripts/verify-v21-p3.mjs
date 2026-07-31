/**
 * v21 P3 검증 — `/work/ai-os`의 실측 카운터 + 리플레이 데모.
 * SDD 검증기준 ④(키보드로도 조작 가능 + "실제 기록 재생" 라벨 표기)와
 * ⑤(수치는 스냅샷에서 생성)를 실제 브라우저에서 확인한다.
 *
 * 확인 항목
 *   1) 정직성 라벨이 화면에 실제로 렌더되는가 ("실제 운영 기록 재생 · 날짜")
 *   2) 카운터 수치가 스냅샷 JSON 값과 일치하는가 (손으로 쓴 숫자 없음)
 *   3) 시나리오 전환이 **키보드만으로** 되는가 (Tab → Enter)
 *   4) 재생을 누르면 단계가 실제로 드러나는가 (흐림 → 선명)
 *   5) 동작 최소화에서는 처음부터 전 단계가 보이는가
 *   6) 가로 넘침 0 · 콘솔 오류 0
 *
 * Usage: node scripts/verify-v21-p3.mjs [baseUrl] [outDir]
 */
import puppeteer from 'puppeteer-core'
import { mkdirSync, readFileSync } from 'node:fs'

const BASE = (process.argv[2] ?? 'http://localhost:4173/henry-portfolio/').replace(/\/$/, '')
const OUT = process.argv[3] ?? 'shots-v21-p3'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const URL = BASE + '/work/ai-os'
const snap = JSON.parse(readFileSync('src/content/aiosEvidence.json', 'utf8'))

mkdirSync(OUT, { recursive: true })
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--force-device-scale-factor=1', '--hide-scrollbars'],
})
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const checks = []
const ok = (name, pass, note = '') => checks.push({ name, pass, note })

async function openPage({ reduced = false, width = 1440, height = 900, mobile = false } = {}) {
  const page = await browser.newPage()
  await page.setViewport({ width, height, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 })
  if (reduced) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  const errors = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 })
  await wait(4800)
  // 데모 블록이 화면에 들어와야 리빌(whileInView)이 풀린다.
  await page.evaluate(() => {
    const el = [...document.querySelectorAll('h3')].find((h) => h.textContent.includes('재생'))
    el?.scrollIntoView({ block: 'center', behavior: 'instant' })
  })
  await wait(1200)
  return { page, errors }
}

/** 단계 li 들의 불투명도 — 드러남 여부 판정용. */
const stepOpacities = (page) =>
  page.evaluate(() => {
    const list = document.querySelector('ol[aria-live]')
    if (!list) return []
    return [...list.querySelectorAll('li > div:last-child')].map((d) => +parseFloat(getComputedStyle(d).opacity).toFixed(2))
  })

// ── 1 · 데스크톱 기본 ────────────────────────────────────────────────
{
  const { page, errors } = await openPage()

  const bodyText = await page.evaluate(() => document.body.innerText)
  ok('정직성 라벨 표기', bodyText.includes('실제 운영 기록 재생'), '"라이브인 척" 금지 요건')
  ok('라이브 아님 설명 표기', bodyText.includes('왜 라이브가 아닌가'))

  const c = snap.counters
  ok('카운터=스냅샷 일치(실행)', bodyText.includes(c.runs.toLocaleString('ko-KR')), `runs=${c.runs}`)
  ok('카운터=스냅샷 일치(규모)', bodyText.includes(`${c.agents} · ${c.skills} · ${c.rules}`), `${c.agents}/${c.skills}/${c.rules}`)
  ok('기준일 표기', bodyText.includes(snap.asOf), `asOf=${snap.asOf}`)

  const before = await stepOpacities(page)
  ok('재생 전 = 단계 흐림', before.length > 0 && before.every((o) => o < 0.5), JSON.stringify(before))

  // 재생 버튼 클릭 → 단계가 드러나는가
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('재생'))
    btn?.click()
  })
  await wait(4200)
  const after = await stepOpacities(page)
  ok('재생 후 = 전 단계 선명', after.length > 0 && after.every((o) => o > 0.9), JSON.stringify(after))
  await page.screenshot({ path: `${OUT}/desktop-played.png` })

  // 키보드만으로 시나리오 전환: 첫 시나리오 버튼에 포커스 → Tab → Enter
  const switched = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('[role="group"] button[aria-pressed]')]
    if (btns.length < 2) return null
    btns[0].focus()
    return { count: btns.length, focused: document.activeElement === btns[0] }
  })
  ok('시나리오 버튼 포커스 가능', !!switched?.focused, `버튼 ${switched?.count ?? 0}개`)
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await wait(900)
  const pressedIdx = await page.evaluate(() =>
    [...document.querySelectorAll('[role="group"] button[aria-pressed]')].findIndex((b) => b.getAttribute('aria-pressed') === 'true'),
  )
  ok('키보드로 시나리오 전환', pressedIdx === 1, `선택된 인덱스=${pressedIdx}`)
  await page.screenshot({ path: `${OUT}/desktop-keyboard-switch.png` })

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  ok('가로 넘침 0', overflow === 0, `${overflow}px`)
  ok('콘솔 오류 0', errors.length === 0, errors.slice(0, 2).join(' | '))
  await page.close()
}

// ── 2 · 동작 최소화 ──────────────────────────────────────────────────
{
  const { page, errors } = await openPage({ reduced: true })
  const o = await stepOpacities(page)
  ok('동작최소화 = 처음부터 전부 표시', o.length > 0 && o.every((v) => v > 0.9), JSON.stringify(o))
  ok('동작최소화 콘솔 오류 0', errors.length === 0)
  await page.screenshot({ path: `${OUT}/reduced.png` })
  await page.close()
}

// ── 3 · 모바일 ───────────────────────────────────────────────────────
{
  const { page, errors } = await openPage({ width: 390, height: 844, mobile: true })
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  ok('모바일 가로 넘침 0', overflow === 0, `${overflow}px`)
  ok('모바일 콘솔 오류 0', errors.length === 0)
  await page.screenshot({ path: `${OUT}/mobile.png`, fullPage: false })
  await page.close()
}

await browser.close()
let failed = 0
for (const c of checks) {
  if (!c.pass) failed++
  console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.note ? '  — ' + c.note : ''}`)
}
console.log(`\n${checks.length - failed}/${checks.length} passed → ${OUT}`)
process.exit(failed ? 1 : 0)
