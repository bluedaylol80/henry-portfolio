/**
 * 인쇄용 페이지 빌더 — site/pdf/index.html(KO) · site/pdf/en/index.html(EN)
 *
 * 원칙: 사이트가 원천이다. 문구를 두 벌로 만들지 않는다.
 * 그래서 손으로 옮겨 적지 않고, 로컬 서버(8787)에 뜬 사이트를 실브라우저로 열어
 * 렌더된 DOM 텍스트를 그대로 읽어 조립한다. 대표 사례 6항목은 상세창을 실제로 열어서 읽는다.
 * 근거 카드 썸네일·Notion URL은 site/evidence/index.json에서 가져온다.
 *
 * 사전 준비: python -m http.server 8787 --bind 127.0.0.1 --directory site
 * Usage: node scripts/build-print.mjs
 */
import puppeteer from 'puppeteer-core'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const BASE = 'http://127.0.0.1:8787'
const NOTION = 'https://limhenry.notion.site/'
const SITE = { ko: 'https://bluedaylol80.github.io/henry-portfolio/', en: 'https://bluedaylol80.github.io/henry-portfolio/en/' }
const HUB = NOTION + '0e48e826c73f4a7ab9c3522d7fb16ce5'
const EV = JSON.parse(readFileSync('site/evidence/index.json', 'utf8'))
const fail = m => { console.error('빌드 실패: ' + m); process.exit(1) }
const sleep = ms => new Promise(r => setTimeout(r, ms))
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/* 발행일은 하루 단위로 고정 — 같은 날 다시 빌드해도 결과가 흔들리지 않는다 */
const TODAY = new Date().toISOString().slice(0, 10)

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
        title: t(c.querySelector('.card-bot h3')).replace(/\s*\((새 창에서 열림|opens in a new window)\)\s*$/, ''),
        href: c.querySelector('.card-go').getAttribute('href'),
        summary: t(c.querySelector('.card-bot > p')),
        note: [...c.querySelectorAll('.demo-note p')].map(p => [t(p.querySelector('b')), t(p.querySelector('span'))]),
        rights: t(c.querySelector('.card-rights')),
        shot: (getComputedStyle(c.querySelector('.card-shot')).backgroundImage.match(/url\("?(.+?)"?\)/) || [])[1] || '',
      })),
      labTitle: t(document.querySelector('#lab .h2')),
      lab: (() => { const c = document.querySelector('#lab .card'); if (!c) return null
        return { meta: t(c.querySelector('.card-meta')), title: t(c.querySelector('.card-bot h3')).replace(/\s*(상세 보기|View details)\s*$/, ''),
          summary: t(c.querySelector('.card-bot > p')) } })(),
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
  for (const c of base.cases) if (c.rows.length !== 6) fail('사례 상세 6항목이 아니다: ' + c.title + ' ' + c.rows.length)
  return base
}

