/**
 * PDF용 이미지 사본 — site/pdf/img/*.jpg
 *
 * 두 갈래다.
 *  ① 사진형 키 비주얼 6장: site/works/* → 폭 ≤1600으로 재인코딩한 사본.
 *  ③ 슈퍼피플 상세창 가공본: site/works/superpeople/*.jpg 복사(WO-34).
 *  ② 프로토타입 2장(deco·ssjproto): site/works의 옛 캡처를 복사하지 않고,
 *     체험판 페이지를 실브라우저로 직접 열어 그 자리에서 캡처한다.
 *     옛 캡처에는 개발용 표시(DEV·규칙 탭·미저장 경고)가 박혀 있었고, 그걸 복사하는 한
 *     빌드를 돌릴 때마다 되살아났다(Codex R12 N2). 화면을 원천으로 삼으면 재발이 없고,
 *     deco는 로비가 아니라 '꾸미기' 화면을 잡으므로 14쪽 안내와 그림이 맞는다(R12 N3).
 *
 * 사전 준비: python -m http.server 8787 --bind 127.0.0.1 --directory site
 * Usage: node scripts/build-pdf-img.mjs
 */
import puppeteer from 'puppeteer-core'
import { writeFileSync, mkdirSync, readFileSync, readdirSync, copyFileSync } from 'node:fs'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const BASE = 'http://127.0.0.1:8787'
const MAXW = 1600
const SRC = ['dalcom.jpg', 'lyn.jpg', 'nightwalker.jpg', 'chaos.jpg', 'fivestars.jpg', 'nanakage.webp']
/* 캡처에 남으면 안 되는 개발용 표시 — 하나라도 보이면 빌드를 세운다 */
const FORBID = ['DEV', '규칙1', 'v2.', '미저장']
const sleep = ms => new Promise(r => setTimeout(r, ms))
const fail = m => { console.error('빌드 실패: ' + m); process.exit(1) }

/* 체험판에서 직접 잡는 두 장. prep은 캡처 직전에 화면을 정리한다. */
const SHOTS = [
  { name: 'deco', url: '/demo/deco.html', clip: '.phone-frame',
    prep: async (page) => {
      /* 기본 화면은 이벤트 로비다 — 상단 칩으로 '꾸미기' 화면으로 옮긴다 */
      await page.evaluate(() => document.querySelector('.screen-nav button[data-screen="deco"]').click())
      await sleep(700)
      /* 미리보기 기본값은 빈 카드다 — 프레임이 적용된 상태로 두어야 '아이템을 고르고 배치'가 그림에 보인다 */
      await page.evaluate(() => document.querySelector('#screen-deco .preview-state-btn[data-state="saved"]').click())
      await sleep(400)
      /* 규칙 탭 행과 저장 경고 띠는 기획 검토용 장치라 제출물에는 넣지 않는다 */
      await page.evaluate(() => {
        const scr = document.getElementById('screen-deco')
        const rows = new Set()
        scr.querySelectorAll('button').forEach(b => {
          if (/^규칙[123]/.test(b.textContent.trim())) rows.add(b.parentElement)
        })
        rows.forEach(r => { r.style.display = 'none' })
        scr.querySelectorAll('div').forEach(d => {
          if (/^⚠\s*저장 버튼/.test(d.textContent.trim())) d.style.display = 'none'
        })
      })
      await sleep(300)
      /* 밝은 카드 위의 필터 칩 글자가 흰색 계열이라 인쇄 축소에서 배경에 묻힌다(Codex R13).
         데모 페이지는 그대로 두고, 캡처 직전 화면에서만 글자색을 어둡게 올린다. */
      await page.evaluate(() => {
        /* 미리보기 칸은 3:4로 잡혀 세로 절반이 빈자리다 — 그만큼 폰 프레임이 길어지고,
           인쇄 칸은 높이가 고정이라 화면 전체가 작게 들어간다. 빈자리를 걷어내면
           같은 칸에서 필터 칩이 크게 실린다(Codex R13). */
        for (const el of document.querySelectorAll('#screen-deco .preview-state')) {
          el.style.aspectRatio = 'auto'
          el.style.height = '260px'
        }
        const num = (c) => (c.match(/[\d.]+/g) || []).map(Number)
        for (const el of document.querySelectorAll('#screen-deco .card, #screen-deco .card *')) {
          const cs = getComputedStyle(el)
          const [r, g, b, a = 1] = num(cs.color)
          if (r === undefined) continue
          const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
          if (lum > 0.6 || a < 0.75) el.style.color = '#1e293b'
          if (Number(cs.opacity) < 0.85) el.style.opacity = '0.92'
          const bg = num(cs.backgroundColor)
          if (bg.length === 4 && bg[0] > 200 && bg[1] > 200 && bg[2] > 200 && bg[3] > 0 && bg[3] < 0.4) {
            el.style.background = 'rgba(15,23,42,0.07)'
            el.style.borderColor = 'rgba(15,23,42,0.32)'
          }
        }
      })
      await sleep(300)
    } },
  { name: 'ssjproto', url: '/demo/ssjproto.html', clip: '.phone-frame', prep: async () => {} },
]

