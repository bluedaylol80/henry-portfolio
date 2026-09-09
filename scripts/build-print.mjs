/**
 * 인쇄용 페이지 빌더 — site/pdf/index.html(KO) · site/pdf/en/index.html(EN)
 *
 * 원칙: 사이트가 원천이다. 문구를 두 벌로 만들지 않는다.
 * 그래서 손으로 옮겨 적지 않고, 로컬 서버(8787)에 뜬 사이트를 실브라우저로 열어
 * 렌더된 DOM 텍스트를 그대로 읽어 조립한다. 대표 사례 6항목은 상세창을 실제로 열어서 읽는다.
 * 근거는 상세창에서 읽은 Notion 링크 목록으로 싣는다.
 *
 * 판형은 16:9 가로 슬라이드 15장이다(WO-24). 이미지는 site/pdf/img/의 사본만 쓴다
 * (scripts/build-pdf-img.mjs가 만든다). 캡처는 잘라내지 않고 통째로 넣는다.
 *
 * 사전 준비: python -m http.server 8787 --bind 127.0.0.1 --directory site
 * Usage: node scripts/build-print.mjs
 */
import puppeteer from 'puppeteer-core'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { hits as banHits } from './pdf-banned.mjs'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const BASE = 'http://127.0.0.1:8787'
const NOTION = 'https://limhenry.notion.site/'
const HUB = NOTION + '0e48e826c73f4a7ab9c3522d7fb16ce5'
const fail = m => { console.error('빌드 실패: ' + m); process.exit(1) }
const sleep = ms => new Promise(r => setTimeout(r, ms))
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/* 발행일은 하루 단위로 고정 — 같은 날 다시 빌드해도 결과가 흔들리지 않는다 */
const TODAY = new Date().toISOString().slice(0, 10)
/* 인쇄물에는 카드가 없다 — 화면 전용 안내를 링크 표현으로 바꾼다(Codex R6) */
const PRINTIFY = [['카드를 누르면 체험판이 열립니다', '아래 링크를 열면 체험판이 열립니다'],
                  ['카드를 누르면 직접 플레이할 수 있습니다', '아래 링크를 열면 직접 플레이할 수 있습니다'],
                  ['카드를 누르면 근거까지 보입니다', '아래 근거 카드에서 근거까지 볼 수 있습니다'],
                  ['Open the card for the demo', 'Open the link below for the demo'],
                  ['Open the card to play it', 'Open the link below to play it'],
                  ['Open a card for the evidence', 'The evidence is in the cards below'],
                  /* 역량 카드의 웹 안내는 인쇄물에서 쪽 안내로 바꾼다(Codex R11 D13) */
                  ['(달콤 상세창 "함께 보기")', '(5쪽 함께 보기)'],
                  ['(in the Dalcomsoft detail, "Also from the same period")', '(see p.5)']]
const pr = (t) => PRINTIFY.reduce((a, [x, y]) => a.split(x).join(y), String(t))

async function scrape(lang) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 1200, deviceScaleFactor: 1 })
  await page.goto(lang === 'ko' ? BASE + '/' : BASE + '/en/', { waitUntil: 'networkidle2', timeout: 60000 })
  await page.waitForFunction(() => !document.getElementById('loader'), { timeout: 15000 }).catch(() => {})
  await sleep(1800)
  const base = await page.evaluate(() => {
    const t = el => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '')
    const all = (sel, f) => [...document.querySelectorAll(sel)].map(f)
    return {
      brand: t(document.querySelector('.hdr .brand')),
      role: t(document.querySelector('.hero .eyebrow')),
      h1: all('.h1 .line>span', t),
      sub: t(document.querySelector('.hero-sub')),
      casesTitle: t(document.querySelector('#cases .h2')),
      casesLede: t(document.querySelector('#cases .works-lede')),
      cases: all('#cases .case', c => ({
        meta: t(c.querySelector('.case-meta')),
        title: t(c.querySelector('.case-t')).replace(/\s*(상세 보기|View details)\s*$/, ''),
        steps: [...c.querySelectorAll('.case-steps > div')].map(d => [t(d.querySelector('dt')), t(d.querySelector('dd'))]),
        state: t(c.querySelector('.case-state')),
        tag: t(c.querySelector('.case-tag')),
        work: c.querySelector('.card-open').dataset.work,
      })),
      skillsTitle: t(document.querySelector('#skills .h2')),
      skills: all('#skills .row-li', r => ({ title: t(r.querySelector('.row-title')), note: t(r.querySelector('.row-note')),
        cases: [...r.querySelectorAll('.row-case')].map(t) })),
      worksTitle: t(document.querySelector('#works .h2')),
      works: all('#works .card', c => ({
        meta: t(c.querySelector('.card-meta')), kpi: t(c.querySelector('.card-wm')),
        title: t(c.querySelector('.card-bot h3')).replace(/\s*(상세 보기|View details)\s*$/, ''),
        summary: t(c.querySelector('.card-bot > p')), rights: t(c.querySelector('.card-rights')),
      })),
      careerTitle: t(document.querySelector('#career .h2')),
      career: all('#career .row-li', r => ({ company: t(r.querySelector('.row-title')), titles: t(r.querySelector('.row-note')),
        sub: t(r.querySelector('.row-sub')), impact: t(r.querySelector('.row-impact')) })),
      careerFoot: t(document.querySelector('#career .row-foot')),
      protoTitle: t(document.querySelector('#proto .h2')),
      protoLede: t(document.querySelector('#proto .proto-lede')),
      proto: all('#proto .card', c => ({
        meta: t(c.querySelector('.card-meta')),
        title: (() => { const h = c.querySelector('.card-bot h3').cloneNode(true)
          h.querySelectorAll('.sr-only').forEach(n => n.remove())   // '체험판 열기 (새 창에서 열림)'이 제목에 섞였다
          return t(h) })(),
        href: c.querySelector('.card-go').getAttribute('href'),
        summary: t(c.querySelector('.card-bot > p')),
        note: [...c.querySelectorAll('.demo-note p')].map(p => [t(p.querySelector('b')), t(p.querySelector('span'))]),
        rights: t(c.querySelector('.card-rights')),
        shot: (getComputedStyle(c.querySelector('.card-shot')).backgroundImage.match(/url\("?(.+?)"?\)/) || [])[1] || '',
      })),
      /* 사이트 주소는 손으로 적지 않는다 — canonical이 정본이다(Codex R8-04) */
      canonical: document.querySelector('link[rel=canonical]').href,
      labTitle: t(document.querySelector('#lab .h2')),
      lab: (() => { const c = document.querySelector('#lab .card'); if (!c) return null
        return { meta: t(c.querySelector('.card-meta')), title: t(c.querySelector('.card-bot h3')).replace(/\s*(상세 보기|View details)\s*$/, ''),
          summary: t(c.querySelector('.card-bot > p')), href: c.querySelector('.card-cta a').href } })(),
      stats: all('.stats-grid li', l => [t(l.querySelector('.stat-n')), t(l.querySelector('.stat-l'))]),
      legal: t(document.querySelector('.ft-legal')),
    }
  })
  /* 상세창을 실제로 열어서 읽는다 — 화면에 뜨는 문장과 바이트 단위로 같아진다 */
  const readDlg = () => page.evaluate(() => {
    const t = el => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '')
    return {
      dlgMeta: t(document.getElementById('wdlgM')),
      dlgTitle: t(document.getElementById('wdlgT')),
      rows: [...document.querySelectorAll('#wdlgR > div')].map(d => [t(d.querySelector('dt')), t(d.querySelector('dd'))]),
      more: document.getElementById('wdlgMore').hidden ? null : {
        sum: t(document.querySelector('#wdlgMore summary')),
        rows: [...document.querySelectorAll('#wdlgMore dt')].map((dt, i) =>
          [t(dt), t(document.querySelectorAll('#wdlgMore dd')[i])]) },
      evHead: t(document.querySelector('#wdlgN h4')),
      ev: [...document.querySelectorAll('#wdlgN .ev-card')].map(a => ({ href: a.href, title: t(a.querySelector('.ev-t')) })),
    }
  })
  const openDlg = async (k) => {
    await page.evaluate(kk => document.querySelector(`.card-open[data-work="${kk}"]`).click(), k)
    await sleep(1600)
    const r = await readDlg()
    await page.keyboard.press('Escape'); await sleep(500)
    return r
  }
  for (const c of base.cases) Object.assign(c, await openDlg(c.work))
  /* 성과 3장도 상세창에서 읽는다 — 본인 행동·근거 링크를 손으로 옮기지 않는다(Codex R11 D10) */
  base.res = {}
  for (const [, slug] of RESULTS) base.res[slug] = await openDlg(slug)
  await browser.close()
  if (base.cases.length !== 3) fail('대표 사례가 3장이 아니다: ' + base.cases.length)
  // 한 줄 요약 + 6항목 = 7행(WO-19 13). 항목이 줄면 원고와 어긋난 것이라 실패시킨다.
  for (const c of base.cases) if (c.rows.length < 7) fail('사례 상세 행이 모자란다: ' + c.title + ' ' + c.rows.length)
  for (const [, slug] of RESULTS) {
    const r = base.res[slug]
    if (!r || r.rows.length < 3) fail('성과 상세 행이 모자란다: ' + slug + ' ' + (r ? r.rows.length : 0))
    if (!r.ev.length) fail('성과 근거 링크가 없다: ' + slug)
  }
  return base
}

