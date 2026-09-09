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

/* ---------- 인쇄 CSS — A4 세로, 사이트 토큰·Pretendard, 섹션 단위 페이지 나눔 ---------- */
const CSS = `
@page{size:A4 portrait}
*{margin:0;padding:0;box-sizing:border-box}
:root{--fg:#111;--muted:#5b5b5b;--line:#e6e5e2;--surface:#f6f5f3;--ink:#0a0a0a}
html{font-size:11pt}
/* 한국어는 어절 단위로 끊는다 — 기본 줄바꿈은 '실행/으로'처럼 낱말을 쪼갠다(Codex R6) */
body{font-family:Pretendard,-apple-system,'Segoe UI',sans-serif;color:var(--fg);background:#fff;line-height:1.6;
  word-break:keep-all;
  -webkit-font-smoothing:antialiased;-webkit-print-color-adjust:exact;print-color-adjust:exact}
/* 쪽 나눔: 섹션은 새 쪽에서 시작하고, 카드·표·행·근거 그림은 쪼개지 않는다 */
section{break-before:page;break-inside:auto}
section:first-of-type{break-before:auto}
/* 연락만으로 한 쪽을 쓰지 않는다 — 앞 섹션에 이어 붙이고 쪼개지지만 않게 한다(Codex R7) */
section:last-of-type{break-before:auto;break-inside:avoid;margin-top:12mm}
.kv,tr,.card,.ev figure,.more,.stats,.note{break-inside:avoid}
.eyebrow,.sec-h,.lede{break-after:avoid}
h1,h2,h3,h4{font-weight:600;letter-spacing:-.01em;line-height:1.3;break-after:avoid}
a{color:inherit;text-decoration:none}
.eyebrow{font-size:.8rem;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.sec-h{font-size:1.5rem;margin:0 0 4mm}
.sec-h+.lede{margin:-2mm 0 5mm;color:var(--muted);font-size:.95rem}
/* 표지 — 절대배치·flex 정렬을 쓰지 않는다. 텍스트 추출 순서가 DOM 순서와 어긋난다(Codex R6) */
.cover{padding-top:60mm}
.cover .name{font-size:2.9rem;font-weight:600;letter-spacing:-.02em;line-height:1.1}
.cover .role{margin-top:2mm;font-size:1.05rem;color:var(--muted)}
.cover .head{margin-top:14mm;font-size:1.75rem;font-weight:600;line-height:1.35;max-width:150mm}
.cover .contact{margin-top:18mm;font-size:.95rem;color:var(--muted)}
.cover .contact p{margin-top:1.5mm}
.cover .contact b{font-weight:500;color:var(--fg);display:inline-block;min-width:26mm}
.cover .issued{margin-top:10mm;font-size:.85rem;color:var(--muted)}
/* 표 */
table{width:100%;border-collapse:collapse;font-size:.95rem;table-layout:fixed}
th,td{border-top:.4pt solid var(--line);padding:2.4mm 3mm 2.4mm 0;vertical-align:top;text-align:left}
th{font-weight:500;color:var(--muted)}
tr:last-child td,tr:last-child th{border-bottom:.4pt solid var(--line)}
.kv col:first-child{width:28mm}
.tl col:nth-child(1){width:46mm}
.tl col:nth-child(2){width:auto}
.tl col:nth-child(3){width:24mm}
.tl thead th{border-top:0;font-size:.8rem;letter-spacing:.04em;color:var(--muted)}
.tl td{padding-right:4mm}
.tl td.k{text-align:right;font-weight:500;padding-right:0}
.tl .sub{display:block;color:var(--muted);font-size:.85rem;margin-top:.8mm}
.nw{white-space:nowrap}
.tl .impact{display:block;color:#333;font-size:.88rem;margin-top:1.2mm}
/* 사례 */
.case-h{font-size:1.3rem;line-height:1.35;max-width:150mm}
.case-meta{font-size:.9rem;color:var(--muted);margin-bottom:1.5mm}
.pills{margin:3mm 0 4mm}
.pill{display:inline-block;border-radius:99px;padding:1mm 3mm;font-size:.8rem;line-height:1.5;margin-right:2mm}
.pill--dark{background:var(--ink);color:#fff}
.pill--line{border:.4pt solid #bdbcb9;color:var(--muted)}
.more{margin-top:3mm;border-top:.4pt solid var(--line);padding-top:2.5mm}
.more h4{font-size:.95rem;color:var(--muted);margin-bottom:2mm}
.more dt{font-size:.95rem;font-weight:500;margin-top:2mm}
.more dd{font-size:.9rem;color:#333}
/* 근거 카드 — 그림과 설명이 갈라지지 않게 통째로 묶는다 */
.ev{margin-top:3mm;display:grid;grid-template-columns:repeat(auto-fit,minmax(0,1fr));gap:3mm;break-inside:avoid}
.ev figure{border:.4pt solid var(--line);border-radius:2mm;overflow:hidden;background:var(--surface)}
.ev img{display:block;width:100%;height:26mm;object-fit:cover;object-position:top}
.ev figcaption{padding:2mm 2.5mm;font-size:.82rem;line-height:1.45}
.ev figcaption b{display:block;font-weight:500}
.ev figcaption .go{color:var(--muted);text-decoration:underline}
/* 카드형 */
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:5mm}
.card{border:.4pt solid var(--line);border-radius:2mm;overflow:hidden}
.card img{display:block;width:100%;height:42mm;object-fit:cover;object-position:center}
.card .in{padding:3mm}
.card h3{font-size:1.05rem}
.card p{margin-top:1.5mm;font-size:.9rem;color:#333}
.note{margin-top:2.5mm;font-size:.85rem;line-height:1.5;display:grid;grid-template-columns:20mm 1fr;gap:1.2mm 3mm}
.note p{display:contents}
.note b{font-weight:600}
.note .go{color:var(--muted);text-decoration:underline}
.rights{margin-top:2.5mm;font-size:.75rem;color:var(--muted)}
.stats{margin-top:5mm;display:grid;grid-template-columns:repeat(4,1fr);gap:4mm}
.stats b{display:block;font-size:1.5rem;font-weight:600}
.stats span{font-size:.85rem;color:var(--muted)}
.foot{margin-top:6mm;font-size:.85rem;color:var(--muted)}
.foot b{font-weight:600;color:var(--fg);margin-right:1mm}
.foot .go{color:var(--muted);text-decoration:underline}
.contact-end{margin-top:10mm;border-top:.4pt solid var(--line);padding-top:4mm}
.contact-line{margin-top:2mm;font-size:.95rem}
.contact-line b{display:inline-block;min-width:26mm;font-weight:600}
.contact-end .foot{margin-top:2.5mm}
`

