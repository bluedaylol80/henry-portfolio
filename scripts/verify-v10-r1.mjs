/**
 * v10 verification harness (independent gate agent run — r1).
 * Steps 3, 4, 6 of the verify plan: room luma gate + screenshots, DOM checks
 * on /story, /brief, /career (desktop + mobile), noise-overlay route check,
 * fresh-incognito tour-alive check.
 *   node scripts/verify-v10-r1.mjs
 */
import puppeteer from 'puppeteer-core'
import { mkdirSync, readFileSync } from 'node:fs'

const BASE = 'http://localhost:5199/henry-portfolio/'
const OUT = 'shots-v10'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'

mkdirSync(OUT, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--force-device-scale-factor=1', '--hide-scrollbars', '--use-angle=default'],
})

const report = {}

function watchErrors(page, bucket) {
  page.on('console', (m) => {
    if (m.type() === 'error') bucket.push(m.text())
  })
  page.on('pageerror', (e) => bucket.push(String(e)))
}

/* ── 1. ROOM: screenshot + luma + noise-overlay ABSENT ─────────────────── */
{
  const page = await browser.newPage()
  await page.setCacheEnabled(false)
  await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 })
  const errors = []
  watchErrors(page, errors)
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 10000))
  await page.screenshot({ path: `${OUT}/verify-room-r1.png` })
  const roomDom = await page.evaluate(() => ({
    noiseOverlay: !!document.querySelector('.noise-overlay'),
    canvas: !!document.querySelector('canvas'),
    tourFlag: sessionStorage.getItem('henry.roomTour'),
  }))
  report.room = { errors: [...new Set(errors)], ...roomDom }
  await page.close()

  // luma from the saved PNG via blank page <img> + canvas
  const pngB64 = readFileSync(`${OUT}/verify-room-r1.png`).toString('base64')
  const blank = await browser.newPage()
  await blank.setContent('<body style="margin:0"></body>')
  report.luma = await blank.evaluate(async (b64) => {
    const img = new Image()
    img.src = 'data:image/png;base64,' + b64
    await img.decode()
    const cw = img.naturalWidth
    const ch = img.naturalHeight
    const cv = document.createElement('canvas')
    cv.width = cw
    cv.height = ch
    const ctx = cv.getContext('2d')
    ctx.drawImage(img, 0, 0)
    const x0 = Math.floor(cw * 0.25)
    const y0 = Math.floor(ch * 0.25)
    const bw = Math.floor(cw * 0.5)
    const bh = Math.floor(ch * 0.5)
    const data = ctx.getImageData(x0, y0, bw, bh).data
    let sum = 0
    let n = 0
    let dark = 0
    const q = [0, 0, 0, 0]
    const qn = [0, 0, 0, 0]
    for (let i = 0; i < data.length; i += 4) {
      const px = (i / 4) % bw
      const py = Math.floor(i / 4 / bw)
      const L = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
      sum += L
      n++
      if (L < 22) dark++
      const qi = (py < bh / 2 ? 0 : 2) + (px < bw / 2 ? 0 : 1)
      q[qi] += L
      qn[qi]++
    }
    return {
      mean: +(sum / n).toFixed(2),
      darkFrac: +((dark / n) * 100).toFixed(1),
      quad: q.map((s, i) => +(s / qn[i]).toFixed(1)),
      w: cw,
      h: ch,
    }
  }, pngB64)
  await blank.close()
}

/* ── 2. TOUR ALIVE: fresh incognito → [data-tour-label] by ~2s ─────────── */
{
  const ctx = await browser.createBrowserContext()
  const page = await ctx.newPage()
  await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 })
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 })
  const t0 = Date.now()
  let appearedAt = -1
  for (;;) {
    const present = await page.evaluate(() => !!document.querySelector('[data-tour-label]'))
    if (present) {
      appearedAt = Date.now() - t0
      break
    }
    if (Date.now() - t0 > 8000) break
    await new Promise((r) => setTimeout(r, 100))
  }
  const labelText = appearedAt >= 0
    ? await page.evaluate(() => document.querySelector('[data-tour-label]')?.textContent ?? '')
    : ''
  report.tour = { appearedMsAfterDomLoaded: appearedAt, labelText }
  await ctx.close()
}

