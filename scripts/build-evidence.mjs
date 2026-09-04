/**
 * 근거 카드 소스 빌더 — Notion 공개 페이지 27건을 캡처·요약해 site/evidence/ 로 굽는다.
 *
 * 왜: 성과 상세창의 텍스트 칩만으로는 "Notion으로 이어진다"는 것이 안 읽힌다(본부장 09-04).
 *     페이지 상단(아이콘·제목·속성·💡 요약·업무 프로세스)이 모든 페이지에서 같은 구조라
 *     1200×750 한 컷이 그대로 카드 썸네일이 된다.
 *
 * 입력: docs/handover/2026-09-04_notion_public_check.json 의 공개 항목(허브 제외 27건)
 * 출력: site/evidence/<id>.jpg (820x512 JPEG q70, ≤60KB) · site/evidence/index.json
 *
 * 폭 820 = Notion 본문 열이 화면을 꽉 채우는 폭이다(1200이면 좌우 여백이 카드의 3분의 1을 먹는다).
 *
 * 🔴 커버 제거는 클래스 선택자로 하지 않는다 — `.notion-page-cover` 류가 안 먹어서
 *    포스트모템 페이지에 연단 인물 사진이 그대로 실렸다(본부장 09-05 지적).
 *    대신 (a) 제목보다 위에 있는 이미지성 요소를 클래스와 무관하게 전부 숨기고,
 *    (b) 크롭 기준을 좌표 0이 아니라 **제목 요소**로 잡는다 — clip.y = 제목top - 72.
 *    커버가 있든 없든 제목·속성·💡 요약이 프레임에 들어온다.
 *
 * 🔴 금지 id 3건(2c099a8d·36359de7·1f999a8d)은 입력 JSON에 애초에 없다 — 여기서도 하드 차단한다.
 * 🟡 본문 미렌더는 무음으로 넘기지 않는다(exit 1). 재실행하면 같은 결과가 나온다.
 *
 * Usage: node scripts/build-evidence.mjs
 */
import puppeteer from 'puppeteer-core'
import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const BASE = 'https://limhenry.notion.site/'
const SRC = 'docs/handover/2026-09-04_notion_public_check.json'
const OUT_DIR = 'site/evidence'
const HUB = '0e48e826c73f4a7ab9c3522d7fb16ce5'      // 이력서 허브는 근거 카드가 아니다
const DENY = ['2c099a8d', '36359de7', '1f999a8d']    // 팩트시트 §9-2 링크 금지
const MAX_BYTES = 60 * 1024
const SHOT_W = 820, SHOT_H = 512      // 카드 썸네일 원본 — 페이지 상단만 자른다
const LABELS = ['태그', '참여 기간', '프로젝트', '활용 Tool', '관련 링크']

const sleep = ms => new Promise(r => setTimeout(r, ms))
const fail = msg => { console.error('빌드 실패: ' + msg); process.exit(1) }

const src = JSON.parse(readFileSync(SRC, 'utf8'))
const targets = src.results.filter(r => r.public && r.id !== HUB)
for (const t of targets) if (DENY.some(d => t.id.startsWith(d))) fail('금지 id가 목록에 있다: ' + t.id)
if (!targets.length) fail('대상이 0건이다')
mkdirSync(OUT_DIR, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--lang=ko-KR'],
})

