/**
 * 포트폴리오 PDF 빌더 — site/pdf/ 인쇄 페이지 → site/henry-lim-portfolio-{ko,en}.pdf
 *
 * v21 React /brief 전용 빌더를 폐기하고 다시 썼다(WO-18). 인쇄 페이지는 scripts/build-print.mjs가
 * 사이트 DOM에서 조립하므로 문구는 한 벌뿐이다. 여기서는 그 페이지를 A4로 굽기만 한다.
 *
 * 텍스트 원천 검사: 인쇄 페이지의 대표 사례 6항목이 사이트 상세창 데이터와 같은지 확인하고,
 * 다르면 굽지 않고 실패한다(문구가 두 벌로 갈라지는 것을 여기서 막는다).
 *
 * 사전 준비: python -m http.server 8787 --bind 127.0.0.1 --directory site
 * Usage: node scripts/build-pdf.mjs
 */
import puppeteer from 'puppeteer-core'
import { statSync } from 'node:fs'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const BASE = 'http://127.0.0.1:8787'
const MAX_BYTES = 3 * 1024 * 1024
const OUT = { ko: 'site/henry-lim-portfolio-ko.pdf', en: 'site/henry-lim-portfolio-en.pdf' }
const fail = m => { console.error('빌드 실패: ' + m); process.exit(1) }
const sleep = ms => new Promise(r => setTimeout(r, ms))
const norm = s => s.replace(/\s+/g, ' ').trim()

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })

/* 1. 원천 검사 — 사이트 상세창 6항목 vs 인쇄 페이지 표 */
for (const lang of ['ko', 'en']) {
  const site = await browser.newPage()
  await site.goto(lang === 'ko' ? BASE + '/' : BASE + '/en/', { waitUntil: 'networkidle2', timeout: 60000 })
  await site.waitForFunction(() => !document.getElementById('loader'), { timeout: 15000 }).catch(() => {})
  await sleep(1800)
  const fromSite = []
  for (const k of ['case1', 'case2', 'case3']) {
    await site.evaluate(k => document.querySelector(`.card-open[data-work="${k}"]`).click(), k)
    await sleep(1400)
    fromSite.push(await site.evaluate(() =>
      [...document.querySelectorAll('#wdlgR > div')].map(d =>
        d.querySelector('dt').textContent.replace(/\s+/g, ' ').trim() + '\u0001' +
        d.querySelector('dd').textContent.replace(/\s+/g, ' ').trim())))
    await site.keyboard.press('Escape'); await sleep(400)
  }
  await site.close()
  const print = await browser.newPage()
  await print.goto(lang === 'ko' ? BASE + '/pdf/' : BASE + '/pdf/en/', { waitUntil: 'networkidle2', timeout: 60000 })
  await sleep(600)
  const fromPrint = await print.evaluate(() =>
    [...document.querySelectorAll('section')].filter(s => s.querySelector('.case-h')).map(s =>
      [...s.querySelectorAll('table:first-of-type tr')].map(tr =>
        tr.querySelector('th').textContent.replace(/\s+/g, ' ').trim() + '\u0001' +
        tr.querySelector('td').textContent.replace(/\s+/g, ' ').trim())))
  await print.close()
  if (fromPrint.length !== 3) fail(lang + ' 인쇄 페이지 사례가 3장이 아니다: ' + fromPrint.length)
  for (let i = 0; i < 3; i++) {
    const a = fromSite[i].map(norm).join('\u0002'), b = fromPrint[i].map(norm).join('\u0002')
    if (a !== b) fail(lang + ' 사례 ' + (i + 1) + ' 텍스트가 사이트와 다르다\n  사이트: ' + a.slice(0, 160) + '\n  인쇄  : ' + b.slice(0, 160))
  }
  console.log('원천 일치 ' + lang + ': 사례 3건 × 6항목')
}

/* 2. PDF 출력 */
for (const lang of ['ko', 'en']) {
  const page = await browser.newPage()
  await page.goto(lang === 'ko' ? BASE + '/pdf/' : BASE + '/pdf/en/', { waitUntil: 'networkidle2', timeout: 60000 })
  await page.evaluate(() => document.fonts.ready)   // 웹폰트가 뜨기 전에 구우면 자간이 흐트러진다
  const font = await page.evaluate(() => document.fonts.check('1rem Pretendard'))
  if (!font) fail(lang + ' Pretendard가 로드되지 않았다 — 폴백 폰트로 구우면 줄바꿈이 달라진다')
  await page.evaluate(() => Promise.all([...document.images].filter(i => !i.complete)
    .map(i => new Promise(r => { i.onload = i.onerror = r }))))
  await sleep(900)
  /* 쪽 번호는 puppeteer의 머리말/꼬리말로 넣는다 — Chrome은 @page의 여백 상자를 지원하지 않는다.
     그래서 preferCSSPageSize 대신 여기서 A4 여백을 준다(꼬리말 자리 18mm). */
  await page.pdf({ path: OUT[lang], format: 'A4', printBackground: true,
    displayHeaderFooter: true, headerTemplate: '<span></span>',
    footerTemplate: '<div style="width:100%;text-align:center;font-size:8pt;color:#8d8d8d;font-family:sans-serif">'
      + '<span class="pageNumber"></span> / <span class="totalPages"></span></div>',
    margin: { top: '16mm', right: '16mm', bottom: '18mm', left: '16mm' } })
  const bytes = statSync(OUT[lang]).size
  if (bytes > MAX_BYTES) fail(OUT[lang] + ' 크기 초과: ' + Math.round(bytes / 1024) + 'KB > 3MB')
  console.log('생성: ' + OUT[lang] + ' — ' + Math.round(bytes / 1024) + 'KB')
  await page.close()
}
await browser.close()