/* ── 3. /story desktop: hero + #work screenshots + DOM checks ──────────── */
{
  const page = await browser.newPage()
  await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 })
  const errors = []
  watchErrors(page, errors)
  await page.goto(BASE + 'story', { waitUntil: 'networkidle2', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 5000))
  await page.screenshot({ path: `${OUT}/verify-story-hero-r1.png` })
  await page.evaluate(() => {
    const el = document.getElementById('work')
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: 'instant' })
  })
  await new Promise((r) => setTimeout(r, 2500))
  await page.screenshot({ path: `${OUT}/verify-story-work-r1.png` })

  report.storyDesktop = await page.evaluate(() => {
    const work = document.getElementById('work')
    const grid = work?.querySelector('.grid')
    const cards = grid ? [...grid.children] : []
    const first = cards[0]
    const firstRect = first?.getBoundingClientRect()
    const secondRect = cards[1]?.getBoundingClientRect()
    const cta = document.querySelector('#contact .btn-island')
    const ctaIcon = cta?.querySelector('.btn-island-icon')
    const ctaIconRect = ctaIcon?.getBoundingClientRect()
    const hero = document.getElementById('about')
    return {
      noiseOverlay: !!document.querySelector('.noise-overlay'),
      gridTemplateColumns: grid ? getComputedStyle(grid).gridTemplateColumns : null,
      cardCount: cards.length,
      cardsAreBezel: cards.every((c) => c.classList.contains('bezel')),
      cardsHaveCore: cards.every((c) => !!c.querySelector('.bezel-core')),
      firstCardClasses: first ? first.className : null,
      firstCardSpan2: first ? getComputedStyle(first).gridColumn : null,
      firstCardWidth: firstRect ? Math.round(firstRect.width) : null,
      secondCardWidth: secondRect ? Math.round(secondRect.width) : null,
      contactCta: {
        present: !!cta,
        borderRadius: cta ? getComputedStyle(cta).borderRadius : null,
        icon: !!ctaIcon,
        iconRadius: ctaIcon ? getComputedStyle(ctaIcon).borderRadius : null,
        iconSize: ctaIconRect ? [Math.round(ctaIconRect.width), Math.round(ctaIconRect.height)] : null,
      },
      heroScrim: hero
        ? [...hero.querySelectorAll('*')].some((el) => {
            const cs = getComputedStyle(el)
            return (cs.backdropFilter && cs.backdropFilter !== 'none') || /gradient/.test(cs.backgroundImage)
          })
        : null,
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }
  })
  report.storyDesktop.errors = [...new Set(errors)]
  await page.close()
}

/* ── 4. /brief desktop ─────────────────────────────────────────────────── */
{
  const page = await browser.newPage()
  await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 })
  const errors = []
  watchErrors(page, errors)
  await page.goto(BASE + 'brief', { waitUntil: 'networkidle2', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 4000))
  await page.screenshot({ path: `${OUT}/verify-brief-r1.png` })
  report.brief = await page.evaluate(() => {
    const bezels = [...document.querySelectorAll('.bezel')]
    const statChips = bezels.filter((b) => b.tagName === 'LI')
    const identity = bezels.find((b) => b.tagName === 'SECTION')
    const cta = document.querySelector('.btn-island')
    return {
      noiseOverlay: !!document.querySelector('.noise-overlay'),
      bezelCount: bezels.length,
      bezelsWithCore: bezels.filter((b) => b.querySelector('.bezel-core')).length,
      statChipBezels: statChips.length,
      identityBezel: !!identity,
      ctaIsland: !!cta,
      ctaIcon: !!cta?.querySelector('.btn-island-icon'),
      ctaText: cta?.textContent?.trim() ?? null,
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }
  })
  report.brief.errors = [...new Set(errors)]
  await page.close()
}

/* ── 5. /career desktop ────────────────────────────────────────────────── */
{
  const page = await browser.newPage()
  await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 })
  const errors = []
  watchErrors(page, errors)
  await page.goto(BASE + 'career', { waitUntil: 'networkidle2', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 4000))
  await page.screenshot({ path: `${OUT}/verify-career-r1.png` })
  report.career = await page.evaluate(() => {
    const mission = document.querySelector('.hub-mission')
    const strata = [...document.querySelectorAll('.hub-strata')]
    return {
      noiseOverlay: !!document.querySelector('.noise-overlay'),
      missionBezel: !!mission?.classList.contains('bezel'),
      missionCore: !!mission?.querySelector('.bezel-core'),
      strataCount: strata.length,
      strataBezel: strata.every((s) => s.classList.contains('bezel') && s.querySelector('.bezel-core')),
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }
  })
  report.career.errors = [...new Set(errors)]
  await page.close()
}

/* ── 6. /story mobile 390x844 → #work ──────────────────────────────────── */
{
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 })
  await page.setUserAgent(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  )
  const errors = []
  watchErrors(page, errors)
  await page.goto(BASE + 'story', { waitUntil: 'networkidle2', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 5000))
  await page.evaluate(() => {
    const el = document.getElementById('work')
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: 'instant' })
  })
  await new Promise((r) => setTimeout(r, 2500))
  await page.screenshot({ path: `${OUT}/verify-story-work-mobile-r1.png` })
  report.storyMobile = await page.evaluate(() => {
    const work = document.getElementById('work')
    const grid = work?.querySelector('.grid')
    const cards = grid ? [...grid.children] : []
    const widths = cards.map((c) => Math.round(c.getBoundingClientRect().width))
    const lefts = cards.map((c) => Math.round(c.getBoundingClientRect().left))
    return {
      gridTemplateColumns: grid ? getComputedStyle(grid).gridTemplateColumns : null,
      cardWidths: widths,
      cardLefts: lefts,
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }
  })
  report.storyMobile.errors = [...new Set(errors)]
  await page.close()
}

await browser.close()
console.log(JSON.stringify(report, null, 2))
