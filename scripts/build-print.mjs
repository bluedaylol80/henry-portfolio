/**
 * 인쇄용 페이지 빌더 — site/pdf/index.html(KO) · site/pdf/en/index.html(EN)
 *
 * 원칙: 사이트가 원천이다. 문구를 두 벌로 만들지 않는다.
 * 그래서 손으로 옮겨 적지 않고, 로컬 서버(8787)에 뜬 사이트를 실브라우저로 열어
 * 렌더된 DOM 텍스트를 그대로 읽어 조립한다. 대표 사례 6항목은 상세창을 실제로 열어서 읽는다.
 * 근거 카드 썸네일·Notion URL은 site/evidence/index.json에서 가져온다.
 *
 * 판형은 16:9 가로 슬라이드 15장이다(WO-24). 이미지는 site/pdf/img/의 사본만 쓴다
 * (scripts/build-pdf-img.mjs가 만든다). 채택 전 슬롯은 "이미지 대기" 박스로 그린다.
 *
 * 사전 준비: python -m http.server 8787 --bind 127.0.0.1 --directory site
 * Usage: node scripts/build-print.mjs
 */
import puppeteer from 'puppeteer-core'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const BASE = 'http://127.0.0.1:8787'
const NOTION = 'https://limhenry.notion.site/'
const HUB = NOTION + '0e48e826c73f4a7ab9c3522d7fb16ce5'
const EV = JSON.parse(readFileSync('site/evidence/index.json', 'utf8'))
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
                  ['Open a card for the evidence', 'The evidence is in the cards below']]
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
  /* 대표 사례 6항목은 상세창을 실제로 열어서 읽는다 — 화면에 뜨는 문장과 바이트 단위로 같아진다 */
  for (const c of base.cases) {
    await page.evaluate(k => document.querySelector(`.card-open[data-work="${k}"]`).click(), c.work)
    await sleep(1600)
    Object.assign(c, await page.evaluate(() => {
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
    }))
    await page.keyboard.press('Escape'); await sleep(500)
  }
  await browser.close()
  if (base.cases.length !== 3) fail('대표 사례가 3장이 아니다: ' + base.cases.length)
  // 한 줄 요약 + 6항목 = 7행(WO-19 13). 항목이 줄면 원고와 어긋난 것이라 실패시킨다.
  for (const c of base.cases) if (c.rows.length < 7) fail('사례 상세 행이 모자란다: ' + c.title + ' ' + c.rows.length)
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
  font-size:.7rem;color:#8d8d8d;letter-spacing:.03em}
.hd{display:flex;justify-content:space-between;align-items:flex-end;gap:10mm;
  border-bottom:.5pt solid var(--line);padding-bottom:2.5mm;margin-bottom:5mm}
