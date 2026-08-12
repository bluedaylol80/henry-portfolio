// 요소 단위 클립 촬영 — 디테일 눈판정용 (풀샷은 너무 길어 판정 불가)
// node scripts/shot-clip.mjs <html파일> <출력폴더> <뷰포트폭> <셀렉터...>
import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'
const [FILE, OUT = 'shots-clip', W = '390', ...SELS] = process.argv.slice(2)
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
mkdirSync(OUT, { recursive: true })
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--force-device-scale-factor=1'] })
const page = await browser.newPage()
await page.setViewport({ width: +W, height: 1000, deviceScaleFactor: 2 })
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))
await page.goto('file:///' + FILE.replace(/\\/g, '/'), { waitUntil: 'networkidle2', timeout: 60000 })
await page.waitForFunction(() => !document.getElementById('loader'), { timeout: 15000 }).catch(() => {})
await new Promise((r) => setTimeout(r, 1700))
// 화면 밖 콘텐츠는 IO가 안 울리므로 리빌 종단상태 강제 (shot-file.mjs와 동일)
await page.evaluate(() => {
  document.querySelectorAll('[data-reveal],[data-lines]').forEach((el) => el.classList.add('is-in'))
  document.querySelectorAll('[data-count]').forEach((el) => { el.textContent = el.dataset.count })
})
await new Promise((r) => setTimeout(r, 900))
for (const sel of SELS) {
  const el = await page.$(sel)
  if (!el) { console.log('MISSING:', sel); continue }
  const name = sel.replace(/[^a-z0-9-]+/gi, '_').replace(/^_|_$/g, '')
  await el.screenshot({ path: `${OUT}/${name}.png` })
}
console.log('saved. console errors:', errors.length)
if (errors.length) console.log(errors.slice(0, 8).join('\n'))
await browser.close()
