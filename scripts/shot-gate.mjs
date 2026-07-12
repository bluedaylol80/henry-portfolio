import puppeteer from 'puppeteer-core'
const BASE = process.argv[2] ?? 'http://localhost:5199/henry-portfolio/'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--force-device-scale-factor=1', '--use-angle=default'] })
const page = await browser.newPage()
await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 })
// fresh session — do NOT click; screenshot the initial (pre-entry) screen
await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 })
await new Promise(r => setTimeout(r, 3500))
await page.screenshot({ path: 'shots-gate/initial.png' })
// report whether the RoomStart overlay is in the DOM + its visible text
const info = await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')]
  const gate = btns.find(b => (b.textContent || '').includes('CLICK') || (b.getAttribute('aria-label') || '').includes('방으로 들어가'))
  return {
    gatePresent: !!gate,
    gateText: gate ? gate.textContent.trim().replace(/\s+/g, ' ') : null,
    sessionEntered: (() => { try { return sessionStorage.getItem('henry.roomEntered') } catch { return 'n/a' } })(),
  }
})
console.log(JSON.stringify(info, null, 1))
await browser.close()
