/**
 * v21 P3 시연용 캡처 — 시나리오 4종을 각각 골라 재생한 뒤, 데모 블록만 잘라 찍는다.
 * (검증은 verify-v21-p3.mjs가 담당하고, 이 파일은 본부장 확인용 그림만 만든다.)
 *
 * Usage: node scripts/shoot-v21-p3.mjs [baseUrl] [outDir]
 */
import puppeteer from 'puppeteer-core'
import { mkdirSync, readFileSync } from 'node:fs'

const BASE = (process.argv[2] ?? 'http://localhost:4173/henry-portfolio/').replace(/\/$/, '')
const OUT = process.argv[3] ?? 'shots-v21-p3-demo'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const snap = JSON.parse(readFileSync('src/content/aiosEvidence.json', 'utf8'))

mkdirSync(OUT, { recursive: true })
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--hide-scrollbars'] })
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 })
await page.goto(BASE + '/work/ai-os', { waitUntil: 'networkidle2', timeout: 60000 })
await wait(5000)

/**
 * 요소 영역만 캡처. ⚠ puppeteer의 clip은 **문서 좌표**인데 getBoundingClientRect는
 * 뷰포트 좌표다 — scrollX/Y를 더하지 않으면 엉뚱한 데가 찍힌다(실측으로 발견).
 */
const clipOf = async (sel) =>
  page.evaluate((s) => {
    const el = document.querySelector(s)
    if (!el) return null
    const r = el.getBoundingClientRect()
    return {
      x: Math.max(0, r.x + window.scrollX - 8),
      y: Math.max(0, r.y + window.scrollY - 8),
      width: Math.min(r.width + 16, document.documentElement.clientWidth),
      height: r.height + 16,
    }
  }, sel)

const scrollTo = async (sel) => {
  await page.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: 'center', behavior: 'instant' }), sel)
  await wait(900)
}

// 카운터 전체
await scrollTo('dl')
await page.screenshot({ path: `${OUT}/counters.png`, clip: (await clipOf('dl')) ?? undefined })

// 시나리오별 재생 캡처
for (let i = 0; i < snap.scenarios.length; i++) {
  const key = snap.scenarios[i].key
  await page.evaluate((idx) => {
    const btns = [...document.querySelectorAll('[role="group"] button[aria-pressed]')]
    btns[idx]?.click()
  }, i)
  await wait(500)
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => /재생/.test(b.textContent ?? ''))
    btn?.click()
  })
  await wait(4600)
  await scrollTo('[role="group"]')
  const clip = await clipOf('[role="group"]')
  // 그룹만 찍으면 타임라인이 잘린다 — 데모 카드 전체를 잡는다.
  const card = await page.evaluate(() => {
    const g = document.querySelector('[role="group"]')
    const card = g?.closest('div.rounded-\\[20px\\]')
    if (!card) return null
    const r = card.getBoundingClientRect()
    return { x: Math.max(0, r.x - 6), y: Math.max(0, r.y - 6), width: r.width + 12, height: r.height + 12 }
  })
  await page.screenshot({ path: `${OUT}/scenario-${i}-${key}.png`, clip: card ?? clip ?? undefined })
  console.log(`captured ${key}`)
}

await browser.close()
console.log('done → ' + OUT)
