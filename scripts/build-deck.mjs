/**
 * HTML 발표자료(덱) 빌더 — site/deck/index.html, site/henry-lim-portfolio-deck.html
 *
 * 원칙은 인쇄 빌더와 같다: 사이트가 원천이다. 문구를 두 벌로 만들지 않는다.
 * 로컬 서버(8787)에 뜬 사이트를 실브라우저로 열어 렌더된 DOM 텍스트를 읽고,
 * 덱 전용 캡션과 라벨만 이 파일의 표에서 가져온다.
 *
 * 판형은 16:9 슬라이드 19장(WO-29 17장 + WO-34 슈퍼피플 1장 + WO-42 사례 1 방향 제안 1장). 스테이지는 1920×1080 고정 좌표계이고,
 * 창 크기가 달라도 비율을 유지한 채 중앙에서 통째로 확대와 축소된다.
 *
 * 산출 2종
 *  ① site/deck/index.html            — 사이트 페이지. 폰트와 이미지는 상대 경로
 *  ② site/henry-lim-portfolio-deck.html — 제출용 단일 파일. 폰트와 이미지 base64 내장
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
const SLIDES = 19
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
    /* NBSP는 사이트가 일부러 넣은 줄바꿈 금지다(WO-31 §7) — 공백 정리에서 살려 덱까지 가져온다 */
    const t = el => (el ? el.textContent.replace(/[^\S\u00a0]+/g, ' ').trim() : '')
    const all = (sel, f) => [...document.querySelectorAll(sel)].map(f)
    return {
      brand: t(document.querySelector('.hdr .brand .nm')), /* 이름만 — 국문 헤더의 (임현택)은 덱과 PDF에 싣지 않는다 */
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
      /* key = 상세창 키(data-work) — 카드 순서가 바뀌어도 위치 번호에 기대지 않는다(WO-34 후속) */
      works: all('#works .card', c => ({ key: c.querySelector('.card-open').dataset.work,
        meta: t(c.querySelector('.card-meta')), kpi: t(c.querySelector('.card-wm')),
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
      hub: document.querySelector('[data-notion-hub]').href,
      lab: (() => { const c = document.querySelector('#lab .card'); if (!c) return null
        return { title: t(c.querySelector('.card-bot h3')).replace(/\s*(상세 보기|View details)\s*$/, ''),
          summary: t(c.querySelector('.card-bot > p')), href: c.querySelector('.card-cta a').href } })(),
      stats: all('.stats-grid li', l => [t(l.querySelector('.stat-n')), t(l.querySelector('.stat-l'))]),
      legal: t(document.querySelector('.ft-legal')),
    }
  })
  const readDlg = () => page.evaluate(() => {
    const t = el => (el ? el.textContent.replace(/[^\S\u00a0]+/g, ' ').trim() : '')
    return {
      dlgMeta: t(document.getElementById('wdlgM')), dlgTitle: t(document.getElementById('wdlgT')),
      rows: [...document.querySelectorAll('#wdlgR > div')].map(x => [t(x.querySelector('dt')), t(x.querySelector('dd'))]),
      ev: [...document.querySelectorAll('#wdlgN .ev-card')].map(a => ({ href: a.href, title: t(a.querySelector('.ev-t')) })),
      /* 슈퍼피플(WO-34) — 상세창 숫자, 이미지 캡션, 외부 링크도 사이트에서 읽는다 */
      stats: [...document.querySelectorAll('#wdlgS > div')].map(x => [t(x.querySelector('b')), t(x.querySelector('span'))]),
      gal: [...document.querySelectorAll('#wdlgG figure')].map(f => ({
        file: f.querySelector('img').getAttribute('src').split('/').pop(), cap: t(f.querySelector('figcaption')) })),
      links: [...document.querySelectorAll('#wdlgL a')].map(a => {
        const c = a.cloneNode(true); c.querySelectorAll('.sr-only').forEach(n => n.remove())
        return { href: a.href, title: t(c) } }),
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
  for (const [slug] of RESULTS) d.res[slug] = await openDlg(slug)
  /* 사례 2 흐름도의 소프트런칭 3개국은 린 상세창에 있다(9장 D6) */
  for (const slug of EXTRA_DLG) d.res[slug] = await openDlg(slug)
  await browser.close()

  if (d.cases.length !== 3) fail('대표 사례가 3장이 아니다: ' + d.cases.length)
  if (d.career.length !== 10) fail('경력 행이 10개가 아니다: ' + d.career.length)
  if (d.works.length !== 7) fail('성과 카드가 7장이 아니다: ' + d.works.length)
  if (d.skills.length !== 4) fail('역량 분류가 4개가 아니다: ' + d.skills.length)
  if (d.proto.length !== 2) fail('프로토타입 카드가 2장이 아니다: ' + d.proto.length)
  if (d.stats.length !== 4) fail('숫자 패널이 4칸이 아니다: ' + d.stats.length)
  for (const c of d.cases) if (c.rows.length < 7) fail('사례 상세 행이 모자란다: ' + c.title + ' ' + c.rows.length)
  for (const [slug] of RESULTS) {
    const r = d.res[slug]
    if (!r || r.rows.length < 3) fail('성과 상세 행이 모자란다: ' + slug)
    if (!r.ev.length) fail('성과 근거 링크가 없다: ' + slug)
  }
  const sp = d.res.superpeople
  if (sp.stats.length !== 2 || sp.links.length !== 2 || !SP_SHOTS.every(f => sp.gal.some(g => g.file === f)))
    fail(`슈퍼피플 상세가 발주서와 다르다: 숫자 ${sp.stats.length}, 링크 ${sp.links.length}, 이미지 ${sp.gal.map(g => g.file)}`)
  return d
}

/* ============================ 2. 덱 전용 표 ============================ */
/* 사이트에 없는 문구는 전부 여기에만 둔다 — 본문은 사이트에서 읽는다 */
const L = {
  doc: '발표자료', cover: 'Portfolio Deck', glance: '한눈에', milestone: 'Career Milestone',
  skills: '역량 4분류', top3: '대표 케이스 3종', judge: '판단', exec: '실행', numbers: '숫자로 증명',
  results: '성과', method: '업무 방식', proto: 'AI 프로토타입', companies: '회사별 상세', contact: '연락',
  caseN: n => `사례 ${n}`, evidence: '근거', demo: '체험판', open: '열기', tryOrder: '체험 순서',
  email: '이메일', site: '사이트', pdf: '포트폴리오 PDF', issued: '발행일',
  web: '포트폴리오 웹', cvKo: '이력서(KO)', cvEn: 'Resume(EN)', cv: '이력서', caseRep: 'Notion 대표 사례',
  before: '변경 전', after: '변경 후', decision: '결정 범위', deferred: '미룬 것', outcome: '결과와 상태',
  act: '본인 행동', lab: '개인 프로덕트', period: '기간', doneBy: '수행 회사',
  full: '문장은 발표용으로 줄였습니다, 전문은 사이트 상세에서 볼 수 있습니다.',
  role: '역할', verdict: '판단', result: '결과',
  phases: ['운영', '사업PM', '기획, 디렉터'],
  rightsPlain: '게임 명칭은 각 권리자의 상표입니다.',
  rightsNW: '나이트워커 개발 원더피플/에이스톰, 퍼블리싱 넥슨.',
  rightsProto: '화면은 내부 정보를 제거한 공개용 요약본입니다, 상표와 저작권은 달콤소프트에 있습니다.',
}
/* 덱의 바깥 링크는 전부 이 표 한곳에 둔다(본부장 결재 09-29).
   빌드 때 사이트 canonical, Notion 허브, HUB 상수와 대조해 하나라도 어긋나면 빌드를 멈춘다(checkLinks). */
const LINK = {
  web: 'https://bluedaylol80.github.io/henry-portfolio/',
  webEn: 'https://bluedaylol80.github.io/henry-portfolio/en/',
  cvKo: 'https://limhenry.notion.site/0e48e826c73f4a7ab9c3522d7fb16ce5',
  cvEn: 'https://limhenry.notion.site/3e859de7280481fcb58ece40d5a8be50',
  caseRep: 'https://limhenry.notion.site/71b99dcfd07f4493b019bfb4bac2acab',
  pdfKo: 'https://bluedaylol80.github.io/henry-portfolio/henry-lim-portfolio-ko.pdf',
  pdfEn: 'https://bluedaylol80.github.io/henry-portfolio/henry-lim-portfolio-en.pdf',
}
function checkLinks(d) {
  const en = readFileSync('site/en/index.html', 'utf8')
  const pick = (re, nm) => (en.match(re) || fail('EN 사이트에서 ' + nm + '을(를) 못 읽었다'))[1]
  if (d.hub !== HUB) fail(`사이트 Notion 허브가 HUB 상수와 다르다: ${d.hub} ≠ ${HUB}`)
  const want = {
    web: d.canonical, webEn: pick(/<link rel="canonical" href="([^"]+)"/, 'canonical'),
    cvKo: HUB, cvEn: pick(/data-notion-hub href="([^"]+)"/, 'Notion 이력서'),
    pdfKo: d.canonical + 'henry-lim-portfolio-ko.pdf', pdfEn: d.canonical + 'henry-lim-portfolio-en.pdf',
  }
  for (const k of Object.keys(LINK)) {
    if (k === 'caseRep') { if (!/^https:\/\/limhenry\.notion\.site\/[0-9a-f]{32}$/.test(LINK[k]) || !LINK[k].startsWith(NOTION)) fail('덱 링크 caseRep 형식이 Notion 공개 페이지가 아니다: ' + LINK[k]); continue }
    if (!(k in want)) fail('덱 링크 ' + k + '의 대조 기준이 없다')
    if (LINK[k] !== want[k]) fail(`덱 링크 ${k}가 사이트와 다르다: ${LINK[k]} ≠ ${want[k]}`)
  }
  for (const k of ['pdfKo', 'pdfEn']) { try { statSync('site/' + LINK[k].slice(d.canonical.length)) } catch { fail('덱 링크 ' + k + '의 PDF가 site/에 없다') } }
}
/* 채택 캡처의 캡션 — 인쇄 빌더와 같은 문구를 쓴다(원본 폴더명과 내부 문서명은 쓰지 않는다) */
const CAPS = {
  'lyn/before_after': '변경 전(1)과 후(2): 초반 안내 대화창과 캐릭터 배치 정리(폴리싱 3건 중 초반 동선)',
  'lyn/system_ui': '시스템 UI 기획: 개선안을 화면 흐름으로 정리한 기획 캡처',
  /* 12장 본문 취지 교체(11-13) — 「한국 퍼블리셔 규격으로 재정의」 대신 본부장 문구 */
  'nightwalker/server_flow_proposal': '서버 선택 플로우 제안: 중국 서비스의 플랫폼 기능을 국내 기능으로 수정',
  'nightwalker/server_flowchart_wire': '서버 선택 플로우차트: 퍼블리셔 플랫폼과 개발사 영역 구분',
  /* 공개 노션 쪽 제목과 그 그림의 화면 이름(그림 위 원문 표기) */
  'nightwalker/ingame': '유료 재화 구매 시스템 연동: 넥슨 캐시 웹페이지 호출 화면',
  'nightwalker/charge_flow': '유료 재화 충전과 프로모션 플로우: 퍼블리셔 결제 정책에 맞춘 지급 흐름',
  'nightwalker/charge_ui_mock': '충전 UI 시안: 프로모션 혜택을 충전 창에서 보여주는 개선안',
  'chaos/event_ui_plan': '이벤트 페이지 UI 기획안: 미션 구조와 보상 배치를 기획해 라이브 이벤트로 적용',
  'chaos/ingame': '인게임 전투 화면',
  'fivestars/prereg': '정식 런칭 사전 예약 키 비주얼',
  'nanakage/update_plan': '1Q~2Q 업데이트 계획: 소프트런칭 뒤 콘텐츠 순서를 정리한 계획',
  'nanakage/mission_ui': '미션 이벤트 UI: 일본 서비스 잔존 대응으로 제안한 미션 이벤트',
}
/* 사례 3 — 2레인 다이어그램의 레인 이름(캡처 캡션에서 온 덱 전용 라벨) */
const LANES = [['퍼블리셔 플랫폼', ['로그인', '런처']], ['개발사 영역', ['서버 선택', '캐릭터 생성']]]
const LANE_ARROW = '중국 SDK 흐름 → 퍼블리셔 규격'
/* 사례 1 — 「2026 방향성 제안」 3장(WO-42). 사이트에 없는 문구라 여기(덱 전용 표)에 둔다.
   출처 = 공개 Notion 「2026 상반기 방향성」(본부장 확정 원문 어휘), 사이트 사례 1 상세창. 글자 그대로 쓴다 — 고쳐 쓰지 않는다. */
const C1 = {
  title: '지표 분석과 유저 VOC를 2026 방향성 제안으로',
  summary: '지표 분석과 만족도 설문(유저 VOC)으로 2026 상반기 방향성을 제안하고, 프로토타입 제작과 실제 출시로 연결하다',
  /* 6장 = 문제 해결 7단계(본부장 결정 11-13). 단계 이름은 본부장 문구 그대로, 단계 아래 붙임은 지금 덱 6장 글을 줄인 것.
     붙임 칸: 문자열 = 글머리 한 줄, { gap } = 핵심 GAP 상자, { img } = 원문 발췌 그림 */
  diag: {
    eyebrow: '사례 1, 진단', ledeTail: ', 2025.11 만족도 설문 → 2026.05 출시',
    steps: [
      ['지표에서 유저 이탈과 매출 하락 발생', [{ drop: true }]],
      ['상세 지표 분석: 이벤트 곡 업데이트만으로는 Retention 유지에 한계', ["상위 유저는 '수집/테마 완성'에 높은 가치를 부여"]],
      ['인게임 팝업 배너로 만족도 설문', ['6개 타이틀, 한, 영, 일']],
      ['니즈 분석', ['수집, 꾸미기, 전시 요구 반복', '예전에 있던 웹뷰 이벤트의 복귀 요구']],
      ['사업, 프로덕트 관점으로 대응 방향 결정', ['현재 UI는 감상이 아닌 관리(List) 중심', { gap: true }, { img: true }]],
      ['웹뷰 이벤트 적용 방향 확정과 개발 진행', ['미니게임 → 꾸미기 이벤트 → 웹뷰 이벤트 순 출시']],
      ['진행과 결과 분석', [{ launched: true }]],
    ],
    gap: ['현재 서비스의 핵심 GAP', '“우리가 잘하는 것”과 “팬이 원하는 것”의 교집합을 제품으로 만든다'],
    img: 'direction/gap',
    cap: '원문 발췌, 현재 서비스의 핵심 GAP, 설문 수치 장표는 비공개',
  },
  dir: {
    eyebrow: '사례 1, 방향 제안', title: '3대 핵심 전략 방향으로 2026년 개발 방향 제시',
    lede: '「SuperStar 2026: 2026 상반기 라이브 프로젝트 방향성」 작성, 방향 4축(원문 3대 핵심 전략 방향)',
    /* [축, 내용, 칩]. 11-13 — 그림이 들어오며 원문 번호 줄과 원문 구호 줄은 뺐다 */
    axes: [['수집 완성', '도감을 채우고 완성하는 성취감, 단기/장기 목표 보상 설계'],
           ['감상/전시', '큰 화면 감상 UI, 꾸미기(Deco)', '꾸미기 이벤트로 실행'],
           ['개인화', '엔터 전체 vs 내 아티스트'],
           ['커뮤니티', '덱/프로필 방문, 아티스트 공통 미션']],
    /* 축 → [그림, 대체 글]. 대체 글은 사이트 카드 제목 그대로. 11-13 2차: 수집 완성은 본부장이 준 인게임 수집 화면,
       커뮤니티는 그림 대신 지금 덱 원문 구호를 큰 글자로(motto) */
    img: { '수집 완성': ['direction/collection', () => '인게임 수집 화면'], '감상/전시': ['deco', d => d.proto[0].title],
           '개인화': ['dalcom', d => d.works.find(w => w.key === 'dalcom').title], '커뮤니티': ['motto'] },
    motto: '"혼자 보는 수집에서, 서로 반응하는 공감으로"',
    applyLabel: '개발 방향 적용',
    apply: ['2026년 상반기 로드맵', '마일스톤 배치를 통한 개발 일정 조정', '기획 방향과 프로토타입 제작', '미니게임 → 꾸미기 이벤트 → 웹뷰 이벤트 순 출시'],
  },
  run: {
    eyebrow: '사례 1, 실행', title: '2026년 개선 방향성 제안을 프로토타입 제작과 실제 출시로 연결',
    tl: [['2025.12', '미니게임 v1', '기존 시스템으로 바로 적용할 수 있는 형식부터'],
         ['2026.01', '미니게임 v2', '타이틀별 순차 적용'],
         /* 설명이 배열이면 가운뎃점 자리를 줄바꿈으로 잇는다(구절 단위 한 줄씩 — 조종석 지시 09-30).
            줄이 다시 배열이면 조각마다 줄바꿈 금지 — 칸이 좁으면 조각 사이에서만 끊긴다 */
         ['2026.04.30 – 05.23', '꾸미기 이벤트', ['뷰잉 및 전시 경험 강화', ['SuperStar STAYC 신규 그룹 런칭에 맞춰', '핵심 기능만 출시'], 'Wireframe은 Claude Code 활용']],
         ['~2026.05', '10주년 웹뷰 이벤트', ['SuperStar JYP Nation', '웹뷰 이벤트 부활', '프로토타입은 Codex 활용']]],
    evFirst: '2026 상반기 방향성',
    areas: ['출시 타임라인', '결과', '프로토타입'],
  },
}
/* 4장 역량 4분류 — 덱 전용(WO-42 추가, 본부장 지시 09-30). 사이트 #skills 본문은 그대로 둔다.
   note = 덱 전용 설명(글자 그대로, 네 칸 모두 명사형 끝맺음 — WO-42 추가 3). co = 그 역량을 수행한 회사(경력 행 표기) */
const SKILLS_TITLE = '보유 핵심 역량'
const SKILLS_DECK = {
  '제품 판단과 마일스톤': { note: '조사와 지표로 무엇을 만들지 정하고, 기획과 개발 마일스톤으로 실행까지 끌고 가는 디렉터와 PM 역할', co: ['달콤소프트', '넥슨 코리아', '네오위즈'] },
  '출시와 라이브 실행': { note: '소프트런칭부터 런칭, 라이브 서비스, 서비스 종료까지, A~Z 모든 단계를 직접 진행', co: ['넥슨 코리아', '넵튠 레전드', '원더피플/에이스톰'] },
  '조직과 인력 운영': { note: '인력 리크루트부터 인력 배치, MM을 활용한 조직 세팅과 인력 효율 개선', co: ['달콤소프트', '스카이피플'] },
  '운영 표준화': { note: '반복, 비효율적인 업무를 규칙과 프로세스를 재정비하여 효율화', co: ['달콤소프트'] },
}
/* 16장 업무 방식 5단계(본부장 결정 11-13) — 그림 위주 덱 17장의 글을 그대로 옮긴다.
   [단계 이름, 사례 문장 2줄, 우선순위 결정 칸(03만)] */
const METHOD = {
  title: '사용자 요구에서 라이브까지',
  steps: [['사용자 조사와 지표', ['만족도 조사에서 예전 웹뷰 이벤트의 복귀 요구가 나왔다.', '소프트런칭에서 상품 구성, 재화 소비, 초반 이탈을 확인했다.']],
          /* 케이스 2 문장은 2차 순서(테스트 개선 + 소프트런칭 VOC → 최종 폴리싱)에 맞춘다(11-13 2차) */
          ['제품 판단', ['인게임 미니게임을 먼저 적용하고 웹뷰로 확장하기로 했다.', '테스트 개선과 소프트런칭 VOC를 최종 폴리싱 과제로 묶었다.']],
          ['개발 우선순위', ['퍼블리셔 정책과 API 문서를 기준으로 다시 정의했다.', '사례: 소프트런칭 VOC → 최종 폴리싱'],
            ['우선순위 결정', '대응 순서와 이벤트 범위(MVP)는 본인이 정했다.']],
          ['실행과 출시', ['꾸미기 이벤트 기획서를 쓰고 AI로 프로토타입을 만들었다.', '구매, 쿠폰, 서버 선택 UI/플로우 기획을 쓰고 협의했다.']],
          ['라이브 서비스와 표준화', ['성과: 카오스크로니클 서비스 종료', '성과: SKU 자동화와 어뷰징 SOP']]],
}
const KPI_NUM = { dalcom: '11종', lyn: '183억', chaos: '98억', nightwalker: '33만+', fivestars: '24억', nanakage: '7개국' }
const KPI_DROP = [/\(기존 게시 승인분\)/g]
const KPI_TBL = (() => {
  const md = readFileSync('docs/handover/2026-09-08_numbers_basis_table.md', 'utf8')
  const by = new Map()
  for (const line of md.split('\n')) {
    const c = line.split('|').map(s => s.trim())
    if (c.length > 7 && /^\d+$/.test(c[1])) by.set(c[3], [c[5], c[6]])
  }
  const out = {}
  /* 슈퍼피플은 13장(6개 지표) 대상이 아니라 KPI_NUM에 넣지 않고 라벨만 같은 근거표에서 읽는다 */
  for (const [k, n] of Object.entries({ ...KPI_NUM, superpeople: '56만+' })) {
    if (!by.has(n)) fail(`수치 근거표에 '${n}'(${k}) 행이 없다`)
    out[k] = by.get(n)
  }
  return out
})()
const kpiLabel = slug => {
  const [def, per] = KPI_TBL[slug]
  const dd = KPI_DROP.reduce((a, re) => a.replace(re, ''), def).trim()
  return per && per !== '미상' ? `${dd}, ${per}` : dd
}
/* 13장 라벨 — 괄호 속 국가 목록은 칸에서 쪼개져 떨어진다(D5). 기간은 둘째 줄로 내린다(D4) */
const kpiLabel2 = slug => {
  const [def, per] = KPI_TBL[slug]
  const dd = KPI_DROP.reduce((a, re) => a.replace(re, ''), def).replace(/\s*\([^)]*\)/g, '').trim()
  return esc(dd) + (per && per !== '미상' ? '<br>' + esc(per) : '')
}
const CASE_IMG = { case2: 'lyn', case3: 'nightwalker' }
/* 18장 티켓 핵심 내용 — 사이트 경력 행 기여 문장을 줄인 조각(1~2줄). 조각은 원문에 그대로 있어야 한다. 없는 회사는 원문 전체 */
const CO_SHORT = {
  '달콤소프트': ['서비스 방향성 제시', '담당 타이틀 매출 172억 기여'],
  '원더피플/에이스톰': ['나이트워커 신규 33만+, DAU 6.4만, D+1 52~56%', '슈퍼피플(스팀 중국) 런칭, 라이브 서비스'],
  '네오위즈': ['시스템 신규 10종과 개편 8종 기획', '개발 마일스톤 관리, 기획팀 채용'],
  '스카이피플': ['사업과 운영 조직 세팅', '사전 예약 20만, 신규 28만+, 매출 24억'],
  '넵튠 레전드': ['7개국 소프트런칭 → 그랜드런칭', '구글 평점 일본 3.29 → 글로벌 4.4'],
  '넥슨 코리아': ['린 매출 183억, 양대 마켓 3위', '카오스크로니클 98억, 7위, 피처드'],
  '소프트닉스': ['NTD 사내 테스트 2, FGI 4, FGT 2 설계', '5개 타이틀 유료화 분석, 남미 런칭 준비'],
  'NHN Service': ['Tera 웹 운영 파트 관리와 FUN QA 4종 게임성 분석', '아틀란티카와 R2 라이브 운영'],
}
/* 17장 체험 순서 단계 — 카드 순서(꾸미기, 10주년 웹뷰)대로 [칩 글, 사이트 문장 속 근거 조각] */
const TRY_STEPS = [
  [['꾸미기 화면', '꾸미기 화면'], ['아이템 고르기', '아이템을 고르고'], ['배치하기', '배치해']],
  [['주차 바꾸기', '주차를 바꾸고'], ['보상 잠금 비교', '보상 잠금 상태를 비교'], ['미션', '미션'], ['보상 수령', '보상 수령'], ['응모', '응모']],
]
/* 12장 제목 —덱에서만 본부장 문구로 바꾼다(11-13). 사이트 사례 3 제목은 그대로 */
const EXEC_TITLE = { case3: '중국 서비스의 플랫폼 기능을 국내 기능으로 수정' }
/* 케이스 2 순서(본부장 원문 11-13 2차: "기존 개선 + 소프트런칭에서 나온 VOC를 포함해 최종 폴리싱 해서 그랜드에 적용함").
   덱에서만 바꾸는 문장 [사이트 원문, 덱 문장]. 사이트 원문이 바뀌면 빌드를 멈춘다(덱 문장이 엉뚱한 자리에 덮이지 않게) */
