/* WO-29·30·34·42 판정 — 덱 19장 렌더 · 콘솔 · 조작 · 비율 · 금지어 · 파일 크기 · 색상 대비 검산 */
import puppeteer from 'puppeteer-core'
import { mkdirSync, statSync, readFileSync } from 'node:fs'
import { hits as banHits } from '../scripts/pdf-banned.mjs'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const OUT = 'loop/shots34/deck'
const sleep = ms => new Promise(r => setTimeout(r, ms))
mkdirSync(OUT, { recursive: true })
const bad = []
/* 대비 기준 — 본문 4.5:1, 큰 글자(28px 이상 굵게) 3:1.
   서브컬러 #E62B1E는 값이 고정이라 작은 글자로 쓰면 어떤 배경에서도 4.5:1을 못 넘는다.
   그래서 빨강은 큰 글자·도형·선에만 두는 것이 규칙이고, 이 검산이 그 규칙을 지킨다. */
const BIG_PX = 28, BIG_W = 600, MIN_SM = 4.5, MIN_BIG = 3
const contrastRows = []

const measure = page => page.evaluate(() => {
  const px = s => parseFloat(s) || 0
  const parse = s => { const m = (s || '').match(/[\d.]+/g)
    if (!m) return [0, 0, 0, 0]
    return [+m[0], +m[1], +m[2], m.length > 3 ? +m[3] : 1] }
  const over = (f, b) => [0, 1, 2].map(i => f[3] * f[i] + (1 - f[3]) * b[i])
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
  const ratio = (a, b) => { const x = lum(a), y = lum(b)
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
  const hex = c => '#' + c.slice(0, 3).map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase()
  const bgOf = el => {
    const stack = []
    for (let n = el; n; n = n.parentElement) {
      const c = parse(getComputedStyle(n).backgroundColor)
      if (c[3] > 0) stack.push(c)
      if (c[3] >= 1) break
    }
    let base = [255, 255, 255]
    for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base)
    return base
  }
  const live = document.querySelector('.s.on')
  const scope = [live, document.getElementById('cnt')].filter(Boolean)
  const out = []
  for (const root of scope) {
    const els = root.matches('#cnt') ? [root] : [...root.querySelectorAll('*')]
    for (const el of els) {
      const txt = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim()
      if (!txt) continue
      const r = el.getBoundingClientRect()
      if (r.width < 1 || r.height < 1) continue
      const cs = getComputedStyle(el)
      if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue
      const bg = bgOf(el)
      const fg = over(parse(cs.color), bg)
      out.push({ cls: el.className || el.tagName, txt: txt.slice(0, 26),
        size: px(cs.fontSize), weight: +cs.fontWeight || 400,
        fg: hex(fg), bg: hex(bg), ratio: +ratio(fg, bg).toFixed(2) })
    }
  }
  return out
})
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })

async function open(url, w, h) {
  const page = await browser.newPage()
  const msgs = []
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') msgs.push(m.type() + ': ' + m.text()) })
  page.on('pageerror', e => msgs.push('pageerror: ' + e.message))
  page.on('requestfailed', r => msgs.push('requestfailed: ' + r.url().slice(0, 80)))
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 })
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })
  await sleep(1200)
  return { page, msgs }
}

