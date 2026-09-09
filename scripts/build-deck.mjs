/**
 * HTML 발표자료(덱) 빌더 — site/deck/index.html · site/henry-lim-portfolio-deck.html
 *
 * 원칙은 인쇄 빌더와 같다: 사이트가 원천이다. 문구를 두 벌로 만들지 않는다.
 * 로컬 서버(8787)에 뜬 사이트를 실브라우저로 열어 렌더된 DOM 텍스트를 읽고,
 * 덱 전용 캡션·라벨만 이 파일의 표에서 가져온다.
 *
 * 판형은 16:9 슬라이드 17장(WO-29). 스테이지는 1920×1080 고정 좌표계이고,
 * 창 크기가 달라도 비율을 유지한 채 중앙에서 통째로 확대·축소된다.
 *
 * 산출 2종
 *  ① site/deck/index.html            — 사이트 페이지. 폰트·이미지는 상대 경로
 *  ② site/henry-lim-portfolio-deck.html — 제출용 단일 파일. 폰트·이미지 base64 내장
 *
 * 사전 준비: python -m http.server 8787 --bind 127.0.0.1 --directory site
 * Usage: node scripts/build-deck.mjs
 */
import puppeteer from 'puppeteer-core'
import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs'
import { hits as banHits } from './pdf-banned.mjs'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const BASE = 'http://127.0.0.1:8787'
const NOTION = 'https://limhenry.notion.site/'
const HUB = NOTION + '0e48e826c73f4a7ab9c3522d7fb16ce5'
const MAIL = 'bluedaylol80@gmail.com'
const SLIDES = 17
const fail = m => { console.error('빌드 실패: ' + m); process.exit(1) }
const sleep = ms => new Promise(r => setTimeout(r, ms))
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const TODAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date())

/* 화면 전용 안내를 덱 표현으로 바꾼다 — 덱에는 누를 카드가 없다(인쇄 빌더와 같은 규칙) */
const DECKIFY = [['카드를 누르면 체험판이 열립니다', '아래 링크에서 체험판이 열립니다'],
                 ['카드를 누르면 직접 플레이할 수 있습니다', '아래 링크에서 직접 플레이할 수 있습니다'],
                 ['카드를 누르면 근거까지 보입니다', '각 장의 근거 링크에서 근거까지 볼 수 있습니다'],
                 ['(달콤 상세창 "함께 보기")', '(사례 1 참조)']]
const pr = t => DECKIFY.reduce((a, [x, y]) => a.split(x).join(y), String(t))

/* ============================ 1. 사이트 스크레이프 ============================ */
async function scrape() {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 1200, deviceScaleFactor: 1 })
  await page.goto(BASE + '/', { waitUntil: 'networkidle2', timeout: 60000 })
  await page.waitForFunction(() => !document.getElementById('loader'), { timeout: 15000 }).catch(() => {})
  await sleep(1800)
  const d = await page.evaluate(() => {
    const t = el => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '')
    const all = (sel, f) => [...document.querySelectorAll(sel)].map(f)
    return {
      brand: t(document.querySelector('.hdr .brand')),
      role: t(document.querySelector('.hero .eyebrow')),
      h1: all('.h1 .line>span', t),
      sub: t(document.querySelector('.hero-sub')),
      heroKeys: all('.hero-keys li', t),
      casesTitle: t(document.querySelector('#cases .h2')),
      casesLede: t(document.querySelector('#cases .works-lede')),
      cases: all('#cases .case', c => ({
        meta: t(c.querySelector('.case-meta')),
        title: t(c.querySelector('.case-t')).replace(/\s*(상세 보기|View details)\s*$/, ''),
        steps: [...c.querySelectorAll('.case-steps > div')].map(x => [t(x.querySelector('dt')), t(x.querySelector('dd'))]),
        state: t(c.querySelector('.case-state')), tag: t(c.querySelector('.case-tag')),
        work: c.querySelector('.card-open').dataset.work,
      })),
      skillsTitle: t(document.querySelector('#skills .h2')),
      skills: all('#skills .row-li', r => ({ title: t(r.querySelector('.row-title')), note: t(r.querySelector('.row-note')),
        cases: [...r.querySelectorAll('.row-case')].map(t) })),
      worksTitle: t(document.querySelector('#works .h2')),
      works: all('#works .card', c => ({ meta: t(c.querySelector('.card-meta')), kpi: t(c.querySelector('.card-wm')),
        title: t(c.querySelector('.card-bot h3')).replace(/\s*(상세 보기|View details)\s*$/, ''),
        summary: t(c.querySelector('.card-bot > p')), rights: t(c.querySelector('.card-rights')) })),
      careerTitle: t(document.querySelector('#career .h2')),
      career: all('#career .row-li', r => ({ company: t(r.querySelector('.row-title')), titles: t(r.querySelector('.row-note')),
        sub: t(r.querySelector('.row-sub')), impact: t(r.querySelector('.row-impact')) })),
      careerFoot: t(document.querySelector('#career .row-foot')),
      protoTitle: t(document.querySelector('#proto .h2')),
      protoLede: t(document.querySelector('#proto .proto-lede')),
      proto: all('#proto .card', c => ({
        meta: t(c.querySelector('.card-meta')),
        title: (() => { const h = c.querySelector('.card-bot h3').cloneNode(true)
          h.querySelectorAll('.sr-only').forEach(n => n.remove()); return t(h) })(),
        href: c.querySelector('.card-go').getAttribute('href'),
        summary: t(c.querySelector('.card-bot > p')),
        note: [...c.querySelectorAll('.demo-note p')].map(p => [t(p.querySelector('b')), t(p.querySelector('span'))]),
        rights: t(c.querySelector('.card-rights')),
      })),
      canonical: document.querySelector('link[rel=canonical]').href,
      lab: (() => { const c = document.querySelector('#lab .card'); if (!c) return null
        return { title: t(c.querySelector('.card-bot h3')).replace(/\s*(상세 보기|View details)\s*$/, ''),
          summary: t(c.querySelector('.card-bot > p')), href: c.querySelector('.card-cta a').href } })(),
      stats: all('.stats-grid li', l => [t(l.querySelector('.stat-n')), t(l.querySelector('.stat-l'))]),
      legal: t(document.querySelector('.ft-legal')),
    }
  })
  const readDlg = () => page.evaluate(() => {
    const t = el => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '')
    return {
      dlgMeta: t(document.getElementById('wdlgM')), dlgTitle: t(document.getElementById('wdlgT')),
      rows: [...document.querySelectorAll('#wdlgR > div')].map(x => [t(x.querySelector('dt')), t(x.querySelector('dd'))]),
      ev: [...document.querySelectorAll('#wdlgN .ev-card')].map(a => ({ href: a.href, title: t(a.querySelector('.ev-t')) })),
    }
  })
  const openDlg = async k => {
    await page.evaluate(kk => document.querySelector(`.card-open[data-work="${kk}"]`).click(), k)
    await sleep(1600)
    const r = await readDlg()
    await page.keyboard.press('Escape'); await sleep(500)
    return r
  }
  for (const c of d.cases) Object.assign(c, await openDlg(c.work))
  d.res = {}
  for (const [, slug] of RESULTS) d.res[slug] = await openDlg(slug)
  await browser.close()

  if (d.cases.length !== 3) fail('대표 사례가 3장이 아니다: ' + d.cases.length)
  if (d.career.length !== 10) fail('경력 행이 10개가 아니다: ' + d.career.length)
  if (d.works.length !== 6) fail('성과 카드가 6장이 아니다: ' + d.works.length)
  if (d.skills.length !== 4) fail('역량 분류가 4개가 아니다: ' + d.skills.length)
  if (d.proto.length !== 2) fail('프로토타입 카드가 2장이 아니다: ' + d.proto.length)
  if (d.stats.length !== 4) fail('숫자 패널이 4칸이 아니다: ' + d.stats.length)
  for (const c of d.cases) if (c.rows.length < 7) fail('사례 상세 행이 모자란다: ' + c.title + ' ' + c.rows.length)
  for (const [, slug] of RESULTS) {
    const r = d.res[slug]
    if (!r || r.rows.length < 3) fail('성과 상세 행이 모자란다: ' + slug)
    if (!r.ev.length) fail('성과 근거 링크가 없다: ' + slug)
  }
  return d
}