const CASE2 = {
  title: ['소프트런칭 지표를 출시 전 개선으로', '테스트와 소프트런칭 VOC를 최종 폴리싱으로'],
  summary: ['3개국 소프트런칭 지표로 상품, 재화, 초반 동선 개선안을 정리해 글로벌 출시에 들어가다',
    '테스트 개선과 3개국 소프트런칭 VOC를 최종 폴리싱해 그랜드런칭에 적용하다'],
  verdict: ['상품, 재화, 초반 동선을 출시 전 개선 과제로 정리했다', '테스트 개선과 소프트런칭 VOC를 최종 폴리싱 과제로 묶었다'],
  exec: ['3개국 소프트런칭 지표로 상품, 재화, 초반 동선 개선안을 정리해 글로벌 출시로',
    '테스트 개선과 소프트런칭 VOC를 최종 폴리싱해 그랜드런칭에 적용'],
}
const c2 = (c, k, v) => {
  if (c.work !== 'case2') return v
  const [from, to] = CASE2[k]
  if (String(v).replace(/ /g, ' ') !== from) fail(`케이스 2 ${k} 사이트 원문이 바뀌었다: ${v}`)
  return to
}
/* 10장(사례 2 실행) 꼬리표 줄 — [꼬리표, 값, 근거 조각(값과 다를 때만)]. 근거 조각은 덱에 보이는 사이트 문장 안에 있어야 한다 */
const EXEC_LINES = {
  case2: {
    '본인 행동': [['FGT', '2018.06~07, 경쟁작 10종 기준 테스터 선발'], ['사내 테스트', '2018.11, 3일'],
      ['역할', '모바일사업실 팀장으로 이끌었다', '모바일사업실 팀장으로 이끌'], ['정리', '결과를 개발 요구로 정리했다']],
    '결과와 상태': [['출시', '2019 글로벌 그랜드런칭'], ['개선 3건', '상품 재구성, 거래소 시점/전용 상점, 초반 동선'],
      ['반영', '개선 3건은 그랜드런칭 빌드에 반영됐다'], ['프로젝트 순위', '한국 앱스토어와 구글 매출 최고 3위'],
      ['프로젝트 매출', '2019년 누적 매출 183억'], ['본인 기여', '테스트 리드, 빌드 개선 조율, 상품/재화 개선안 범위']],
  },
}
const RESULTS = [['chaos', ['chaos/event_ui_plan']], ['fivestars', ['fivestars/prereg']],
                 ['nanakage', ['nanakage/update_plan']]]
const EXTRA_DLG = ['lyn', 'superpeople']
/* 15장 슈퍼피플(WO-34 §3) — 이미지 2장(가공본)과 흐름 5칸. 칸 이름은 발주서 문안 그대로다 */
const SP_SHOTS = ['timeline.jpg', 'douyu-event.jpg']
const SP_FLOW = ['채널 운영', '이벤트와 콘텐츠', 'VOC', '지표 분석', '보고와 조치']
/* 14장 — 발주서 §2가 요구한 역할, 판단, 결과 3줄. 값은 사이트 상세창 행에서 읽고,
   어느 행이 어느 칸인지만 여기(덱 전용 표)에서 정한다. */