/* --- 1. site/deck 19장 렌더 1920×1080 --- */
{
  const { page, msgs } = await open('http://127.0.0.1:8787/deck/', 1920, 1080)
  const n = await page.$$eval('.s', e => e.length)
  if (n !== 19) bad.push('슬라이드 수 ' + n)
  /* 나이트워커 수치 — 원천 문서 값(09-29 본부장 확정). 옛 값이 돌아오면 실패 */
  const body = await page.evaluate(() => document.body.textContent)
  if (!body.includes('DAU 6.4만') || !body.includes('D+1 52~56%') || /6\.3만|약 50%/.test(body)) bad.push('나이트워커 수치(DAU 6.4만·D+1 52~56%) 불일치')
  for (let i = 1; i <= 19; i++) {
    await page.evaluate(k => { location.hash = '#' + k }, i)
    await sleep(700)
    await page.screenshot({ path: `${OUT}/ko-${String(i).padStart(2, '0')}.png` })
    for (const r of await measure(page)) contrastRows.push({ slide: i, ...r })
  }
  /* 겹침·넘침 실측 — 스테이지 밖으로 나가는 요소 */
  const overflow = await page.evaluate(() => {
    const out = []
    document.querySelectorAll('.s').forEach((s, i) => {
      s.classList.add('on'); s.style.transition = 'none'
      const R = s.getBoundingClientRect()
      s.querySelectorAll('*').forEach(el => {
        const r = el.getBoundingClientRect()
        if (r.width < 2 || r.height < 2) return
        if (r.bottom > R.bottom + 1.5 || r.right > R.right + 1.5 || r.top < R.top - 1.5 || r.left < R.left - 1.5) {
          out.push((i + 1) + ' ' + (el.className || el.tagName) + ' ' +
            [r.left - R.left, r.top - R.top, r.right - R.right, r.bottom - R.bottom].map(v => v.toFixed(0)).join('/'))
        }
      })
      if (!s.classList.contains('on2')) s.classList.remove('on')
    })
    return out
  })
  if (overflow.length) bad.push('넘침 ' + overflow.length + '건: ' + overflow.slice(0, 12).join(' | '))

  /* 조작 — 키보드 / 클릭 / 해시 */
  await page.reload({ waitUntil: 'networkidle2' }); await sleep(900)
  const cur = () => page.evaluate(() => [...document.querySelectorAll('.s')].findIndex(s => s.classList.contains('on')) + 1)
  await page.evaluate(() => { location.hash = '#1' }); await sleep(500)
  await page.keyboard.press('ArrowRight'); await sleep(500)
  const k1 = await cur()
  await page.keyboard.press('ArrowLeft'); await sleep(500)
  const k2 = await cur()
  await page.mouse.click(1600, 540); await sleep(500)
  const c1 = await cur()
  await page.mouse.click(200, 540); await sleep(500)
  const c2 = await cur()
  await page.evaluate(() => { location.hash = '#12' }); await sleep(500)
  const h1 = await cur()
  if (!(k1 === 2 && k2 === 1 && c1 === 2 && c2 === 1 && h1 === 12)) bad.push(`조작 실패 k=${k1},${k2} click=${c1},${c2} hash=${h1}`)
  /* 링크에 포커스가 있을 때 Enter는 장을 넘기지 않는다(D13) — 근거 링크가 있는 사례 1 실행 장(8장) */
  await page.evaluate(() => { location.hash = '#8' }); await sleep(600)
  const focused = await page.evaluate(() => { const a = document.querySelector('.s.on .ev a')
    if (!a) return false; a.focus(); return document.activeElement === a })
  if (!focused) bad.push('8장 근거 링크에 포커스를 못 줬다')
  await page.keyboard.press('Enter'); await sleep(600)
  const e1 = await cur()
  if (e1 !== 8) bad.push('링크 포커스 상태의 Enter가 장을 넘겼다: ' + e1)
  if (msgs.length) bad.push('콘솔 ' + msgs.length + '건: ' + msgs.slice(0, 5).join(' | '))
  await page.close()
}