/* EN 타임라인만 조인다 — 영어 문장이 길어 10행이 한 쪽을 넘겼다(Codex R7 PDF04). KO는 그대로 한 쪽에 든다. */
const TL_EN = `
.tl{font-size:.86rem}
.tl col:nth-child(1){width:42mm}
.tl col:nth-child(3){width:22mm}
.tl th,.tl td{padding:1.5mm 3mm 1.5mm 0;line-height:1.42}
.tl td{padding-right:3mm}
.tl .sub{font-size:.78rem;margin-top:.3mm;line-height:1.35}
.tl .impact{font-size:.8rem;margin-top:.6mm;line-height:1.38}
`

/* 인쇄물에만 있는 안내 라벨 — 사이트에 없는 문구는 여기서만 정의한다(본문은 전부 사이트에서 읽는다) */
const L = {
  ko: { doc:'포트폴리오', issued:'발행일', email:'이메일', site:'사이트', notion:'Notion 이력',
        evMore:'전체 근거는 사이트 상세창에서 볼 수 있습니다 — 총', timeline:'프로젝트 타임라인', tlCompany:'회사', tlTitle:'대표 타이틀', tlPeriod:'소속·직위·기간', tlKpi:'대표 지표',
        contact:'연락', open:'열기', auto:'이 문서는 사이트에서 자동 생성됐습니다.', demo:'체험판', evidence:'근거',
        summary:'한 줄 요약과 역량 4분류', numbers:'숫자로 남은 기록' },
  en: { doc:'Portfolio', issued:'Issued', email:'Email', site:'Site', notion:'Notion resume',
        evMore:'All evidence is in the site detail view — total', timeline:'Project timeline', tlCompany:'Company', tlTitle:'Titles', tlPeriod:'Team, role, period', tlKpi:'Headline number',
        contact:'Contact', open:'Open', auto:'This document is generated from the site.', demo:'Demo', evidence:'Evidence',
        summary:'Summary and the four areas', numbers:'The record in numbers' },
}
const KPI_OF = [['달콤', 0], ['Dalcom', 0], ['넥슨', 1], ['Nexon', 1], ['원더피플', 3], ['Wonderpeople', 3],
                ['스카이피플', 4], ['Skypeople', 4], ['넵튠', 5], ['Neptune', 5]]