const RESULT_ROWS = {
  chaos: [['역할', '서비스 종료'], ['판단', '소프트런칭'], ['결과', '미국 성적']],
  fivestars: [['역할', '조직 세팅과 리크루트'], ['판단', '외주사와 계약 관리'], ['결과', '한국 성적']],
  /* Shadow Seven은 가운데 칸이 판단이 아니라 시스템 기획이다(WO-31 §6) — 칸 이름표도 그에 맞춘다 */
  nanakage: [['역할', '담당'], ['기획', '시스템 기획'], ['결과', '지표 → 조치 → 결과']],
}
/* 14장 칸에 다 안 들어가는 긴 나열 행 — 앞 n개 항목만 싣고 말줄임을 단다(자르기만, 고쳐 쓰지 않는다) */
const RESULT_CLIP = { '시스템 기획': 2 }
/* 쉼표 나열을 괄호 밖에서만 자른다 — 「BM과 패키지 구조(상자, 코스튬, 즉시 열기)」의 괄호 속 쉼표는 한 항목이다 */
const splitTop = v => {
  const xs = []
  let depth = 0, buf = ''
  for (let i = 0; i < v.length; i++) {
    const ch = v[i]
    if (ch === '(') depth++
    else if (ch === ')') depth--
    if (!depth && v.startsWith(', ', i)) { xs.push(buf); buf = ''; i++; continue }
    buf += ch
  }
  xs.push(buf)
  return xs
}
/* 역할 범례 — 칸 = [연도 문자열, 너비 비율]. 사업PM은 네오위즈(2021) 뒤 원더피플/에이스톰(2022–2024)에서 한 번 더 나온다 */
const PHASES = [['2006 – 2011', 5], ['2011 – 2021, 2022 – 2024', 11], ['2021, 2024 – 2026', 4]]
const AXIS = ['2006', '2026']
/* 3장 연표 — 회사별 역할 단계(PHASES 순서 번호). 범례 연도와 맞춘다(그림 위주 덱 3장과 같은 배정) */
const PHASE_OF = { '웹젠': 0, 'NHN Service': 0, '소프트닉스': 1, '넷마블 블루': 1, '넥슨 코리아': 1, '넵튠 레전드': 1,
  '스카이피플': 1, '네오위즈': 2, '원더피플/에이스톰': 1, '달콤소프트': 2 }
const GN_W = 300 /* 3장 회사 이름 칸 너비(px) */
/* 나열 잇기 — 둘이면 「A와 B」(받침에 따라 와/과), 셋 이상이면 쉼표 */
const andJoin = xs => {
  if (xs.length !== 2) return xs.join(', ')
  const c = xs[0].charCodeAt(xs[0].length - 1)
  return xs[0] + (c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? '과 ' : '와 ') + xs[1]
}

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
/* 6장 01단계 하락 아트웍(11-13 2차). 실제 자료처럼 보이지 않게 축, 눈금, 숫자, 단위가 없다.
   덱 색만: 옅은 막대(--m12), 먹 선(--tx), 꺾여 내려가는 끝 구간과 화살촉은 서브컬러(도형) */
const DROP_ART = `<svg viewBox="0 0 320 150" aria-hidden="true" style="display:block;flex:1 1 0;min-height:0;width:100%;margin-top:16px">
  ${[[24, 92], [76, 86], [128, 80], [180, 72], [232, 50], [284, 32]].map(([x, h]) => `<rect x="${x - 14}" y="${146 - h}" width="28" height="${h}" rx="5" style="fill:var(--m12)"/>`).join('')}
  <polyline points="8,40 62,52 112,44 166,66 214,58" style="fill:none;stroke:var(--tx);stroke-width:5;stroke-linecap:round;stroke-linejoin:round"/>
  <polyline points="214,58 292,128" style="fill:none;stroke:var(--sub);stroke-width:5;stroke-linecap:round"/>
  <path d="M300,136 L276,128 L292,112 Z" style="fill:var(--sub);stroke:var(--sub);stroke-width:3;stroke-linejoin:round"/>
</svg>`
const SKILL_ICONS = ['target', 'rocket', 'users', 'gear']
const EXEC_ICONS = { [L.act]: 'hand', [L.deferred]: 'clock', [L.outcome]: 'check' }

/* ============================ 3. 자산 (상대 경로 / base64) ============================ */
const IMG_DIR = 'site/pdf/img/'
const FONT = 'site/deck/fonts/SUIT-Variable.woff2'
/* 1과 19장 캔버스 모션 — 외부 라이브러리 없이 덱 HTML에 그대로 인라인한다(단일 파일 오프라인 동작) */
const MOTION_JS = readFileSync('scripts/deck-motion.js', 'utf8')
if (/<\/script/i.test(MOTION_JS)) fail('deck-motion.js에 </script>가 있다')
/* 2~18장 진입 모션(본부장 결재 11-12), 요소 분류와 시작 시각, 숫자 올리기. 움직임은 아래 CSS 키프레임 */
const ANIM_JS = readFileSync('scripts/deck-anim.js', 'utf8')
if (/<\/script/i.test(ANIM_JS)) fail('deck-anim.js에 </script>가 있다')
/* 사례 1 연결 밑줄, 진단 장 VOC 한 줄과 실행 장 타임라인 넷째 카드 한 줄. 글자 그대로 찾는다 */
const C1_LINK = { diag: '예전에 있던 웹뷰 이벤트의 복귀 요구', run: '웹뷰 이벤트 부활' }
const b64 = (p, mime) => `data:${mime};base64,` + readFileSync(p).toString('base64')
const makeAssets = inline => ({
  img: slug => (inline ? b64(IMG_DIR + slug + '.jpg', 'image/jpeg') : '../pdf/img/' + slug + '.jpg'),
  font: () => (inline ? b64(FONT, 'font/woff2') : 'fonts/SUIT-Variable.woff2'),
})
/* 원본 픽셀 크기 — JPEG 프레임 헤더에서 직접 읽는다.
   확대 금지(D9) 상한을 렌더 때 계산하려면 원본 크기를 알아야 한다. */
const natural = slug => {
  const b = readFileSync(IMG_DIR + slug + '.jpg')
  for (let i = 2; i < b.length - 9;) {
    if (b[i] !== 0xFF) { i++; continue }
    const m = b[i + 1]
    if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) {
      return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) }
    }
    i += 2 + b.readUInt16BE(i + 2)
  }
  return fail('이미지 크기를 못 읽었다: ' + slug)
}