/* ---------- 인쇄 CSS — 16:9 가로 슬라이드, 사이트 토큰·Pretendard ---------- */
const SLIDES = 15
const CSS = `
@page{size:338.67mm 190.5mm;margin:0}
*{margin:0;padding:0;box-sizing:border-box}
:root{--fg:#111;--muted:#5b5b5b;--line:#e6e5e2;--surface:#f6f5f3;--ink:#0a0a0a;--acc:#8a3a24}
html{font-size:11pt}
/* 한국어는 어절 단위로 끊는다 — 기본 줄바꿈은 '실행/으로'처럼 낱말을 쪼갠다(Codex R6) */
body{font-family:Pretendard,-apple-system,'Segoe UI',sans-serif;color:var(--fg);background:#fff;line-height:1.55;
  word-break:keep-all;counter-reset:slide;
  -webkit-font-smoothing:antialiased;-webkit-print-color-adjust:exact;print-color-adjust:exact}
a{color:inherit;text-decoration:none}
h1,h2,h3,h4{font-weight:600;letter-spacing:-.01em;line-height:1.28}
/* 슬라이드 한 장 = 한 쪽. 쪽 번호는 CSS 카운터로 찍는다(puppeteer 꼬리말을 쓰지 않는다) */
.s{position:relative;width:338.67mm;height:190.5mm;padding:11mm 14mm 13mm;overflow:hidden;
  display:flex;flex-direction:column;counter-increment:slide;break-after:page;background:#fff}
.s:last-of-type{break-after:auto}
.s::after{content:counter(slide) " / ${SLIDES}";position:absolute;right:14mm;bottom:6.5mm;
  font-size:.82rem;color:#8d8d8d;letter-spacing:.03em}
.hd{display:flex;justify-content:space-between;align-items:flex-end;gap:10mm;
  border-bottom:.5pt solid var(--line);padding-bottom:2.5mm;margin-bottom:5mm}
.hd .who{font-size:.91rem;color:var(--muted);margin-top:.8mm}
.eyebrow{font-size:.82rem;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.bd{flex:1;min-height:0;display:flex;flex-direction:column}
/* 권리 줄은 모든 슬라이드에 있다(Codex R11 D3) — 쪽 번호와 겹치지 않게 폭을 잘라 둔다 */
.rights{position:absolute;left:14mm;right:34mm;bottom:6mm;font-size:.82rem;color:#7c7c7c;line-height:1.35}
.pill{display:inline-block;border-radius:99px;padding:1mm 3.2mm;font-size:.88rem;line-height:1.5;margin-left:2mm;white-space:nowrap}
.pill--dark{background:var(--ink);color:#fff}
.pill--line{border:.5pt solid #bdbcb9;color:var(--muted)}
.t{font-size:1.55rem;max-width:230mm}
.t--sm{font-size:1.25rem}
.lede{margin-top:2.5mm;color:var(--muted);font-size:1rem;max-width:230mm}
.foot{margin-top:3mm;font-size:.91rem;color:var(--muted);line-height:1.5}
.foot b{font-weight:600;color:var(--fg);margin-right:1.5mm}
.go{color:var(--muted);text-decoration:underline}
.nw{white-space:nowrap}
/* 표지 */
.cover{padding-top:16mm}
.cover .name{font-size:3.1rem;font-weight:600;letter-spacing:-.02em;line-height:1.05}
.cover .role{margin-top:2.5mm;font-size:1.05rem;color:var(--muted)}
.cover .head{margin-top:9mm;font-size:1.9rem;font-weight:600;line-height:1.3;max-width:210mm}
.cover .contact{margin-top:8mm;font-size:.95rem;color:var(--muted)}
.cover .contact p{margin-top:1.5mm}
.cover .contact b{font-weight:500;color:var(--fg);display:inline-block;min-width:26mm}
.cover .issued{margin-top:4mm;font-size:.91rem;color:var(--muted)}
.strip{display:grid;grid-template-columns:repeat(3,1fr);gap:5mm;margin-top:auto;margin-bottom:6mm}
.strip figure{border:.5pt solid var(--line);border-radius:2mm;overflow:hidden;background:var(--surface)}
/* 키 비주얼 3장은 가로세로비가 제각각이다(1.33~1.78) — cover로 자르면 달콤 아이콘 격자와
   'Superstar Series' 글자가 잘린다. 통째로 보여주고 남는 자리는 종이색으로 채운다(WO-24 ④) */
.strip img{display:block;width:100%;height:44mm;object-fit:contain;object-position:center;background:var(--surface)}
.strip figcaption{padding:1.8mm 2.5mm;font-size:1rem;color:var(--muted)}
/* Career Milestone — 연도선 + 회사별 기간 막대(간트). 막대와 타일은 같은 번호로 묶인다(Codex R11 D12) */
.ms-bar{display:flex;gap:2mm;margin-bottom:1.5mm}
.ms-ph{flex:1;border-radius:1.5mm;background:var(--surface);border:.5pt solid var(--line);padding:2mm 3.5mm}
.ms-ph b{display:block;font-size:1rem;font-weight:600}
.ms-ph span{font-size:.91rem;color:var(--muted)}
.ms-ph:nth-child(3){background:var(--ink);border-color:var(--ink);color:#fff}
.ms-ph:nth-child(3) span{color:#cfcfcf}
.gantt{position:relative;height:7mm;margin-bottom:1.2mm}
.gantt i{position:absolute;top:0;height:7mm;border-radius:1mm;background:#cfcdc9;
  display:flex;align-items:center;justify-content:center;font-style:normal;
  font-size:.82rem;font-weight:600;color:#3a3a3a;overflow:hidden}
.gantt i.on{background:var(--acc);color:#fff}
.ms-axis{position:relative;height:5mm;border-top:.5pt solid var(--line)}
.ms-axis span{position:absolute;top:1mm;font-size:.82rem;color:var(--muted);transform:translateX(-50%)}
.ms-axis span:first-child{transform:none}
.ms-axis span:last-child{transform:translateX(-100%)}
.ms-grid{flex:1;display:grid;grid-template-columns:repeat(5,1fr);grid-auto-rows:1fr;gap:3.5mm;margin-top:3mm}
.ms-c{border-top:.8pt solid var(--ink);padding-top:1.8mm}
.ms-c b{display:block;font-size:1rem;font-weight:600}
.ms-c b em{font-style:normal;color:var(--acc);margin-right:1.4mm}
.ms-c .per{font-size:.91rem;color:var(--muted);margin-top:.5mm}
.ms-c .rl{font-size:.91rem;margin-top:.9mm}
.ms-c .ti{font-size:.91rem;color:var(--muted);margin-top:.6mm;line-height:1.38}
.ms-c .im{font-size:.91rem;color:#333;margin-top:1.2mm;line-height:1.38}
/* 요약·역량 */
.cards4{flex:1;min-height:0;display:grid;grid-template-columns:repeat(4,1fr);gap:5mm;align-items:stretch}
.sk{border:.5pt solid var(--line);border-radius:2mm;padding:5mm;background:#fff;display:flex;flex-direction:column}
.sk h3{font-size:1.2rem}
.sk p{margin-top:2.5mm;font-size:.94rem;line-height:1.55}
.sk .cs{margin-top:auto;padding-top:4mm;font-size:.91rem;color:var(--muted);line-height:1.5}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:5mm;margin-top:auto;border-top:.5pt solid var(--line);padding-top:4mm}
.stats b{display:block;font-size:1.9rem;font-weight:600;letter-spacing:-.01em}
.stats .lb{display:block;font-size:.91rem;color:var(--muted)}
/* 사례 */
.two{flex:1;min-height:0;display:grid;grid-template-columns:1fr 1fr;gap:9mm}
.two--top{align-items:start}
.two--l{grid-template-columns:118mm 1fr}
.two--r{grid-template-columns:1fr 130mm}
.two--r3{grid-template-columns:1fr 152mm}
.kpi{border-left:1.2mm solid var(--acc);padding-left:3.5mm;margin:3mm 0 4mm}
.kpi b{display:block;font-size:2rem;font-weight:600;letter-spacing:-.02em;line-height:1.1}
.kpi .lb{display:block;font-size:.91rem;color:var(--muted);margin-top:.8mm;line-height:1.35}
table{width:100%;border-collapse:collapse;table-layout:fixed}
.kv{font-size:.91rem}
.kv th,.kv td{border-top:.4pt solid var(--line);padding:1.6mm 3mm 1.6mm 0;vertical-align:top;text-align:left;line-height:1.45}
.kv th{font-weight:500;color:var(--muted)}
.kv tr:last-child td,.kv tr:last-child th{border-bottom:.4pt solid var(--line)}
.kv col:first-child{width:24mm}
.hero-shot{align-self:center;border:.5pt solid var(--line);border-radius:2mm;overflow:hidden;background:var(--surface)}
.hero-shot img{display:block;width:100%;height:auto}
.hero-shot figcaption{padding:2.2mm 3mm;font-size:1rem;color:var(--muted)}
.more{margin-top:3mm;border-top:.4pt solid var(--line);padding-top:2.2mm}
.more h4{font-size:.91rem;color:var(--muted);margin-bottom:1.2mm}
.more dt{font-size:.94rem;font-weight:600;margin-top:1.4mm}
.more dd{font-size:.91rem;color:#333;line-height:1.42}
/* 이미지 그리드 */
.ig{display:grid;grid-template-columns:1fr 1fr;gap:3.5mm;align-content:start}
.evlist{font-size:.91rem;line-height:1.45;margin-top:3.5mm;border-top:.4pt solid var(--line);padding-top:2.5mm}
.ig>.evlist{grid-column:1/-1;margin-top:1mm}
.evlist b{display:block;font-weight:600;margin-bottom:1mm}
.evlist a{display:block;margin-top:1mm}
.ph{border:.5pt solid var(--line);border-radius:2mm;overflow:hidden;background:#fff;
  display:flex;flex-direction:column;justify-self:center;width:100%}
/* 캡처는 잘라내지 않는다 — 통째로 보여주고 남는 자리는 종이색으로 둔다(Codex R11 D6·D7) */
.ph img{display:block;width:100%;height:36mm;object-fit:contain;object-position:center;background:#fff}
.ph--wide{grid-column:1/-1}
.ph--wide img{height:auto}
.ig--proto .ph:first-child img{height:54mm}
.ig--proto .ph:nth-child(2) img{height:40mm}
.res .ig .ph img{height:44mm}
.res .ph--wide img{height:70mm}
.res .ph--por img{height:66mm}
/* 보조 캡처가 한 장뿐인 장은 두 칸을 다 써서 키운다 */
.ig--solo .ph{grid-column:1/-1}
.ig--solo .ph img{height:66mm}
/* 사례 3 실행 — 세로로 긴 플로우차트를 큰 칸에 세우고 나머지 3장을 옆에 작게 둔다 */
.ig--tall{grid-template-columns:62mm 1fr;grid-template-rows:repeat(3,auto)}
.ph--tall{grid-row:1/4}
.ph--tall img{height:100mm}
.ig--tall .ph:not(.ph--tall) img{height:28mm}
.ph figcaption{padding:1.6mm 2.5mm;font-size:1rem;color:var(--muted);line-height:1.35;border-top:.4pt solid var(--line)}
.ph figcaption b{display:block;font-weight:500;color:var(--fg)}
/* 성과 */
.res-n{font-size:3.1rem;font-weight:600;letter-spacing:-.03em;line-height:1}
.res-l{margin-top:2mm;font-size:.91rem;color:var(--muted);line-height:1.35;max-width:80mm}
.res-b{margin-top:4mm;font-size:.94rem;line-height:1.5}
.res-b li{list-style:none;padding-left:4.5mm;position:relative;margin-top:1.6mm}
.res-b li::before{content:"";position:absolute;left:0;top:2.1mm;width:2mm;height:2mm;border-radius:99px;background:var(--acc)}
.res-meta{margin-top:3mm;font-size:.91rem;color:var(--muted);line-height:1.4}
.res .kv{margin-top:3.5mm}
/* 타임라인 */
.tl{font-size:.91rem}
.tl th,.tl td{border-top:.4pt solid var(--line);padding:2.8mm 3mm 2.8mm 0;vertical-align:top;text-align:left;line-height:1.38}
.tl thead th{border-top:0;font-size:.91rem;letter-spacing:.03em;color:var(--muted);font-weight:500}
.tl col:nth-child(1){width:32mm}
.tl col:nth-child(3){width:19mm}
.tl td.k{text-align:right;font-weight:600;padding-right:0}
.tl b{font-weight:600}
.tl .sub{display:block;color:var(--muted);font-size:.91rem;margin-top:.3mm}
.tl .impact{display:block;color:#333;font-size:.91rem;margin-top:.5mm}
/* 프로토타입 카드 */
.proto{display:grid;grid-template-columns:1fr 1fr;gap:7mm;height:100%}
.pc{border:.5pt solid var(--line);border-radius:2mm;overflow:hidden;display:flex;flex-direction:column}
.pc img{display:block;width:100%;height:56mm;object-fit:contain;object-position:center;background:#fff;
  border-bottom:.4pt solid var(--line)}
.pc .in{padding:4mm;flex:1;display:flex;flex-direction:column}
.pc h3{font-size:1.15rem;margin-top:1mm}
.pc p.sum{margin-top:1.8mm;font-size:.94rem;line-height:1.5}
.note{margin-top:2.5mm;font-size:.91rem;line-height:1.42;display:grid;grid-template-columns:22mm 1fr;gap:1mm 3mm}
.note p{display:contents}
.note b{font-weight:600}
/* 연락 */
.end{display:flex;flex-direction:column;justify-content:center;height:100%}
.end .name{font-size:2.4rem;font-weight:600;letter-spacing:-.02em}
.end .role{margin-top:2mm;font-size:1rem;color:var(--muted)}
.end .lines{margin-top:9mm;font-size:1rem}
.end .lines p{margin-top:2.5mm}
.end .lines b{display:inline-block;min-width:30mm;font-weight:600}
`

