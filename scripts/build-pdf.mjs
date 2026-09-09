/**
 * 포트폴리오 PDF 빌더 — site/pdf/ 인쇄 페이지 → site/henry-lim-portfolio-{ko,en}.pdf
 *
 * v21 React /brief 전용 빌더를 폐기하고 다시 썼다(WO-18). 인쇄 페이지는 scripts/build-print.mjs가
 * 사이트 DOM에서 조립하므로 문구는 한 벌뿐이다. 여기서는 그 페이지를 16:9 가로 슬라이드로 굽기만 한다(WO-24).
 *
 * 텍스트 원천 검사: 인쇄 페이지의 대표 사례 표가 사이트 상세창 데이터와 같은지 확인하고,
 * 다르면 굽지 않고 실패한다(문구가 두 벌로 갈라지는 것을 여기서 막는다).
 *
 * 사전 준비: python -m http.server 8787 --bind 127.0.0.1 --directory site
 * Usage: node scripts/build-pdf.mjs
 */
import puppeteer from 'puppeteer-core'
import { statSync } from 'node:fs'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const BASE = 'http://127.0.0.1:8787'
const MAX_BYTES = 8 * 1024 * 1024
const OUT = { ko: 'site/henry-lim-portfolio-ko.pdf', en: 'site/henry-lim-portfolio-en.pdf' }
const fail = m => { console.error('빌드 실패: ' + m); process.exit(1) }
const sleep = ms => new Promise(r => setTimeout(r, ms))
const norm = s => s.replace(/\s+/g, ' ').trim()

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })

/* 1. 원천 검사 — 사이트 상세창 행 vs 인쇄 페이지 표 (사례마다 행 수가 다르다: case1=8, case2·3=6) */
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
  /* 사례 하나가 슬라이드 두 장(개요·실행)으로 나뉜다 — data-case로 묶어 상세 행을 원래 순서로 잇는다 */
  const fromPrint = await print.evaluate(() => {
    const g = new Map()
    for (const s of document.querySelectorAll('section[data-case]')) {
      if (!g.has(s.dataset.case)) g.set(s.dataset.case, [])
      g.get(s.dataset.case).push(...[...s.querySelectorAll('.kv tr')].map(tr =>
        tr.querySelector('th').textContent.replace(/\s+/g, ' ').trim() + '\u0001' +
        tr.querySelector('td').textContent.replace(/\s+/g, ' ').trim()))
    }
    return [...g.values()]
  })
  await print.close()
  if (fromPrint.length !== 3) fail(lang + ' 인쇄 페이지 사례가 3장이 아니다: ' + fromPrint.length)
  for (let i = 0; i < 3; i++) {
    const a = fromSite[i].map(norm).join('\u0002'), b = fromPrint[i].map(norm).join('\u0002')
    if (a !== b) fail(lang + ' 사례 ' + (i + 1) + ' 텍스트가 사이트와 다르다\n  사이트: ' + a.slice(0, 160) + '\n  인쇄  : ' + b.slice(0, 160))
  }
  console.log('원천 일치 ' + lang + ': 사례 3건 — ' + fromSite.map(r => r.length + '항목').join(' · '))
}

/* 2. PDF 출력 */
for (const lang of ['ko', 'en']) {
  const page = await browser.newPage()
  await page.goto(lang === 'ko' ? BASE + '/pdf/' : BASE + '/pdf/en/', { waitUntil: 'networkidle2', timeout: 60000 })
  await page.evaluate(() => document.fonts.ready)   // 웹폰트가 뜨기 전에 구우면 자간이 흐트러진다
  /* fonts.check는 폴백으로도 그릴 수 있으면 true를 준다 — 등록된 이름을 직접 확인한다.
     이름이 정확히 'Pretendard'여야 한다. 'Pretendard Variable'을 부르면 Chrome이 가변 글꼴을
     Type3 윤곽선으로 구워 PDF에 글꼴이 내장되지 않고 파일이 두 배가 된다(Codex R7 PDF04). */
  const fam = await page.evaluate(() => [...document.fonts].map(f => f.family.replace(/^['"]|['"]$/g, '')))
  if (!fam.includes('Pretendard')) fail(lang + " 정적 Pretendard가 로드되지 않았다: " + fam.join(','))
  if (fam.some(f => /Variable/.test(f))) fail(lang + ' 가변 Pretendard가 섞였다(Type3로 구워진다): ' + fam.join(','))
  const used = await page.evaluate(() => getComputedStyle(document.body).fontFamily)
  if (used.split(',')[0].replace(/^['"]|['"]$/g, '') !== 'Pretendard') fail(lang + ' 본문 글꼴이 Pretendard가 아니다: ' + used)
  await page.evaluate(() => Promise.all([...document.images].filter(i => !i.complete)
    .map(i => new Promise(r => { i.onload = i.onerror = r }))))
  await sleep(900)
  /* 슬라이드가 넘치면 굽지 않는다 — 16:9 판형은 쪽이 자동으로 늘지 않아 글자가 잘려 나간다 */
  const ovf = await page.evaluate(() => [...document.querySelectorAll('.s')].flatMap((s, i) =>
    [s, s.querySelector('.bd')].filter(Boolean).map(el => ({ n: i + 1, over: el.scrollHeight - el.clientHeight })))
    .filter(x => x.over > 2))
  if (ovf.length) fail(lang + ' 슬라이드가 넘친다: ' + ovf.map(x => `${x.n}번 +${x.over}px`).join(' · '))
  /* 쪽 번호는 인쇄 CSS의 카운터가 찍는다 — 판형은 @page가 정본이라 여백 없이 그대로 굽는다 */
  await page.pdf({ path: OUT[lang], printBackground: true, preferCSSPageSize: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 } })
  const bytes = statSync(OUT[lang]).size
  if (bytes > MAX_BYTES) fail(OUT[lang] + ' 크기 초과: ' + Math.round(bytes / 1024) + 'KB > 8MB')
  console.log('생성: ' + OUT[lang] + ' — ' + Math.round(bytes / 1024) + 'KB')
  await page.close()
}
await browser.close()