const index = {}
let done = 0
for (const t of targets) {
  const page = await browser.newPage()
  try {
    for (const width of [SHOT_W, 720]) {
      await page.setViewport({ width, height: SHOT_H + 200, deviceScaleFactor: 1 })
      if (width === SHOT_W) {
        /* 🔴 Notion은 연속 요청에 429를 준다 — 429는 빈 셸이라 '본문 미렌더'와 구분되지 않는다.
           상태코드를 보고 지수 백오프로 다시 받는다(무음 실패 금지). */
        for (let attempt = 0; ; attempt++) {
          const res = await page.goto(BASE + t.id, { waitUntil: 'networkidle2', timeout: 60000 })
          const code = res ? res.status() : 0
          if (code !== 429) break
          if (attempt >= 4) fail('429가 계속된다(백오프 5회): ' + t.id)
          const wait = 45000 * (attempt + 1)
          console.log('... 429 ' + t.id + ' — ' + (wait / 1000) + '초 대기 후 재시도')
          await sleep(wait)
        }
        await page.waitForSelector('.notion-page-content, [class*="notion-page-content"]', { timeout: 25000 }).catch(() => {})
        await sleep(2500)
      } else {
        await sleep(600)   // 재캡처: 같은 페이지를 좁혀서 다시 찍는다
      }
      const info = await page.evaluate((LABELS) => {
        const content = document.querySelector('.notion-page-content, [class*="notion-page-content"]')
        const blocks = content ? content.querySelectorAll('[data-block-id]').length : 0
        const txt = el => (el && el.innerText || '').replace(/\s+/g, ' ').trim()
        const callout = content && content.querySelector('.notion-callout-block')
        const bullets = content ? [...content.querySelectorAll('.notion-bulleted_list-block')] : []
        const texts = content ? [...content.querySelectorAll('.notion-text-block')] : []
        // "업무 프로세스" 문단 바로 뒤의 첫 불릿 → 없으면 문서의 첫 불릿
        let process = ''
        const head = texts.find(e => txt(e).includes('업무 프로세스'))
        if (head) {
          let n = head.nextElementSibling
          while (n && !n.className.toString().includes('bulleted_list')) n = n.nextElementSibling
          if (n) process = txt(n)
        }
        if (!process && bullets.length) process = txt(bullets[0])
        // 속성은 본문 밖이라 innerText 라인 파싱이 가장 안정적이다(DOM 행이 2벌로 렌더된다)
        const lines = (document.body.innerText || '').split('\n').map(s => s.trim())
        const prop = name => {
          const i = lines.indexOf(name)
          if (i < 0) return ''
          const vals = []
          for (let j = i + 1; j < lines.length; j++) {
            if (!lines[j] || LABELS.includes(lines[j])) break
            vals.push(lines[j])
            if (vals.length >= 4) break
          }
          return vals.filter(v => v !== 'Empty' && v !== '비어 있음').join(' · ')
        }
        return {
          blocks,
          title: (document.title || '').replace(/\s*\|\s*Notion\s*$/, '').trim(),
          summary: txt(callout),
          process,
          period: prop('참여 기간'),
          tools: prop('활용 Tool'),
        }
      }, LABELS)
      if (!info.blocks) fail('본문이 렌더되지 않았다: ' + t.id + ' (' + t.label + ')')
      /* 제목 기준 크롭 — 커버가 있든 없든 제목·속성·요약이 프레임에 들어오게 한다.
         반환값 top 은 페이지(문서) 좌표라 그대로 screenshot clip 에 넣을 수 있다. */
      const clipTop = await page.evaluate(() => {
        const bar = document.querySelector('.notion-topbar')
        if (bar) bar.style.display = 'none'     // 상단 툴바(브레드크럼·가입 버튼)는 카드에 필요 없다
        const findTitle = () => {
          const h1 = document.querySelector('.notion-page-block h1, .notion-title, h1')
          if (h1 && h1.getBoundingClientRect().height) return h1
          const want = (document.title || '').replace(/\s*\|\s*Notion\s*$/, '').trim()
          if (!want) return null
          return [...document.querySelectorAll('div,span,h1,h2')]
            .find(e => e.children.length === 0 && e.textContent.trim() === want) || null
        }
        const title = findTitle()
        if (!title) return null
        // 제목이 화면 위쪽(72px)에 오게 스크롤 — Notion은 window가 아니라 내부 스크롤러를 쓴다.
        // scrollIntoView 로 컨테이너를 가리지 않고 옮긴 뒤, 그 스크롤러를 72px 되감아 여백을 남긴다.
        title.scrollIntoView({ block: 'start' })
        let sc = title.parentElement
        while (sc && sc.scrollHeight <= sc.clientHeight + 1) sc = sc.parentElement
        if (sc) sc.scrollTop = Math.max(0, sc.scrollTop - 72)
        else window.scrollBy(0, -72)
        const tTop = title.getBoundingClientRect().top
        // 🔴 클래스 이름에 기대지 않는다 — 제목보다 위에 있는 이미지성 요소는 전부 커버로 본다.
        for (const el of document.querySelectorAll('img, div, span, figure')) {
          const r = el.getBoundingClientRect()
          if (!r.height || r.bottom > tTop) continue
          const isImg = el.tagName === 'IMG' ||
            getComputedStyle(el).backgroundImage.includes('url(')
          if (isImg) el.style.visibility = 'hidden'
        }
        // 되감기가 먹었으면 tTop 이 이미 72 근처다 — 남은 오차만 clip 으로 보정한다.
        const top = title.getBoundingClientRect().top + (window.scrollY || 0)
        return Math.max(0, Math.round(top - 72))
      })
      if (clipTop === null) fail('제목 요소를 찾지 못했다: ' + t.id + ' (' + t.label + ')')
      await sleep(400)
      const file = OUT_DIR + '/' + t.id + '.jpg'
      await page.screenshot({ path: file, type: 'jpeg', quality: 70,
        clip: { x: 0, y: clipTop, width, height: Math.round(SHOT_H * width / SHOT_W) } })
      const bytes = statSync(file).size
      if (bytes <= MAX_BYTES || width === 720) {
        if (bytes > MAX_BYTES) fail('720폭 재캡처에도 ' + bytes + 'B로 상한 초과: ' + t.id)
        index[t.id] = {
          title: info.title || t.title || t.label,
          summary: info.summary, process: info.process,
          period: info.period, tools: info.tools,
          img: t.id + '.jpg',
        }
        console.log(`OK  ${t.group} / ${t.label} — ${bytes}B @${width} · 요약 ${info.summary.length}자 · 체인 ${info.process.length}자`)
        break
      }
      console.log(`... ${t.id} ${bytes}B > 상한 — 720폭 재캡처`)
    }
  } finally {
    await page.close()
  }
  done++
  await sleep(3000)   // 연속 요청 간격 — 없으면 후반부 렌더가 늦어진다(check-notion-public 실측)
}

await browser.close()
if (done !== targets.length) fail('처리 누락: ' + done + '/' + targets.length)
writeFileSync(OUT_DIR + '/index.json', JSON.stringify(index, null, 1) + '\n', 'utf8')
console.log('\n' + Object.keys(index).length + '/' + targets.length + ' -> ' + OUT_DIR + '/index.json')