/* ============================ 4. CSS ============================ */
const css = fontUrl => `
*{margin:0;padding:0;box-sizing:border-box}
@font-face{font-family:SUIT;src:url('${fontUrl}') format('woff2-variations');
  font-weight:100 900;font-style:normal;font-display:swap}
/* 보조색 규칙(WO-30 D1과 D2)
   --m60 = 본문 보조 글자. 어떤 배경에서도 4.5:1 이상이어야 한다.
   --m38 = 화살표와 구분선 같은 도형 전용. 3:1 이상. 글자에는 쓰지 않는다.
   서브컬러(#E62B1E)는 값이 고정이라 작은 글자에 쓰면 4.5:1을 못 넘는다.
   그래서 빨강은 28px 이상 굵은 글자, 도형, 선에만 쓰고, 작은 라벨은 굵기와 크기로 강조한다. */
:root{--bg:#F5F5F5;--ink:#26262B;--sub:#E62B1E;--tx:#1A1A1A;
  --m60:rgba(26,26,26,.62);--m38:rgba(26,26,26,.50);--m12:rgba(26,26,26,.12);
  --panel:#fff;--shot:#fff;
  /* 규격(11-13 2차): 안쪽 여백 2벌(작은 박스, 큰 패널), 간격 3벌(박스 사이, 단 사이, 화살표 칸). 지금 덱에서 가장 많이 쓰던 값으로 모았다.
     글 크기 단계마다 줄 간격 하나: 22~28px = 1.4, 32px = 1.3, 40px 이상 = 1.2 */
  --ps:22px 24px;--pl:32px 34px;--g:24px;--gc:36px;--ga:52px}
html,body{height:100%;overflow:hidden;background:var(--ink)}
body{font-family:SUIT,-apple-system,'Segoe UI',sans-serif;color:var(--tx);word-break:keep-all;
  -webkit-font-smoothing:antialiased;transition:background-color .35s ease}
a{color:inherit;text-decoration:none}
li{list-style:none}
.wrap{position:fixed;inset:0;overflow:hidden}
/* 1920×1080 고정 좌표계 — 창 크기와 무관하게 비율을 유지한 채 통째로 확대와 축소된다.
   flex와 grid 중앙 정렬은 스테이지가 창보다 클 때 시작 정렬로 되돌아간다(overflow 안전 정렬).
   그래서 좌표로 못 박는다: left/top 50% + translate(-50%,-50%) + scale. */
.stage{position:absolute;left:50%;top:50%;width:1920px;height:1080px;
  transform:translate(-50%,-50%) scale(var(--s,1));transform-origin:center center;overflow:hidden}
.s{position:absolute;inset:0;padding:70px 96px 92px;display:flex;flex-direction:column;
  background:var(--bg);color:var(--tx);opacity:0;visibility:hidden;transform:translateY(20px);
  transition:opacity .35s ease,transform .35s ease,visibility 0s linear .35s}
.s.on{opacity:1;visibility:visible;transform:none;transition:opacity .35s ease,transform .35s ease,visibility 0s}
.s--dark{--bg:var(--ink);--tx:#fff;--m60:rgba(255,255,255,.72);--m38:rgba(255,255,255,.52);
  --m12:rgba(255,255,255,.18);--panel:rgba(255,255,255,.06);--shot:rgba(255,255,255,.9)}
.s--acc{--bg:#1A1A1A;--tx:#fff;--m60:rgba(255,255,255,.72);--m38:rgba(255,255,255,.52);
  --m12:rgba(255,255,255,.18);--panel:rgba(255,255,255,.06);--shot:rgba(255,255,255,.9)}
/* 머리 */
.eb{font-size:22px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--m60)}
.eb::after{content:"";display:block;width:56px;height:4px;border-radius:2px;background:var(--sub);margin-top:14px}
.h{margin-top:22px;font-size:48px;font-weight:700;letter-spacing:-.022em;line-height:1.2;max-width:1560px}
.h--lg{font-size:56px}
.h--sm{font-size:40px}
.lede{margin-top:16px;font-size:28px;line-height:1.4;color:var(--m60);max-width:1450px}
.bd{flex:1;min-height:0;margin-top:36px;display:flex;flex-direction:column}
.rights{position:absolute;left:96px;right:300px;bottom:36px;font-size:22px;line-height:1.4;color:var(--m60)}
/* 숫자 */
.n{font-size:120px;font-weight:800;color:var(--sub);letter-spacing:-.04em;line-height:.92}
.n--md{font-size:96px}
.n--sm{font-size:72px}
.n--xs{font-size:56px}
.nl{margin-top:14px;font-size:22px;line-height:1.4;color:var(--m60)}
.nn{white-space:nowrap}
/* 줄바꿈 다듬기(WO-31 §7) — 큰 숫자는 한 줄로(D2), 본문은 끝줄 외톨이를 줄이고(D3), 칩, 목록, 제목은 줄 길이를 고르게(D7) */
.n{white-space:nowrap}
p,dd{text-wrap:pretty}
li,h2,h3,.h,.hl,.chip{text-wrap:balance}
/* 전→후 — 앞은 회색, 뒤는 서브컬러. 큰 숫자에만 쓴다(작은 빨강 금지) */
.ba i{font-style:normal;color:var(--m60)}
.ba u{text-decoration:none;color:var(--sub)}
.ba s{text-decoration:none;color:var(--m38);margin:0 .12em}
/* 블록 */
.pn{background:var(--panel);border:1px solid var(--m12);border-radius:24px;padding:var(--pl)}
.ico{width:64px;height:64px;border-radius:50%;background:var(--sub);display:grid;place-items:center;flex:none}
.ico svg{width:32px;height:32px;fill:none;stroke:#fff;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.ico--sm{width:52px;height:52px}.ico--sm svg{width:26px;height:26px}
.chip{display:inline-block;border:1px solid var(--m12);border-radius:999px;padding:9px 18px;
  font-size:22px;line-height:1.4;color:var(--m60)}
.chip--dark{background:var(--tx);border-color:var(--tx);color:var(--bg)}
/* 서브컬러 칩 — 면을 채우면 흰 글자가 4.5:1을 못 넘는다(빨강/흰 4.44:1).
   그래서 빨강은 테두리(선)로만 쓰고 글자는 텍스트색으로 둔다. */
.chip--sub{background:transparent;border:2px solid var(--sub);color:var(--tx);font-weight:700;padding:8px 17px}
/* 수행 회사 버튼(4장) — 링크 없는 표시용. 회색 칩보다 또렷하게: 본문색 굵은 글자 + 본문색 테두리 */
.cobtn{display:inline-block;border:2px solid var(--tx);border-radius:12px;padding:8px 18px;
  font-size:22px;font-weight:700;line-height:1.4;color:var(--tx);background:var(--panel)}
/* 캡처 */
.shot{background:var(--shot);border:1px solid var(--m12);border-radius:20px;overflow:hidden;
  display:flex;flex-direction:column;min-height:0;position:relative}
/* 원본보다 크게 늘리지 않는다 — 저해상 캡처가 흐려지는 것을 막는다(D9).
   max-width와 max-height는 렌더 때 원본 픽셀에서 계산해 인라인으로 박는다. */
.shot img{display:block;width:100%;flex:1;min-height:0;object-fit:contain;background:#fff;margin:0 auto}
/* 전과 후 배지 — 그림 모서리에 얹어 범례와 실제 화면을 잇는다(D6b) */
.bdg{position:absolute;top:14px;width:52px;height:52px;border-radius:50%;display:grid;place-items:center;
  font-size:28px;font-weight:800;color:#fff;z-index:2;box-shadow:0 2px 10px rgba(0,0,0,.28)}
.bdg--b{background:#26262B}
.bdg--a{background:var(--sub)}
.shot figcaption{padding:14px 20px;font-size:22px;line-height:1.4;color:var(--m60);
  border-top:1px solid var(--m12);background:var(--panel)}
.shot--plain img{object-fit:cover}
/* 플로우 */
.flow{display:flex;flex-direction:column}
.fs{background:var(--panel);border:1px solid var(--m12);border-radius:20px;padding:var(--ps)}
.fs b{display:block;font-size:22px;font-weight:800;letter-spacing:.08em;line-height:1.4;color:var(--tx);margin-bottom:8px}
.fs p{font-size:26px;line-height:1.4}
.farr{height:var(--g);display:grid;place-items:center;color:var(--m38)}
.farr svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;transform:rotate(90deg)}
.frow{display:flex;align-items:stretch;gap:0}
.frow .fs{flex:1}
.frow .farr{width:var(--ga);height:auto}
.frow .farr svg{width:26px;height:26px}
.frow .farr svg{transform:none}
/* 표 비슷한 행 */
.rows{display:flex;flex-direction:column;gap:var(--g)}
.row{display:flex;gap:20px;align-items:flex-start}
.row .rt{font-size:22px;font-weight:800;letter-spacing:.08em;line-height:1.4;color:var(--tx);margin-bottom:8px}
.row p{font-size:26px;line-height:1.4}
.kv{display:grid;grid-template-columns:170px 1fr;gap:12px var(--g);font-size:22px;line-height:1.4}
.kv dt{color:var(--m60);font-weight:600}
/* 10장 꼬리표 줄(11-13) — 한 줄에 한 사실, 글자 한 단계 크게 */
.kv--x{grid-template-columns:150px 1fr;gap:4px var(--g);font-size:26px;align-items:baseline}
.kv--x dt{font-size:22px}
/* 17장 체험 순서 — 번호 붙은 단계 칩(.chip)과 화살표(.farr와 같은 선 아이콘) */
.stps{display:flex;flex-wrap:wrap;align-items:center;gap:10px 6px}
.stp-g{display:inline-flex;align-items:center;gap:6px}
.stp{color:var(--tx);padding:7px 16px 7px 8px;display:inline-flex;align-items:center;gap:10px}
.stp b{width:34px;height:34px;border-radius:50%;background:var(--tx);color:var(--bg);display:grid;place-items:center;font-size:22px;font-weight:800}
.stp-a{color:var(--m38);display:inline-grid}
.stp-a svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.ev{margin-top:auto;padding-top:20px;border-top:1px solid var(--m12);font-size:22px;line-height:1.4;color:var(--m60)}
.ev b{display:block;color:var(--tx);font-weight:800;letter-spacing:.08em;margin-bottom:8px}
.ev a{display:inline-block;margin-right:24px;text-decoration:underline;text-underline-offset:4px}
/* 그리드 */
.g2{display:grid;grid-template-columns:1fr 1fr;gap:var(--gc);flex:1;min-height:0}
.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:var(--gc);flex:1;min-height:0}
.g4{display:grid;grid-template-columns:repeat(2,1fr);grid-template-rows:1fr 1fr;gap:var(--g);flex:1;min-height:0}
/* 표지 */
.cover{display:grid;grid-template-columns:740px 1fr;gap:56px;align-items:center;padding:70px 96px}
.cover .nm{font-size:84px;font-weight:800;letter-spacing:-.03em;line-height:1}
.cover .rl{margin-top:18px;font-size:28px;color:var(--m60)}
.cover .hl{margin-top:44px;font-size:52px;font-weight:700;line-height:1.28;letter-spacing:-.02em}
.cover .ct{margin-top:44px;font-size:24px;line-height:1.9;color:var(--m60)}
.cover .ct b{display:inline-block;min-width:212px;color:var(--tx);font-weight:600}
/* 1과 19장 모션(본부장 결재 11-05: 표지=C4, 마지막 장=E4) — scripts/deck-motion.js.
   캔버스는 1920×1080 스테이지 좌표 그대로 깔고 글자 아래에 둔다. 포인터를 받지 않아 링크 클릭을 가로채지 않는다. */
.mo{position:absolute;left:0;top:0;width:1920px;height:1080px;display:block;pointer-events:none}
.cover>div{position:relative;z-index:1}
.cover .hl{position:relative}
.hl .ln{display:block}
.hl .w{white-space:nowrap}
/* 표지 헤드라인 — 낱말마다 마스크(.w) 아래에서 떠오른다(.wi) */
.hl .w{display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.1em;margin-bottom:-.1em}
.hl .wi{display:inline-block;will-change:transform}
/* 등장 연출은 화면에서만 — 인쇄에서는 글자를 항상 완전히 보인다 */
@media print{.cover [data-d],.cover [data-n],.hl .wi{opacity:1!important;transform:none!important}}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.ct .sep{color:var(--m38);margin:0 .5em}
.ct a,.lk a{text-decoration:underline;text-decoration-color:var(--m38);text-underline-offset:5px}
.lk{position:absolute;left:96px;bottom:36px;z-index:1;font-size:22px;line-height:1.35;color:var(--m60)}
.lk .sep{color:var(--m38);margin:0 .6em 0 .1em}
/* Career milestone */
.msb{display:flex;gap:var(--g)}
.msb div{border:1px solid var(--m12);border-radius:16px;padding:var(--ps);background:var(--panel)}
.msb b{display:block;font-size:26px;font-weight:700;line-height:1.4}
.msb span{font-size:22px;line-height:1.4;color:var(--m60)}
/* 범례 칸의 단계 색 견본 — 막대와 같은 색(.p0~.p2) */
.msb .ph{display:inline-block;width:40px;height:18px;border-radius:6px;margin-right:12px;vertical-align:-1px}
/* 회사별 가로 막대 연표(11-13) — 단계 색: 운영 옅은 회색, 사업PM 짙은 회색, 기획/디렉터 서브컬러(도형이라 빨강 규칙에 맞다) */
.p0{background:rgba(26,26,26,.18)}.p1{background:rgba(26,26,26,.45)}.p2{background:var(--sub)}
.gc{position:relative;flex:1;min-height:0;display:flex;flex-direction:column;margin-top:22px}
.gl{position:absolute;top:0;bottom:34px;width:1px;background:var(--m12)}
.gr{display:grid;grid-template-columns:300px 1fr;align-items:center;flex:1}
.gr>b{font-size:26px;font-weight:700;line-height:1.4}
.gantt{position:relative;height:34px}
.gantt i{position:absolute;top:0;height:34px;border-radius:8px}
.gantt .yr{position:absolute;top:1.6px;line-height:1.4;font-size:22px;font-weight:600;color:var(--m60);white-space:nowrap}
.gantt .yr em{font-style:normal;font-weight:500;color:var(--tx);margin-left:14px}
.axis{position:relative;height:34px;border-top:1px solid var(--m12)}
.axis span{position:absolute;top:8px;font-size:22px;line-height:1.4;color:var(--m60);transform:translateX(-50%)}
.axis span:first-child{transform:none}.axis span:last-child{transform:translateX(-100%)}
/* 회사별 상세 */
/* 티켓 카드(11-13) — 면, 테두리, 모서리는 기존 카드(.pn). 절취선 = 오른쪽 숫자 칸 앞 점선, 그 위아래에 반원 홈(배경색 원을 카드 테두리에 얹는다) */
.co{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:repeat(5,1fr);grid-auto-flow:column;
  gap:var(--g) var(--gc);flex:1;min-height:0}
.tk{position:relative;display:grid;grid-template-columns:1fr 200px;background:var(--panel);border:1px solid var(--m12);border-radius:20px;min-height:0}
.tk::before,.tk::after{content:"";position:absolute;right:186px;width:28px;height:28px;border-radius:50%;
  background:var(--bg);border:1px solid var(--m12);z-index:2}
.tk::before{top:-15px;clip-path:inset(50% -1px -1px -1px)}
.tk::after{bottom:-15px;clip-path:inset(-1px -1px 50% -1px)}
/* 티켓 안 위아래 여백은 칸 높이에 맞춰 가운데 정렬(10장이 한 화면에 들어가는 조건이 먼저) */
.tk-m{padding:0 24px;display:flex;flex-direction:column;justify-content:center;min-width:0}
.tk-m b{font-size:26px;font-weight:700;line-height:1.4}
.tk-m .p{font-size:22px;color:var(--m60);line-height:1.4}
.tk-m .t{font-size:22px;line-height:1.4}
.tk-s{position:relative;display:grid;place-items:center}
.tk-s::before{content:"";position:absolute;left:-1px;top:18px;bottom:18px;border-left:2px dashed var(--m38)}
.tk .k{font-size:40px;font-weight:800;color:var(--sub);letter-spacing:-.02em;white-space:nowrap}
/* 스텝 */
/* 16장 업무 방식(11-13) — 칸 다섯이 화살표로 이어진다. 칸은 기존 카드(.pn과 같은 면, 테두리, 모서리), 번호는 큰 숫자 단계(72px) */
.steps{flex:none;margin:auto 0}
.st{flex:1;min-width:0;background:var(--panel);border:1px solid var(--m12);border-radius:24px;padding:var(--ps);min-height:560px;display:flex;flex-direction:column}
.st .no{font-size:72px;font-weight:800;color:var(--sub);letter-spacing:-.03em;line-height:.92}
.st .pri{margin-top:auto;padding-top:16px;border-top:2px solid var(--sub);font-size:22px;line-height:1.4}
.st .pri b{display:block;font-weight:800;margin-bottom:6px}
.st h3{margin-top:18px;font-size:26px;font-weight:700;line-height:1.4}
.st ul{margin-top:22px;display:flex;flex-direction:column;gap:12px}
.st li{font-size:22px;line-height:1.4;padding-left:20px;position:relative}
.st li::before{content:"";position:absolute;left:0;top:11px;width:8px;height:8px;border-radius:50%;background:var(--sub)}
/* 사례 1 진단 7단계(11-13) — 칸은 .fs, 번호는 업무 방식 장 번호(.st .no)와 같은 크기와 색 */
.s7{display:flex;flex-direction:column;min-height:0;padding:var(--ps)}
.s7 .no{font-size:30px;font-weight:800;color:var(--sub);letter-spacing:.06em}
.s7 .snm{margin-top:6px;font-size:26px;font-weight:700;line-height:1.4}
/* 조작 UI */
.bar{position:absolute;left:0;bottom:0;height:6px;background:var(--sub);width:0;transition:width .35s ease;z-index:5}
.cnt{position:absolute;right:96px;bottom:36px;font-size:24px;font-weight:600;z-index:5;letter-spacing:.04em;
  color:var(--uim,rgba(26,26,26,.62))}
.cnt em{font-style:normal;color:var(--ui,#1A1A1A)}
/* 세로 화면 안내 — 390×844에서는 스테이지가 219px라 읽을 수 없다. 가로로 돌리면 사라진다(D14). */
.rot{position:fixed;inset:0;z-index:20;display:none;place-items:center;text-align:center;
  background:#26262B;color:#fff;padding:40px}
.rot p{font-size:20px;font-weight:700;line-height:1.5}
.rot span{display:block;margin-top:10px;font-size:15px;color:rgba(255,255,255,.72);font-weight:400}
.rot svg{width:132px;height:72px;margin:0 auto 22px;display:block;fill:none;stroke:#E62B1E;stroke-width:1.6;
  stroke-linecap:round;stroke-linejoin:round}
@media (orientation:portrait) and (max-width:900px){.rot{display:grid}}
/* 2~18장 진입 모션(본부장 결재 11-12), scripts/deck-anim.js가 종류 클래스(a-*)와 시작 시각(--d)을 단다.
   키프레임은 시작 상태만 적고 끝은 원래 스타일로 돌아온다(backwards). 끝난 화면은 모션이 없던 덱과 같다.
   글자는 불투명도와 색만, 카드만 0.98→1. 장이 .on이 될 때마다 처음부터 다시 돈다.
   표지와 마지막 장(.cover)은 deck-motion.js의 캔버스 모션만 쓴다. 나머지 장은 장 전환에서 위로 미끄러지지 않는다. */
.s:not(.cover){transform:none}
.s.on .a-t{animation:a-t .35s cubic-bezier(.16,1,.3,1) var(--d) backwards}
.s.on .a-c{animation:a-c .45s cubic-bezier(.16,1,.3,1) var(--d) backwards}
.s.on .a-s{animation:a-s .5s cubic-bezier(.16,1,.3,1) var(--d) backwards}
.s.on .a-n{animation:a-n .7s linear var(--d) backwards}
.s.on .a-lb::before{animation:a-g .5s cubic-bezier(.65,0,.35,1) var(--d) backwards}
.s.on .a-g{animation:a-g .5s cubic-bezier(.65,0,.35,1) var(--d) backwards}
.s.on .farr.a-g:not(.frow>.farr){animation-name:a-gv}
.s.on .a-d{animation:a-d .2s cubic-bezier(.16,1,.3,1) var(--d) backwards}
.s.on:not(.cover) .eb::after{animation:a-g .3s cubic-bezier(.65,0,.35,1) backwards}
.s.on .c1u::after{animation:a-g .4s cubic-bezier(.65,0,.35,1) var(--d) backwards}
@keyframes a-t{from{opacity:0;color:var(--m12)}}
@keyframes a-c{from{opacity:0;transform:scale(.98)}}
@keyframes a-s{from{clip-path:inset(0 0 100% 0 round 20px)}to{clip-path:inset(0 0 0 0 round 20px)}}
@keyframes a-n{from{opacity:0}15%{opacity:1}}
@keyframes a-g{from{clip-path:inset(0 100% 0 0 round var(--gr,0px))}to{clip-path:inset(0 0 0 0 round var(--gr,0px))}}
@keyframes a-gv{from{clip-path:inset(0 0 100% 0)}to{clip-path:inset(0)}}
@keyframes a-d{from{opacity:0;transform:scale(0)}}
.gantt i{--gr:8px}
/* 칸 위 가로선, 모션 동안만 테두리를 비우고 같은 자리, 같은 색의 띠(::before)를 왼쪽에서 긋는다. 끝나면 deck-anim.js가 걷어 원래 테두리로 */
.a-lb{position:relative;border-top-color:transparent!important}
.a-lb::before{content:"";position:absolute;left:0;right:0;top:calc(-1 * var(--lw));height:var(--lw);background:var(--lc)}
/* 숫자 올리기 중에만 자리별 칸(deck-anim.js count). 칸은 최종 글자의 자리와 폭 그대로, 숫자는 칸 가운데(넓으면 양옆으로 고르게 넘침).
   숫자 글꼴 설정은 최종 화면과 같게 둬서 끝나는 순간 글자가 튀지 않는다. 빈 앞자리 칸(.e)은 최종 글자를 숨겨 기준선을 지킨다 */
.a-nv.run{display:inline-flex}
.a-nv.run>span{display:flex;justify-content:center;flex:none;position:relative}
.a-nv.run>.e{visibility:hidden}
/* 사례 1 연결 밑줄, 도형이라 빨강 규칙(28px 이상 굵은 글자와 도형)에 맞다. 최종 화면에 남는 유일한 추가 요소 */
.c1u{position:relative}
.c1u::after{content:"";position:absolute;left:0;right:0;bottom:-3px;height:4px;background:var(--sub)}
@media (prefers-reduced-motion:reduce){.s .a-t,.s .a-c,.s .a-s,.s .a-n,.s .a-lb::before,.s .a-g,.s .a-d,.s .eb::after,.c1u::after{animation:none!important}}
@media print{.s .a-t,.s .a-c,.s .a-s,.s .a-n,.s .a-lb::before,.s .a-g,.s .a-d,.s .eb::after,.c1u::after{animation:none!important}}
`