/* --- 2. 1280×720 · 390×844 표지 — 스테이지가 중앙에 비율 유지 --- */
for (const [w, h, nm] of [[1280, 720, 'fit-1280x720'], [390, 844, 'fit-390x844']]) {
  const { page } = await open('http://127.0.0.1:8787/deck/#1', w, h)
  await page.screenshot({ path: `${OUT}/${nm}.png` })
  const box = await page.evaluate(() => {
    const r = document.getElementById('stage').getBoundingClientRect()
    return { l: r.left, t: r.top, w: r.width, h: r.height, vw: innerWidth, vh: innerHeight }
  })
  const s = Math.min(w / 1920, h / 1080)
  const ok = Math.abs(box.w - 1920 * s) < 2 && Math.abs(box.h - 1080 * s) < 2 &&
    Math.abs((box.l + box.w / 2) - w / 2) < 2 && Math.abs((box.t + box.h / 2) - h / 2) < 2
  if (!ok) bad.push(`${nm} 스테이지 어긋남 ${JSON.stringify(box)} 기대 ${(1920 * s).toFixed(1)}×${(1080 * s).toFixed(1)}`)
  /* 표지 캔버스 — 실해상도가 스테이지 표시 크기와 맞고(DPR 1), 표지에서만 돈다 */
  const m1 = await page.evaluate(() => DeckMotion.state())
  if (m1.id !== 'C3' || !m1.running || m1.w !== Math.round(1920 * s) || m1.h !== Math.round(1080 * s))
    bad.push(`${nm} 표지 모션 상태 ${JSON.stringify(m1)} 기대 캔버스 ${Math.round(1920 * s)}×${Math.round(1080 * s)}`)
  await page.evaluate(() => { location.hash = '#2' }); await sleep(500)
  if ((await page.evaluate(() => DeckMotion.state())).running) bad.push(nm + ' 2장에서도 모션이 돈다')
  await page.close()
}

/* --- 2b. 동작 줄이기 — 1·19장 캔버스 모션이 완성 화면에서 멈춘다(rAF 정지 · 그림 불변 · 글자 전부 보임) --- */
{
  const page = await browser.newPage()
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 })
  await page.goto('http://127.0.0.1:8787/deck/#1', { waitUntil: 'networkidle2', timeout: 60000 })
  await sleep(1500)
  await page.screenshot({ path: `${OUT}/reduced-motion.png` })
  for (const i of [1, 19]) {
    await page.evaluate(k => { location.hash = '#' + k }, i); await sleep(700)
    const snap = () => page.evaluate(() => document.querySelector('.s.on canvas.mo').toDataURL())
    const a = await snap(); await sleep(600); const b = await snap()
    const st = await page.evaluate(() => ({ ...DeckMotion.state(),
      hidden: [...document.querySelectorAll('.s.on .ch,.s.on [data-d],.s.on [data-n]')].filter(el => +getComputedStyle(el).opacity < 1).length }))
    if (st.running || a !== b) bad.push(`동작 줄이기에서 ${i}장 모션이 계속 움직인다`)
    if (st.hidden) bad.push(`동작 줄이기에서 ${i}장 글자 ${st.hidden}개가 덜 보인다`)
    if (a.length < 20000) bad.push(`동작 줄이기에서 ${i}장 캔버스가 비었다`)
  }
  await page.close()
}

/* --- 2c. 사이트의 발표자료 링크 — 헤더·히어로가 보이게 (D11) --- */
for (const [path, nm] of [['/', 'site-ko-hero-links'], ['/en/', 'site-en-hero-links']]) {
  const { page } = await open('http://127.0.0.1:8787' + path, 1440, 960)
  await page.waitForFunction(() => !document.getElementById('loader'), { timeout: 15000 }).catch(() => {})
  await sleep(1500)
  await page.screenshot({ path: `${OUT}/${nm}.png`, clip: { x: 0, y: 0, width: 1440, height: 960 } })
  const links = await page.evaluate(() => [...document.querySelectorAll('a[href="deck/"],a[href="../deck/"]')]
    .map(a => ({ where: a.closest('.hdr') ? 'header' : a.closest('.hero') ? 'hero' : 'footer',
      text: a.textContent.replace(/\s+/g, ' ').trim() })))
  if (!links.some(l => l.where === 'header')) bad.push(nm + ' 헤더에 발표자료 링크가 없다')
  if (links.length < 3) bad.push(nm + ' 발표자료 링크가 ' + links.length + '개뿐이다')
  await page.close()
}