/* ============================ 2. 덱 전용 표 ============================ */
/* 사이트에 없는 문구는 전부 여기에만 둔다 — 본문은 사이트에서 읽는다 */
const L = {
  doc: '발표자료', cover: 'Portfolio Deck', glance: '한눈에', milestone: 'Career Milestone',
  skills: '역량 4분류', top3: '대표 사례 3', judge: '판단', exec: '실행', numbers: '숫자로 증명',
  results: '성과', method: '업무 방식', proto: 'AI 프로토타입', companies: '회사별 상세', contact: '연락',
  caseN: n => `사례 ${n}`, evidence: '근거', demo: '체험판', open: '열기',
  email: '이메일', site: '사이트', notion: 'Notion 이력', pdf: '포트폴리오 PDF', issued: '발행일',
  before: '변경 전', after: '변경 후', decision: '결정 범위', deferred: '미룬 것', outcome: '결과·상태',
  act: '본인 행동', lab: '개인 프로덕트', period: '기간',
  phases: ['운영', '사업 PM', '기획·디렉터'],
  rightsPlain: '수치는 공개 이력 기준입니다 · 게임 명칭은 각 권리자의 상표입니다.',
  rightsNW: '나이트워커 개발 원더피플·에이스톰 · 퍼블리싱 넥슨.',
  rightsProto: '화면은 내부 정보를 제거한 공개용 요약본입니다 · 상표·저작권은 달콤소프트에 있습니다.',
}
/* 채택 캡처의 캡션 — 인쇄 빌더와 같은 문구를 쓴다(원본 폴더명·내부 문서명은 쓰지 않는다) */
const CAPS = {
  'lyn/before_after': '변경 전(1)·후(2) — 초반 안내 대화창·캐릭터 배치 정리(폴리싱 3건 중 초반 동선)',
  'lyn/system_ui': '시스템 UI 기획 — 개선안을 화면 흐름으로 정리한 기획 캡처',
  'nightwalker/server_flow_proposal': '서버 선택 플로우 제안 — 중국 SDK 흐름을 퍼블리셔 로그인·런처 기준으로 재정의',
  'nightwalker/server_flowchart_wire': '서버 선택 플로우차트 — 퍼블리셔 플랫폼과 개발사 영역 구분',
  'nightwalker/charge_flow': '보석 충전·프로모션 플로우 — 퍼블리셔 결제 정책에 맞춘 지급 흐름',
  'nightwalker/charge_ui_mock': '충전 UI 시안 — 프로모션 혜택을 충전 창에서 보여주는 개선안',
  'chaos/event_ui_plan': '이벤트 페이지 UI 기획안 — 미션 구조·보상 배치를 기획해 라이브 이벤트로 적용',
  'chaos/ingame': '인게임 전투 화면',
  'fivestars/prereg': '정식 런칭 사전예약 키 비주얼',
  'nanakage/update_plan': '1Q~2Q 업데이트 계획 — 소프트런칭 뒤 콘텐츠 순서를 정리한 계획',
  'nanakage/mission_ui': '미션 이벤트 UI — 일본 서비스 잔존 대응으로 제안한 미션 이벤트',
}
/* 사례 3 — 2레인 다이어그램의 레인 이름(캡처 캡션에서 온 덱 전용 라벨) */
const LANES = [['퍼블리셔 플랫폼', ['로그인', '런처']], ['개발사 영역', ['서버 선택', '캐릭터 생성']]]
const LANE_ARROW = '중국 SDK 흐름 → 퍼블리셔 규격'
/* 업무 방식 5단계 — 단계 이름만 덱 전용이고, 각 단계의 칩은 사이트에서 읽은 문장이다 */
const STEPS = [
  ['사용자 조사·지표', d => [d.cases[0].steps[0][1], d.cases[1].steps[0][1]]],
  ['제품 판단', d => [d.cases[0].steps[1][1], d.cases[1].steps[1][1]]],
  ['개발 우선순위', d => [d.cases[2].steps[1][1], d.skills[0].cases[1]]],
  ['실행·출시', d => [d.cases[0].steps[2][1], d.cases[2].steps[2][1]]],
  ['라이브 운영·표준화', d => [d.skills[1].cases[1], d.skills[3].cases[0]]],
]
const KPI_NUM = { dalcom: '11→7', lyn: '183억', chaos: '98억', nightwalker: '33만+', fivestars: '24억', nanakage: '7개국' }
const KPI_DROP = [/\(기존 게시 승인분\)/g]
const KPI_TBL = (() => {
  const md = readFileSync('docs/handover/2026-09-08_numbers_basis_table.md', 'utf8')
  const by = new Map()
  for (const line of md.split('\n')) {
    const c = line.split('|').map(s => s.trim())
    if (c.length > 7 && /^\d+$/.test(c[1])) by.set(c[3], [c[5], c[6]])
  }
  const out = {}
  for (const [k, n] of Object.entries(KPI_NUM)) {
    if (!by.has(n)) fail(`수치 근거표에 '${n}'(${k}) 행이 없다`)
    out[k] = by.get(n)
  }
  return out
})()
const kpiLabel = slug => {
  const [def, per] = KPI_TBL[slug]
  const dd = KPI_DROP.reduce((a, re) => a.replace(re, ''), def).trim()
  return per && per !== '미상' ? `${dd} · ${per}` : dd
}
const CASE_IMG = { case1: 'dalcom', case2: 'lyn', case3: 'nightwalker' }
const WORK_IX = { dalcom: 0, lyn: 1, chaos: 2, nightwalker: 3, fivestars: 4, nanakage: 5 }
const RESULTS = [[2, 'chaos', ['chaos/event_ui_plan']], [4, 'fivestars', ['fivestars/prereg']],
                 [5, 'nanakage', ['nanakage/update_plan']]]
