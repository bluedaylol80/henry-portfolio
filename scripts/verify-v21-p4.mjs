/**
 * v21 P4 검증 — `/room` 탐험 무대.
 * SDD §2/§5.5: 방은 **콘텐츠의 관문이 아니다** + 성능 예산 유지. 그래서 검사는
 * "재미"가 아니라 "빠져나갈 길이 항상 있는가 / 키보드로 되는가 / 안 깨지는가"를 본다.
 *
 *   1) 핀을 눌러도 즉시 이동하지 않고 사물 카드가 열린다(실수 이탈 방지)
 *   2) 카드의 이동 버튼을 눌러야 실제로 이동한다
 *   3) Esc 로 닫히고, ← → 로 옆 사물로 넘어간다
 *   4) 하단 메뉴(Legend)는 카드와 무관하게 항상 바로 이동시킨다 = 관문 아님
 *   5) 둘러본 개수 표시가 실제로 올라간다
 *   6) 가로 넘침 0 · 콘솔 오류 0 · 모바일 동작
 *
 * Usage: node scripts/verify-v21-p4.mjs [baseUrl] [outDir]
 */
import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'

const BASE = (process.argv[2] ?? 'http://localhost:4173/henry-portfolio/').replace(/\/$/, '')
const OUT = process.argv[3] ?? 'shots-v21-p4'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const ROOM = BASE + '/room'

mkdirSync(OUT, { recursive: true })
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--hide-scrollbars'] })
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const checks = []
const ok = (name, pass, note = '') => checks.push({ name, pass, note })

async function openRoom({ width = 1440, height = 900, mobile = false } = {}) {
  const page = await browser.newPage()
  await page.setViewport({ width, height, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 })
  const errors = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto(ROOM, { waitUntil: 'networkidle2', timeout: 60000 })
  await wait(5200)
  return { page, errors }
}

const cardTitle = (page) =>
  page.evaluate(() => document.querySelector('[role="dialog"] h2')?.textContent?.trim() ?? null)
const progressText = (page) =>
  page.evaluate(() => {
    const el = [...document.querySelectorAll('span')].find((s) => /둘러본 사물|Explored/.test(s.textContent ?? ''))
    return el?.textContent?.trim() ?? null
  })
const clickPin = (page, id) => page.evaluate((i) => document.querySelector(`[data-pin="${i}"]`)?.click(), id)

// ── 데스크톱 ────────────────────────────────────────────────────────
{
  const { page, errors } = await openRoom()
  const pins = await page.evaluate(() => document.querySelectorAll('[data-pin]').length)
  ok('핀 렌더', pins === 7, `${pins}개`)
  ok('시작 시 카드 없음', (await cardTitle(page)) === null)
  const p0 = await progressText(page)
  ok('둘러본 개수 표시', /0/.test(p0 ?? ''), p0 ?? '없음')

  // 1 · 핀 클릭 → 이동하지 않고 카드가 열려야 한다
  await clickPin(page, 'bookshelf')
  await wait(700)
  const title1 = await cardTitle(page)
  const url1 = page.url()
  ok('핀 클릭 = 카드 열림', !!title1, title1 ?? '없음')
  ok('핀 클릭으로는 이동하지 않음', url1.endsWith('/room'), url1.split('/').slice(-1)[0])
  await page.screenshot({ path: `${OUT}/desktop-card.png` })

  // 2 · 방향키로 옆 사물
  await page.keyboard.press('ArrowRight')
  await wait(600)
  const title2 = await cardTitle(page)
  ok('→ 키로 다음 사물', !!title2 && title2 !== title1, `${title1} → ${title2}`)

  // 3 · Esc 로 닫기
  await page.keyboard.press('Escape')
  await wait(500)
  ok('Esc 로 카드 닫힘', (await cardTitle(page)) === null)

  const p1 = await progressText(page)
  ok('둘러본 개수 증가', /2/.test(p1 ?? ''), p1 ?? '없음')

  // 4 · 카드의 이동 버튼을 눌러야 실제 이동
  await clickPin(page, 'server')
  await wait(700)
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('[role="dialog"] button')]
    btns.find((b) => !/✕/.test(b.textContent ?? ''))?.click()
  })
  await wait(1600)
  ok('카드 버튼 = 실제 이동', page.url().includes('/work/ai-os'), page.url())

  // 5 · 방으로 돌아가 하단 메뉴가 카드 없이 바로 이동시키는지(관문 아님)
  await page.goto(ROOM, { waitUntil: 'networkidle2', timeout: 60000 })
  await wait(5200)
  // ⚠ 핀 버튼도 숨은 라벨 칩에 같은 글자를 품고 있다 — 부분일치로 찾으면 핀을
  //   눌러버려서 "이동이 안 된다"는 거짓 실패가 난다(실측으로 발견).
  //   하단 메뉴 버튼은 라벨 텍스트만 가지므로 **완전일치**로 겨냥한다.
  await page.evaluate(() => {
    const el = [...document.querySelectorAll('button')].find((b) => ['커리어 여정', 'Career journey'].includes((b.textContent ?? '').trim()))
    el?.click()
  })
  await wait(1600)
  ok('하단 메뉴 = 즉시 이동(관문 아님)', page.url().includes('/career'), page.url())

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  ok('가로 넘침 0', overflow === 0, `${overflow}px`)
  ok('콘솔 오류 0', errors.length === 0, errors.slice(0, 2).join(' | '))
  await page.close()
}

// ── 모바일 ──────────────────────────────────────────────────────────
{
  const { page, errors } = await openRoom({ width: 390, height: 844, mobile: true })
  await clickPin(page, 'desk')
  await wait(800)
  ok('모바일 카드 열림', !!(await cardTitle(page)))
  const fits = await page.evaluate(() => {
    const el = document.querySelector('[role="dialog"]')
    if (!el) return false
    const r = el.getBoundingClientRect()
    return r.left >= 0 && r.right <= window.innerWidth + 1
  })
  ok('모바일 카드가 화면 안에 들어옴', fits)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  ok('모바일 가로 넘침 0', overflow === 0, `${overflow}px`)
  ok('모바일 콘솔 오류 0', errors.length === 0)
  await page.screenshot({ path: `${OUT}/mobile-card.png` })
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
