/**
 * PDF용 이미지 사본 — site/works/* → site/pdf/img/*.jpg (폭 ≤1600, webp는 jpg로)
 *
 * 인쇄 페이지는 사이트 자산을 그대로 참조하지 않고 이 사본만 쓴다. 원본을 건드리지 않으면서
 * 폭·형식을 PDF 기준으로 맞추기 위해서다. 재인코딩은 크롬 캔버스로 한다(추가 의존성 없음).
 *
 * Usage: node scripts/build-pdf-img.mjs
 */
import puppeteer from 'puppeteer-core'
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const MAXW = 1600
const SRC = ['dalcom.jpg', 'lyn.jpg', 'nightwalker.jpg', 'chaos.jpg', 'fivestars.jpg',
             'nanakage.webp', 'deco.jpg', 'ssjproto.jpg']

mkdirSync('site/pdf/img', { recursive: true })
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.goto('about:blank')

for (const name of SRC) {
  const mime = name.endsWith('.webp') ? 'image/webp' : 'image/jpeg'
  const b64 = readFileSync('site/works/' + name).toString('base64')
  const out = await page.evaluate(async (src, maxw) => {
    const img = new Image()
    img.src = src
    await img.decode()
    const w = Math.min(img.naturalWidth, maxw)
    const h = Math.round(img.naturalHeight * (w / img.naturalWidth))
    const cv = document.createElement('canvas')
    cv.width = w; cv.height = h
    cv.getContext('2d').drawImage(img, 0, 0, w, h)
    return { data: cv.toDataURL('image/jpeg', 0.86).split(',')[1], w, h }
  }, `data:${mime};base64,${b64}`, MAXW)
  const dst = 'site/pdf/img/' + name.replace(/\.\w+$/, '.jpg')
  writeFileSync(dst, Buffer.from(out.data, 'base64'))
  console.log(`${dst} — ${out.w}x${out.h} · ${Math.round(Buffer.from(out.data, 'base64').length / 1024)}KB`)
}
await browser.close()