/* ---------- 인쇄 CSS — A4 세로, 사이트 토큰·Pretendard, 섹션 단위 페이지 나눔 ---------- */
const CSS = `
@page{size:A4 portrait;margin:16mm}
*{margin:0;padding:0;box-sizing:border-box}
:root{--fg:#111;--muted:#5b5b5b;--line:#e6e5e2;--surface:#f6f5f3;--ink:#0a0a0a}
html{font-size:10.5pt}
body{font-family:Pretendard,-apple-system,'Segoe UI',sans-serif;color:var(--fg);background:#fff;line-height:1.55;
  -webkit-font-smoothing:antialiased;-webkit-print-color-adjust:exact;print-color-adjust:exact}
section{break-before:page;padding-top:2mm}
section:first-of-type{break-before:auto}
h1,h2,h3,h4{font-weight:600;letter-spacing:-.01em;line-height:1.25}
.eyebrow{font-size:8.5pt;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.sec-h{font-size:15pt;margin:0 0 4mm}
.sec-h+.lede{margin:-2mm 0 5mm;color:var(--muted);font-size:9.5pt}
/* 표지 */
.cover{display:flex;flex-direction:column;justify-content:center;min-height:245mm}
.cover .name{font-size:30pt;font-weight:600;letter-spacing:-.02em}
.cover .role{margin-top:2mm;font-size:11pt;color:var(--muted)}
.cover .head{margin-top:14mm;font-size:20pt;font-weight:600;line-height:1.3;max-width:150mm}
.cover .contact{margin-top:18mm;display:flex;flex-direction:column;gap:1.5mm;font-size:9.5pt;color:var(--muted)}
.cover .contact b{font-weight:500;color:var(--fg);display:inline-block;min-width:22mm}
.cover .issued{margin-top:10mm;font-size:8.5pt;color:var(--muted)}
/* 표 */
table{width:100%;border-collapse:collapse;font-size:9.5pt}
th,td{border-top:.4pt solid var(--line);padding:2.2mm 0;vertical-align:top;text-align:left}
th{width:26mm;font-weight:500;color:var(--muted);padding-right:4mm}
tr:last-child td,tr:last-child th{border-bottom:.4pt solid var(--line)}
.tl th{width:auto}
.tl thead th{border-top:0;font-size:8.5pt;letter-spacing:.04em;color:var(--muted)}
.tl td.n{white-space:nowrap;color:var(--muted);font-size:9pt}
.tl td.k{white-space:nowrap;font-weight:500;text-align:right}
/* 사례 */
.case-h{font-size:13pt;line-height:1.35;max-width:150mm}
.case-meta{font-size:9pt;color:var(--muted);margin-bottom:1.5mm}
.pills{margin:3mm 0 4mm;display:flex;gap:2mm;flex-wrap:wrap}
.pill{border-radius:99px;padding:1mm 3mm;font-size:8.5pt;line-height:1.4}
.pill--dark{background:var(--ink);color:#fff}
.pill--line{border:.4pt solid #bdbcb9;color:var(--muted)}
.more{margin-top:5mm;border-top:.4pt solid var(--line);padding-top:3mm}
.more h4{font-size:9.5pt;color:var(--muted);margin-bottom:2mm}
.more dt{font-size:9.5pt;font-weight:500;margin-top:2.5mm}
.more dd{font-size:9pt;color:#333;line-height:1.5}
/* 근거 카드 */
.ev{margin-top:5mm;display:grid;grid-template-columns:1fr 1fr;gap:3mm}
.ev figure{border:.4pt solid var(--line);border-radius:2mm;overflow:hidden;background:var(--surface)}
.ev img{display:block;width:100%;height:auto}
.ev figcaption{padding:2mm 2.5mm;font-size:8pt;line-height:1.45}
.ev figcaption b{display:block;font-weight:500}
.ev figcaption span{color:var(--muted);word-break:break-all}
/* 카드형 */
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:5mm}
.card{border:.4pt solid var(--line);border-radius:2mm;overflow:hidden}
.card img{display:block;width:100%;height:auto}
.card .in{padding:3mm}
.card h3{font-size:11pt}
.card p{margin-top:1.5mm;font-size:9pt;color:#333}
.note{margin-top:2.5mm;font-size:8.5pt;line-height:1.5}
.note b{font-weight:500}
.note .u{color:var(--muted);word-break:break-all}
.rights{margin-top:2.5mm;font-size:7.5pt;color:var(--muted)}
.stats{margin-top:5mm;display:grid;grid-template-columns:repeat(4,1fr);gap:4mm}
.stats b{display:block;font-size:15pt;font-weight:600}
.stats span{font-size:8.5pt;color:var(--muted)}
.foot{margin-top:6mm;font-size:8.5pt;color:var(--muted)}
`

/* 인쇄물에만 있는 안내 라벨 — 사이트에 없는 문구는 여기서만 정의한다(본문은 전부 사이트에서 읽는다) */
const L = {
  ko: { doc:'포트폴리오', issued:'발행일', email:'이메일', site:'사이트', notion:'Notion 이력',
        timeline:'프로젝트 타임라인', tlCompany:'회사', tlTitle:'대표 타이틀', tlPeriod:'소속·직위·기간', tlKpi:'대표 지표',
        contact:'연락', auto:'이 문서는 사이트에서 자동 생성됐습니다.', demo:'체험판', evidence:'근거',
        summary:'한 줄 요약과 역량 4분류', numbers:'숫자로 남은 기록' },
  en: { doc:'Portfolio', issued:'Issued', email:'Email', site:'Site', notion:'Notion resume',
        timeline:'Project timeline', tlCompany:'Company', tlTitle:'Titles', tlPeriod:'Team, role, period', tlKpi:'Headline number',
        contact:'Contact', auto:'This document is generated from the site.', demo:'Demo', evidence:'Evidence',
        summary:'Summary and the four areas', numbers:'The record in numbers' },
}
const KPI_OF = [['달콤', 0], ['Dalcom', 0], ['넥슨', 1], ['Nexon', 1], ['원더피플', 3], ['Wonderpeople', 3],
                ['스카이피플', 4], ['Skypeople', 4], ['넵튠', 5], ['Neptune', 5]]