.hd .who{font-size:.85rem;color:var(--muted);margin-top:.8mm}
.eyebrow{font-size:.7rem;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.bd{flex:1;min-height:0;display:flex;flex-direction:column}
.rights{position:absolute;left:14mm;bottom:6.5mm;font-size:.68rem;color:#8d8d8d;max-width:255mm;line-height:1.4}
.pill{display:inline-block;border-radius:99px;padding:1mm 3.2mm;font-size:.76rem;line-height:1.5;margin-left:2mm;white-space:nowrap}
.pill--dark{background:var(--ink);color:#fff}
.pill--line{border:.5pt solid #bdbcb9;color:var(--muted)}
.t{font-size:1.55rem;max-width:230mm}
.t--sm{font-size:1.25rem}
.lede{margin-top:2.5mm;color:var(--muted);font-size:.95rem;max-width:230mm}
.foot{margin-top:3mm;font-size:.8rem;color:var(--muted);line-height:1.5}
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
.cover .issued{margin-top:4mm;font-size:.82rem;color:var(--muted)}
.strip{display:grid;grid-template-columns:repeat(3,1fr);gap:5mm;margin-top:auto}
.strip figure{border:.5pt solid var(--line);border-radius:2mm;overflow:hidden;background:var(--surface)}
.strip img{display:block;width:100%;height:44mm;object-fit:cover;object-position:center}
.strip figcaption{padding:1.8mm 2.5mm;font-size:.75rem;color:var(--muted)}
/* Career Milestone */
.ms-bar{display:flex;gap:2mm;margin-bottom:6mm}
.ms-ph{flex:1;border-radius:1.5mm;background:var(--surface);border:.5pt solid var(--line);padding:2.5mm 3.5mm}
.ms-ph b{display:block;font-size:1rem;font-weight:600}
.ms-ph span{font-size:.78rem;color:var(--muted)}
.ms-ph:nth-child(3){background:var(--ink);border-color:var(--ink);color:#fff}
.ms-ph:nth-child(3) span{color:#cfcfcf}
.ms-rail{height:.8mm;background:linear-gradient(90deg,#dcdbd8,#9a9894);border-radius:99px;margin-bottom:4mm}
.ms-grid{flex:1;display:grid;grid-template-columns:repeat(5,1fr);grid-auto-rows:1fr;gap:4mm}
.ms-c{border-top:.8pt solid var(--ink);padding-top:2mm}
.ms-c b{display:block;font-size:.98rem;font-weight:600}
.ms-c .per{font-size:.78rem;color:var(--muted);margin-top:.6mm}
.ms-c .rl{font-size:.78rem;margin-top:1.2mm}
.ms-c .ti{font-size:.75rem;color:var(--muted);margin-top:.8mm;line-height:1.4}
.ms-c .im{font-size:.74rem;color:#333;margin-top:1.6mm;line-height:1.42}
/* 요약·역량 */
.cards4{flex:1;min-height:0;display:grid;grid-template-columns:repeat(4,1fr);gap:5mm;align-items:stretch}
.sk{border:.5pt solid var(--line);border-radius:2mm;padding:4mm;background:#fff}
.sk h3{font-size:1.02rem}
.sk p{margin-top:2mm;font-size:.82rem;line-height:1.5}
.sk .cs{margin-top:2.5mm;font-size:.75rem;color:var(--muted);line-height:1.45}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:5mm;margin-top:auto;border-top:.5pt solid var(--line);padding-top:4mm}
.stats b{display:block;font-size:1.6rem;font-weight:600;letter-spacing:-.01em}
.stats .lb{display:block;font-size:.78rem;color:var(--muted)}
/* 사례 */
.two{flex:1;min-height:0;display:grid;grid-template-columns:1fr 1fr;gap:9mm}
.two--top{align-items:start}
.two--l{grid-template-columns:118mm 1fr}
.two--r{grid-template-columns:1fr 130mm}
.kpi{border-left:1.2mm solid var(--acc);padding-left:3.5mm;margin:3mm 0 4mm}
.kpi b{display:block;font-size:2rem;font-weight:600;letter-spacing:-.02em;line-height:1.1}
.kpi .lb{display:block;font-size:.76rem;color:var(--muted);letter-spacing:.04em;text-transform:uppercase}
table{width:100%;border-collapse:collapse;table-layout:fixed}
.kv{font-size:.84rem}
.kv th,.kv td{border-top:.4pt solid var(--line);padding:1.8mm 3mm 1.8mm 0;vertical-align:top;text-align:left;line-height:1.5}
.kv th{font-weight:500;color:var(--muted)}
.kv tr:last-child td,.kv tr:last-child th{border-bottom:.4pt solid var(--line)}
.kv col:first-child{width:24mm}
.hero-shot{align-self:center;border:.5pt solid var(--line);border-radius:2mm;overflow:hidden;background:var(--surface)}
.hero-shot img{display:block;width:100%;height:auto}
.hero-shot figcaption{padding:2.2mm 3mm;font-size:.78rem;color:var(--muted)}
.more{margin-top:3.5mm;border-top:.4pt solid var(--line);padding-top:2.5mm}
.more h4{font-size:.85rem;color:var(--muted);margin-bottom:1.5mm}
.more dt{font-size:.84rem;font-weight:600;margin-top:1.5mm}
.more dd{font-size:.78rem;color:#333;line-height:1.45}
/* 이미지 그리드·대기 박스 */
.ig{display:grid;grid-template-columns:1fr 1fr;gap:4mm;align-content:start}
.evlist{font-size:.78rem;line-height:1.5}
.evlist b{display:block;font-weight:600;margin-bottom:1.2mm}
.evlist a{display:block;margin-top:1.2mm}
.ph{border:.5pt solid var(--line);border-radius:2mm;overflow:hidden;background:var(--surface)}
.ph img{display:block;width:100%;height:40mm;object-fit:cover;object-position:top}
/* 기획서·플로우·UI 시안은 잘리면 읽을 수 없다 — 통째로 넣고 남는 자리는 흰 여백으로 둔다 */
.ph--doc img{object-fit:contain;background:#fff}
.ph--wide{grid-column:1/-1}
.ph--wide img{height:auto;object-fit:contain}
.ig--4 .ph img{height:36mm}
.ph figcaption{padding:1.8mm 2.5mm;font-size:.75rem;color:var(--muted);line-height:1.4}
.ph figcaption b{display:block;font-weight:500;color:var(--fg)}
.pend{border:.5pt dashed #bdbcb9;border-radius:2mm;background:var(--surface);color:#8d8d8d;
  height:47mm;display:flex;align-items:center;justify-content:center;font-size:.8rem}
/* 성과 */
.res-n{font-size:3.4rem;font-weight:600;letter-spacing:-.03em;line-height:1}
.res-l{margin-top:2mm;font-size:.8rem;color:var(--muted);letter-spacing:.04em;text-transform:uppercase}
.res-b{margin-top:5mm;font-size:.9rem;line-height:1.55}
.res-b li{list-style:none;padding-left:4.5mm;position:relative;margin-top:1.8mm}
.res-b li::before{content:"";position:absolute;left:0;top:2.1mm;width:2mm;height:2mm;border-radius:99px;background:var(--acc)}
/* 타임라인 */
.tl{font-size:.78rem}
.tl th,.tl td{border-top:.4pt solid var(--line);padding:1.6mm 3mm 1.6mm 0;vertical-align:top;text-align:left;line-height:1.42}
.tl thead th{border-top:0;font-size:.72rem;letter-spacing:.05em;color:var(--muted);font-weight:500}
.tl col:nth-child(1){width:34mm}
.tl col:nth-child(3){width:20mm}
.tl td.k{text-align:right;font-weight:600;padding-right:0}
.tl b{font-weight:600}
.tl .sub{display:block;color:var(--muted);font-size:.72rem;margin-top:.4mm}
.tl .impact{display:block;color:#333;font-size:.74rem;margin-top:.6mm}
/* 프로토타입 카드 */
.proto{display:grid;grid-template-columns:1fr 1fr;gap:7mm;height:100%}
.pc{border:.5pt solid var(--line);border-radius:2mm;overflow:hidden;display:flex;flex-direction:column}
.pc img{display:block;width:100%;height:58mm;object-fit:cover;object-position:top}
.pc .in{padding:4mm;flex:1;display:flex;flex-direction:column}
.pc h3{font-size:1.05rem;margin-top:1mm}
.pc p.sum{margin-top:1.8mm;font-size:.82rem;line-height:1.5}
.note{margin-top:2.5mm;font-size:.78rem;line-height:1.45;display:grid;grid-template-columns:20mm 1fr;gap:1mm 3mm}
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
        timeline:'프로젝트 타임라인', tlCompany:'회사', tlPeriod:'소속·직위·기간', tlKpi:'대표 지표',
        contact:'연락', open:'열기', auto:'이 문서는 사이트에서 자동 생성됐습니다.', demo:'체험판', evidence:'근거',
        summary:'한 줄 요약과 역량 4분류', milestone:'Career Milestone', results:'성과',
        phases:['운영','사업 PM','기획·디렉터'], caseN:n => `사례 ${n}`, overview:'개요', exec:'실행',
        pending:'이미지 대기', proto:'AI 프로토타입', lab:'개인 프로덕트' },
  en: { doc:'Portfolio', issued:'Issued', email:'Email', site:'Site', notion:'Notion resume',
        timeline:'Project timeline', tlCompany:'Company', tlPeriod:'Team, role, period', tlKpi:'Headline number',
        contact:'Contact', open:'Open', auto:'This document is generated from the site.', demo:'Demo', evidence:'Evidence',
        summary:'Summary and the four areas', milestone:'Career Milestone', results:'Results',
        phases:['Operations','Business PM','Planning · Director'], caseN:n => `Case ${n}`, overview:'Overview', exec:'Execution',
        pending:'이미지 대기', proto:'AI prototypes', lab:'Personal product' },
}
/* 채택 캡처의 캡션 — 인쇄물에만 있는 문구라 여기서 정의한다(원본 폴더명·내부 문서명은 쓰지 않는다).
   ph--doc는 잘라내지 않고 통째로, ph--wide는 두 칸을 가로질러 놓는다. */
const CAPS = {
  'lyn/before_after': ['변경 전·후 화면 비교', 'Screens before and after the change'],
  'lyn/system_ui': ['시스템 UI 기획', 'System UI spec'],
  'nightwalker/server_flow_proposal': ['서버 선택 플로우 제안', 'Server select flow proposal'],
  'nightwalker/server_flowchart_wire': ['서버 선택 플로우차트·와이어프레임', 'Server select flowchart and wireframe'],
  'nightwalker/charge_flow': ['보석 충전·프로모션 플로우', 'Gem purchase and promotion flow'],
  'nightwalker/charge_ui_mock': ['충전 UI 시안', 'Purchase UI mockup'],
  'chaos/event_ui_plan': ['이벤트 페이지 UI 기획안', 'Event page UI spec'],
  'chaos/ingame': ['인게임 화면', 'In-game screen'],
  'fivestars/prereg': ['정식 런칭 사전예약 키 비주얼', 'Launch pre-registration key visual'],
  'nanakage/update_plan': ['1Q~2Q 업데이트 계획', 'Q1–Q2 update plan'],
  'nanakage/mission_ui': ['미션 이벤트 UI', 'Mission event UI'],
}
/* 사례 실행 슬라이드(7·9)와 성과 슬라이드(10·11·12)가 쓰는 채택 캡처 */
const EXEC_SHOTS = { case2: ['lyn/before_after', 'lyn/system_ui'],
                     case3: ['nightwalker/server_flow_proposal', 'nightwalker/server_flowchart_wire',
                             'nightwalker/charge_flow', 'nightwalker/charge_ui_mock'] }
const WIDE_SHOTS = new Set(['lyn/before_after'])
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
  /* EN 인쇄 페이지는 site/pdf/en/ 아래라 자산 경로가 한 단계 더 올라간다 */
  const UP = lang === 'en' ? '../../' : '../'
  const IMG = lang === 'en' ? '../img/' : 'img/'
  const pend = `<div class="pend">${esc(l.pending)}</div>`
  const kv = rows => `<table class="kv"><colgroup><col><col></colgroup>${
    rows.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(pr(v))}</td></tr>`).join('')}</table>`
  const kpiFor = (company) => {
    const hit = KPI_OF.find(([k]) => company.includes(k))
    return hit ? d.works[hit[1]].kpi : ''
  }
  /* 사례가 어느 회사 카드에 걸리는지 — 저작권 문구·키 비주얼 제목이 여기서 나온다 */
  const workOf = (meta) => d.works[(KPI_OF.find(([k]) => meta.includes(k)) || [, 0])[1]]
  const shot = (slug, cap) => `<figure class="hero-shot"><img src="${IMG}${slug}.jpg" alt="">
      <figcaption>${esc(cap)}</figcaption></figure>`
  const tile = (slug, cap) => `<figure class="ph"><img src="${IMG}${slug}.jpg" alt=""><figcaption>${esc(cap)}</figcaption></figure>`
  /* 채택 캡처 한 칸 — 캡션은 CAPS가 원천이고, 잘라내지 않는다 */
  const doc = (slug) => `<figure class="ph ph--doc${WIDE_SHOTS.has(slug) ? ' ph--wide' : ''}">
      <img src="${IMG}${slug}.jpg" alt=""><figcaption>${esc(CAPS[slug][lang === 'en' ? 1 : 0])}</figcaption></figure>`
  /* 근거 카드 1장 — 썸네일과 제목은 site/evidence/index.json이 원천이다 */
  const evTile = (c) => {
    const e = c.ev[0]
    if (!e) return pend
    const m = EV[e.href.replace(/^.*\//, '')]
    if (!m) return pend
    const title = lang === 'en' && m.en ? m.en.title : m.title
    return `<figure class="ph"><img src="${UP}evidence/${esc(m.img)}" alt="">
      <figcaption><b>${esc(title)}</b></figcaption></figure>`
  }
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
  const coverRights = [...new Set([d.works[0].rights, d.works[1].rights, d.works[3].rights])].join(' ')
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

  /* 2. Career Milestone — 상단 3구간 바 + 회사 10곳 타일(오래된 순) */
  const per = s => (s.match(PERIOD) || [''])[0]
  const roleOf = s => s.replace(PERIOD, '').replace(/[·•]\s*$/, '').trim()
  const milestone = slide({
    eyebrow: l.milestone, who: `${PHASES[0][0]} – ${PHASES[2][1]}`,
    body: `
    <div class="ms-bar">${PHASES.map(([a, b, w], i) =>
      `<div class="ms-ph" style="flex:${w}"><b>${esc(l.phases[i])}</b><span>${a} – ${b}</span></div>`).join('')}</div>
    <div class="ms-rail"></div>
    <div class="ms-grid">${[...d.career].reverse().map(r => `
      <div class="ms-c"><b>${esc(r.company)}</b>
        <p class="per">${nw(per(r.sub))}</p>
        <p class="rl">${esc(roleOf(r.sub))}</p>
        <p class="ti">${esc(r.titles)}</p>
        <p class="im">${nw(r.impact)}</p></div>`).join('')}</div>`,
  })

  /* 3. 한 줄 요약 + 역량 4분류 */
  const summary = slide({
    eyebrow: l.summary, who: d.brand,
    body: `
    <h2 class="t t--sm">${esc(d.skillsTitle)}</h2>
    <p class="lede">${esc(pr(d.sub))}</p>
    <div class="cards4" style="margin-top:6mm">${d.skills.map(s => `
      <div class="sk"><h3>${esc(s.title)}</h3><p>${esc(s.note)}</p>
        ${s.cases.length ? `<p class="cs">${s.cases.map(esc).join('<br>')}</p>` : ''}</div>`).join('')}</div>
    <div class="stats">${d.stats.map(([n, k]) => `<div><b>${nw(n)}</b><span class="lb">${esc(k)}</span></div>`).join('')}</div>`,
  })

  /* 4·6·8. 사례 개요 — 키 비주얼 + KPI + 앞쪽 상세 행 */
  const caseOverview = (c, i) => slide({
    cls: 'case', attr: ` data-case="${esc(c.work)}"`,
    eyebrow: `${l.caseN(i + 1)} · ${l.overview}`, who: c.dlgMeta,
    pills: `<span class="pill pill--dark">${esc(c.state)}</span><span class="pill pill--line">${esc(c.tag)}</span>`,
    rights: workOf(c.dlgMeta).rights,
    body: `<div class="two two--l">
      ${shot(CASE_IMG[c.work], workOf(c.dlgMeta).title)}
      <div><h2 class="t case-h">${esc(c.dlgTitle)}</h2>
        <div class="kpi"><b>${nw(kpiFor(c.dlgMeta))}</b><span class="lb">${esc(l.tlKpi)}</span></div>
        ${kv(c.rows.slice(0, CASE_SPLIT[c.work]))}</div>
    </div>`,
  })

  /* 5·7·9. 사례 실행 — 뒤쪽 상세 행 + 캡처 3칸 + 근거 링크 */
  const caseExec = (c, i) => {
    /* 사례 3은 채택 캡처가 4장이라 2×2로 채우고, 근거 카드는 썸네일 없이 링크만 남긴다(자리가 없다) */
    const shots = EXEC_SHOTS[c.work]
    const tiles = c.work === 'case1'
      ? [tile('deco', d.proto[0].title), tile('ssjproto', d.proto[1].title), evTile(c)]
      : shots.length === 4 ? shots.map(doc) : [...shots.map(doc), evTile(c)]
    return slide({
      cls: 'case', attr: ` data-case="${esc(c.work)}"`,
      eyebrow: `${l.caseN(i + 1)} · ${l.exec}`, who: c.dlgTitle,
      pills: `<span class="pill pill--line">${esc(c.tag)}</span>`,
      rights: c.work === 'case1' ? d.proto[0].rights : workOf(c.dlgMeta).rights,
      body: `<div class="two two--r">
        <div>${kv(c.rows.slice(CASE_SPLIT[c.work]))}
          ${c.more ? `<div class="more"><h4>${esc(c.more.sum)}</h4><dl>${c.more.rows.map(([k, v]) =>
            `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></div>` : ''}</div>
        <div class="ig${tiles.length === 4 ? ' ig--4' : ''}">${tiles.join('')}${evLinks(c)}</div>
      </div>`,
    })
  }

  /* 10·11·12. 성과 3장 — 큰 KPI + 업무 요약 불릿 + 키 비주얼 + 옛 포폴 캡처 자리 */
  const result = ([wi, slug, shots]) => {
    const w = d.works[wi]
    const bullets = w.summary.split(/(?<=[.。])\s+/).filter(Boolean)
    return slide({
      cls: 'res', eyebrow: `${l.results} · ${w.title}`, who: w.meta, rights: w.rights,
      body: `<div class="two two--top">
        <div><p class="res-n">${nw(w.kpi)}</p><p class="res-l">${esc(l.tlKpi)}</p>
          <ul class="res-b">${bullets.map(b => `<li>${nw(b)}</li>`).join('')}</ul></div>
        <div class="ig">${tile(slug, w.title)}${shots.map(doc).join('')}</div>
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
    eyebrow: l.timeline, who: d.careerTitle,
    body: `<div class="two two--top">${tlRows(d.career.slice(0, half))}${tlRows(d.career.slice(half))}</div>
      <p class="foot">${esc(d.careerFoot)}</p>`,
  })

  /* 14. AI 프로토타입 2 + 가계부 1줄 */
  const proto = slide({
    eyebrow: l.proto, who: d.protoLede,
    rights: d.proto[0].rights,
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
    eyebrow: l.contact, who: `${l.issued} ${TODAY}`,
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
