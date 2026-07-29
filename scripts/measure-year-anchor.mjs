/**
 * Measures the v21 Act 1 year readout against the 40%-of-scrollbar rule
 * (본부장 2026-07-30): at ~40% page scroll the readout must BOTH show the end
 * year AND still be on screen. Prints the year + visibility at a range of
 * scroll fractions. Usage: node scripts/measure-year-anchor.mjs [baseUrl]
 */
import puppeteer from 'puppeteer-core'

const BASE = process.argv[2] ?? 'http://localhost:4173/henry-portfolio/'
const URL = BASE.replace(/\/$/, '') + '/lab/scrolly'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--hide-scrollbars'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.evaluateOnNewDocument(() => localStorage.setItem('henry.lang', 'ko'))
await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 })
await wait(5200)

const probe = () =>
  page.evaluate(() => {
    const el = document.querySelector('.u-fig.text-7xl, .u-fig.md\\:text-8xl') ?? document.querySelector('.u-fig')
    const r = el?.getBoundingClientRect()
    const max = document.documentElement.scrollHeight - window.innerHeight
    return {
      frac: +(window.scrollY / max).toFixed(3),
      y: Math.round(window.scrollY),
      max: Math.round(max),
      year: el?.textContent?.trim() ?? '(none)',
      visible: !!r && r.bottom > 0 && r.top < window.innerHeight,
      top: r ? Math.round(r.top) : null,
    }
  })

for (const f of [0, 0.2, 0.3, 0.35, 0.4, 0.45, 0.5]) {
  await page.evaluate((frac) => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo({ top: Math.round(max * frac), behavior: 'instant' })
  }, f)
  await wait(1200) // scrub 0.6 catch-up
  const p = await probe()
  console.log(
    `frac=${String(f).padEnd(5)} scrollY=${String(p.y).padStart(5)}/${p.max}  year=${p.year}  visible=${p.visible}  top=${p.top}px`,
  )
}
await browser.close()
