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
  await new Promise((r) => setTimeout(r, 1200))
  await page.screenshot({ path: `${OUT}/${tag}-top.png` })
  // full page
  await page.screenshot({ path: `${OUT}/${tag}-full.png`, fullPage: true })
  await page.close()
}
console.log('saved. console errors:', errors.length)
if (errors.length) console.log(errors.slice(0, 8).join('\n'))
await browser.close()