/* --- 3. 단일 파일 — 오프라인(네트워크 차단)에서 같은 렌더 --- */
{
  const page = await browser.newPage()
  const msgs = []
  page.on('console', m => { if (m.type() === 'error') msgs.push(m.text()) })
  page.on('pageerror', e => msgs.push('pageerror: ' + e.message))
  await page.setRequestInterception(true)
  page.on('request', r => (r.url().startsWith('file:') || r.url().startsWith('data:') ? r.continue() : r.abort()))
  await page.setViewport({ width: 1920, height: 1080 })
  await page.goto('file:///D:/Github/henry-portfolio/site/henry-lim-portfolio-deck.html', { waitUntil: 'networkidle2' })
  await sleep(1500)
  for (const i of [1, 5, 6, 7, 8, 13, 15, 19]) {
    await page.evaluate(k => { location.hash = '#' + k }, i)
    await sleep(700)
    await page.screenshot({ path: `${OUT}/single-${String(i).padStart(2, '0')}.png` })
  }
  const fontOk = await page.evaluate(() => document.fonts.check('700 48px SUIT'))
  if (!fontOk) bad.push('단일 파일에서 SUIT 폰트가 안 붙었다')
  if (msgs.length) bad.push('단일 파일 콘솔 ' + msgs.length + '건: ' + msgs.slice(0, 3).join(' | '))
  await page.close()
}
await browser.close()

/* --- 4. 금지어 · 파일 크기 --- */
const strip = h => h.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ')
for (const f of ['site/deck/index.html', 'site/henry-lim-portfolio-deck.html']) {
  const h = banHits(strip(readFileSync(f, 'utf8')))
  if (h.length) bad.push(f + ' 금지어: ' + h.join(','))
}
const mb = statSync('site/henry-lim-portfolio-deck.html').size / 1048576
if (mb > 8) bad.push('단일 파일 ' + mb.toFixed(2) + 'MB')

/* --- 5. 색상 검산표 — 항목·전경·배경·대비값·판정 --- */
const seen = new Map()
for (const r of contrastRows) {
  const key = [r.cls, r.fg, r.bg, r.size, r.weight].join('|')
  const big = r.size >= BIG_PX && r.weight >= BIG_W
  const need = big ? MIN_BIG : MIN_SM
  const row = { ...r, big, need, ok: r.ratio >= need }
  const old = seen.get(key)
  if (!old || row.ratio < old.ratio) seen.set(key, old ? { ...row, slide: old.slide + '·' + row.slide } : row)
}
const rows = [...seen.values()].sort((a, b) => a.ratio - b.ratio)
const fails = rows.filter(r => !r.ok)
const pad = (s, n) => String(s).padEnd(n).slice(0, n)
console.log('\n색상 검산표 (본문 4.5:1 · 큰 글자 28px+굵게 3:1)')
console.log(pad('장', 6) + pad('항목', 22) + pad('예시', 20) + pad('크기', 10) +
  pad('전경', 9) + pad('배경', 9) + pad('대비', 7) + '판정')
for (const r of rows) {
  console.log(pad(r.slide, 6) + pad(r.cls, 22) + pad(r.txt, 20) +
    pad(`${Math.round(r.size)}px/${r.weight}`, 10) + pad(r.fg, 9) + pad(r.bg, 9) +
    pad(r.ratio.toFixed(2), 7) + (r.ok ? 'PASS' : 'FAIL') + (r.big ? ' (큰 글자)' : ''))
}
console.log(`검사 ${contrastRows.length}건 · 조합 ${rows.length}건 · 최저 ${rows[0] ? rows[0].ratio.toFixed(2) : '-'}:1 · 미달 ${fails.length}건`)
if (fails.length) bad.push('대비 미달 ' + fails.length + '건: ' +
  fails.slice(0, 6).map(f => `${f.slide}장 ${f.cls} ${f.ratio}`).join(' | '))

console.log('\n단일 파일 ' + mb.toFixed(2) + 'MB')
console.log(bad.length ? 'FAIL\n - ' + bad.join('\n - ') : 'PASS — 19장 렌더·콘솔 0·조작·비율·금지어 0·크기·대비 OK')
process.exit(bad.length ? 1 : 0)
