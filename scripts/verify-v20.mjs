/**
 * v20 remaining-options verification — production build via `npm run preview`.
 * Checks per route: console errors, horizontal overflow, screenshot.
 * Plus: hero reveal (async motion features), /career GSAP reveal (bridge),
 * /#contact hash scroll, KO vs EN label tracking.
 * Usage: node verify-v20-opts.mjs <baseUrl> <outDir>
 */
import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'

const BASE = process.argv[2] ?? 'http://localhost:4173/henry-portfolio/'
const OUT = process.argv[3] ?? 'shots-verify'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'

mkdirSync(OUT, { recursive: true })
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--force-device-scale-factor=1', '--hide-scrollbars'],
})

const results = []

async function newPage({ width = 1440, height = 900, mobile = false, reduced = false, lang = 'ko' } = {}) {
  const page = await browser.newPage()
  await page.setViewport({ width, height, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 })
  if (reduced) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  const errors = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.evaluateOnNewDocument((l) => localStorage.setItem('henry.lang', l), lang)
  return { page, errors }
}

async function route(name, path, opts = {}, extra) {
  const { page, errors } = await newPage(opts)
  await page.goto(BASE.replace(/\/$/, '') + path, { waitUntil: 'networkidle2', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 5200)) // preloader lift + reveals
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  let extraNote = ''
  if (extra) extraNote = await extra(page)
  await page.screenshot({ path: `${OUT}/${name}.png` })
  results.push({ name, overflow, errors: [...new Set(errors)], extraNote })
  await page.close()
}

// 1. Home KO desktop — hero reveal must reach opacity 1 (async features fired)
await route('home-ko-desktop', '/', {}, async (page) => {
  const heroOpacity = await page.evaluate(() => {
    const h1 = document.querySelector('main h1')
    return h1 ? getComputedStyle(h1.parentElement).opacity : 'no-h1'
  })
  const eyebrowLS = await page.evaluate(() => {
    const e = document.querySelector('.eyebrow')
    return e ? getComputedStyle(e).letterSpacing : 'no-eyebrow'
  })
  // scroll bottom to fire whileInView through all sections
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }))
  await new Promise((r) => setTimeout(r, 1500))
  const contactVisible = await page.evaluate(() => {
    const s = document.querySelector('#contact h2')
    return s ? getComputedStyle(s.parentElement).opacity : 'no-contact'
  })
  return `heroOpacity=${heroOpacity} eyebrowLetterSpacing(KO)=${eyebrowLS} contactRevealOpacity=${contactVisible}`
})

// 2. Home EN desktop — tracking should stay wide (no :lang(ko) match)
await route('home-en-desktop', '/', { lang: 'en' }, async (page) => {
  const eyebrowLS = await page.evaluate(() => {
    const e = document.querySelector('.eyebrow')
    return e ? getComputedStyle(e).letterSpacing : 'no-eyebrow'
  })
  return `eyebrowLetterSpacing(EN)=${eyebrowLS}`
})

// 3. Home mobile KO
await route('home-ko-mobile', '/', { width: 390, height: 844, mobile: true })

// 4. Home reduced motion — everything visible instantly
await route('home-reduced', '/', { reduced: true }, async (page) => {
  const heroOpacity = await page.evaluate(() => {
    const h1 = document.querySelector('main h1')
    return h1 ? getComputedStyle(h1.parentElement).opacity : 'no-h1'
  })
  return `heroOpacity=${heroOpacity}`
})

// 5. /career — GSAP bridge: strata must reveal (autoAlpha → opacity 1)
await route('career-ko', '/career', {}, async (page) => {
  const first = await page.evaluate(() => {
    const el = document.querySelector('.hub-strata')
    return el ? getComputedStyle(el).opacity : 'no-strata'
  })
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }))
  await new Promise((r) => setTimeout(r, 1800))
  const cta = await page.evaluate(() => {
    const el = document.querySelector('.hub-cta')
    return el ? getComputedStyle(el).opacity : 'no-cta'
  })
  return `firstStrataOpacity=${first} ctaOpacityAfterScroll=${cta}`
})

// 6. /career/ai-system
await route('phase-ai-system', '/career/ai-system', {}, async (page) => {
  const eyebrow = await page.evaluate(() => {
    const el = document.querySelector('.ph-eyebrow')
    return el ? getComputedStyle(el).opacity : 'no-eyebrow'
  })
  return `phaseEyebrowOpacity=${eyebrow}`
})

// 7. /brief, /work/ai-os, /room
await route('brief', '/brief', {})
await route('work-ai-os', '/work/ai-os', {})
await route('room', '/room', {})

// 8. Hash scroll: /#contact should land scrolled down
{
  const { page, errors } = await newPage()
  await page.goto(BASE.replace(/\/$/, '') + '/#contact', { waitUntil: 'networkidle2', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 6500))
  const scrollY = await page.evaluate(() => window.scrollY)
  await page.screenshot({ path: `${OUT}/hash-contact.png` })
  results.push({ name: 'hash-contact', overflow: 0, errors: [...new Set(errors)], extraNote: `scrollY=${Math.round(scrollY)}` })
  await page.close()
}

for (const r of results) {
  console.log(
    `[${r.name}] overflow-x=${r.overflow}px errors=${r.errors.length} ${r.extraNote ?? ''}${
      r.errors.length ? '\n  - ' + r.errors.slice(0, 6).join('\n  - ') : ''
    }`,
  )
}
await browser.close()
console.log('done → ' + OUT)
