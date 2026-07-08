/**
 * v10-A room lighting self-check (SPEC §17.5).
 * Screenshots `/` at 1600×1000 after 10s, then measures the central-50%-crop
 * mean luminance (0.2126R+0.7152G+0.0722B) by loading the PNG back into a blank
 * page <img> → canvas drawImage → getImageData on the central box. Gate: [46,92].
 *   node scripts/shoot-room-v10.mjs [url] [outPng]
 */
import puppeteer from 'puppeteer-core'
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname } from 'node:path'

const URL = process.argv[2] ?? 'http://localhost:5197/henry-portfolio/'
const OUT = process.argv[3] ?? 'shots-v10/room-after-3d.png'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'

mkdirSync(dirname(OUT), { recursive: true })

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--force-device-scale-factor=1', '--hide-scrollbars', '--use-angle=default'],
})

const page = await browser.newPage()
await page.setCacheEnabled(false)
await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 })
const errors = []
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text())
})
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 })
await new Promise((r) => setTimeout(r, 10000)) // preloader + room settle
await page.screenshot({ path: OUT })
console.log('saved → ' + OUT)
console.log(
  `console errors: ${errors.length}${errors.length ? '\n  - ' + [...new Set(errors)].slice(0, 10).join('\n  - ') : ''}`,
)

// Measure central-50% mean luminance from the saved PNG (spec-prescribed route).
const pngB64 = readFileSync(OUT).toString('base64')
const blank = await browser.newPage()
await blank.setContent('<body style="margin:0"></body>')
const lum = await blank.evaluate(async (b64) => {
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
  // central 50% box
  const x0 = Math.floor(cw * 0.25)
  const y0 = Math.floor(ch * 0.25)
  const bw = Math.floor(cw * 0.5)
  const bh = Math.floor(ch * 0.5)
  const data = ctx.getImageData(x0, y0, bw, bh).data
  let sum = 0
  let n = 0
  let dark = 0 // fraction of near-black background pixels
  // per-quadrant means to see WHERE the crop is dark
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
    mean: sum / n,
    darkFrac: dark / n,
    quad: q.map((s, i) => +(s / qn[i]).toFixed(1)),
    w: cw,
    h: ch,
    box: [x0, y0, bw, bh],
  }
}, pngB64)
console.log(`darkFrac(<22): ${(lum.darkFrac * 100).toFixed(1)}%  quad[TL,TR,BL,BR]: ${lum.quad.join(', ')}`)

const pass = lum.mean >= 46 && lum.mean <= 92
console.log(`central-50% mean luminance: ${lum.mean.toFixed(2)}  (gate [46,92] → ${pass ? 'PASS' : 'FAIL'})`)
console.log(`image ${lum.w}x${lum.h}, box ${lum.box.join(',')}`)

await browser.close()