/* 인쇄물에만 있는 안내 라벨 — 사이트에 없는 문구는 여기서만 정의한다(본문은 전부 사이트에서 읽는다) */
const L = {
  ko: { doc:'포트폴리오', issued:'발행일', email:'이메일', site:'사이트', notion:'Notion 이력',
        timeline:'프로젝트 타임라인 — 회사별 상세', tlCompany:'회사', tlPeriod:'소속·직위·기간', tlKpi:'대표 지표',
        contact:'연락', open:'열기', auto:'이 문서는 사이트에서 자동 생성됐습니다.', demo:'체험판', evidence:'근거',
        summary:'한 줄 요약과 역량 4분류', milestone:'Career Milestone', results:'성과',
        phases:['운영','사업 PM','기획·디렉터'], caseN:n => `사례 ${n}`, overview:'개요', exec:'실행',
        proto:'AI 프로토타입', lab:'개인 프로덕트', period:'참여 기간·직위',
        rightsPlain:'수치는 공개 이력 기준입니다 · 게임 명칭은 각 권리자의 상표입니다.',
        rightsNW:'나이트워커 개발 원더피플·에이스톰 · 퍼블리싱 넥슨.',
        rightsProto:'화면은 내부 정보를 제거한 공개용 요약본입니다 · 상표·저작권은 달콤소프트에 있습니다.' },
  en: { doc:'Portfolio', issued:'Issued', email:'Email', site:'Site', notion:'Notion resume',
        timeline:'Project timeline — by company', tlCompany:'Company', tlPeriod:'Team, role, period', tlKpi:'Headline number',
        contact:'Contact', open:'Open', auto:'This document is generated from the site.', demo:'Demo', evidence:'Evidence',
        summary:'Summary and the four areas', milestone:'Career Milestone', results:'Results',
        phases:['Operations','Business PM','Planning · Director'], caseN:n => `Case ${n}`, overview:'Overview', exec:'Execution',
        proto:'AI prototypes', lab:'Personal product', period:'Period and role',
        rightsPlain:'Figures follow the public résumé · Game titles are trademarks of their respective owners.',
        rightsNW:'Night Walker developed by Wonderpeople and Acetom · published by Nexon.',
        rightsProto:'Screens are a public summary with internal information removed · trademarks and copyright belong to Dalcomsoft.' },
}
/* 채택 캡처의 캡션 — 인쇄물에만 있는 문구라 여기서 정의한다(원본 폴더명·내부 문서명은 쓰지 않는다).
   ph--doc는 잘라내지 않고 통째로, ph--wide는 두 칸을 가로질러 놓는다. */