/* ============================ 5. 렌더 ============================ */
function render(d, A) {
  const IMGX = A.img
  const nw = v => esc(v).split(' ').map(w => (/\d/.test(w) ? `<span class="nn">${w}</span>` : w)).join(' ')
  const per = s => (s.match(PERIOD) || [''])[0]
  const roleOf = s => s.replace(PERIOD, '').replace(/[,·•]\s*$/, '').trim()
  const workOf = slug => d.works.find(w => w.key === slug) || fail('성과 카드가 없다: ' + slug)
  const kpiOf = slug => workOf(slug).kpi
  const icon = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[k]}</svg>`
  const arrow = cls => `<div class="farr ${cls || ''}">${icon('arrow')}</div>`
  /* 발표용 요약 — 첫 문장부터 n문장까지만 남긴다. 자르기만 하고 고쳐 쓰지 않는다(사실 왜곡 금지). */
  const sentsOf = t => pr(t).trim().split(/(?<=[다요]\.)\s+/)
  const brief = (t, n = 1) => sentsOf(t).slice(0, n).join(' ')
  const briefCut = (t, n = 1) => sentsOf(t).length > n
  /* 전→후 — 앞은 회색, 뒤는 서브컬러. 28px 이상 굵은 숫자에만 붙인다. */
  const BA = /^(.+?)\s*(?:→|>)\s*(.+)$/
  const ba = v => { const m = String(v).match(BA)
    return m ? `<span class="ba"><i>${esc(m[1])}</i><s>→</s><u>${esc(m[2])}</u></span>` : nw(v) }
  /* altOnly — 키 비주얼처럼 제목이 이미 옆에 있는 그림은 캡션 없이 대체텍스트만 둔다.
     band — 띠로 잘라 채운다(칸보다 원본이 넓을 때만 쓴다. 확대가 아니라 크롭이다). */
  const shot = (slug, cap, style, extra, altOnly, band) => {
    const { w, h } = natural(slug)
    const fit = band ? 'object-fit:cover' : `max-width:${w}px;max-height:${h}px`
    return `<figure class="shot"${style ? ` style="${style}"` : ''}>${extra || ''}
      <img src="${IMGX(slug)}" alt="${esc(cap)}" style="${fit}">
      ${altOnly ? '' : `<figcaption>${esc(cap)}</figcaption>`}</figure>`
  }
  const doc = (slug, style, extra) => shot(slug, CAPS[slug], style, extra)
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
    return u[0].slice(0, a) + andJoin(u.map(x => x.slice(a, x.length - b))) + u[0].slice(u[0].length - b)
  }

  /* 사례 1의 큰 숫자 — 11종은 달콤 앱 서비스 총괄 범위이지 이 이벤트의 결과가 아니다.
     사이트 '결과와 상태' 문장에 적힌 출시 항목을 세어 쓴다(D4). 11종은 13과 18장에만 남긴다. */
  const launched = (() => {
    const v = d.cases[0].rows.find(r => r[0] === L.outcome)[1]
    const m = v.match(/실제 출시\s*[:—–-]\s*(.+?)\.?\s*$/)
    if (!m) fail('사례 1 결과에서 출시 목록을 못 읽었다: ' + v)
    const items = []
    let depth = 0, buf = ''
    for (const ch of m[1]) {
      if (ch === '(') depth++
      else if (ch === ')') depth--
      if (ch === ',' && !depth) { items.push(buf); buf = '' } else buf += ch
    }
    items.push(buf)
    const names = items.map(s => s.replace(/\([^)]*\)/g, '').trim()).filter(Boolean)
    if (names.length !== 3) fail('사례 1 출시 항목이 3건이 아니다: ' + names.join(' / '))
    return [`출시 ${names.length}건`, names.join(', ')]
  })()
  const caseKpi = c => (c.work === 'case1' ? launched
    : [kpiOf(CASE_IMG[c.work]), kpiLabel(CASE_IMG[c.work])])

  const slide = o => `
<section class="s${o.cls ? ' ' + o.cls : ''}" role="group" aria-roledescription="slide"
  aria-label="${esc(o.aria)}" data-bg="${o.bg || '#F5F5F5'}">
  ${o.raw || `<p class="eb">${esc(o.eyebrow)}</p>
  ${o.title ? `<h2 class="h${o.hcls ? ' ' + o.hcls : ''}">${o.titleHtml || esc(o.title)}</h2>` : ''}
  ${o.lede ? `<p class="lede">${esc(pr(o.lede))}</p>` : ''}
  <div class="bd">${o.body}</div>`}
  ${o.rights ? `<p class="rights">${esc(o.rights)}</p>` : ''}
</section>`

  /* --- 1. 표지 --- C4 신호 정렬: 헤드라인은 낱말 단위로 쪼개 캔버스 줄과 같은 박자로 마스크 아래에서 떠오르게 한다.
     화면 낭독기는 쪼갠 낱말 대신 .sr의 한 문장을 읽는다. data-d = 등장 시작(ms) */
  if (d.h1.length !== 3) fail('표지 헤드라인이 3줄이 아니다(C4 타이밍은 3줄 기준): ' + d.h1.length)
  if (d.h1.join(' ').split(' ').length !== 9) fail('표지 헤드라인 낱말이 9개가 아니다(C4 타이밍은 9낱말 기준): ' + d.h1.join(' '))
  const ext = (href, txt) => `<a href="${esc(href)}" target="_blank" rel="noopener">${txt}</a>`
  const SEP = '<span class="sep" aria-hidden="true">,</span>'
  const words = d.h1.map(line => `<span class="ln">${line.split(' ').map(w =>
    `<span class="w"><span class="wi">${esc(w)}</span></span>`).join(' ')}</span>`).join('')
  const cover = `
