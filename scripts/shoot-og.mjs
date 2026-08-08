/**
 * 링크 미리보기 카드(og.png) 재생성 — 사이트의 첫 화면을 1200×630으로 찍는다.
 * 카드 문구를 따로 만들지 않는 이유는 PDF와 같다: 문구가 두 벌이 되면 반드시 어긋난다.
 * (2026-08-08 실측: 수동 캡처였던 탓에 카드만 v20 시절 문구로 굳어 있었다.)
 *
 * 선행: npm run build && npm run preview (4173)
 * Usage: node scripts/shoot-og.mjs [baseUrl]
 */
import puppeteer from 'puppeteer-core'
import { statSync } from 'node:fs'

const BASE = (process.argv[2] ?? 'http://localhost:4173/henry-portfolio/').replace(/\/$/, '') + '/'
const OUT = 'public/og.png'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--force-device-scale-factor=1', '--hide-scrollbars'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 })
await page.evaluateOnNewDocument(() => localStorage.setItem('henry.lang', 'ko'))
await page.goto(BASE, { waitUntil: 'networkidle0', timeout: 60000 })
await new Promise((r) => setTimeout(r, 1500))

// 카드에 히어로 문구가 실제로 담겼는지 확인하고 저장한다 — 빈 화면이 조용히 나가지 않게.
const h1 = await page.evaluate(() => document.querySelector('h1')?.textContent?.trim() ?? '')
if (h1.length < 10) {
  console.error('[shoot-og] 실패: 첫 화면 제목을 찾지 못했습니다.')
  process.exit(1)
}
await page.screenshot({ path: OUT })
await browser.close()

console.log(`[shoot-og] → ${OUT}  ${Math.round(statSync(OUT).size / 1024)} KB`)
console.log(`  카드에 담긴 제목: ${h1.replace(/\s+/g, ' ')}`)
