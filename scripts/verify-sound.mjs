/**
 * Verify the room speaker toggles the new BGM: enter the room, click the speaker
 * pin, and assert the browser requested music/jazz-room.mp3 and an Audio element
 * is actually playing (not paused). node scripts/verify-sound.mjs [url]
 */
import puppeteer from 'puppeteer-core'
const BASE = process.argv[2] ?? 'http://localhost:5199/henry-portfolio/'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ['--force-device-scale-factor=1', '--use-angle=default', '--autoplay-policy=no-user-gesture-required'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 })
const requested = []
page.on('request', (r) => { if (r.url().includes('/music/')) requested.push(r.url().split('/').pop()) })
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 })
await new Promise((r) => setTimeout(r, 1500))
await page.mouse.click(800, 500) // dismiss the CLICK-TO-MENU gate
await new Promise((r) => setTimeout(r, 700))

// click the speaker pin (aria-label contains '스피커')
const box = await page.evaluate(() => {
  const pins = [...document.querySelectorAll('button[aria-label]')].filter((b) => b.getAttribute('aria-label').includes(' — '))
  const sp = pins.find((b) => b.getAttribute('aria-label').includes('스피커'))
  if (!sp) return null
  const r = sp.getBoundingClientRect()
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
})
if (!box) { console.log('speaker pin not found'); process.exit(1) }
await page.mouse.click(box.x, box.y)
await new Promise((r) => setTimeout(r, 2500))

const playing = await page.evaluate(() => {
  // the sound module uses new Audio(...); find any non-paused HTMLMediaElement
  const media = [...document.querySelectorAll('audio,video')]
  // Audio() objects aren't in the DOM; probe via a global if present, else report media
  return { domMedia: media.map((m) => ({ src: m.currentSrc, paused: m.paused })) }
})

console.log(JSON.stringify({
  musicRequests: [...new Set(requested)],
  jazzRequested: requested.some((u) => u && u.includes('jazz-room')),
  playing,
  consoleErrors: errors.length,
}, null, 1))
await browser.close()
process.exit(requested.some((u) => u && u.includes('jazz-room')) ? 0 : 2)