const PHASES = [['2006', '2011', 5], ['2011', '2021', 10], ['2021', '2026', 5]]
const PERIOD = /\d{4}\.\d{1,2}\s*[–—-]\s*(?:\d{4}\.\d{1,2}|현재)/
/* 4분류 아이콘 — 단순 선형 인라인 SVG(외부 아이콘 폰트 금지) */
const ICONS = {
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>',
  rocket: '<path d="M5 15l-1 5 5-1"/><path d="M9 15l-3-3c3-7 8-9 12-9 0 4-2 9-9 12z"/><circle cx="14.5" cy="9.5" r="1.6"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><path d="M16 5.6a3.2 3.2 0 010 5.6M18 20c0-2.4-.9-4.2-2.3-5.3"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.6M12 18.6v2.6M4.5 7.5l2.2 1.3M17.3 15.2l2.2 1.3M4.5 16.5l2.2-1.3M17.3 8.8l2.2-1.3"/>',
  hand: '<path d="M8 12V6.5a1.6 1.6 0 013.2 0V12"/><path d="M11.2 11V5.2a1.6 1.6 0 013.2 0V12"/><path d="M14.4 12V7.8a1.6 1.6 0 013.2 0V15c0 3.3-2.4 6-6 6s-6-2.7-6-6v-2.6a1.6 1.6 0 013.2 0"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.4l3.4 2"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.4l2.8 2.8L16 9.6"/>',
  arrow: '<path d="M4 12h15M13 6l6 6-6 6"/>',
}
const SKILL_ICONS = ['target', 'rocket', 'users', 'gear']
const EXEC_ICONS = { [L.act]: 'hand', [L.deferred]: 'clock', [L.outcome]: 'check' }

/* ============================ 3. 자산 (상대 경로 / base64) ============================ */
const IMG_DIR = 'site/pdf/img/'
const FONT = 'site/deck/fonts/SUIT-Variable.woff2'
const b64 = (p, mime) => `data:${mime};base64,` + readFileSync(p).toString('base64')
const makeAssets = inline => ({
  img: slug => (inline ? b64(IMG_DIR + slug + '.jpg', 'image/jpeg') : '../pdf/img/' + slug + '.jpg'),
  font: () => (inline ? b64(FONT, 'font/woff2') : 'fonts/SUIT-Variable.woff2'),
})