<section class="s s--dark cover" role="group" aria-roledescription="slide" aria-label="표지: ${esc(d.brand)}" data-bg="#26262B" data-mo="C4">
  <canvas class="mo" aria-hidden="true"></canvas>
  <div>
    <p class="eb" data-d="0">${esc(L.cover)}</p>
    <p class="nm" style="margin-top:26px" data-d="80">${esc(d.brand)}</p>
    <p class="rl" data-d="160">${esc(d.role)}</p>
    <p class="hl"><span class="sr">${esc(d.h1.join(' '))}</span><span aria-hidden="true">${words}</span></p>
    <div class="ct" data-d="900">
      <p><b>${L.email}</b>${MAIL}</p>
      <p><b>${L.site}</b>${esc(LINK.web.replace(/^https?:\/\//, ''))}</p>
    </div>
  </div>
  <div></div>
  <p class="lk" data-d="1000">${[[LINK.web, L.web], [LINK.cvKo, L.cvKo], [LINK.cvEn, L.cvEn], [LINK.caseRep, L.caseRep]]
    .map(([h, t]) => ext(h, esc(t) + ' ↗')).join(SEP)}</p>
</section>`

  /* --- 2. 한눈에 --- */
  const sents = pr(d.sub).split(/(?<=다\.)\s+/).filter(Boolean)
  const glance = slide({
    aria: '한눈에: ' + d.role, eyebrow: L.glance, title: d.h1.join(' '), titleHtml: d.h1.map(esc).join('<br>'), hcls: 'h--lg',
    rights: L.rightsPlain,
    body: `<div class="g2" style="grid-template-columns:1fr 860px;align-items:center">
      <ul style="display:flex;flex-direction:column;gap:var(--g)">${sents.map(s =>
        `<li style="font-size:28px;line-height:1.4;padding-left:26px;position:relative">
          <span style="position:absolute;left:0;top:15px;width:10px;height:10px;border-radius:50%;background:var(--sub)"></span>${esc(s)}</li>`).join('')}
        <li style="display:flex;gap:12px;flex-wrap:wrap">${d.heroKeys.map(k => `<span class="chip">${esc(k)}</span>`).join('')}</li>
      </ul>
      <div style="display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:var(--g)">
        ${d.stats.map(([n, k]) => `<div class="pn" style="display:flex;flex-direction:column;justify-content:center">
          <p class="n n--md">${nw(n)}</p><p class="nl">${esc(k)}</p></div>`).join('')}
      </div>
    </div>`,
  })

  /* --- 3. Career Milestone --- */
  const rows3 = [...d.career].reverse()
  const ym = s => { const [y, m] = s.split('.').map(Number); return y + (m - 1) / 12 }
  const ends = rows3.map(r => { const p = per(r.sub); if (!p) fail('경력 기간을 못 읽었다: ' + r.sub)
    return p.split(/\s*[–—-]\s*/)[1] })
  /* 축 상한은 실제 마지막 종료월까지 잡는다 — 2026.01로 못 박으면 달콤(2026.07) 막대가 잘린다(D5) */
  const T0 = ym(AXIS[0] + '.1')
  const T1 = Math.max(ym(AXIS[1] + '.1'), ...ends.filter(e => /\d/.test(e)).map(ym))
  const at = s => (ym(s) - T0) / (T1 - T0) * 100
  const span = sub => {
    const p = per(sub)
    const [a, b] = p.split(/\s*[–—-]\s*/)
    return [Math.max(0, at(a)), Math.min(100, /\d/.test(b) ? at(b) : 100)]
  }
  /* 회사별 가로 막대 연표(본부장 결정 11-13, 그림 위주 덱 3장 구현을 지금 덱 양식으로 옮김).
     한 줄 = 회사 이름 칸 + 막대(역할 단계 색) + 막대 옆 연도와 직책. 막대 오른쪽에 글이 다 들어가면 오른쪽, 아니면 왼쪽 */
  const yrOf = sub => { const [a, b] = per(sub).split(/\s*[–—-]\s*/)
    return a.slice(0, 4) === b.slice(0, 4) ? a.slice(0, 4) : `${a.slice(0, 4)} – ${b.slice(0, 4)}` }
  const TW = 1920 - 2 * 96 - GN_W, CH = 22
  const ticks = ['2006', '2011', '2016', '2021', '2026'].map(y => [y, at(y + '.1')])
  const milestone = slide({
    aria: 'Career Milestone: 2006부터 2026까지', eyebrow: L.milestone, title: d.careerTitle, hcls: 'h--sm',
    rights: L.rightsPlain,
    body: `
    <div class="msb">${PHASES.map(([yr, w], i) =>
      `<div style="flex:${w}"><b><i class="ph p${i}"></i>${esc(L.phases[i])}</b><span>${esc(yr)}</span></div>`).join('')}</div>
    <div class="gc">${ticks.map(([, p]) => `<span class="gl" style="left:calc(${GN_W}px + (100% - ${GN_W}px) * ${(p / 100).toFixed(4)})"></span>`).join('')}
      ${rows3.map(r => { const [x0, x1] = span(r.sub), ph = PHASE_OF[r.company]
        if (ph === undefined) fail('역할 단계 표에 없는 회사: ' + r.company)
        const role = roleOf(r.sub), y = yrOf(r.sub)
        const right = x1 / 100 * TW + 14 + (y.length + role.length) * CH < TW
        const lab = right ? `left:calc(${x1.toFixed(2)}% + 14px)` : `right:calc(${(100 - x0).toFixed(2)}% + 14px)`
        return `<div class="gr"><b>${esc(r.company)}</b><div class="gantt"><i class="p${ph}" style="left:${x0.toFixed(2)}%;width:${(x1 - x0).toFixed(2)}%"></i><span class="yr" style="${lab}">${esc(y)}<em>${esc(role)}</em></span></div></div>` }).join('')}
      <div class="axis" style="margin-left:${GN_W}px">${ticks.map(([y, p]) =>
        `<span style="left:${p.toFixed(2)}%">${y}</span>`).join('')}</div>
    </div>`,
  })

  /* --- 4. 역량 4분류 --- */
  /* 덱 전용(WO-42 추가) — 사례와 성과 칩 대신 수행 회사 버튼(링크 없음). 회사 이름은 경력 행 표기와 대조한다 */
  const coNames = new Set(d.career.map(r => r.company))
  const skillOf = s => SKILLS_DECK[s.title] || fail('덱 역량 표에 없는 분류: ' + s.title)
  for (const s of d.skills) for (const co of skillOf(s).co)
    if (!coNames.has(co)) fail(`역량 '${s.title}'의 수행 회사 '${co}'가 경력 행에 없다`)
  const skills = slide({
    aria: '역량 4분류: ' + SKILLS_TITLE, eyebrow: L.skills, title: SKILLS_TITLE, rights: L.rightsPlain,
    body: `<div class="g4">${d.skills.map((s, i) => `
      <div class="pn" style="display:flex;flex-direction:column">
        <div style="display:flex;align-items:center;gap:20px">
          <span class="ico">${icon(SKILL_ICONS[i])}</span>
          <h3 style="font-size:32px;font-weight:700;line-height:1.3">${esc(s.title)}</h3></div>
        <p style="margin-top:20px;font-size:26px;line-height:1.4">${esc(skillOf(s).note)}</p>
        <div style="margin-top:auto;padding-top:var(--g);display:flex;gap:12px;flex-wrap:wrap;align-items:center">
          <span style="font-size:22px;font-weight:600;line-height:1.4;color:var(--m60);margin-right:6px">${esc(L.doneBy)}</span>${
          skillOf(s).co.map(co => `<span class="cobtn">${esc(co)}</span>`).join('')}</div>
      </div>`).join('')}</div>`,
  })

  /* --- 5. 대표 사례 3 (강조 장) --- */
  /* 덱에서만 「대표 사례 3」을 「대표 케이스 3종」으로 부른다(본부장 결정 11-13). 사이트 제목은 그대로 */
  if (!d.casesTitle.includes('대표 사례 3')) fail('사례 제목에 「대표 사례 3」이 없다: ' + d.casesTitle)
  const top3Title = d.casesTitle.replace('대표 사례 3', L.top3)
  const top3 = slide({
    cls: 's--acc', bg: '#1A1A1A', aria: L.top3 + ': ' + top3Title,
    eyebrow: L.top3, title: top3Title, lede: d.casesLede, rights: L.rightsPlain,
    body: `<div class="g3" style="align-items:start">${d.cases.map(c => {
      const [num, lab] = caseKpi(c)
      return `<div style="display:flex;flex-direction:column;border-top:3px solid var(--sub);padding-top:26px">
        <p style="font-size:22px;line-height:1.4;color:var(--m60);letter-spacing:.04em">${esc(c.dlgMeta)}</p>
        <h3 style="margin-top:16px;font-size:32px;font-weight:700;line-height:1.3;min-height:2.6em">${esc(c.work === 'case1' ? C1.title : c2(c, 'title', c.dlgTitle))}</h3>
        <p class="n n--sm" style="margin-top:28px">${ba(num)}</p>
        <p class="nl">${esc(lab)}</p>
        <p style="margin-top:26px;font-size:26px;line-height:1.4;color:var(--m60)">${esc(c.work === 'case1' ? C1.summary : c2(c, 'summary', c.rows[0][1]))}</p>
        <p style="margin-top:28px"><span class="chip chip--sub">${esc(c.state)}</span></p>
      </div>` }).join('')}</div>`,
  })

  /* --- 6, 7, 8. 사례 1 — 진단 → 방향 제안 → 실행(WO-42). 문구는 덱 전용 표 C1, '판단'·'결정 범위'·'미룬 것'은 사이트에서 읽는다 --- */
  const c1 = d.cases[0]
  if (c1.work !== 'case1') fail('첫 대표 사례가 case1이 아니다: ' + c1.work)
  const c1row = k => (c1.rows.find(r => r[0] === k) || fail(`사례 1 상세에 '${k}' 행이 없다`))[1]
  const c1u = (x, k) => (x === C1_LINK[k] ? `<span class="c1u">${esc(x)}</span>` : esc(x))
  const bullets = xs => `<ul style="margin-top:10px;display:flex;flex-direction:column;gap:6px">${xs.map(x =>
    `<li style="font-size:22px;line-height:1.4;padding-left:20px;position:relative;color:var(--m60)">
      <span style="position:absolute;left:0;top:11px;width:8px;height:8px;border-radius:50%;background:var(--sub)"></span>${c1u(x, 'diag')}</li>`).join('')}</ul>`
  const G = C1.diag
  if (G.steps.length !== 7) fail('사례 1 진단 단계가 7개가 아니다: ' + G.steps.length)
  /* 7단계 번호 흐름(두 줄: ①~④, ⑤~⑦). 칸은 기존 흐름 칸(.fs), 번호는 업무 방식 장 번호(.no)와 같은 모양.
     ⑤는 핵심 GAP 상자와 원문 발췌 그림을 품어 두 칸 너비 */
  const step7 = ([nm, xs], k) => {
    const lines = xs.filter(x => typeof x === 'string')
    const gap = xs.some(x => x.gap), img = xs.some(x => x.img), lau = xs.some(x => x.launched), drop = xs.some(x => x.drop)
    const text = `<p class="no">0${k + 1}</p><p class="snm">${esc(nm)}</p>
      ${lines.length ? bullets(lines) : ''}
      ${drop ? DROP_ART : ''}
      ${lau ? `<p class="n" style="margin-top:16px;font-size:56px">${ba(launched[0])}</p><p class="nl" style="margin-top:10px">${launched[1].split(', ').map(esc).join('<br>')}</p>` : ''}
      ${gap ? `<div style="margin-top:14px;border:2px solid var(--sub);border-radius:16px;padding:var(--ps)">
        <p style="font-size:26px;font-weight:700;line-height:1.4">${esc(G.gap[0])}</p>
        <p style="margin-top:4px;font-size:22px;line-height:1.4">${esc(G.gap[1])}</p></div>` : ''}`
    return `<div class="fs s7"${img ? ' style="grid-column:span 3;display:grid;grid-template-columns:1fr 1fr;gap:var(--g)"' : ''}>
      ${img ? `<div>${text}</div>${shot(G.img, G.cap, 'min-height:0')}` : text}</div>`
  }
  const ix7 = G.steps.map((s, k) => [s, k])
  const c1diag = slide({
    aria: `${G.eyebrow}: ${C1.title}`, eyebrow: G.eyebrow, title: C1.title, lede: c1.dlgMeta + G.ledeTail,
    rights: L.rightsProto,
    /* 11-13 2차 규격: 4칸 격자(칸 사이 = 화살표 칸). 05는 01, 02와 그 사이 칸을 합친 폭, 06은 03 폭, 07은 04 폭. 줄마다 높이 같음 */
    body: `<div class="frow" style="flex:1;min-height:0;display:grid;grid-template-columns:1fr var(--ga) 1fr var(--ga) 1fr var(--ga) 1fr;
      grid-template-rows:minmax(0,.8fr) minmax(0,1.2fr);row-gap:var(--g)">
      ${ix7.map(([s, k]) => (k % 4 ? arrow() : '') + step7(s, k)).join('')}</div>`,
  })
  const D = C1.dir
  /* 영역 라벨(7, 8장 공통, .fs b와 같은 크기, 굵기, 자간) */
  const areaLabel = t => `<p style="font-size:22px;font-weight:800;letter-spacing:.08em;line-height:1.4">${esc(t)}</p>`
  const c1dir = slide({
    aria: `${D.eyebrow}: ${D.title}`, eyebrow: D.eyebrow, title: D.title, lede: D.lede,
    /* 11-13 2차: 권리 표기는 6, 8장과 같은 달콤소프트 화면 표기 */
    rights: L.rightsProto,
    /* 세 덩어리(축 카드, 개발 방향 적용, 판단/결정 범위)를 세로로 고르게 나눈다 — 아래쪽 빈 띠를 남기지 않는다 */
    body: `<div style="flex:1;min-height:0;display:flex;flex-direction:column;justify-content:space-between">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--ga)">${D.axes.map(([nm, what, chip]) => {
        /* 축마다 내용이 맞는 실제 캡처 1장(11-13). 그림이 들어온 만큼 원문 번호 줄과 원문 구호 줄은 뺀다 */
        const [img, cap] = D.img[nm] || fail('방향 축 그림이 없다: ' + nm)
        return `
        <div class="pn" style="padding:var(--ps);display:flex;flex-direction:column">
          <p style="font-size:32px;font-weight:700;line-height:1.3;letter-spacing:-.02em">${esc(nm)}</p>
          ${img === 'motto'
            ? `<div style="height:200px;flex:none;margin-top:14px;border:1px solid var(--m12);border-radius:20px;display:flex;align-items:center;padding:0 24px">
                <p style="font-size:32px;font-weight:700;line-height:1.3;letter-spacing:-.02em">${esc(D.motto)}</p></div>`
            : shot(img, cap(d), 'height:200px;flex:none;margin-top:14px', '', true)}
          <p style="margin-top:12px;font-size:22px;line-height:1.4">${esc(what)}</p>
          ${chip ? `<p style="margin-top:auto;padding-top:12px"><span class="chip chip--sub">${esc(chip)}</span></p>` : ''}
        </div>` }).join('')}</div>
      <div>
        ${areaLabel(D.applyLabel)}
        <div class="frow" style="margin-top:12px">${D.apply.map((x, k) => (k ? arrow() : '') +
          `<div class="fs" style="display:flex;align-items:center"><p style="font-size:26px;font-weight:700">${esc(x)}</p></div>`).join('')}</div>
      </div>
      <!-- 11-13 2차: 판단과 결정 범위는 박스 없이 글만. 두 칸은 위 4칸 격자의 1~2칸, 3~4칸 폭 -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--ga)">${[L.verdict, L.decision].map(k =>
        `<div>${areaLabel(k)}<p style="margin-top:8px;font-size:22px;line-height:1.4">${esc(c1row(k))}</p></div>`).join('')}</div>
    </div>`,
  })
  const R = C1.run
  const c1ev = [...c1.ev].sort((a, b) => (b.title === R.evFirst) - (a.title === R.evFirst))
  if (c1ev[0].title !== R.evFirst) fail(`사례 1 근거에 「${R.evFirst}」가 없다`)
  const [c1num, c1lab] = launched
  /* 출시 항목 라벨은 숫자 옆 좁은 칸이라 항목마다 줄을 바꾼다(줄 끝 '·' 매달림 방지) */
  /* 8장은 세 영역으로 나눈다(WO-42 추가 2): ① 출시 타임라인(위 전체 폭) ② 결과(아래 왼쪽) ③ 프로토타입(아래 오른쪽).
     '미룬 것'과 안내 줄은 싣지 않는다 — 같은 내용이 타임라인 3번에 있다. 영역 라벨은 7장 '개발 방향 적용' 라벨과 같은 모양 */
  const nat = [natural('deco'), natural('ssjproto')].map(({ w, h }) => (w / h).toFixed(3))
  const c1run = slide({
    /* 11-13 품질 — 제목 크기를 6, 7장(사례 1 묶음)과 같은 기본 단계로 */
    aria: `${R.eyebrow}: ${R.title}`, eyebrow: R.eyebrow, title: R.title,
    rights: L.rightsProto,
    body: `<div style="flex:1;min-height:0;display:flex;flex-direction:column;gap:var(--g)">
      <div>
        ${areaLabel(R.areas[0])}
        <!-- 11-13 2차: 빨간 선은 첫 칸 왼끝부터 마지막 칸 오른끝까지 한 줄, 점은 칸마다 가로 가운데 -->
        <div style="margin-top:12px;position:relative;height:28px">
          <span class="a-tln" style="position:absolute;left:0;right:0;top:12px;height:2px;background:var(--sub)"></span>
          <div style="position:absolute;inset:0;display:grid;grid-template-columns:repeat(${R.tl.length},minmax(0,1fr));gap:0 var(--g)">${R.tl.map(() => `
            <div style="position:relative"><span class="a-tdot" style="position:absolute;left:50%;top:4px;width:18px;height:18px;margin-left:-9px;border-radius:50%;background:var(--sub)"></span></div>`).join('')}</div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(${R.tl.length},minmax(0,1fr));gap:0 var(--g)">${R.tl.map(([dt, nm, x]) => `
          <div class="pn" style="padding:var(--ps);border-radius:20px">
            <p style="font-size:22px;font-weight:800;line-height:1.4">${esc(dt)}</p>
            <p style="margin-top:4px;font-size:26px;font-weight:700;line-height:1.4">${esc(nm)}</p>
            <p style="margin-top:8px;font-size:22px;line-height:1.4;color:var(--m60)">${[].concat(x).map(ln => (Array.isArray(ln) ? ln.map(g => `<span style="white-space:nowrap">${esc(g)}</span>`).join(' ') : c1u(ln, 'run'))).join('<br>')}</p>
          </div>`).join('')}</div>
      </div>
      <div style="flex:1;min-height:0;display:grid;grid-template-columns:560px 1fr;gap:var(--gc)">
        <div style="display:flex;flex-direction:column;min-height:0">
          ${areaLabel(R.areas[1])}
          <div class="pn" style="margin-top:12px;flex:1;min-height:0;display:flex;flex-direction:column">
            <div style="display:flex;align-items:flex-end;gap:20px;margin:auto 0"><p class="n n--sm" style="flex:none">${ba(c1num)}</p>
              <p class="nl" style="margin-bottom:4px">${c1lab.split(', ').map(esc).join('<br>')}</p></div>
            <div class="ev" style="padding-top:16px;margin-top:0"><b>${L.evidence}</b>
              <div style="display:flex;flex-direction:column;gap:4px">${c1ev.map(e =>
                `<a href="${esc(e.href)}" target="_blank" rel="noopener" style="margin-right:0;align-self:flex-start">${esc(e.title)} ↗</a>`).join('')}</div></div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;min-height:0">
          ${areaLabel(R.areas[2])}
          <div style="margin-top:12px;flex:1;min-height:0;display:grid;grid-template-columns:${nat[0]}fr ${nat[1]}fr;gap:var(--g)">
            ${shot('deco', d.proto[0].title, 'min-height:0')}${shot('ssjproto', d.proto[1].title, 'min-height:0')}</div>
        </div>
      </div>
    </div>`,
  })

  /* --- 9와 11. 사례 판단(사례 2와 3) --- */
  /* 사례 2 흐름 6단계(본부장 원문 11-13 2차): FGT 진행 → 사내 테스트 → 개선사항 적용 → 소프트런칭(VOC 수집) → 최종 폴리싱 → 그랜드런칭.
     칩은 사이트 문장에서 읽은 것만: 날짜는 본인 행동, 국가 이름은 린 상세, 개선 3건과 그랜드런칭은 결과와 상태 */
  const chain2 = (() => {
    const out = d.cases[1].rows.find(r => r[0] === L.outcome)[1]
    const gm = out.match(/출시\(([^)]+)\)/)
    if (!gm) fail('사례 2 결과에서 그랜드런칭을 못 읽었다: ' + out)
    const im = out.match(/(?:^|\.)\s*([^.]+?)\s*개선 (\d)건은/)
    if (!im) fail('사례 2 결과에서 개선 항목을 못 읽었다: ' + out)
    const items = im[1].split(/\s*,\s*/).map(s => s.trim()).filter(Boolean)
    if (String(items.length) !== im[2]) fail(`사례 2 개선 항목 수가 안 맞는다: ${items.length} vs ${im[2]}`)
    const lyn = d.res.lyn.rows.find(r => r[0] === '소프트런칭')
    if (!lyn) fail('린 상세에 소프트런칭 행이 없다')
    const co = lyn[1].split(/\s*,\s*/).map(s => s.trim()).filter(Boolean)
    const act = d.cases[1].rows.find(r => r[0] === L.act)[1]
    const fgt = act.match(/FGT\(([^,]+),/), it = act.match(/사내 테스트\(([^,]+),\s*([^)]+)\)/)
    if (!fgt || !it) fail('사례 2 본인 행동에서 FGT와 사내 테스트 날짜를 못 읽었다: ' + act)
    return [['FGT 진행', [fgt[1]]], ['사내 테스트', [it[1], it[2]]], ['개선사항 적용', []],
            ['소프트런칭(VOC 수집)', co], ['최종 폴리싱', items], ['그랜드런칭', [gm[1]]]]
  })()

  const judge = (c, i) => {
    const slug = CASE_IMG[c.work]
    const [num, lab] = caseKpi(c)
    const boxes = [c.steps[0], [c.steps[1][0], c2(c, 'verdict', c.steps[1][1])], c.steps[3]]
    /* 단계 칸: 이름 뒤에 칩이 이어지고, 칸이 차면 다음 줄로 */
    const stage = ([nm, xs]) => `<div class="fs" style="display:flex;flex-wrap:wrap;align-items:center;align-content:center;gap:10px">
      <b style="margin:0 8px 0 0">${esc(nm)}</b>${xs.map(x =>
        `<span class="chip" style="white-space:nowrap">${esc(x)}</span>`).join('')}</div>`
    /* 사례 3 — 두 레인 사이에 실제 이관 화살표를 둔다(D6) */
    const lanes = c.work === 'case3' ? `
      <div class="pn" style="margin-bottom:var(--g);
        display:grid;grid-template-columns:1fr 168px 1fr;gap:0;align-items:center">${[LANES[0], null, LANES[1]]
        .map((ln, k) => (ln === null
          ? `<div style="text-align:center;color:var(--m38)">
               <svg viewBox="0 0 24 24" style="width:44px;height:44px;fill:none;stroke:currentColor;stroke-width:1.8;
                 stroke-linecap:round;stroke-linejoin:round">${ICONS.arrow}</svg>
               <p style="margin-top:6px;font-size:22px;font-weight:700;color:var(--tx);line-height:1.4">${esc(LANE_ARROW.split('→')[0].trim())}<br>${esc(LANE_ARROW.split('→')[1].trim())}</p></div>`
          : `<div style="border-left:4px solid ${k ? 'var(--m38)' : 'var(--sub)'};padding-left:18px">
               <p style="font-size:26px;font-weight:700;line-height:1.4">${esc(ln[0])}</p>
               <p style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap">${ln[1].map(x =>
                 `<span class="chip${k ? '' : ' chip--sub'}">${esc(x)}</span>`).join('')}</p></div>`)).join('')}
      </div>` : ''
    /* 사례 2, 6단계 흐름은 본문 전체 폭 맨 위에 두 줄(세 칸씩)로 둔다. 한 줄 여섯 칸이면 칩(「2019 글로벌 그랜드런칭」)이 칸에 안 들어간다 */
    const chain = c.work === 'case2' ? `
      <div style="flex:none;display:flex;flex-direction:column;gap:var(--g);margin-bottom:var(--g)">${[chain2.slice(0, 3), chain2.slice(3)].map(row =>
        `<div class="frow">${row.map((s, k) => (k ? arrow() : '') + stage(s)).join('')}</div>`).join('')}</div>` : ''
    const title = c2(c, 'title', c.dlgTitle)
    const box = ([k, v]) => `<div class="fs"><b>${esc(k)}</b><p>${esc(v)}</p></div>`
    const kpi = (st = '') => `<div class="pn" style="${st}display:flex;align-items:flex-end;gap:20px">
            <p class="n">${ba(num)}</p>
            <p class="nl" style="margin-bottom:10px">${esc(lab)}</p></div>`
    /* 사례 2, 6단계 흐름이 위 두 줄을 차지하므로 문제 → 판단 → 결과는 가로 한 줄, 큰 숫자는 그 아래, 그림은 오른쪽 전체 높이 */
    const body = c.work === 'case2' ? `${chain}<div class="g2" style="grid-template-columns:1fr 660px">
        <div style="display:flex;flex-direction:column;min-height:0">
          <div class="frow" style="flex:1;min-height:0">${boxes.map((b, n) => (n ? arrow() : '') + box(b)).join('')}</div>
          ${kpi('margin-top:var(--g);')}
        </div>
        ${shot(slug, workOf(slug).title, 'min-height:0')}
      </div>` : `<div class="g2" style="grid-template-columns:1fr 660px">
        <div style="display:flex;flex-direction:column;min-height:0">${lanes}
          <div class="flow">${boxes.map((b, n) => (n ? arrow() : '') + box(b)).join('')}</div>
        </div>
        <div style="display:flex;flex-direction:column;min-height:0">
          ${shot(slug, workOf(slug).title, 'flex:1;min-height:0')}
          ${kpi('margin-top:var(--g);')}
        </div>
      </div>`
    return slide({
      aria: `${L.caseN(i + 1)} 판단: ${title}`,
      eyebrow: `${L.caseN(i + 1)}, ${L.judge}`, title, lede: c.dlgMeta,
      rights: rightsOf(slug), body,
    })
  }

  /* --- 10과 12. 사례 실행(사례 2와 3) --- */
  /* 10장 — 긴 문단을 꼬리표 붙은 짧은 줄로(본부장 결정 11-13). 한 줄에 한 사실, 사실은 빼지 않는다.
     값은 덱 전용 표 EXEC_LINES의 글이고, 줄마다 근거 조각(src, 없으면 값 그대로)이 사이트 문장에 있어야 빌드된다 */
  const linesOf = (c, k, src) => (EXEC_LINES[c.work][k] || fail(`${c.work} ${k} 줄 표가 없다`)).map(([tag, v, frag]) => {
    const f = frag || v
    if (!src.replace(/ /g, ' ').includes(f)) fail(`${c.work} ${k} 줄 「${tag}」의 근거 「${f}」가 사이트 문장에 없다`)
    return [tag, v]
  })
  const exec = (c, i) => {
    /* 발표용으로 줄인다 — 행동과 미룬 것은 첫 문장만. 결과는 본인 기여 범위 단서가 들어 있어 통째로 남긴다(D3). */
    const pick = k => { const r = c.rows.find(x => x[0] === k); return r && r[1] }
    const rows = [[L.act, brief(pick('본인 행동'))]]
    const deferred = pick(L.deferred)
    if (deferred) rows.push([L.deferred, brief(deferred)])
    rows.push([L.outcome, pr(pick(L.outcome))])
    const cut = briefCut(pick('본인 행동')) || (deferred && briefCut(deferred))
    /* 전과 후 배지 — 2분할 캡처의 각 절반 오른쪽 위에 얹는다. 왼쪽 위 원본 라벨과 겹치지 않게. */
    const baBadge = `<span class="bdg bdg--b" style="left:45.5%">1</span><span class="bdg bdg--a" style="right:2.5%">2</span>`
    let tiles, cols
    if (c.work === 'case2') {
      cols = '680px 1fr'
      tiles = `<div style="display:grid;grid-template-rows:auto 1fr 1fr;gap:var(--g);min-height:0">
        <p style="display:flex;gap:14px;align-items:center;font-size:22px;font-weight:700;line-height:1.4">
          <span class="bdg bdg--b" style="position:static;width:42px;height:42px;font-size:28px">1</span>${L.before}
          <span style="color:var(--m60)">→</span>
          <span class="bdg bdg--a" style="position:static;width:42px;height:42px;font-size:28px">2</span>${L.after}</p>
        ${doc('lyn/before_after', 'min-height:0', baBadge)}${doc('lyn/system_ui', 'min-height:0')}</div>`
    } else {
      /* 4장을 작게 늘어놓으니 아무것도 안 읽혔다. 발주서 §2대로 플로우 제안과 충전 UI 시안 2장만 크게(D9). */
      cols = '680px 1fr'
      /* 11-13 인게임 화면 1장 추가(공개 노션 「유료 재화 구매 시스템 연동」) — 위 전체 폭, 아래에 기존 두 장 */
      tiles = `<div style="display:grid;grid-template-columns:1fr 1.25fr;grid-template-rows:1.25fr 1fr;gap:var(--g);min-height:0">
        ${doc('nightwalker/ingame', 'min-height:0;grid-column:1/-1')}
        ${doc('nightwalker/server_flow_proposal', 'min-height:0')}${doc('nightwalker/charge_ui_mock', 'min-height:0')}</div>`
    }
    return slide({
      aria: `${L.caseN(i + 1)} 실행: ${c2(c, 'title', c.dlgTitle)}`,
      eyebrow: `${L.caseN(i + 1)}, ${L.exec}`, title: EXEC_TITLE[c.work] || c2(c, 'exec', c.title), hcls: 'h--sm',
      rights: rightsOf(CASE_IMG[c.work]),
      body: `<div class="g2" style="grid-template-columns:${cols}">
        <div style="display:flex;flex-direction:column;min-height:0">
          <div class="rows">${rows.map(([k, v]) => `
            <div class="row"><span class="ico ico--sm">${icon(EXEC_ICONS[k])}</span>
              <div style="flex:1;min-width:0"><p class="rt">${esc(k)}</p>${EXEC_LINES[c.work]
                ? `<dl class="kv kv--x">${linesOf(c, k, v).map(([t, x]) => `<dt>${esc(t)}</dt><dd>${esc(x)}</dd>`).join('')}</dl>`
                : `<p>${esc(v)}</p>`}</div></div>`).join('')}</div>
          ${cut ? `<p style="margin-top:var(--g);font-size:22px;line-height:1.4;color:var(--m60)">${esc(L.full)}</p>` : ''}
          ${evList(c.ev)}
        </div>
        ${tiles}
      </div>`,
    })
  }

  /* --- 13. 숫자로 증명 (강조 장) --- */
  const numbers = slide({
    cls: 's--acc', bg: '#1A1A1A', aria: '숫자로 증명: 6개 지표',
    eyebrow: L.numbers, title: d.worksTitle, rights: L.rightsPlain,
    body: `<div style="display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:auto;align-content:space-evenly;
      gap:var(--g) var(--gc);flex:1;min-height:0">
      ${Object.keys(KPI_NUM).map(slug => `
        <div style="border-top:3px solid var(--sub);padding-top:22px">
          <p style="font-size:22px;line-height:1.4;color:var(--m60)">${esc(workOf(slug).title)}</p>
          <p class="n" style="margin-top:26px">${ba(kpiOf(slug))}</p>
          <p class="nl">${kpiLabel2(slug)}</p></div>`).join('')}
    </div>`,
  })

  /* --- 14. 성과 3장 --- */
  const results = slide({
    aria: '성과: 카오스크로니클, Five Stars, Shadow Seven', eyebrow: L.results,
    title: RESULTS.map(([slug]) => workOf(slug).title).join(', '), hcls: 'h--sm',
    rights: mergeRights(RESULTS.map(([slug]) => workOf(slug).rights)),
    /* 11-13 2차: 세 칸이 같은 줄 격자(subgrid)를 나눠 써서 키 비주얼, 캡처, 숫자, 평점, 3줄, 근거가 칸마다 같은 높이에 놓인다.
       근거는 맨 아래 같은 위치, 같은 높이 */
    body: `<div style="display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:auto auto auto auto auto minmax(0,1fr) auto;column-gap:var(--gc);flex:1;min-height:0">${RESULTS.map(([slug, shots]) => {
      const w = workOf(slug), r = d.res[slug]
      /* 발주서 §2 — 키 비주얼 + 캡처 1 + 역할, 판단, 결과 3줄 + 근거 링크(D7과 D8) */
      const rowOf = k => { const x = r.rows.find(y => y[0] === k)
        if (!x) fail(`${slug} 상세에 '${k}' 행이 없다`)
        if (banHits(x[0] + ' ' + x[1]).length) fail(`${slug} '${k}' 행에 금지어가 있다`)
        return x[1] }
      /* Shadow Seven 평점은 전후 비교라 별도 칸으로 뺀다 — 본문에 남기면 작은 빨강이 된다(D6b) */
      let pair = null
      const line = ([lb, key]) => { let v = rowOf(key)
        const m = v.match(/구글 평점[^\d]*([\d.]+)\s*(?:→|>)\s*[^\d]*([\d.]+)/)
        if (m) { pair = [m[1], m[2]]; v = v.slice(0, m.index).replace(/\s*(?:→|>)\s*$/, '').trim() }
        if (RESULT_CLIP[key]) { const xs = splitTop(v); if (xs.length > RESULT_CLIP[key]) v = xs.slice(0, RESULT_CLIP[key]).join(', ') + ' …' }
        return `<dt>${esc(lb)}</dt><dd>${esc(brief(v))}</dd>` }
      const lines = RESULT_ROWS[slug].map(line).join('')
      return `<div style="display:grid;grid-row:1/-1;grid-template-rows:subgrid;min-height:0">
        ${shot(slug, w.title, 'height:132px', '', true, true)}
        ${doc(shots[0], 'height:180px;margin-top:var(--g)')}
        <div style="display:flex;align-items:flex-end;gap:20px;margin-top:var(--g)">
          <p class="n n--xs">${ba(w.kpi)}</p>
          <p class="nl" style="margin-bottom:4px">${esc(kpiLabel(slug).replace(/\s*\([^)]*\)/g, ''))}</p></div>
        ${pair ? `<p class="ba" style="margin-top:12px;font-size:40px;font-weight:800;letter-spacing:-.02em">
          <span style="font-size:22px;font-weight:600;color:var(--m60);margin-right:12px">구글 평점</span>
          <i>${esc(pair[0])}</i><s>→</s><u>${esc(pair[1])}</u></p>` : '<div></div>'}
        <dl class="kv" style="margin-top:var(--g);grid-template-columns:88px 1fr;gap:10px var(--g);align-content:start">${lines}</dl>
        <div></div>
        ${evList(r.ev).replace('<div class="ev">', '<div class="ev" style="margin-top:0">')}
      </div>` }).join('')}</div>`,
  })

  /* --- 15. 슈퍼피플 — 흐름 5칸 + 가공 이미지 2장 + 상세창 숫자 2개 + 외부 링크 --- */
  const spW = workOf('superpeople'), spR = d.res.superpeople
  const spCap = f => spR.gal.find(g => g.file === f).cap
  const spImg = f => `superpeople/${f.replace(/\.jpg$/, '')}`
  const superpeople = slide({
    aria: `${L.results}: ${spW.title}`, eyebrow: `${L.results}, ${spW.title}`, title: spW.summary, hcls: 'h--sm',
    lede: spR.dlgMeta, rights: spW.rights,
    body: `<div class="frow" style="flex:none">${SP_FLOW.map((x, k) => (k ? arrow() : '') +
        `<div class="fs"><p style="font-size:26px;font-weight:700;line-height:1.4;text-align:center">${esc(x)}</p></div>`).join('')}</div>
      <!-- 11-13 2차: 두 그림 칸이 같은 줄(격자 1행)이라 높이가 같다. 숫자 칸과 근거는 2행 -->
      <div class="g2" style="grid-template-columns:1fr 600px;grid-template-rows:minmax(0,1fr) auto;row-gap:var(--g);margin-top:var(--g)">
        ${shot(spImg(SP_SHOTS[0]), spCap(SP_SHOTS[0]), 'min-height:0')}
        ${shot(spImg(SP_SHOTS[1]), spCap(SP_SHOTS[1]), 'min-height:0')}
        <div class="pn" style="display:flex;gap:56px">${spR.stats.map(([n, k]) =>
          `<div style="display:flex;align-items:flex-end;gap:20px"><p class="n n--xs">${nw(n)}</p>
            <p class="nl" style="margin-bottom:4px">${esc(k)}</p></div>`).join('')}</div>
        <div class="ev" style="margin-top:0"><b>${L.evidence}</b>${spR.links.map(a =>
          `<a href="${esc(a.href)}" target="_blank" rel="noopener">${esc(a.title)} ↗</a>`).join('')}</div>
      </div>`,
  })

  /* --- 16. 업무 방식 5단계 --- */
  const method = slide({
    aria: '업무 방식 5단계: ' + METHOD.title, eyebrow: L.method, title: METHOD.title,
    rights: L.rightsPlain,
    body: `<div class="steps frow">${METHOD.steps.map(([nm, xs, pri], i) => (i ? arrow() : '') + `
      <div class="st"><p class="no">0${i + 1}</p><h3>${esc(nm)}</h3>
        <ul>${xs.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        ${pri ? `<div class="pri"><b>${esc(pri[0])}</b>${esc(pri[1])}</div>` : ''}
      </div>`).join('')}</div>`,
  })

  /* --- 17. AI 프로토타입 --- */
  /* 체험 순서를 번호 붙은 단계 칩으로(11-13). 단계 낱말은 덱 전용 표 TRY_STEPS, 낱말마다 사이트 문장에 있어야 한다 */
  const tryStepsOf = (i, v) => TRY_STEPS[i].map(([lab, frag]) => {
    if (!v.includes(frag)) fail(`체험 순서 ${i + 1}의 단계 근거 「${frag}」가 사이트 문장에 없다: ${v}`)
    return lab })
  const protoRows = d.proto[0].note.length + 1
  if (d.proto.some(p => p.note.map(x => x[0]).join() !== d.proto[0].note.map(x => x[0]).join()))
    fail('프로토타입 두 카드의 설명 줄 이름이 다르다(같은 줄 격자를 못 나눈다)')
  const proto = slide({
    aria: 'AI 프로토타입 2종', eyebrow: L.proto, title: d.protoTitle, lede: d.protoLede,
    rights: L.rightsProto,
    /* 11-13 2차: 두 카드가 같은 줄 격자(subgrid)를 나눠 써서 그림 칸, 단계 칩 줄, 설명 줄, 버튼이 같은 높이에 놓인다 */
    body: `<div style="display:grid;grid-template-columns:1fr 1fr;grid-template-rows:minmax(0,1fr) repeat(${protoRows},auto);gap:12px var(--gc);flex:1;min-height:0">${d.proto.map((p, i) => `
      <div style="display:grid;grid-row:1/-1;grid-template-rows:subgrid;grid-template-columns:170px 1fr;column-gap:var(--g);align-items:center;min-height:0">
        ${shot(['deco', 'ssjproto'][i], p.title, 'min-height:0;height:100%;grid-column:1/-1;margin-bottom:12px')}
        <dl class="kv" style="display:contents">${p.note.map(([k, v]) => k === L.tryOrder
          ? `<dt>${esc(k)}</dt><dd class="stps">${tryStepsOf(i, v).map((x, n) => `<span class="stp-g">${n ? `<span class="stp-a">${icon('arrow')}</span>` : ''}` +
              `<span class="chip stp"><b>${n + 1}</b>${esc(x)}</span></span>`).join('')}</dd>`
          : `<dt>${esc(k)}</dt><dd>${esc(pr(v))}</dd>`).join('')}
          <dt>${L.demo}</dt><dd><a class="cobtn" href="${esc(d.canonical + p.href)}" target="_blank" rel="noopener">${L.open} ↗</a></dd></dl>
      </div>`).join('')}</div>`,
  })

  /* --- 18. 회사별 상세 --- */
  const KPI_BY_CO = [['달콤', 'dalcom'], ['넥슨', 'lyn'], ['원더피플', 'nightwalker'], ['스카이피플', 'fivestars'], ['넵튠', 'nanakage']]
  const companies = slide({
    aria: '회사별 상세: 10개 회사', eyebrow: L.companies, title: d.careerTitle, hcls: 'h--sm',
    rights: L.rightsPlain + ' ' + d.careerFoot,
    /* 티켓 카드 10장(본부장 결정 11-13). 노션 링크는 싣지 않는다. 왼쪽 본문(회사, 직책과 기간, 핵심 내용) | 점선 절취선 | 오른쪽 대표 숫자 */
    body: `<div class="co">${d.career.map(r => {
      const hit = KPI_BY_CO.find(([k]) => r.company.includes(k))
      if (!r.impact) fail('경력행에 기여 문장이 없다: ' + r.company)
      const src = r.impact.replace(/ /g, ' ')
      const core = (CO_SHORT[r.company] || [src]).map(f => { if (!src.includes(f)) fail(`회사별 상세 ${r.company} 줄임 조각 「${f}」가 사이트 문장에 없다`); return f })
      return `<div class="tk"><div class="tk-m"><b>${esc(r.company)}</b>
        <p class="p">${esc(r.sub)}</p><p class="t">${core.map(esc).join('<br>')}</p></div>
        <div class="tk-s">${hit ? `<span class="k">${ba(kpiOf(hit[1]))}</span>` : ''}</div></div>` }).join('')}</div>`,
  })

  /* --- 19. 연락 --- */
  const legal = d.legal.replace(/^(©\s*\d{4}\s+Henry Lim(?:\s*\([^)]*\))?)\s+/, '$1, ')
  const contact = `
<section class="s s--dark cover" role="group" aria-roledescription="slide" aria-label="연락: ${esc(d.brand)}" data-bg="#26262B" data-mo="E4">
  <canvas class="mo" aria-hidden="true"></canvas>
  <div>
    <p class="eb" data-d="0">${esc(L.contact)}</p>
    <p class="nm" style="margin-top:26px;font-size:72px" data-d="80">${esc(d.brand)}</p>
    <p class="rl" data-d="160">${esc(d.role)}</p>
    <div class="ct" style="margin-top:40px">
      <p data-n="0"><b>${L.email}</b><a href="mailto:${MAIL}">${MAIL}</a></p>
      <p data-n="1"><b>${L.web}</b>${ext(LINK.web, 'KO ↗')}${SEP}${ext(LINK.webEn, 'EN ↗')}</p>
      <p data-n="2"><b>${L.cv}</b>${ext(LINK.cvKo, esc(L.cvKo) + ' ↗')}${SEP}${ext(LINK.cvEn, esc(L.cvEn) + ' ↗')}</p>
      <p data-n="3"><b>${L.caseRep}</b>${ext(LINK.caseRep, L.open + ' ↗')}</p>
      <p data-n="4"><b>${L.pdf}</b>${ext(LINK.pdfKo, 'KO ↗')}${SEP}${ext(LINK.pdfEn, 'EN ↗')}</p>
    </div>
    <p style="margin-top:44px;font-size:22px;color:var(--m60);line-height:1.5" data-n="5">${esc(L.issued)} ${TODAY}, ${esc(legal)}</p>
  </div>
  <div></div>
</section>`

  const body = [cover, glance, milestone, skills, top3,
    c1diag, c1dir, c1run,
    judge(d.cases[1], 1), exec(d.cases[1], 1),
    judge(d.cases[2], 2), exec(d.cases[2], 2),
    numbers, results, superpeople, method, proto, companies, contact]
  if (body.length !== SLIDES) fail('슬라이드가 ' + SLIDES + '장이 아니다: ' + body.length)

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(d.brand)}: ${esc(L.doc)}</title>
<meta name="description" content="${esc(d.h1.join(' '))}">
<meta name="robots" content="noindex">
<!-- Microsoft Clarity — 라이브 도메인에서만 수집(로컬, 빌더 렌더, 내려받은 덱 파일 제외) -->
<script type="text/javascript">
if (location.hostname === 'bluedaylol80.github.io') {
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "yatji6jh65");
}
</script>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Cpath fill='%23E62B1E' d='M24 2c2.2 13.8 7.9 19.6 22 22-14.1 2.4-19.8 8.2-22 22-2.2-13.8-7.9-19.6-22-22 14.1-2.4 19.8-8.2 22-22Z'/%3E%3C/svg%3E">
<style>${css(A.font())}</style>
</head>
<body>
<div class="rot" aria-hidden="true">
  <div>
    <svg viewBox="0 0 44 24"><rect x="2" y="2" width="12" height="20" rx="2.5"/><path d="M19 12h7"/><path d="M23 9l3 3-3 3"/><rect x="30" y="7" width="12" height="10" rx="2.5"/></svg>
    <p>가로로 돌려 보세요<span>Rotate for full view</span></p>
  </div>
