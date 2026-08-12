import puppeteer from 'puppeteer-core'
const FILE = process.argv[2]
const OUT = process.argv[3] ?? 'shots-artifact'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
import { mkdirSync } from 'node:fs'
mkdirSync(OUT, { recursive: true })
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--force-device-scale-factor=1'] })
const errors = []
for (const [w, tag] of [[900, 'wide'], [390, 'mobile']]) {
  const page = await browser.newPage()
  await page.setViewport({ width: w, height: 1000, deviceScaleFactor: 1 })
  page.on('console', (m) => m.type() === 'error' && errors.push(`[${tag}] ` + m.text()))
  page.on('pageerror', (e) => errors.push(`[${tag}] ` + String(e)))
  await page.goto('file:///' + FILE.replace(/\\/g, '/'), { waitUntil: 'networkidle2', timeout: 60000 })
  // 로더 퇴장 대기 후 게이트 리빌(최대 지연 900ms + 전환 800ms)이 끝나야 판정 가능한 화면이 찍힌다
  await page.waitForFunction(() => !document.getElementById('loader'), { timeout: 15000 }).catch(() => {})
  await new Promise((r) => setTimeout(r, 1700))
  await page.screenshot({ path: `${OUT}/${tag}-top.png` })
  // full page: 화면 밖 콘텐츠는 IntersectionObserver가 안 울리므로 리빌 종단상태를 강제한 뒤 촬영
  await page.evaluate(() => {
    document.querySelectorAll('[data-reveal],[data-lines]').forEach((el) => el.classList.add('is-in'))
    document.querySelectorAll('[data-count]').forEach((el) => { el.textContent = el.dataset.count })
  })
  await new Promise((r) => setTimeout(r, 900))
  await page.screenshot({ path: `${OUT}/${tag}-full.png`, fullPage: true })
  await page.close()
}
console.log('saved. console errors:', errors.length)
if (errors.length) console.log(errors.slice(0, 8).join('\n'))
await browser.close()