const CAPS = {
  'lyn/before_after': ['폴리싱 제안 반영 전(1)·후(2) 화면 — 소프트런칭 지표 기반 개선 3건 중 게임성 폴리싱',
                       'Before (1) and after (2) the polishing proposal — one of three pre-launch fixes from soft-launch metrics'],
  'lyn/system_ui': ['시스템 UI 기획 — 개선안을 화면 흐름으로 정리한 기획 캡처',
                    'System UI plan — the fix laid out as a screen flow'],
  'nightwalker/server_flow_proposal': ['서버 선택 플로우 제안 — 중국 SDK 흐름을 퍼블리셔 로그인·런처 기준으로 재정의',
                                       "Server-select flow proposal — the China SDK flow redefined around the publisher's login and launcher"],
  'nightwalker/server_flowchart_wire': ['서버 선택 플로우차트 — 퍼블리셔 플랫폼(로그인·런처)과 개발사 영역(서버 선택·캐릭터 생성) 구분',
                                        'Server-select flowchart — publisher platform (login, launcher) vs. developer scope (server select, character creation)'],
  'nightwalker/charge_flow': ['보석 충전·프로모션 플로우 — 퍼블리셔 결제 정책에 맞춘 지급 흐름',
                              "Gem top-up and promotion flow — item grant flow aligned to the publisher's billing policy"],
  'nightwalker/charge_ui_mock': ['충전 UI 시안 — 프로모션 혜택을 충전 창에서 보여주는 개선안',
                                 'Top-up UI mock — showing promotion benefits inside the top-up window'],
  'chaos/event_ui_plan': ['이벤트 페이지 UI 기획안 — 라이브 이벤트 미션 구조',
                          'Event page UI plan — live event mission structure'],
  'chaos/ingame': ['인게임 전투 화면', 'In-game battle screen'],
  'fivestars/prereg': ['정식 런칭 사전예약 키 비주얼', 'Launch pre-registration key visual'],
  'nanakage/update_plan': ['1Q~2Q 업데이트 계획 — 소프트런칭 뒤 콘텐츠 일정 정리',
                           '1Q–2Q update plan — content schedule after soft launch'],
  'nanakage/mission_ui': ['미션 이벤트 UI — 일본 서비스 잔존 대응 이벤트',
                          'Mission event UI — retention event for the Japan service'],
}
/* 사례 실행 슬라이드(7·9)와 성과 슬라이드(10·11·12)가 쓰는 채택 캡처 */
const EXEC_SHOTS = { case2: ['lyn/system_ui', 'lyn/before_after'],
                     case3: ['nightwalker/server_flowchart_wire', 'nightwalker/server_flow_proposal',
                             'nightwalker/charge_flow', 'nightwalker/charge_ui_mock'] }