mkdirSync('site/pdf/img', { recursive: true })
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()

/* 재인코딩·축소는 크롬 캔버스로 한다(추가 의존성 없음) */
const shrink = (buf, mime) => page.evaluate(async (src, maxw) => {
  const img = new Image()
  img.src = src
  await img.decode()
  const w = Math.min(img.naturalWidth, maxw)
  const h = Math.round(img.naturalHeight * (w / img.naturalWidth))
  const cv = document.createElement('canvas')
  cv.width = w; cv.height = h
  cv.getContext('2d').drawImage(img, 0, 0, w, h)
  return { data: cv.toDataURL('image/jpeg', 0.86).split(',')[1], w, h }
}, `data:${mime};base64,${buf.toString('base64')}`, MAXW)

const save = (name, out) => {
  const b = Buffer.from(out.data, 'base64')
  writeFileSync('site/pdf/img/' + name + '.jpg', b)
  console.log(`site/pdf/img/${name}.jpg — ${out.w}x${out.h} · ${Math.round(b.length / 1024)}KB`)
}

await page.setViewport({ width: 1200, height: 900, deviceScaleFactor: 1 })
await page.goto('about:blank')
for (const file of SRC) {
  const mime = file.endsWith('.webp') ? 'image/webp' : 'image/jpeg'
  save(file.replace(/\.\w+$/, ''), await shrink(readFileSync('site/works/' + file), mime))
}

/* ③ 슈퍼피플 상세창 가공본(WO-34) — 사이트용 사본이 이미 폭 ≤1600 JPEG라 그대로 복사한다 */
mkdirSync('site/pdf/img/superpeople', { recursive: true })
for (const f of readdirSync('site/works/superpeople').filter(f => f.endsWith('.jpg'))) {
  copyFileSync('site/works/superpeople/' + f, 'site/pdf/img/superpeople/' + f)
  console.log('site/pdf/img/superpeople/' + f + ' — 사이트 가공본 복사')
}

for (const s of SHOTS) {
  /* 1600폭 · 2배 픽셀로 잡고 사본 단계에서 1600으로 줄인다 — 글자가 뭉개지지 않는다 */
  await page.setViewport({ width: 1600, height: 1100, deviceScaleFactor: 2 })
  await page.goto(BASE + s.url, { waitUntil: 'networkidle2', timeout: 60000 })
  await sleep(1200)
  await s.prep(page)
  const el = await page.$(s.clip)
  if (!el) fail(`${s.name}: 클립 대상 ${s.clip}을 못 찾았다`)
  const png = Buffer.from(await el.screenshot({ type: 'png' }))
  const seen = await page.evaluate(() => document.body.innerText)
  const hits = FORBID.filter(w => seen.includes(w))
  if (hits.length) fail(`${s.name}: 캡처 화면에 개발용 표시가 남았다 — ${hits.join(',')}`)
  await page.setViewport({ width: 1200, height: 900, deviceScaleFactor: 1 })
  await page.goto('about:blank')
  save(s.name, await shrink(png, 'image/png'))
  console.log(`  ${s.name} — 체험판 직접 캡처 · 금지 표시 0 (${FORBID.join('·')})`)
}
await browser.close()
