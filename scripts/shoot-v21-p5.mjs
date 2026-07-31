/**
 * v21 P5 시연용 캡처 — PDF 내려받기 자리(홈 Act 5 · /brief)와 인쇄 미리보기.
 * 검증은 verify-v21-final.mjs가 하고, 여기서는 확인용 그림만 만든다.
 */
import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'

const BASE = (process.argv[2] ?? 'http://localhost:4173/henry-portfolio/').replace(/\/$/, '')
const OUT = process.argv[3] ?? 'shots-v21-p5'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
mkdirSync(OUT, { recursive: true })

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--hide-scrollbars'] })
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

async function shot(name, route, scrollToText) {
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
  await page.goto(BASE + route, { waitUntil: 'networkidle2', timeout: 60000 })
  await wait(5200)
  if (scrollToText) {
    await page.evaluate((needle) => {
      const el = [...document.querySelectorAll('h3, a')].find((e) => (e.textContent ?? '').includes(needle))
      el?.scrollIntoView({ block: 'center', behavior: 'instant' })
    }, scrollToText)
    await wait(900)
  }
  await page.screenshot({ path: `${OUT}/${name}.png` })
  await page.close()
  console.log('captured ' + name)
}

await shot('home-pdf', '/', '지원용 한 장 요약')
await shot('brief-cta', '/brief', 'PDF 내려받기')

// 인쇄 미리보기 — 실제 PDF와 같은 렌더(밝은 문서)
{
  const page = await browser.newPage()
  await page.setViewport({ width: 900, height: 1200, deviceScaleFactor: 1 })
  await page.goto(BASE + '/brief', { waitUntil: 'networkidle2', timeout: 60000 })
  await wait(5600)
  await page.emulateMediaType('print')
  await wait(400)
  await page.screenshot({ path: `${OUT}/print-preview.png`, fullPage: true })
  await page.close()
  console.log('captured print-preview')
}

await browser.close()
console.log('done → ' + OUT)
