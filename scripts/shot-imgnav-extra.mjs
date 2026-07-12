import puppeteer from 'puppeteer-core'
const BASE = process.argv[2] ?? 'http://localhost:5199/henry-portfolio/'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const OUT = 'shots-imgnav2'
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--force-device-scale-factor=1', '--use-angle=default'] })

const page = await browser.newPage()
await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 })
await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 })
await new Promise(r => setTimeout(r, 1500))
await page.mouse.click(800, 500)
await new Promise(r => setTimeout(r, 700))

// find the TV pin (aria-label with ' — ' and 'Notion') and hover its real centre
const box = await page.evaluate(() => {
  const pins = [...document.querySelectorAll('button[aria-label]')].filter(b => b.getAttribute('aria-label').includes(' — '))
  const tv = pins.find(b => b.getAttribute('aria-label').includes('Notion'))
  if (!tv) return null
  const r = tv.getBoundingClientRect()
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
})
if (box) {
  await page.mouse.move(box.x, box.y)
  await new Promise(r => setTimeout(r, 500))
  const op = await page.evaluate(() => {
    const pins = [...document.querySelectorAll('button[aria-label]')].filter(b => b.getAttribute('aria-label').includes(' — '))
    const tv = pins.find(b => b.getAttribute('aria-label').includes('Notion'))
    const chip = tv.querySelector('span:last-child')
    return getComputedStyle(chip).opacity
  })
  console.log('TV pin centre:', box, 'label chip opacity on hover:', op)
}
await page.screenshot({ path: `${OUT}/hover-tv.png` })
await page.close()

const m = await browser.newPage()
await m.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 })
await m.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 })
await new Promise(r => setTimeout(r, 1500))
await m.mouse.click(195, 400)
await new Promise(r => setTimeout(r, 700))
await m.screenshot({ path: `${OUT}/mobile.png` })
await m.close()

console.log('saved hover-tv.png + mobile.png')
await browser.close()
