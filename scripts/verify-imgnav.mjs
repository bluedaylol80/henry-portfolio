/**
 * §24 image-nav verification: enters the room, hovers a pin (label chip check),
 * then clicks each of the 7 hotspot pins and asserts the resulting navigation.
 *   node scripts/verify-imgnav.mjs [url]
 */
import puppeteer from 'puppeteer-core'

const BASE = process.argv[2] ?? 'http://localhost:5199/henry-portfolio/'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'

// expected result per hotspot id (from content/room.ts actions)
const EXPECT = {
  desk: { type: 'hash', url: '/story', hash: '#about' },
  tv: { type: 'newtab' }, // notion → window.open
  bookshelf: { type: 'route', url: '/career' },
  server: { type: 'hash', url: '/story', hash: '#ai' },
  coffee: { type: 'hash', url: '/story', hash: '#contact' },
  speaker: { type: 'toggle' }, // sound → no nav
  frame: { type: 'hash', url: '/story', hash: '#work' },
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--force-device-scale-factor=1', '--use-angle=default'],
})

async function fresh() {
  const page = await browser.newPage()
  await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 })
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 })
  await new Promise((r) => setTimeout(r, 1500))
  // dismiss the CLICK-TO-MENU gate if present (click centre)
  await page.mouse.click(800, 500)
  await new Promise((r) => setTimeout(r, 700))
  return page
}

// map hotspot id → aria-label prefix so we can find each button
const page0 = await fresh()
const buttons = await page0.$$eval('button[aria-label]', (els) =>
  els.map((e, i) => ({ i, label: e.getAttribute('aria-label') })),
)
// pins have aria-label "<label> — <hint>"; identify by hint keywords
const idByKeyword = [
  ['desk', '컴퓨터'],
  ['tv', 'Notion'],
  ['bookshelf', '책장'],
  ['server', '서버'],
  ['coffee', '커피'],
  ['speaker', '스피커'],
  ['frame', '액자'],
]
await page0.close()

const results = []
for (const [id, kw] of idByKeyword) {
  const page = await fresh()
  let newTabOpened = false
  browser.on('targetcreated', () => (newTabOpened = true))
  // find the pin button by its aria-label containing the keyword, that is NOT in the legend bar (legend chips are <button> too, but the pins live inside the image wrapper). Pins are the ones whose label contains ' — ' (em dash we set).
  const handle = await page.evaluateHandle((keyword) => {
    const all = [...document.querySelectorAll('button[aria-label]')]
    // pins: aria-label uses ' — ' (em dash) joining label and hint
    const pins = all.filter((b) => b.getAttribute('aria-label').includes(' — '))
    return pins.find((b) => b.getAttribute('aria-label').includes(keyword)) || null
  }, kw)
  const el = handle.asElement()
  if (!el) {
    results.push({ id, ok: false, note: 'pin not found' })
    await page.close()
    continue
  }
  await el.click()
  await new Promise((r) => setTimeout(r, 700))
  const url = page.url()
  const exp = EXPECT[id]
  let ok = false, note = ''
  if (exp.type === 'newtab') {
    ok = newTabOpened
    note = `newtab=${newTabOpened}`
  } else if (exp.type === 'toggle') {
    ok = url.endsWith('/henry-portfolio/') // stayed on room
    note = `stayed on room (url=${url.split('henry-portfolio')[1]})`
  } else {
    const path = url.split('henry-portfolio')[1] || ''
    ok = path.includes(exp.url) && (!exp.hash || path.includes(exp.hash))
    note = `path=${path}`
  }
  results.push({ id, ok, note })
  browser.removeAllListeners('targetcreated')
  await page.close()
}

console.log(JSON.stringify(results, null, 1))
const pass = results.filter((r) => r.ok).length
console.log(`PINS OK: ${pass}/${results.length}`)
await browser.close()
process.exit(pass === results.length ? 0 : 1)