/* 위계 — 판독이 어려운 기획서·플로우 한 장을 큰 칸에 두고 나머지는 작은 칸으로 내린다(Codex R11 D6) */
const WIDE_SHOTS = new Set(['lyn/system_ui', 'lyn/before_after', 'chaos/event_ui_plan', 'nanakage/update_plan'])
const TALL_SHOTS = new Set(['nightwalker/server_flowchart_wire'])
/* 세로로 긴 원본은 폭이 아니라 높이로 키워야 읽힌다 */
const POR_SHOTS = new Set(['nanakage/mission_ui'])
/* 원본이 작은 캡처는 표시 폭을 원본의 1.5배로 묶는다(Codex R11 D8) — px→mm는 96dpi 기준 */
const NAT_W = { 'chaos/ingame': 500, 'fivestars/prereg': 361, 'nanakage/mission_ui': 304,
                chaos: 550, fivestars: 600, nanakage: 574, lyn: 600 }
const capMM = (slug) => (NAT_W[slug] ? ` style="max-width:${(NAT_W[slug] * 1.5 * 25.4 / 96).toFixed(1)}mm"` : '')
/* 대표 지표의 정의 라벨 — KO는 수치 근거표에서 그대로 읽고, EN만 여기서 옮긴다(Codex R11 D11) */
const KPI_NUM = { dalcom:'11→7', lyn:'183억', chaos:'98억', nightwalker:'33만+', fivestars:'24억', nanakage:'7개국' }
const KPI_DEF_EN = { dalcom:'Titles in the live portfolio (11 at hire → 5 sunset + 1 new → 7)',
                     lyn:'Revenue', chaos:'US revenue', nightwalker:'Cumulative new users in Korea',
                     fivestars:'Revenue (previously approved for publication)',
                     nanakage:'Soft-launch countries (Indonesia, Hong Kong, Philippines, Malaysia, Singapore, Thailand, Macau)' }
const KPI_DEF_KO = (() => {
  /* 근거표의 '정의' 칸을 그대로 쓴다 — 손으로 옮기면 문서와 갈라진다 */
  const md = readFileSync('docs/handover/2026-09-08_numbers_basis_table.md', 'utf8')
  const by = new Map()
  for (const line of md.split('\n')) {
    const c = line.split('|').map(s => s.trim())
    if (c.length > 6 && /^\d+$/.test(c[1])) by.set(c[3], c[5])
  }
  const out = {}
  for (const [k, n] of Object.entries(KPI_NUM)) {
    if (!by.has(n)) fail(`수치 근거표에 '${n}'(${k}) 행이 없다`)
    out[k] = by.get(n)
  }
  return out
})()
/* 회사 기간·직위는 경력 행에서 읽는다(Codex R11 D10) */
const COMPANY_TOK = { dalcom:['달콤','Dalcom'], lyn:['넥슨','Nexon'], chaos:['넥슨','Nexon'],
                      nightwalker:['원더피플','Wonderpeople'], fivestars:['스카이피플','Skypeople'],
                      nanakage:['넵튠','Neptune'] }
const KPI_OF = [['달콤', 0], ['Dalcom', 0], ['넥슨', 1], ['Nexon', 1], ['원더피플', 3], ['Wonderpeople', 3],
                ['스카이피플', 4], ['Skypeople', 4], ['넵튠', 5], ['Neptune', 5]]
