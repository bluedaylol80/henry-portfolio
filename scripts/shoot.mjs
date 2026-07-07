/**
 * Screenshot harness — captures every section at desktop/mobile/reduced-motion,
 * and reports browser console errors. Usage:
 *   node scripts/shoot.mjs [url] [outDir]
 */
import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'

const URL = process.argv[2] ?? 'http://localhost:5173/henry-portfolio/'
const OUT = process.argv[3] ?? 'shots'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'

mkdirSync(OUT, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--force-device-scale-factor=1', '--hide-scrollbars', '--use-angle=default'],
})

const SECTIONS = ['about', 'career', 'work', 'ai', 'skills', 'contact']

async function shoot(name, { width, height, mobile = false, reducedMotion = false }) {
  const page = await browser.newPage()
  await page.setViewport({ width, height, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 })
  if (mobile) {
    await page.setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    )
  }
  if (reducedMotion) {
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  }
  const errors = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(String(e)))

  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 5000)) // preloader + hero intro
  await page.screenshot({ path: `${OUT}/${name}-hero.png` })

  for (const id of SECTIONS) {
    await page.evaluate((sid) => {
      const el = document.getElementById(sid)
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: 'instant' })
    }, id)
    await new Promise((r) => setTimeout(r, 2000))
    await page.screenshot({ path: `${OUT}/${name}-${id}.png` })
  }

  // horizontal overflow check
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  console.log(
    `[${name}] overflow-x: ${overflow}px | console errors: ${errors.length}${
      errors.length ? '\n  - ' + [...new Set(errors)].slice(0, 10).join('\n  - ') : ''
    }`,
  )
  await page.close()
}

await shoot('desktop', { width: 1440, height: 900 })
await shoot('mobile', { width: 390, height: 844, mobile: true })
await shoot('reduced', { width: 1440, height: 900, reducedMotion: true })

await browser.close()
console.log('done → ' + OUT)
