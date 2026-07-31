/**
 * v21 P4 시연용 캡처 — 카드 두 장(왼쪽/오른쪽 배치)과 "다 둘러본" 상태.
 * 검증은 verify-v21-p4.mjs가 하고, 여기서는 본부장 확인용 그림만 만든다.
 */
import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'

const BASE = (process.argv[2] ?? 'http://localhost:4173/henry-portfolio/').replace(/\/$/, '')
const OUT = process.argv[3] ?? 'shots-v21-p4-demo'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
mkdirSync(OUT, { recursive: true })

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--hide-scrollbars'] })
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
await page.goto(BASE + '/room', { waitUntil: 'networkidle2', timeout: 60000 })
await wait(5200)

const clickPin = (id) => page.evaluate((i) => document.querySelector(`[data-pin="${i}"]`)?.click(), id)

// 오른쪽 사물(서버) → 카드는 왼쪽에 떠야 한다
await clickPin('server')
await wait(900)
await page.screenshot({ path: `${OUT}/card-left.png` })

// 왼쪽 사물(액자) → 카드는 오른쪽
await clickPin('frame')
await wait(900)
await page.screenshot({ path: `${OUT}/card-right.png` })

// 전부 열어본 상태 — 하단 안내가 "다 둘러봤다"로 바뀐다
for (const id of ['desk', 'tv', 'bookshelf', 'coffee', 'speaker']) {
  await clickPin(id)
  await wait(320)
}
await page.keyboard.press('Escape')
await wait(700)
await page.screenshot({ path: `${OUT}/all-seen.png` })

await browser.close()
console.log('done → ' + OUT)