/* 사례별 키 비주얼과 상세 행 분할점(개요 슬라이드가 가져가는 행 수) — 사례 1만 '결정 범위'가 있어 5행이다 */
const CASE_IMG = { case1: 'dalcom', case2: 'lyn', case3: 'nightwalker' }
const CASE_SPLIT = { case1: 5, case2: 4, case3: 4 }
/* 성과 슬라이드 3장이 쓰는 #works 인덱스와 키 비주얼 */
const RESULTS = [[2, 'chaos', ['chaos/event_ui_plan', 'chaos/ingame']],
                 [4, 'fivestars', ['fivestars/prereg']],
                 [5, 'nanakage', ['nanakage/update_plan', 'nanakage/mission_ui']]]
/* 경력 구간 — 가로 바의 눈금(연도)과 폭 비율 */
const PHASES = [['2006', '2011', 5], ['2011', '2021', 10], ['2021', '2026', 5]]
const PERIOD = /\d{4}\.\d{1,2}\s*[–—-]\s*(?:\d{4}\.\d{1,2}|현재|present)/i

function render(lang, d) {
  const l = L[lang]
  /* '56만+'의 '+'만 다음 줄로 떨어졌다(Codex R8-03) — 숫자가 든 토큰은 통째로 붙여 둔다 */
  const nw = (v) => esc(v).split(' ').map(w => (/\d/.test(w) ? `<span class="nw">${w}</span>` : w)).join(' ')
  const IMG = lang === 'en' ? '../img/' : 'img/'
  const kv = rows => `<table class="kv"><colgroup><col><col></colgroup>${
    rows.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(pr(v))}</td></tr>`).join('')}</table>`
  const kpiFor = (company) => {
    const hit = KPI_OF.find(([k]) => company.includes(k))
    return hit ? d.works[hit[1]].kpi : ''
  }
  /* 큰 숫자 밑에는 항목·단위를 붙인다 — 숫자만 있으면 무엇을 센 값인지 알 수 없다(Codex R11 D11) */
  const kpiDef = (slug) => (lang === 'en' ? KPI_DEF_EN : KPI_DEF_KO)[slug]
  const per = s => (s.match(PERIOD) || [''])[0]
  const roleOf = s => s.replace(PERIOD, '').replace(/[·•]\s*$/, '').trim()
  /* 성과 슬라이드의 참여 기간·직위 — 경력 행이 원천이다 */
  const careerOf = (slug) => d.career.find(r => COMPANY_TOK[slug].some(tk => r.company.includes(tk)))
  /* 사례가 어느 회사 카드에 걸리는지 — 저작권 문구·키 비주얼 제목이 여기서 나온다 */
  const workOf = (meta) => d.works[(KPI_OF.find(([k]) => meta.includes(k)) || [, 0])[1]]
  const shot = (slug, cap) => `<figure class="hero-shot"><img src="${IMG}${slug}.jpg" alt="">
      <figcaption>${esc(cap)}</figcaption></figure>`
  const tile = (slug, cap, cls = '') => `<figure class="ph${cls}"${capMM(slug)}>
      <img src="${IMG}${slug}.jpg" alt=""><figcaption>${esc(cap)}</figcaption></figure>`
  /* 채택 캡처 한 칸 — 캡션은 CAPS가 원천이고, 잘라내지 않는다 */
  const doc = (slug) => tile(slug, CAPS[slug][lang === 'en' ? 1 : 0],
    (WIDE_SHOTS.has(slug) ? ' ph--wide' : '') + (TALL_SHOTS.has(slug) ? ' ph--tall' : '') +
    (POR_SHOTS.has(slug) ? ' ph--por' : ''))
  const evLinks = (c) => `<div class="evlist"><b>${esc(l.evidence)}</b>${c.ev.map(e =>
    `<a class="go" href="${esc(e.href)}">${esc(e.title)} ↗</a>`).join('')}</div>`
  const slide = (o) => `
<section class="s${o.cls ? ' ' + o.cls : ''}"${o.attr || ''}>
  <div class="hd">
    <div><p class="eyebrow">${esc(o.eyebrow)}</p>${o.who ? `<p class="who">${esc(o.who)}</p>` : ''}</div>
    <div>${o.pills || ''}</div>
  </div>
  <div class="bd">${o.body}</div>
  ${o.rights ? `<p class="rights">${esc(o.rights)}</p>` : ''}
</section>`

  /* 1. 표지 */
  /* 세 회사 문구를 이어 붙이면 같은 문장이 세 번 반복돼 한 줄로 뭉갠 것처럼 읽혔다(WO-24 ④).
     문안을 손으로 새로 쓰지 않고, 세 문장의 공통 앞뒤를 잘라 회사 이름만 묶는다. */
  const coverRights = (() => {
    const ss = [...new Set([d.works[0].rights, d.works[1].rights, d.works[3].rights])]
    if (ss.length < 2) return ss.join(' ')
    let p = 0, s = 0
    while (ss.every(x => x[p] === ss[0][p]) && p < ss[0].length - 1) p++
    while (ss.every(x => x[x.length - 1 - s] === ss[0][ss[0].length - 1 - s]) && s < ss[0].length - p - 1) s++
    const mids = ss.map(x => x.slice(p, x.length - s))
    return ss[0].slice(0, p) + mids.join('·') + ss[0].slice(ss[0].length - s)
  })() + ' ' + l.rightsNW
  const cover = `
<section class="s cover">
  <p class="eyebrow">${esc(l.doc)}</p>
  <p class="name">${esc(d.brand)}</p>
  <p class="role">${esc(d.role)}</p>
  <p class="head">${d.h1.map(esc).join(' ')}</p>
  <div class="contact">
    <p><b>${esc(l.email)}</b> <a href="mailto:bluedaylol80@gmail.com">bluedaylol80@gmail.com</a></p>
    <p><b>${esc(l.site)}</b> <a href="${esc(d.canonical)}">${esc(d.canonical)}</a></p>
    <p><b>${esc(l.notion)}</b> <a href="${esc(HUB)}">${esc(l.notion)} ↗</a></p>
  </div>
  <p class="issued">${esc(l.issued)} ${TODAY}</p>
  <div class="strip">${[0, 1, 3].map((i, k) =>
    `<figure><img src="${IMG}${['dalcom', 'lyn', 'nightwalker'][k]}.jpg" alt=""><figcaption>${esc(d.works[i].title)}</figcaption></figure>`).join('')}</div>
  <p class="rights">${esc(coverRights)}</p>