/* ============================ 4. CSS ============================ */
const css = fontUrl => `
*{margin:0;padding:0;box-sizing:border-box}
@font-face{font-family:SUIT;src:url('${fontUrl}') format('woff2-variations');
  font-weight:100 900;font-style:normal;font-display:swap}
:root{--bg:#F5F5F5;--ink:#26262B;--sub:#E62B1E;--tx:#1A1A1A;
  --m60:rgba(26,26,26,.62);--m38:rgba(26,26,26,.38);--m12:rgba(26,26,26,.12);
  --panel:#fff;--shot:#fff}
html,body{height:100%;overflow:hidden;background:var(--ink)}
body{font-family:SUIT,-apple-system,'Segoe UI',sans-serif;color:var(--tx);word-break:keep-all;
  -webkit-font-smoothing:antialiased;transition:background-color .35s ease}
a{color:inherit;text-decoration:none}
li{list-style:none}
.wrap{position:fixed;inset:0;overflow:hidden}
/* 1920×1080 고정 좌표계 — 창 크기와 무관하게 비율을 유지한 채 통째로 확대·축소된다.
   flex·grid 중앙 정렬은 스테이지가 창보다 클 때 시작 정렬로 되돌아간다(overflow 안전 정렬).
   그래서 좌표로 못 박는다: left/top 50% + translate(-50%,-50%) + scale. */
.stage{position:absolute;left:50%;top:50%;width:1920px;height:1080px;
  transform:translate(-50%,-50%) scale(var(--s,1));transform-origin:center center;overflow:hidden}
.s{position:absolute;inset:0;padding:70px 96px 92px;display:flex;flex-direction:column;
  background:var(--bg);color:var(--tx);opacity:0;visibility:hidden;transform:translateY(20px);
  transition:opacity .35s ease,transform .35s ease,visibility 0s linear .35s}
.s.on{opacity:1;visibility:visible;transform:none;transition:opacity .35s ease,transform .35s ease,visibility 0s}
.s--dark{--bg:var(--ink);--tx:#fff;--m60:rgba(255,255,255,.72);--m38:rgba(255,255,255,.42);
  --m12:rgba(255,255,255,.18);--panel:rgba(255,255,255,.06);--shot:rgba(255,255,255,.9)}
.s--acc{--bg:#1A1A1A;--tx:#fff;--m60:rgba(255,255,255,.72);--m38:rgba(255,255,255,.42);
  --m12:rgba(255,255,255,.18);--panel:rgba(255,255,255,.06);--shot:rgba(255,255,255,.9)}
/* 머리 */
.eb{font-size:22px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--m60)}
.eb::after{content:"";display:block;width:56px;height:4px;border-radius:2px;background:var(--sub);margin-top:14px}
.h{margin-top:22px;font-size:48px;font-weight:700;letter-spacing:-.022em;line-height:1.2;max-width:1560px}
.h--lg{font-size:56px}
.h--sm{font-size:40px}
.lede{margin-top:16px;font-size:28px;line-height:1.55;color:var(--m60);max-width:1450px}
.bd{flex:1;min-height:0;margin-top:36px;display:flex;flex-direction:column}
.rights{position:absolute;left:96px;right:300px;bottom:36px;font-size:22px;line-height:1.35;color:var(--m38)}
/* 숫자 */
.n{font-size:120px;font-weight:800;color:var(--sub);letter-spacing:-.04em;line-height:.92}
.n--md{font-size:96px}
.n--sm{font-size:72px}
.nl{margin-top:14px;font-size:22px;line-height:1.4;color:var(--m60)}
.nn{white-space:nowrap}
/* 블록 */
.pn{background:var(--panel);border:1px solid var(--m12);border-radius:24px;padding:32px 34px}
.ico{width:64px;height:64px;border-radius:50%;background:var(--sub);display:grid;place-items:center;flex:none}
.ico svg{width:32px;height:32px;fill:none;stroke:#fff;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.ico--sm{width:52px;height:52px}.ico--sm svg{width:26px;height:26px}
.chip{display:inline-block;border:1px solid var(--m12);border-radius:999px;padding:9px 18px;
  font-size:22px;line-height:1.35;color:var(--m60)}
.chip--dark{background:var(--tx);border-color:var(--tx);color:var(--bg)}
.chip--sub{background:var(--sub);border-color:var(--sub);color:#fff;font-weight:600}
/* 캡처 */
.shot{background:var(--shot);border:1px solid var(--m12);border-radius:20px;overflow:hidden;
  display:flex;flex-direction:column;min-height:0}
.shot img{display:block;width:100%;flex:1;min-height:0;object-fit:contain;background:#fff}
.shot figcaption{padding:14px 20px;font-size:22px;line-height:1.35;color:var(--m60);
  border-top:1px solid var(--m12);background:var(--panel)}
.shot--plain img{object-fit:cover}
/* 플로우 */
.flow{display:flex;flex-direction:column}
.fs{background:var(--panel);border:1px solid var(--m12);border-radius:20px;padding:22px 28px}
.fs b{display:block;font-size:22px;font-weight:700;letter-spacing:.08em;color:var(--sub);margin-bottom:10px}
.fs p{font-size:26px;line-height:1.5}
.farr{height:36px;display:grid;place-items:center;color:var(--m38)}
.farr svg{width:26px;height:26px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;transform:rotate(90deg)}
.frow{display:flex;align-items:stretch;gap:0}
.frow .fs{flex:1}
.frow .farr{width:52px;height:auto}
.frow .farr svg{transform:none}
/* 표 비슷한 행 */
.rows{display:flex;flex-direction:column;gap:22px}
.row{display:flex;gap:20px;align-items:flex-start}
.row .rt{font-size:22px;font-weight:700;letter-spacing:.06em;color:var(--sub);margin-bottom:8px}
.row p{font-size:24px;line-height:1.55}
.kv{display:grid;grid-template-columns:170px 1fr;gap:12px 22px;font-size:23px;line-height:1.5}
.kv dt{color:var(--m60);font-weight:600}
.ev{margin-top:auto;padding-top:20px;border-top:1px solid var(--m12);font-size:22px;line-height:1.5;color:var(--m60)}
.ev b{display:block;color:var(--tx);font-weight:700;margin-bottom:8px}
.ev a{display:inline-block;margin-right:24px;text-decoration:underline;text-underline-offset:4px}
/* 그리드 */
.g2{display:grid;grid-template-columns:1fr 1fr;gap:36px;flex:1;min-height:0}
.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:36px;flex:1;min-height:0}
.g4{display:grid;grid-template-columns:repeat(2,1fr);grid-template-rows:1fr 1fr;gap:32px;flex:1;min-height:0}
/* 표지 */
.cover{display:grid;grid-template-columns:740px 1fr;gap:56px;align-items:center;padding:70px 96px}
.cover .nm{font-size:84px;font-weight:800;letter-spacing:-.03em;line-height:1}
.cover .rl{margin-top:18px;font-size:28px;color:var(--m60)}
.cover .hl{margin-top:44px;font-size:52px;font-weight:700;line-height:1.28;letter-spacing:-.02em}
.cover .ct{margin-top:44px;font-size:24px;line-height:1.9;color:var(--m60)}
.cover .ct b{display:inline-block;min-width:212px;color:var(--tx);font-weight:600}
.mg{width:100%;height:820px}
/* 흐름 모션 — 왼쪽의 흩어진 점(요구)이 렌즈를 지나 오른쪽 정렬된 흐름선(실행)으로 */
.mg .lane{stroke:#fff;stroke-opacity:.16;stroke-width:1.5;fill:none}
.mg .lens{stroke:#fff;stroke-opacity:.3;stroke-width:2;fill:none}
.mg .lens2{stroke:var(--sub);stroke-opacity:.5;stroke-width:2;fill:none}
.mg .dot{transform:translate(var(--x2),var(--y1))}
.mg .dot circle{fill:#fff;fill-opacity:var(--o,.28)}
.mg .dot--sub circle{fill:#E62B1E;fill-opacity:.9}
@media (prefers-reduced-motion:no-preference){
  .mg .dot{animation:drift var(--dur,12s) linear var(--d,0s) infinite}
}
@keyframes drift{
  0%{transform:translate(var(--x0),var(--y0)) scale(.55);opacity:0}
  10%{opacity:1}
  46%{transform:translate(430px,var(--ym)) scale(1);opacity:1}
  62%{transform:translate(600px,var(--y1)) scale(.95)}
  92%{opacity:1}
  100%{transform:translate(1020px,var(--y1)) scale(.8);opacity:0}
}
/* Career milestone */
.msb{display:flex;gap:14px}
.msb div{border:1px solid var(--m12);border-radius:16px;padding:16px 22px;background:var(--panel)}
.msb b{display:block;font-size:24px;font-weight:700}
.msb span{font-size:22px;color:var(--m60)}
.msb div:nth-child(3){background:var(--tx);border-color:var(--tx);color:var(--bg)}
.msb div:nth-child(3) span{color:rgba(245,245,245,.7)}
.gantt{position:relative;height:46px;margin-top:22px}
.gantt i{position:absolute;top:0;height:46px;border-radius:10px;background:rgba(26,26,26,.16);
  display:grid;place-items:center;font-style:normal;font-size:22px;font-weight:700;color:var(--tx)}
.gantt i.on{background:var(--sub);color:#fff}
.axis{position:relative;height:34px;border-top:1px solid var(--m12);margin-top:8px}
.axis span{position:absolute;top:8px;font-size:22px;color:var(--m38);transform:translateX(-50%)}
.axis span:first-child{transform:none}.axis span:last-child{transform:translateX(-100%)}
.msg{flex:1;min-height:0;display:grid;grid-template-columns:repeat(5,1fr);grid-auto-rows:auto;
  align-content:space-around;gap:56px 24px;margin-top:30px}
.msc{border-top:3px solid var(--tx);padding-top:14px}
.msc b{display:block;font-size:24px;font-weight:700}
.msc b em{font-style:normal;color:var(--sub);margin-right:10px}
.msc .p{font-size:22px;color:var(--m60);margin-top:6px}
.msc .r{font-size:22px;margin-top:8px;line-height:1.4}
/* 회사별 상세 */
.co{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:repeat(5,auto);grid-auto-flow:column;
  gap:26px 56px;flex:1;min-height:0;align-content:start}
.cor{border-top:1px solid var(--m12);padding-top:16px;display:grid;grid-template-columns:1fr auto;gap:6px 20px}
.cor b{font-size:26px;font-weight:700}
.cor .k{font-size:30px;font-weight:800;color:var(--sub);letter-spacing:-.02em;white-space:nowrap}
.cor .p{grid-column:1/-1;font-size:22px;color:var(--m60);line-height:1.4}
.cor .t{grid-column:1/-1;font-size:22px;line-height:1.4}
/* 스텝 */
.steps{display:grid;grid-template-columns:repeat(5,1fr);gap:0;flex:none;align-items:stretch;margin:auto 0}
.st{position:relative;background:var(--panel);border:1px solid var(--m12);padding:30px 26px;display:flex;flex-direction:column}
.st:first-child{border-radius:24px 0 0 24px}
.st:last-child{border-radius:0 24px 24px 0}
.st+.st{border-left:none}
.st .no{font-size:22px;font-weight:800;color:var(--sub);letter-spacing:.1em}
.st h3{margin-top:12px;font-size:28px;font-weight:700;line-height:1.3}
.st ul{margin-top:22px;display:flex;flex-direction:column;gap:12px}
.st li{font-size:22px;line-height:1.45;color:var(--m60);padding-left:20px;position:relative}
.st li::before{content:"";position:absolute;left:0;top:11px;width:8px;height:8px;border-radius:50%;background:var(--sub)}
/* 조작 UI */
.bar{position:absolute;left:0;bottom:0;height:6px;background:var(--sub);width:0;transition:width .35s ease;z-index:5}
.cnt{position:absolute;right:96px;bottom:36px;font-size:24px;font-weight:600;z-index:5;letter-spacing:.04em;
  color:var(--uim,rgba(26,26,26,.55))}
.cnt em{font-style:normal;color:var(--ui,#1A1A1A)}
`