function render(lang, d) {
  const l = L[lang]
  /* EN 인쇄 페이지는 site/pdf/en/ 아래라 자산 경로가 한 단계 더 올라간다 */
  const UP = lang === 'en' ? '../../' : '../'
  const evFig = (c) => c.ev.slice(0, 3).map(e => {
    const id = e.href.replace(/^.*\//, '')
    const m = EV[id]
    if (!m) return ''
    const title = lang === 'en' && m.en ? m.en.title : m.title
    return `<figure><img src="${UP}evidence/${esc(m.img)}" alt=""><figcaption><b>${esc(title)}</b><span>${esc(NOTION + id)}</span></figcaption></figure>`
  }).join('')
  const caseSec = (c) => `
<section>
  <p class="eyebrow">${esc(l.doc)} · ${esc(c.tag)}</p>
  <p class="case-meta">${esc(c.dlgMeta)}</p>
  <h2 class="case-h">${esc(c.dlgTitle)}</h2>
  <p class="pills"><span class="pill pill--dark">${esc(c.state)}</span><span class="pill pill--line">${esc(c.tag)}</span></p>
  <table>${c.rows.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</table>
  ${c.more ? `<div class="more"><h4>${esc(c.more.sum)}</h4><dl>${c.more.rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></div>` : ''}
  ${c.ev.length ? `<div class="ev">${evFig(c)}</div>` : ''}
</section>`
  const kpiFor = (company) => {
    const hit = KPI_OF.find(([k]) => company.includes(k))
    return hit ? d.works[hit[1]].kpi : ''
  }
  const proto = d.proto.map(p => `
    <div class="card">${p.shot ? `<img src="${esc(UP + 'works/' + p.shot.replace(/^.*\/works\//, ''))}" alt="">` : ''}
      <div class="in">
        <p class="eyebrow">${esc(p.meta)}</p>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.summary)}</p>
        <div class="note">${p.note.map(([k, v]) => `<p><b>${esc(k)}</b> ${esc(v)}</p>`).join('')}
          <p class="u">${esc(l.demo)} — ${esc(SITE[lang] + p.href)}</p></div>
        <p class="rights">${esc(p.rights)}</p>
      </div></div>`).join('')
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(d.brand)} — ${esc(l.doc)}</title>
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<style>${CSS}</style>
</head>
<body>

<section class="cover">
  <p class="eyebrow">${esc(l.doc)}</p>
  <p class="name">${esc(d.brand)}</p>
  <p class="role">${esc(d.role)}</p>
  <p class="head">${d.h1.map(esc).join(' ')}</p>
  <div class="contact">
    <p><b>${esc(l.email)}</b> bluedaylol80@gmail.com</p>
    <p><b>${esc(l.site)}</b> ${esc(SITE[lang])}</p>
    <p><b>${esc(l.notion)}</b> ${esc(HUB)}</p>
  </div>
  <p class="issued">${esc(l.issued)} ${TODAY}</p>
</section>

<section>
  <p class="eyebrow">${esc(l.summary)}</p>
  <h2 class="sec-h">${esc(d.casesTitle)}</h2>
  <p class="lede">${esc(d.sub)}</p>
  <table>${d.skills.map(s => `<tr><th>${esc(s.title)}</th><td>${esc(s.note)}${s.cases.length ? `<br><span style="color:var(--muted);font-size:9pt">${s.cases.map(esc).join(' · ')}</span>` : ''}</td></tr>`).join('')}</table>
  <div class="stats">${d.stats.map(([n, k]) => `<div><b>${esc(n)}</b><span>${esc(k)}</span></div>`).join('')}</div>
</section>
${d.cases.map(caseSec).join('')}

<section>
  <p class="eyebrow">${esc(l.timeline)}</p>
  <h2 class="sec-h">${esc(d.careerTitle)}</h2>
  <table class="tl">
    <thead><tr><th>${esc(l.tlCompany)}</th><th>${esc(l.tlPeriod)}</th><th style="text-align:right">${esc(l.tlKpi)}</th></tr></thead>
    <tbody>${d.career.map(r => `<tr><td><b>${esc(r.company)}</b><br><span style="color:var(--muted);font-size:9pt">${esc(r.titles)}</span></td>
      <td class="n">${esc(r.sub)}<br><span style="color:#333">${esc(r.impact)}</span></td>
      <td class="k">${esc(kpiFor(r.company))}</td></tr>`).join('')}</tbody>
  </table>
  <p class="foot">${esc(d.careerFoot)}</p>
</section>

<section>
  <p class="eyebrow">${esc(d.protoTitle)}</p>
  <h2 class="sec-h">${esc(d.protoLede)}</h2>
  <div class="grid2">${proto}</div>
  ${d.lab ? `<p class="foot"><b>${esc(d.lab.title)}</b> — ${esc(d.lab.summary)}</p>` : ''}
</section>

<section>
  <p class="eyebrow">${esc(l.contact)}</p>
  <h2 class="sec-h">${esc(d.brand)}</h2>
  <table>
    <tr><th>${esc(l.email)}</th><td>bluedaylol80@gmail.com</td></tr>
    <tr><th>${esc(l.site)}</th><td>${esc(SITE[lang])}</td></tr>
    <tr><th>${esc(l.notion)}</th><td>${esc(HUB)}</td></tr>
  </table>
  <p class="foot">${esc(l.auto)} ${esc(l.issued)} ${TODAY}</p>
  <p class="foot">${esc(d.legal)}</p>
</section>

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
console.log('  사례 ' + ko.cases.length + '건 · 경력 ' + ko.career.length + '행 · 성과 카드 ' + ko.works.length + '장 · 프로토 ' + ko.proto.length + '장')
