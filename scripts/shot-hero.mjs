/**
 * 히어로(첫 화면) 비교 캡처 — 문구 조준을 바꿀 때 "변경 전 / 변경 후"를 같은
 * 조건으로 찍어 눈으로 비교하기 위한 도구. 판정은 사람이 하되, 캡처 조건
 * (뷰포트·언어·스케일)은 기계가 고정한다.
 *
 * Usage: node scripts/shot-hero.mjs [baseUrl] [outDir] [tag]
 *   node scripts/shot-hero.mjs https://bluedaylol80.github.io/henry-portfolio/ shots-hero before
 *   node scripts/shot-hero.mjs http://localhost:4173/henry-portfolio/ shots-hero after
 */
import puppeteer from 'puppeteer-core'
import { mkdirSync, writeFileSync } from 'node:fs'

const BASE = (process.argv[2] ?? 'http://localhost:4173/henry-portfolio/').replace(/\/$/, '') + '/'
const OUT = process.argv[3] ?? 'shots-hero'
const TAG = process.argv[4] ?? 'shot'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'

mkdirSync(OUT, { recursive: true })
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--force-device-scale-factor=1', '--hide-scrollbars'],
})

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const modes = [
  { key: 'desktop-ko', width: 1440, height: 900, lang: 'ko', mobile: false },
  { key: 'desktop-en', width: 1440, height: 900, lang: 'en', mobile: false },
  { key: 'mobile-ko', width: 390, height: 844, lang: 'ko', mobile: true },
]

const record = {}
for (const m of modes) {
  const page = await browser.newPage()
  await page.setViewport({ width: m.width, height: m.height, isMobile: m.mobile, hasTouch: m.mobile, deviceScaleFactor: 1 })
  await page.evaluateOnNewDocument((l) => localStorage.setItem('henry.lang', l), m.lang)
  await page.goto(BASE, { waitUntil: 'networkidle0', timeout: 60000 })
  await wait(1200)

  // 첫 화면(스크롤 0)만 — 히어로가 3초 안에 무엇을 말하는지가 판정 대상이다.
  await page.screenshot({ path: `${OUT}/${TAG}-${m.key}.png` })

  record[m.key] = await page.evaluate(() => {
    const txt = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : null)
    const inFirstScreen = [...document.querySelectorAll('h1, p, span')]
      .filter((el) => {
        const r = el.getBoundingClientRect()
        return r.top >= 0 && r.top < window.innerHeight && r.height > 0 && el.textContent.trim()
      })
      .slice(0, 14)
      .map((el) => txt(el))
    return { h1: txt(document.querySelector('h1')), firstScreen: [...new Set(inFirstScreen)] }
  })
  await page.close()
}

writeFileSync(`${OUT}/${TAG}.json`, JSON.stringify(record, null, 2))
console.log(`[shot-hero] ${TAG} → ${OUT}/`)
console.log(`  h1(ko): ${record['desktop-ko'].h1}`)
console.log(`  h1(en): ${record['desktop-en'].h1}`)
await browser.close()