</section>`

  /* 2. Career Milestone — 3구간 밴드 + 회사별 기간 막대(간트) + 회사 10곳 타일(오래된 순).
     막대와 타일은 같은 번호를 달아 연결한다(Codex R11 D12). 기간은 경력 행이 원천이다. */
  const rows2 = [...d.career].reverse()
  const T0 = +PHASES[0][0], T1 = +PHASES[2][1]
  const at = (ym) => { const [y, m] = ym.split('.').map(Number); return ((y + (m - 1) / 12) - T0) / (T1 - T0) * 100 }
  const span = (sub) => {
    const p = per(sub); if (!p) fail('경력 기간을 못 읽었다: ' + sub)
    const [a, b] = p.split(/\s*[–—-]\s*/)
    return [Math.max(0, at(a)), Math.min(100, /\d/.test(b) ? at(b) : 100)]
  }
  const ticks = ['2006', '2011', '2016', '2021', '2026']
  const milestone = slide({
    eyebrow: l.milestone, who: `${PHASES[0][0]} – ${PHASES[2][1]}`, rights: l.rightsPlain,
    body: `
    <div class="ms-bar">${PHASES.map(([a, b, w], i) =>
      `<div class="ms-ph" style="flex:${w}"><b>${esc(l.phases[i])}</b><span>${a} – ${b}</span></div>`).join('')}</div>
    <div class="gantt">${rows2.map((r, i) => { const [x0, x1] = span(r.sub)
      return `<i class="${i % 2 ? 'on' : ''}" style="left:${x0.toFixed(2)}%;width:${(x1 - x0).toFixed(2)}%">${i + 1}</i>` }).join('')}</div>
    <div class="ms-axis">${ticks.map(y =>
      `<span style="left:${at(y + '.1').toFixed(2)}%">${y}</span>`).join('')}</div>
    <div class="ms-grid">${rows2.map((r, i) => `
      <div class="ms-c"><b><em>${i + 1}</em>${esc(r.company)}</b>
        <p class="per">${nw(per(r.sub))}</p>
        <p class="rl">${esc(roleOf(r.sub))}</p>
        <p class="ti">${esc(r.titles)}</p>
        <p class="im">${nw(r.impact)}</p></div>`).join('')}</div>`,
  })

  /* 3. 한 줄 요약 + 역량 4분류 */
  const summary = slide({
    eyebrow: l.summary, who: d.brand, rights: l.rightsPlain,
    body: `
    <h2 class="t t--sm">${esc(d.skillsTitle)}</h2>
    <p class="lede">${esc(pr(d.sub))}</p>
    <div class="cards4" style="margin-top:6mm">${d.skills.map(s => `
      <div class="sk"><h3>${esc(s.title)}</h3><p>${esc(s.note)}</p>
        ${s.cases.length ? `<p class="cs">${s.cases.map(x => esc(pr(x))).join('<br>')}</p>` : ''}</div>`).join('')}</div>
    <div class="stats">${d.stats.map(([n, k]) => `<div><b>${nw(n)}</b><span class="lb">${esc(k)}</span></div>`).join('')}</div>`,
  })

  /* 권리 줄 — 나이트워커는 개발·퍼블리싱이 갈려 있어 사이트 문구에 권리자를 덧붙인다(Codex R11 D4) */
  const rightsOf = (c) => workOf(c.dlgMeta).rights + (CASE_IMG[c.work] === 'nightwalker' ? ' ' + l.rightsNW : '')

  /* 4·6·8. 사례 개요 — 키 비주얼 + KPI + 앞쪽 상세 행 */
  const caseOverview = (c, i) => slide({
    cls: 'case', attr: ` data-case="${esc(c.work)}"`,
    eyebrow: `${l.caseN(i + 1)} · ${l.overview}`, who: c.dlgMeta,
    pills: `<span class="pill pill--dark">${esc(c.state)}</span><span class="pill pill--line">${esc(c.tag)}</span>`,
    rights: rightsOf(c),
    body: `<div class="two two--l">
      ${shot(CASE_IMG[c.work], workOf(c.dlgMeta).title)}
      <div><h2 class="t case-h">${esc(c.dlgTitle)}</h2>
        <div class="kpi"><b>${nw(kpiFor(c.dlgMeta))}</b><span class="lb">${esc(kpiDef(CASE_IMG[c.work]))}</span></div>
        ${kv(c.rows.slice(0, CASE_SPLIT[c.work]))}</div>
    </div>`,
  })

  /* 5·7·9. 사례 실행 — 뒤쪽 상세 행 + 캡처 + 근거 링크.
     캡처는 큰 칸 1개 + 작은 칸으로 위계를 둔다(Codex R11 D6). 근거는 링크로만 싣는다 —
     Notion 썸네일은 이 크기에서 읽히지 않는다(D6). */
  const caseExec = (c, i) => {
    const tiles = c.work === 'case1'
      ? [tile('deco', d.proto[0].title, ' ph--wide'), tile('ssjproto', d.proto[1].title, ' ph--wide')]
      : EXEC_SHOTS[c.work].map(doc)
    return slide({
      cls: 'case', attr: ` data-case="${esc(c.work)}"`,
      eyebrow: `${l.caseN(i + 1)} · ${l.exec}`, who: c.dlgTitle,
      pills: `<span class="pill pill--line">${esc(c.tag)}</span>`,
      rights: c.work === 'case1' ? l.rightsProto : rightsOf(c),
      body: `<div class="two two--r${c.work === 'case3' ? ' two--r3' : ''}">
        <div>${kv(c.rows.slice(CASE_SPLIT[c.work]))}
          ${c.more ? `<div class="more"><h4>${esc(c.more.sum)}</h4><dl>${c.more.rows.map(([k, v]) =>
            `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></div>` : ''}
          ${c.work === 'case3' ? evLinks(c) : ''}</div>
        <div class="ig${c.work === 'case3' ? ' ig--tall' : c.work === 'case1' ? ' ig--proto' : ''}">${tiles.join('')}${c.work === 'case3' ? '' : evLinks(c)}</div>
      </div>`,
    })
  }

  /* 10·11·12. 성과 3장 — 큰 KPI + 정의 라벨 + 참여 기간·직위 + 상세창의 본인 행동 표 + 근거 링크.
     본문은 손으로 옮기지 않는다 — 상세창에서 읽은 행을 그대로 싣는다(Codex R11 D10). */
  /* 사이트에는 있지만 인쇄물 배포가 막힌 항목이 섞여 있다 — 그 행만 빼고 나머지는 그대로 싣는다 */
  const resRows = (slug, rows) => rows.filter(([k, v]) => {
    const h = banHits(k + ' ' + v)
    if (h.length) console.log(`  인쇄 제외(${lang} ${slug}): ${k} — 금지어 ${h.join(',')}`)
    return !h.length
  })
  const result = ([wi, slug, shots]) => {
    const w = d.works[wi], r = d.res[slug], cr = careerOf(slug)
    if (!cr) fail('경력 행을 못 찾았다: ' + slug)
    const bullets = w.summary.split(/(?<=[.。])\s+/).filter(Boolean)
    return slide({
      cls: 'res', eyebrow: `${l.results} · ${w.title}`, who: r.dlgMeta,
      rights: w.rights + (slug === 'nightwalker' ? ' ' + l.rightsNW : ''),
      body: `<div class="two two--top">
        <div><p class="res-n">${nw(w.kpi)}</p><p class="res-l">${esc(kpiDef(slug))}</p>
          <p class="res-meta"><b>${esc(l.period)}</b> ${nw(per(cr.sub))} · ${esc(roleOf(cr.sub))}</p>
          <ul class="res-b">${bullets.map(b => `<li>${nw(b)}</li>`).join('')}</ul>
          ${kv(resRows(slug, r.rows))}${evLinks(r)}</div>
        <div class="ig${shots.length < 2 ? ' ig--solo' : ''}">${tile(slug, w.title)}${[...shots].sort((a, b) =>
          WIDE_SHOTS.has(a) - WIDE_SHOTS.has(b)).map(doc).join('')}</div>
      </div>`,
    })
  }

  /* 13. 프로젝트 타임라인 — 2열 표 */
  const tlRows = rows => `<table class="tl"><colgroup><col><col><col></colgroup>
    <thead><tr><th>${esc(l.tlCompany)}</th><th>${esc(l.tlPeriod)}</th><th style="text-align:right">${esc(l.tlKpi)}</th></tr></thead>
    <tbody>${rows.map(r => `<tr><td><b>${esc(r.company)}</b><span class="sub">${esc(r.titles)}</span></td>
      <td>${esc(r.sub)}<span class="impact">${nw(r.impact)}</span></td>
      <td class="k">${nw(kpiFor(r.company))}</td></tr>`).join('')}</tbody></table>`
  const half = Math.ceil(d.career.length / 2)
  const timeline = slide({
    eyebrow: l.timeline, who: d.careerTitle, rights: l.rightsPlain,
    body: `<div class="two two--top">${tlRows(d.career.slice(0, half))}${tlRows(d.career.slice(half))}</div>
      <p class="foot">${esc(d.careerFoot)}</p>`,
  })

  /* 14. AI 프로토타입 2 + 가계부 1줄 */
  const proto = slide({
    eyebrow: l.proto, who: d.protoLede,
    rights: l.rightsProto,
    body: `<div class="proto">${d.proto.map((p, i) => `
      <div class="pc"><img src="${IMG}${['deco', 'ssjproto'][i]}.jpg" alt="">
        <div class="in"><p class="eyebrow">${esc(p.meta)}</p><h3>${esc(p.title)}</h3>
          <p class="sum">${esc(pr(p.summary))}</p>
          <div class="note">${p.note.map(([k, v]) => `<p><b>${esc(k)}</b> ${esc(pr(v))}</p>`).join('')}
            <p><b>${esc(l.demo)}</b> <a class="go" href="${esc(d.canonical + p.href)}">${esc(l.open)} ↗</a></p></div>
        </div></div>`).join('')}</div>
      ${d.lab ? `<p class="foot"><b>${esc(l.lab)}</b> ${esc(d.lab.title)} — ${esc(d.lab.summary)}
        <a class="go" href="${esc(d.lab.href)}">${esc(l.open)} ↗</a></p>` : ''}`,
  })

  /* 15. 연락 */
  /* 사이트 푸터는 "© 2026 Henry Lim (임현택) 본 사이트의…"처럼 이름과 문장이 붙어 있다 */
  const legal = d.legal.replace(/^(©\s*\d{4}\s+Henry Lim(?:\s*\([^)]*\))?)\s+/, '$1 · ')
  const contact = slide({
    eyebrow: l.contact, who: `${l.issued} ${TODAY}`, rights: l.rightsPlain,
    body: `<div class="end">
      <p class="name">${esc(d.brand)}</p>
      <p class="role">${esc(d.role)}</p>
      <div class="lines">
        <p><b>${esc(l.email)}</b> <a href="mailto:bluedaylol80@gmail.com">bluedaylol80@gmail.com</a></p>
        <p><b>${esc(l.site)}</b> <a href="${esc(d.canonical)}">${esc(d.canonical)}</a></p>
        <p><b>${esc(l.notion)}</b> <a href="${esc(HUB)}">${esc(HUB)}</a></p>
      </div>
      <p class="foot">${esc(l.auto)} ${esc(l.issued)} ${TODAY} · ${esc(legal)}</p>
    </div>`,
  })

  const body = [cover, milestone, summary,
    caseOverview(d.cases[0], 0), caseExec(d.cases[0], 0),
    caseOverview(d.cases[1], 1), caseExec(d.cases[1], 1),
    caseOverview(d.cases[2], 2), caseExec(d.cases[2], 2),
    ...RESULTS.map(result), timeline, proto, contact]
  if (body.length !== SLIDES) fail('슬라이드가 ' + SLIDES + '장이 아니다: ' + body.length)

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(d.brand)} — ${esc(l.doc)}</title>
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<!-- dynamic-subset은 unicode-range로 폰트를 잘게 쪼갠다 — 그러면 "19년"이 두 런으로 갈라져
     PDF 텍스트 추출 순서가 "년19"로 뒤집힌다(Codex R6). 그래서 통짜 폰트를 쓴다.
     가변(variable)도 안 된다 — Chrome은 가변 폰트를 PDF에 Type3 윤곽선으로 구워서 글꼴 이름이
     남지 않고 파일이 두 배로 불어난다(Codex R7). 무게별 정적 폰트라야 /BaseFont로 내장된다. -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<style>${CSS}</style>
</head>
<body>
${body.join('\n')}
</body>
</html>
`
}

const ko = await scrape('ko')
const en = await scrape('en')
mkdirSync('site/pdf/en', { recursive: true })
writeFileSync('site/pdf/index.html', render('ko', ko), 'utf8')
writeFileSync('site/pdf/en/index.html', render('en', en), 'utf8')
console.log('생성: site/pdf/index.html · site/pdf/en/index.html')
console.log('  슬라이드 ' + SLIDES + '장 · 사례 ' + ko.cases.length + '건 · 경력 ' + ko.career.length + '행 · 성과 카드 ' + ko.works.length + '장 · 프로토 ' + ko.proto.length + '장')