function render(lang, d) {
  const l = L[lang]
  /* '56만+'의 '+'만 다음 줄로 떨어졌다(Codex R8-03) — 숫자가 든 토큰은 통째로 붙여 둔다 */
  const nw = (v) => esc(v).split(' ').map(w => (/\d/.test(w) ? `<span class="nw">${w}</span>` : w)).join(' ')
  /* EN 인쇄 페이지는 site/pdf/en/ 아래라 자산 경로가 한 단계 더 올라간다 */
  const UP = lang === 'en' ? '../../' : '../'
  /* 사례 1건 = 1쪽. 보조 사례(함께 보기)가 붙는 쪽은 그림 자리가 없어 근거 링크 줄로 대신한다(Codex R7). */
  const evFig = (c) => c.ev.slice(0, 2).map(e => {
    const id = e.href.replace(/^.*\//, '')
    const m = EV[id]
    if (!m) return ''
    const title = lang === 'en' && m.en ? m.en.title : m.title
    const go = lang === 'en' ? 'Open in Notion' : 'Notion에서 보기'
    return `<figure><img src="${UP}evidence/${esc(m.img)}" alt=""><figcaption><b>${esc(title)}</b><a class="go" href="${esc(NOTION + id)}">${esc(go)} ↗</a></figcaption></figure>`
  }).join('')
  const caseSec = (c) => `
<section>
  <p class="eyebrow">${esc(l.doc)} · ${esc(c.tag)}</p>
  <p class="case-meta">${esc(c.dlgMeta)}</p>
  <h2 class="case-h">${esc(c.dlgTitle)}</h2>
  <p class="pills"><span class="pill pill--dark">${esc(c.state)}</span><span class="pill pill--line">${esc(c.tag)}</span></p>
  <table class="kv"><colgroup><col><col></colgroup>${c.rows.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(pr(v))}</td></tr>`).join('')}</table>
  ${c.more ? `<div class="more"><h4>${esc(c.more.sum)}</h4><dl>${c.more.rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></div>` : ''}
  ${c.ev.length ? (c.more
    ? `<p class="foot"><b>${esc(l.evidence)}</b> ${c.ev.map(e => `<a class="go" href="${esc(e.href)}">${esc(e.title)} ↗</a>`).join(' · ')}</p>`
    : `<div class="ev">${evFig(c)}</div>${c.ev.length > 2 ? `<p class="foot"><a class="go" href="${esc(d.canonical + '#cases')}">${esc(l.evMore)} ${c.ev.length} ↗</a></p>` : ''}`) : ''}
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
        <p>${esc(pr(p.summary))}</p>
        <div class="note">${p.note.map(([k, v]) => `<p><b>${esc(k)}</b> ${esc(pr(v))}</p>`).join('')}
          <p><b>${esc(l.demo)}</b> <a class="go" href="${esc(d.canonical + p.href)}">${esc(l.open)} ↗</a></p></div>
        <p class="rights">${esc(p.rights)}</p>
      </div></div>`).join('')
  /* 사이트 푸터는 "© 2026 Henry Lim (임현택) 본 사이트의…"처럼 이름과 문장이 붙어 있다 */
  const legal = d.legal.replace(/^(©\s*\d{4}\s+Henry Lim(?:\s*\([^)]*\))?)\s+/, '$1 · ')
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
<style>${CSS}${lang === 'en' ? TL_EN : ''}</style>
</head>
<body>

<section class="cover">
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
</section>

<section>
  <p class="eyebrow">${esc(l.summary)}</p>
  <h2 class="sec-h">${esc(d.casesTitle)}</h2>
  <p class="lede">${esc(pr(d.sub))}</p>
  <table class="kv"><colgroup><col><col></colgroup>${d.skills.map(s => `<tr><th>${esc(s.title)}</th><td>${esc(s.note)}${s.cases.length ? `<br><span style="color:var(--muted);font-size:9pt">${s.cases.map(esc).join(' · ')}</span>` : ''}</td></tr>`).join('')}</table>
  <div class="stats">${d.stats.map(([n, k]) => `<div><b>${esc(n)}</b><span>${esc(k)}</span></div>`).join('')}</div>
</section>
${d.cases.map(caseSec).join('')}

<section>
  <p class="eyebrow">${esc(l.timeline)}</p>
  <h2 class="sec-h">${esc(d.careerTitle)}</h2>
  <table class="tl">
    <colgroup><col><col><col></colgroup>
    <thead><tr><th>${esc(l.tlCompany)}</th><th>${esc(l.tlPeriod)}</th><th style="text-align:right">${esc(l.tlKpi)}</th></tr></thead>
    <tbody>${d.career.map(r => `<tr><td><b>${esc(r.company)}</b><span class="sub">${esc(r.titles)}</span></td>
      <td>${esc(r.sub)}<span class="impact">${nw(r.impact)}</span></td>
      <td class="k">${nw(kpiFor(r.company))}</td></tr>`).join('')}</tbody>
  </table>
  <p class="foot">${esc(d.careerFoot)}</p>
</section>

<section>
  <p class="eyebrow">${esc(d.protoTitle)}</p>
  <h2 class="sec-h">${esc(d.protoLede)}</h2>
  <div class="grid2">${proto}</div>
  ${d.lab ? `<p class="foot"><b>${esc(d.lab.title)}</b> — ${esc(d.lab.summary)} <a class="go" href="${esc(d.lab.href)}">${esc(l.open)} ↗</a></p>` : ''}
</section>

<section class="contact-end">
  <p class="eyebrow">${esc(l.contact)}</p>
  <p class="contact-line"><b>${esc(d.brand)}</b>
    <a href="mailto:bluedaylol80@gmail.com">bluedaylol80@gmail.com</a> ·
    <a href="${esc(d.canonical)}">${esc(l.site)} ↗</a> ·
    <a href="${esc(HUB)}">${esc(l.notion)} ↗</a></p>
  <p class="foot">${esc(l.auto)} ${esc(l.issued)} ${TODAY} · ${esc(legal)}</p>
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
