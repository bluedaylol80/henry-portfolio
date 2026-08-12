// 리퀴드 리빌 검증: 포인터 궤적 시뮬 후 히어로 캡처 (정적 스샷엔 포인터 효과가 안 찍힘)
import puppeteer from 'puppeteer-core'
const FILE = process.argv[2]
const OUT = process.argv[3] ?? 'shots-reveal'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
import { mkdirSync } from 'node:fs'
mkdirSync(OUT, { recursive: true })
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--force-device-scale-factor=1'] })
const errors = []
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 })
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))
await page.goto('file:///' + FILE.replace(/\\/g, '/'), { waitUntil: 'networkidle2', timeout: 60000 })
await page.waitForFunction(() => !document.getElementById('loader'), { timeout: 15000 })
// S자 궤적: 좌하단 → 헤드라인 관통 → 카드 → 우하단
const path = [[120, 700], [260, 520], [420, 330], [640, 260], [860, 330], [1040, 480], [1150, 640]]
await page.mouse.move(path[0][0], path[0][1])
for (let i = 1; i < path.length; i++) await page.mouse.move(path[i][0], path[i][1], { steps: 18 })
await page.screenshot({ path: `${OUT}/reveal-trail.png` })
await new Promise((r) => setTimeout(r, 2600)) // idle 120프레임 초과 → 하드클리어 확인
await page.screenshot({ path: `${OUT}/reveal-clear.png` })
console.log('saved. console errors:', errors.length)
if (errors.length) console.log(errors.slice(0, 8).join('\n'))
await browser.close()
