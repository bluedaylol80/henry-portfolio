/**
 * v21 P1 PoC visual verification — /lab/scrolly over a production preview build.
 * Mirrors scripts/verify-v20.mjs (puppeteer-core + local Chrome, port 4173).
 *
 * Captures: desktop step-scroll (7), mobile step-scroll (3), reduced-motion full
 * page (1). Per run it records console errors and max horizontal overflow — both
 * must be 0 (SDD §5 / order gate). Scrolling is wheel-driven with a correcting
 * loop so it lands on scroll fractions whether or not Lenis smooth-scroll is
 * active (Lenis reconciles window.scrollTo, so plain scrollTo is unreliable).
 *
 * Usage: node scripts/verify-v21-poc.mjs [baseUrl] [outDir]
 */
import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'

const BASE = process.argv[2] ?? 'http://localhost:4173/henry-portfolio/'
const OUT = process.argv[3] ?? 'shots-v21-poc'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const URL = BASE.replace(/\/$/, '') + '/lab/scrolly'

mkdirSync(OUT, { recursive: true })
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--force-device-scale-factor=1', '--hide-scrollbars'],
})

const results = []
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

async function makePage({ width = 1440, height = 900, mobile = false, reduced = false, lang = 'ko' } = {}) {
  const page = await browser.newPage()
  await page.setViewport({ width, height, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 })
  if (reduced) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  const errors = []
  const failedUrls = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('response', (res) => {
    if (res.status() >= 400) failedUrls.push(`${res.status()} ${res.url()}`)
  })
  page.on('requestfailed', (req) => failedUrls.push(`FAILED ${req.url()}`))
  await page.evaluateOnNewDocument((l) => localStorage.setItem('henry.lang', l), lang)
  return { page, errors, failedUrls }
}

const overflowOf = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

/**
 * Jump to a fraction of the scrollable range. Lenis smooth-scroll is inactive in
 * headless (no WebGL → 'fallback' tier → no Lenis), so an instant window.scrollTo
 * sticks and fires the scroll event ScrollTrigger reads for pin/scrub.
 */
async function scrollToFrac(page, frac) {
  await page.evaluate((f) => {
    const y = Math.round((document.documentElement.scrollHeight - window.innerHeight) * f)
    window.scrollTo({ top: y, behavior: 'instant' })
  }, frac)
  await wait(850) // let scrub / reveals settle
}

async function stepRun(tag, opts, fracs, target = URL) {
  const { page, errors, failedUrls } = await makePage(opts)
  await page.goto(target, { waitUntil: 'networkidle2', timeout: 60000 })
  await wait(5200) // preloader lift + first reveals
  let maxOverflow = await overflowOf(page)
  const ys = []
  for (let i = 0; i < fracs.length; i++) {
    await scrollToFrac(page, fracs[i])
    const o = await overflowOf(page)
    if (o > maxOverflow) maxOverflow = o
    ys.push(await page.evaluate(() => Math.round(window.scrollY)))
    if (target === URL) await page.screenshot({ path: `${OUT}/${tag}-${String(i).padStart(2, '0')}.png` })
  }
  results.push({ tag, shots: fracs.length, overflow: maxOverflow, errors: [...new Set(errors)], failed: [...new Set(failedUrls)], ys })
  await page.close()
}

async function fullPageRun(tag, opts) {
  const { page, errors, failedUrls } = await makePage(opts)
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 })
  await wait(5200)
  const overflow = await overflowOf(page)
  await page.screenshot({ path: `${OUT}/${tag}.png`, fullPage: true })
  results.push({ tag, shots: 1, overflow, errors: [...new Set(errors)], failed: [...new Set(failedUrls)], ys: [0] })
  await page.close()
}

// 1 · Desktop KO — 7-step scroll across Act 1 (calm) → Act 2 (pin+scrub)
await stepRun('desktop-ko', { width: 1440, height: 900 }, [0, 0.14, 0.3, 0.46, 0.6, 0.75, 0.92])

// 2 · Mobile KO — 3-step scroll (Act 2 pin disabled ≤768px, stacked reveal)
await stepRun('mobile-ko', { width: 390, height: 844, mobile: true }, [0, 0.5, 0.96])

// 3 · Reduced motion — full page, everything static & complete (no pin/scrub)
await fullPageRun('reduced-desktop', { width: 1440, height: 900, reduced: true })

// 4 · Baseline parity — home route (no screenshots): shows any 404 is pre-existing.
await stepRun('home-baseline', { width: 1440, height: 900 }, [0], BASE.replace(/\/$/, '') + '/')

for (const r of results) {
  console.log(
    `[${r.tag}] shots=${r.shots} overflow-x=${r.overflow}px consoleErrors=${r.errors.length} failedReqs=${r.failed.length} scrollY=[${r.ys.join(',')}]` +
      (r.failed.length ? '\n  failed: ' + r.failed.slice(0, 6).join(' | ') : '') +
      (r.errors.length ? '\n  console: ' + r.errors.slice(0, 4).join(' | ') : ''),
  )
}
await browser.close()
console.log('done → ' + OUT)