/* ============================ 5. 렌더 ============================ */
function render(d, A) {
  const IMGX = A.img
  const nw = v => esc(v).split(' ').map(w => (/\d/.test(w) ? `<span class="nn">${w}</span>` : w)).join(' ')
  const per = s => (s.match(PERIOD) || [''])[0]
  const roleOf = s => s.replace(PERIOD, '').replace(/[·•]\s*$/, '').trim()
  const kpiOf = slug => d.works[WORK_IX[slug]].kpi
  const workOf = slug => d.works[WORK_IX[slug]]
  const icon = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[k]}</svg>`
  const arrow = cls => `<div class="farr ${cls || ''}">${icon('arrow')}</div>`
  const shot = (slug, cap, style) => `<figure class="shot"${style ? ` style="${style}"` : ''}>
      <img src="${IMGX(slug)}" alt="${esc(cap)}">
      <figcaption>${esc(cap)}</figcaption></figure>`
  const doc = (slug, style) => shot(slug, CAPS[slug], style)
  const evList = ev => `<div class="ev"><b>${L.evidence}</b>${ev.map(e =>
    `<a href="${esc(e.href)}" target="_blank" rel="noopener">${esc(e.title)} ↗</a>`).join('')}</div>`
  const rightsOf = slug => workOf(slug).rights + (slug === 'nightwalker' ? ' ' + L.rightsNW : '')
  /* 같은 문장에서 회사 이름만 다른 권리 줄을 하나로 묶는다 — 세 줄을 이어 붙이면 같은 말이 세 번 반복된다 */
  const mergeRights = ss => {
    const u = [...new Set(ss)]
    if (u.length < 2) return u.join(' ')
    let a = 0, b = 0
    while (u.every(x => x[a] === u[0][a]) && a < u[0].length - 1) a++
    while (u.every(x => x[x.length - 1 - b] === u[0][u[0].length - 1 - b]) && b < u[0].length - a - 1) b++
    return u[0].slice(0, a) + u.map(x => x.slice(a, x.length - b)).join('·') + u[0].slice(u[0].length - b)
  }

  const slide = o => `
<section class="s${o.cls ? ' ' + o.cls : ''}" role="group" aria-roledescription="slide"
  aria-label="${esc(o.aria)}" data-bg="${o.bg || '#F5F5F5'}">
  ${o.raw || `<p class="eb">${esc(o.eyebrow)}</p>
  ${o.title ? `<h2 class="h${o.hcls ? ' ' + o.hcls : ''}">${esc(o.title)}</h2>` : ''}
  ${o.lede ? `<p class="lede">${esc(pr(o.lede))}</p>` : ''}
  <div class="bd">${o.body}</div>`}
  ${o.rights ? `<p class="rights">${esc(o.rights)}</p>` : ''}
</section>`

  /* --- 1. 표지 --- */
  const DOTS = 44
  const rnd = (() => { let s = 20260910; return () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648 })()
  const LANES_Y = [120, 220, 320, 420, 520, 620, 720]
  const dots = Array.from({ length: DOTS }, (_, i) => {
    const y0 = 40 + rnd() * 760, lane = LANES_Y[i % LANES_Y.length]
    const ym = y0 * 0.3 + lane * 0.7
    const sub = i % 7 === 3 && i < 44
    return `<g class="dot${sub ? ' dot--sub' : ''}" style="--x0:${(rnd() * 90).toFixed(0)}px;--y0:${y0.toFixed(0)}px;--ym:${ym.toFixed(0)}px;--y1:${lane}px;--x2:${(620 + rnd() * 60).toFixed(0)}px;--d:${(-rnd() * 12).toFixed(1)}s;--dur:${(11 + rnd() * 3).toFixed(1)}s;--o:${(0.2 + rnd() * 0.15).toFixed(2)}"><circle r="${sub ? 7 : 5}"/></g>`
  }).join('')
  const motion = (h) => `<svg class="mg" viewBox="0 0 1040 840" style="height:${h}px" aria-hidden="true" focusable="false">
    <g>${LANES_Y.map(y => `<path class="lane" d="M640 ${y} H1010"/>`).join('')}</g>
    <path class="lens" d="M430 90 C 530 300 530 540 430 750"/>
    <path class="lens2" d="M430 300 C 470 380 470 460 430 540"/>
    ${dots}</svg>`
  const cover = `