</div>
<div class="wrap"><div class="stage" id="stage">
${body.join('\n')}
<div class="bar" id="bar"></div>
<p class="cnt" id="cnt" aria-hidden="true"><em>1</em> / ${SLIDES}</p>
</div></div>
<script>${MOTION_JS}</script>
<script>${ANIM_JS}</script>
<script>
(function(){
  var stage=document.getElementById('stage'),bar=document.getElementById('bar'),cnt=document.getElementById('cnt')
  var ss=[].slice.call(stage.querySelectorAll('.s')),N=ss.length,cur=-1
  function fit(){var s=Math.min(innerWidth/1920,innerHeight/1080);stage.style.setProperty('--s',s);DeckMotion.fit(s)}
  function show(i,push){
    i=Math.max(0,Math.min(N-1,i)); if(i===cur)return; cur=i
    DeckAnim.prep(ss[i])
    ss.forEach(function(s,k){s.classList.toggle('on',k===i);if(k===i){s.removeAttribute('inert')}else{s.setAttribute('inert','')}})
    var dk=ss[i].dataset.bg!=='#F5F5F5'
    document.body.style.background=ss[i].dataset.bg
    stage.style.setProperty('--ui',dk?'#fff':'#1A1A1A')
    stage.style.setProperty('--uim',dk?'rgba(255,255,255,.72)':'rgba(26,26,26,.62)')
    bar.style.width=((i+1)/N*100)+'%'
    cnt.innerHTML='<em>'+(i+1)+'</em> / '+N
    if(push!==false){history.replaceState(null,'','#'+(i+1))}
    DeckMotion.show(ss[i])
    DeckAnim.play(ss[i])
  }
  function fromHash(){var n=parseInt((location.hash||'').slice(1),10);return isFinite(n)&&n>=1&&n<=N?n-1:0}
  addEventListener('resize',fit); addEventListener('hashchange',function(){show(fromHash(),false)})
  addEventListener('keydown',function(e){
    var k=e.key
    /* 링크와 버튼에 포커스가 있으면 Enter는 그 요소의 기본 동작이다 — 장 넘김으로 가로채지 않는다 */
    var onCtl=document.activeElement&&document.activeElement.closest&&document.activeElement.closest('a,button')
    if(k==='Enter'&&onCtl)return
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
checkLinks(d)
const A_rel = makeAssets(false), A_inline = makeAssets(true)
/* 덱에서는 「사례」를 「케이스」로 부른다(본부장 지시 11-13). 사이트 문장을 그대로 읽어 오므로 다 만든 덱 HTML에서 한 번에 바꾼다.
   「대표 사례 3」은 render에서 먼저 「대표 케이스 3종」으로 바꾼다. 링크 주소와 그림 데이터에는 한글이 없다 */
const deCase = h => h.split('사례').join('케이스')
const page = deCase(render(d, A_rel))
const single = deCase(render(d, A_inline))
if (/사례/.test(page + single)) fail('덱에 「사례」가 남았다')
if (page.split('<span class="c1u">').length !== 3) fail('사례 1 연결 밑줄 자리 2곳을 못 찾았다: ' + Object.values(C1_LINK).join(' / '))

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
console.log('생성: site/deck/index.html, site/henry-lim-portfolio-deck.html')
console.log(`  슬라이드 ${SLIDES}장, 사례 ${d.cases.length}건, 경력 ${d.career.length}행, 단일 파일 ${mb.toFixed(2)}MB, 금지어 0`)
