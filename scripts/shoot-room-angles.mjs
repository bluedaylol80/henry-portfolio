/**
 * Room layout inspection — rest view + orbit angles + zoom-out, original resolution.
 *   node scripts/shoot-room-angles.mjs [url] [outDir]
 * Drags past the CLICK-TO-MENU gate first, then captures:
 *   rest.png (first paint), left.png / right.png (orbit), wide.png (zoom out)
 */
import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'

const URL = process.argv[2] ?? 'http://localhost:5199/henry-portfolio/'
const OUT = process.argv[3] ?? 'shots-layout'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'

mkdirSync(OUT, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--force-device-scale-factor=1', '--hide-scrollbars', '--use-angle=default'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 })
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 })
await new Promise((r) => setTimeout(r, 10000))

// enter through the start gate (click center), let tour begin then settle
await page.mouse.click(800, 500)
await new Promise((r) => setTimeout(r, 2500))
await page.screenshot({ path: `${OUT}/rest.png` })

const drag = async (dx) => {
  await page.mouse.move(800, 500)
  await page.mouse.down()
  for (let i = 1; i <= 10; i++) {
    await page.mouse.move(800 + (dx * i) / 10, 500, { steps: 1 })
    await new Promise((r) => setTimeout(r, 30))
  }
  await page.mouse.up()
  await new Promise((r) => setTimeout(r, 1200))
}

await drag(-350)
await page.screenshot({ path: `${OUT}/left.png` })
await drag(700)
await page.screenshot({ path: `${OUT}/right.png` })
await drag(-350) // back to center
for (let i = 0; i < 6; i++) {
  await page.mouse.wheel({ deltaY: 240 })
  await new Promise((r) => setTimeout(r, 150))
}
await new Promise((r) => setTimeout(r, 800))
await page.screenshot({ path: `${OUT}/wide.png` })

console.log(`saved 4 shots → ${OUT}/  console errors: ${errors.length}`)
if (errors.length) console.log('  - ' + [...new Set(errors)].slice(0, 5).join('\n  - '))
await browser.close()