<section class="s s--dark cover" role="group" aria-roledescription="slide" aria-label="표지 — ${esc(d.brand)}" data-bg="#26262B">
  <div>
    <p class="eb">${esc(L.cover)}</p>
    <p class="nm" style="margin-top:26px">${esc(d.brand)}</p>
    <p class="rl">${esc(d.role)}</p>
    <p class="hl">${esc(d.h1.join(' '))}</p>
    <div class="ct">
      <p><b>${L.email}</b>${MAIL}</p>
      <p><b>${L.site}</b>${esc(d.canonical.replace(/^https?:\/\//, ''))}</p>
    </div>
  </div>
  <div>${motion(820)}</div>
</section>`

  /* --- 2. 한눈에 --- */
  const sents = pr(d.sub).split(/(?<=다\.)\s+/).filter(Boolean)
  const glance = slide({
    aria: '한눈에 — ' + d.role, eyebrow: L.glance, title: d.h1.join(' '), hcls: 'h--lg',
    rights: L.rightsPlain,
    body: `<div class="g2" style="grid-template-columns:1fr 860px;align-items:center">
      <ul style="display:flex;flex-direction:column;gap:26px">${sents.map(s =>
        `<li style="font-size:28px;line-height:1.55;padding-left:26px;position:relative">
          <span style="position:absolute;left:0;top:14px;width:10px;height:10px;border-radius:50%;background:var(--sub)"></span>${esc(s)}</li>`).join('')}
        <li style="margin-top:8px;display:flex;gap:12px;flex-wrap:wrap">${d.heroKeys.map(k => `<span class="chip">${esc(k)}</span>`).join('')}</li>
      </ul>
      <div style="display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:34px">
        ${d.stats.map(([n, k]) => `<div class="pn" style="display:flex;flex-direction:column;justify-content:center">
          <p class="n n--md">${nw(n)}</p><p class="nl">${esc(k)}</p></div>`).join('')}
      </div>
    </div>`,
  })

  /* --- 3. Career Milestone --- */
  const rows3 = [...d.career].reverse()
  const T0 = +PHASES[0][0], T1 = +PHASES[2][1]
  const at = ym => { const [y, m] = ym.split('.').map(Number); return ((y + (m - 1) / 12) - T0) / (T1 - T0) * 100 }
  const span = sub => {
    const p = per(sub); if (!p) fail('경력 기간을 못 읽었다: ' + sub)
    const [a, b] = p.split(/\s*[–—-]\s*/)
    return [Math.max(0, at(a)), Math.min(100, /\d/.test(b) ? at(b) : 100)]
  }
  const milestone = slide({
    aria: 'Career Milestone — 2006부터 2026까지', eyebrow: L.milestone, title: d.careerTitle, hcls: 'h--sm',
    rights: L.rightsPlain,
    body: `
    <div class="msb">${PHASES.map(([a, b, w], i) =>
      `<div style="flex:${w}"><b>${esc(L.phases[i])}</b><span>${a} – ${b}</span></div>`).join('')}</div>
    <div class="gantt">${rows3.map((r, i) => { const [x0, x1] = span(r.sub)
      return `<i class="${i % 2 ? 'on' : ''}" style="left:${x0.toFixed(2)}%;width:${(x1 - x0).toFixed(2)}%">${i + 1}</i>` }).join('')}</div>
    <div class="axis">${['2006', '2011', '2016', '2021', '2026'].map(y =>
      `<span style="left:${at(y + '.1').toFixed(2)}%">${y}</span>`).join('')}</div>
    <div class="msg">${rows3.map((r, i) => `
      <div class="msc"><b><em>${i + 1}</em>${esc(r.company)}</b>
        <p class="p">${nw(per(r.sub))}</p>
        <p class="r">${esc(roleOf(r.sub))}</p></div>`).join('')}</div>`,
  })

  /* --- 4. 역량 4분류 --- */
  const skills = slide({
    aria: '역량 4분류 — ' + d.skillsTitle, eyebrow: L.skills, title: d.skillsTitle, rights: L.rightsPlain,
    body: `<div class="g4">${d.skills.map((s, i) => `
      <div class="pn" style="display:flex;flex-direction:column">
        <div style="display:flex;align-items:center;gap:20px">
          <span class="ico">${icon(SKILL_ICONS[i])}</span>
          <h3 style="font-size:32px;font-weight:700">${esc(s.title)}</h3></div>
        <p style="margin-top:20px;font-size:24px;line-height:1.55">${esc(s.note)}</p>
        <div style="margin-top:auto;padding-top:22px;display:flex;gap:12px;flex-wrap:wrap">${
          s.cases.map(c => `<span class="chip">${esc(pr(c))}</span>`).join('')}</div>
      </div>`).join('')}</div>`,
  })

  /* --- 5. 대표 사례 3 (강조 장) --- */
  const top3 = slide({
    cls: 's--acc', bg: '#1A1A1A', aria: '대표 사례 3 — ' + d.casesTitle,
    eyebrow: L.top3, title: d.casesTitle, lede: d.casesLede, rights: L.rightsPlain,
    body: `<div class="g3" style="align-items:start">${d.cases.map((c, i) => {
      const slug = CASE_IMG[c.work]
      return `<div style="display:flex;flex-direction:column;border-top:3px solid var(--sub);padding-top:26px">
        <p style="font-size:22px;color:var(--m60);letter-spacing:.04em">${esc(c.dlgMeta)}</p>
        <h3 style="margin-top:16px;font-size:34px;font-weight:700;line-height:1.3">${esc(c.dlgTitle)}</h3>
        <p class="n n--sm" style="margin-top:28px">${nw(kpiOf(slug))}</p>
        <p class="nl">${esc(kpiLabel(slug))}</p>
        <p style="margin-top:26px;font-size:24px;line-height:1.55;color:var(--m60)">${esc(c.rows[0][1])}</p>
        <p style="margin-top:28px"><span class="chip chip--sub">${esc(c.state)}</span></p>
      </div>` }).join('')}</div>`,
  })

  /* --- 6·8·10. 사례 판단 --- */
  const judge = (c, i) => {
    const slug = CASE_IMG[c.work]
    const boxes = c.work === 'case1'
      ? [c.steps[0], c.steps[1], [L.decision, c.rows[4][1]]]
      : [c.steps[0], c.steps[1], c.steps[3]]
    const lanes = c.work === 'case3' ? `
      <div class="pn" style="margin-bottom:24px;padding:24px 28px">
        <p style="font-size:22px;font-weight:700;color:var(--sub);letter-spacing:.08em;margin-bottom:16px">${esc(LANE_ARROW)}</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">${LANES.map(([nm, chips], k) => `
          <div style="border-left:4px solid ${k ? 'var(--m38)' : 'var(--sub)'};padding-left:18px">
            <p style="font-size:24px;font-weight:700">${esc(nm)}</p>
            <p style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap">${chips.map(x =>
              `<span class="chip${k ? '' : ' chip--sub'}">${esc(x)}</span>`).join('')}</p></div>`).join('')}</div>
      </div>` : ''
    return slide({
      aria: `${L.caseN(i + 1)} 판단 — ${c.dlgTitle}`,
      eyebrow: `${L.caseN(i + 1)} · ${L.judge}`, title: c.dlgTitle, lede: c.dlgMeta,
      rights: rightsOf(slug),
      body: `<div class="g2" style="grid-template-columns:1fr 660px">
        <div style="display:flex;flex-direction:column;min-height:0">${lanes}
          <div class="flow">${boxes.map(([k, v], n) =>
            (n ? arrow() : '') + `<div class="fs"><b>${esc(k)}</b><p>${esc(v)}</p></div>`).join('')}</div>
        </div>
        <div style="display:flex;flex-direction:column;min-height:0">
          ${shot(slug, workOf(slug).title, 'flex:1;min-height:0')}
          <div class="pn" style="margin-top:26px;display:flex;align-items:flex-end;gap:26px">
            <p class="n">${nw(kpiOf(slug))}</p>
            <p class="nl" style="margin-bottom:10px">${esc(kpiLabel(slug))}</p></div>
        </div>
      </div>`,
    })
  }

  /* --- 7·9·11. 사례 실행 --- */
  const exec = (c, i) => {
    const rows = [[L.act, c.rows.find(r => r[0] === '본인 행동')[1]]]
    const deferred = c.rows.find(r => r[0] === L.deferred)
    if (deferred) rows.push([L.deferred, deferred[1]])
    rows.push([L.outcome, c.rows.find(r => r[0] === L.outcome)[1]])
    let tiles
    if (c.work === 'case1') {
      tiles = `<div style="display:grid;grid-template-rows:1fr 1fr;gap:24px;min-height:0">
        ${shot('deco', d.proto[0].title, 'min-height:0')}${shot('ssjproto', d.proto[1].title, 'min-height:0')}</div>`
    } else if (c.work === 'case2') {
      tiles = `<div style="display:grid;grid-template-rows:auto 1fr 1fr;gap:20px;min-height:0">
        <p style="display:flex;gap:12px;align-items:center;font-size:22px;color:var(--m60)">
          <span class="chip chip--dark">${L.before}</span><span style="color:var(--m38)">→</span><span class="chip chip--sub">${L.after}</span></p>
        ${doc('lyn/before_after', 'min-height:0')}${doc('lyn/system_ui', 'min-height:0')}</div>`
    } else {
      tiles = `<div style="display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:20px;min-height:0">
        ${doc('nightwalker/server_flow_proposal', 'min-height:0')}${doc('nightwalker/server_flowchart_wire', 'min-height:0')}
        ${doc('nightwalker/charge_flow', 'min-height:0')}${doc('nightwalker/charge_ui_mock', 'min-height:0')}</div>`
    }
    return slide({
      aria: `${L.caseN(i + 1)} 실행 — ${c.dlgTitle}`,
      eyebrow: `${L.caseN(i + 1)} · ${L.exec}`, title: c.title, hcls: 'h--sm',
      rights: c.work === 'case1' ? L.rightsProto : rightsOf(CASE_IMG[c.work]),
      body: `<div class="g2" style="grid-template-columns:1fr 780px">
        <div style="display:flex;flex-direction:column;min-height:0">
          <div class="rows">${rows.map(([k, v]) => `
            <div class="row"><span class="ico ico--sm">${icon(EXEC_ICONS[k])}</span>
              <div><p class="rt">${esc(k)}</p><p>${esc(v)}</p></div></div>`).join('')}</div>
          ${evList(c.ev)}
        </div>
        ${tiles}
      </div>`,
    })
  }

  /* --- 12. 숫자로 증명 (강조 장) --- */
  const numbers = slide({
    cls: 's--acc', bg: '#1A1A1A', aria: '숫자로 증명 — 6개 지표',
    eyebrow: L.numbers, title: d.worksTitle, rights: L.rightsPlain,
    body: `<div style="display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:auto;align-content:space-evenly;
      gap:30px 34px;flex:1;min-height:0">
      ${Object.keys(KPI_NUM).map(slug => `
        <div style="border-top:3px solid var(--sub);padding-top:22px">
          <p style="font-size:22px;color:var(--m60)">${esc(workOf(slug).title)}</p>
          <p class="n" style="margin-top:26px">${nw(kpiOf(slug))}</p>
          <p class="nl">${esc(kpiLabel(slug))}</p></div>`).join('')}
    </div>`,
  })

  /* --- 13. 성과 3장 --- */
  const results = slide({
    aria: '성과 — 카오스크로니클 · Five Stars · Shadow Seven', eyebrow: L.results,
    title: RESULTS.map(([wi]) => d.works[wi].title).join(' · '), hcls: 'h--sm',
    rights: mergeRights(RESULTS.map(([wi]) => d.works[wi].rights)),
    body: `<div class="g3">${RESULTS.map(([wi, slug, shots]) => {
      const w = d.works[wi], r = d.res[slug]
      const keep = r.rows.filter(([k, v]) => !banHits(k + ' ' + v).length).slice(0, 3)
      return `<div style="display:flex;flex-direction:column;min-height:0">
        ${doc(shots[0], 'height:300px;flex:none')}
        <div style="display:flex;align-items:flex-end;gap:18px;margin-top:24px">
          <p class="n n--sm">${nw(w.kpi)}</p>
          <p class="nl" style="margin-bottom:8px">${esc(kpiLabel(slug))}</p></div>
        <dl class="kv" style="margin-top:24px;grid-template-columns:150px 1fr">${keep.map(([k, v]) =>
          `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
        ${evList(r.ev.slice(0, 2))}
      </div>` }).join('')}</div>`,
  })

  /* --- 14. 업무 방식 5단계 --- */
  const method = slide({
    aria: '업무 방식 5단계', eyebrow: L.method, title: d.h1.join(' '), lede: d.casesLede,
    rights: L.rightsPlain,
    body: `<div class="steps">${STEPS.map(([nm, pick], i) => `
      <div class="st"><p class="no">0${i + 1}</p><h3>${esc(nm)}</h3>
        <ul>${pick(d).map(x => `<li>${esc(pr(x))}</li>`).join('')}</ul></div>`).join('')}</div>`,
  })

  /* --- 15. AI 프로토타입 --- */
  const proto = slide({
    aria: 'AI 프로토타입 2종', eyebrow: L.proto, title: d.protoTitle, lede: d.protoLede,
    rights: L.rightsProto,
    body: `<div class="g2">${d.proto.map((p, i) => `
      <div style="display:flex;flex-direction:column;min-height:0">
        ${shot(['deco', 'ssjproto'][i], p.title, 'flex:1;min-height:0')}
        <dl class="kv" style="margin-top:24px">${p.note.map(([k, v]) =>
          `<dt>${esc(k)}</dt><dd>${esc(pr(v))}</dd>`).join('')}
          <dt>${L.demo}</dt><dd><a href="${esc(d.canonical + p.href)}" target="_blank" rel="noopener"
            style="text-decoration:underline;text-underline-offset:4px">${L.open} ↗</a></dd></dl>
      </div>`).join('')}</div>`,
  })

  /* --- 16. 회사별 상세 --- */
  const KPI_BY_CO = [['달콤', 0], ['넥슨', 1], ['원더피플', 3], ['스카이피플', 4], ['넵튠', 5]]
  const companies = slide({
    aria: '회사별 상세 — 10개 회사', eyebrow: L.companies, title: d.careerTitle, hcls: 'h--sm',
    rights: L.rightsPlain + ' ' + d.careerFoot,
    body: `<div class="co">${d.career.map(r => {
      const hit = KPI_BY_CO.find(([k]) => r.company.includes(k))
      return `<div class="cor"><b>${esc(r.company)}</b>
        <span class="k">${hit ? nw(d.works[hit[1]].kpi) : ''}</span>
        <p class="p">${esc(r.sub)}</p><p class="t">${esc(r.titles)}</p></div>` }).join('')}</div>`,
  })

  /* --- 17. 연락 --- */
  const legal = d.legal.replace(/^(©\s*\d{4}\s+Henry Lim(?:\s*\([^)]*\))?)\s+/, '$1 · ')
  const contact = `
<section class="s s--dark cover" role="group" aria-roledescription="slide" aria-label="연락 — ${esc(d.brand)}" data-bg="#26262B">
  <div>
    <p class="eb">${esc(L.contact)}</p>
    <p class="nm" style="margin-top:26px;font-size:72px">${esc(d.brand)}</p>
    <p class="rl">${esc(d.role)}</p>
    <div class="ct" style="margin-top:40px">
      <p><b>${L.email}</b><a href="mailto:${MAIL}">${MAIL}</a></p>
      <p><b>${L.site}</b><a href="${esc(d.canonical)}" target="_blank" rel="noopener">${esc(d.canonical.replace(/^https?:\/\//, ''))}</a></p>
      <p><b>${L.notion}</b><a href="${esc(HUB)}" target="_blank" rel="noopener">${L.open} ↗</a></p>
      <p><b>${L.pdf}</b><a href="${esc(d.canonical + 'henry-lim-portfolio-ko.pdf')}" target="_blank" rel="noopener">${L.open} ↗</a></p>
    </div>
    <p style="margin-top:44px;font-size:22px;color:var(--m38);line-height:1.5">${esc(L.issued)} ${TODAY} · ${esc(legal)}</p>
  </div>
  <div>${motion(640)}</div>
</section>`

  const body = [cover, glance, milestone, skills, top3,
    judge(d.cases[0], 0), exec(d.cases[0], 0),
    judge(d.cases[1], 1), exec(d.cases[1], 1),
    judge(d.cases[2], 2), exec(d.cases[2], 2),
    numbers, results, method, proto, companies, contact]
  if (body.length !== SLIDES) fail('슬라이드가 ' + SLIDES + '장이 아니다: ' + body.length)

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(d.brand)} — ${esc(L.doc)}</title>
<meta name="description" content="${esc(d.h1.join(' '))}">
<meta name="robots" content="noindex">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Cpath fill='%23E62B1E' d='M24 2c2.2 13.8 7.9 19.6 22 22-14.1 2.4-19.8 8.2-22 22-2.2-13.8-7.9-19.6-22-22 14.1-2.4 19.8-8.2 22-22Z'/%3E%3C/svg%3E">
<style>${css(A.font())}</style>
</head>
<body>
<div class="wrap"><div class="stage" id="stage">
${body.join('\n')}
<div class="bar" id="bar"></div>
<p class="cnt" id="cnt" aria-hidden="true"><em>1</em> / ${SLIDES}</p>
</div></div>
<script>
(function(){
  var stage=document.getElementById('stage'),bar=document.getElementById('bar'),cnt=document.getElementById('cnt')
  var ss=[].slice.call(stage.querySelectorAll('.s')),N=ss.length,cur=-1
  function fit(){stage.style.setProperty('--s',Math.min(innerWidth/1920,innerHeight/1080))}
  function show(i,push){
    i=Math.max(0,Math.min(N-1,i)); if(i===cur)return; cur=i
    ss.forEach(function(s,k){s.classList.toggle('on',k===i);if(k===i){s.removeAttribute('inert')}else{s.setAttribute('inert','')}})
    var dk=ss[i].dataset.bg!=='#F5F5F5'
    document.body.style.background=ss[i].dataset.bg
    stage.style.setProperty('--ui',dk?'#fff':'#1A1A1A')
    stage.style.setProperty('--uim',dk?'rgba(255,255,255,.62)':'rgba(26,26,26,.55)')
    bar.style.width=((i+1)/N*100)+'%'
    cnt.innerHTML='<em>'+(i+1)+'</em> / '+N
    if(push!==false){history.replaceState(null,'','#'+(i+1))}
  }
  function fromHash(){var n=parseInt((location.hash||'').slice(1),10);return isFinite(n)&&n>=1&&n<=N?n-1:0}
  addEventListener('resize',fit); addEventListener('hashchange',function(){show(fromHash(),false)})
  addEventListener('keydown',function(e){
    var k=e.key
    if(k==='ArrowRight'||k==='ArrowDown'||k===' '||k==='PageDown'||k==='Enter'){show(cur+1);e.preventDefault()}
    else if(k==='ArrowLeft'||k==='ArrowUp'||k==='PageUp'||k==='Backspace'){show(cur-1);e.preventDefault()}
    else if(k==='Home'){show(0);e.preventDefault()}
    else if(k==='End'){show(N-1);e.preventDefault()}
    else if(k==='f'||k==='F'){if(document.fullscreenElement){document.exitFullscreen()}else{document.documentElement.requestFullscreen()};e.preventDefault()}
  })
  addEventListener('click',function(e){
    if(e.target.closest('a'))return
    show(e.clientX>innerWidth/3?cur+1:cur-1)
  })
  var tx=0,ty=0
  addEventListener('touchstart',function(e){tx=e.changedTouches[0].clientX;ty=e.changedTouches[0].clientY},{passive:true})
  addEventListener('touchend',function(e){
    var dx=e.changedTouches[0].clientX-tx,dy=e.changedTouches[0].clientY-ty
    if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)){show(dx<0?cur+1:cur-1)}
  },{passive:true})
  fit(); show(fromHash(),false)
})()
</script>
</body>
</html>
`
}

/* ============================ 6. 실행 ============================ */
const d = await scrape()
const A_rel = makeAssets(false), A_inline = makeAssets(true)
const page = render(d, A_rel)
const single = render(d, A_inline)

/* 금지어 게이트 — 인쇄물과 같은 목록을 본다.
   태그를 걷어내고 본문 텍스트만 본다: SVG 좌표(d="M12 2.8v2.6")나 점 위치(--ym:590px) 같은
   생성 좌표가 금지어처럼 읽히는 것을 막는다. */
const textOf = h => h.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<script[\s\S]*?<\/script>/g, ' ')
  .replace(/<[^>]+>/g, ' ')
for (const [nm, html] of [['site/deck/index.html', page], ['henry-lim-portfolio-deck.html', single]]) {
  const h = banHits(textOf(html))
  if (h.length) fail(`${nm}에 금지어가 남았다: ${h.join(', ')}`)
}
mkdirSync('site/deck', { recursive: true })
writeFileSync('site/deck/index.html', page, 'utf8')
writeFileSync('site/henry-lim-portfolio-deck.html', single, 'utf8')
const mb = statSync('site/henry-lim-portfolio-deck.html').size / 1048576
if (mb > 8) fail(`단일 파일이 8MB를 넘는다: ${mb.toFixed(2)}MB`)
console.log('생성: site/deck/index.html · site/henry-lim-portfolio-deck.html')
console.log(`  슬라이드 ${SLIDES}장 · 사례 ${d.cases.length}건 · 경력 ${d.career.length}행 · 단일 파일 ${mb.toFixed(2)}MB · 금지어 0`)
