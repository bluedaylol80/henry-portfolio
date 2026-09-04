/**
 * 근거 카드 소스 빌더 — Notion 공개 페이지 27건을 캡처·요약해 site/evidence/ 로 굽는다.
 *
 * 왜: 성과 상세창의 텍스트 칩만으로는 "Notion으로 이어진다"는 것이 안 읽힌다(본부장 09-04).
 *     페이지 상단(아이콘·제목·속성·💡 요약·업무 프로세스)이 모든 페이지에서 같은 구조라
 *     1200×750 한 컷이 그대로 카드 썸네일이 된다.
 *
 * 입력: docs/handover/2026-09-04_notion_public_check.json 의 공개 항목(허브 제외 27건)
 * 출력: site/evidence/<id>.jpg (JPEG q70, ≤60KB) · site/evidence/index.json
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
    for (const width of [1200, 960]) {
      await page.setViewport({ width, height: Math.round(width * 750 / 1200), deviceScaleFactor: 1 })
      if (width === 1200) {
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
      await page.evaluate(() => {
        const bar = document.querySelector('.notion-topbar')
        if (bar) bar.style.display = 'none'     // 상단 툴바(브레드크럼·가입 버튼)는 카드에 필요 없다
      })
      await sleep(300)
      const file = OUT_DIR + '/' + t.id + '.jpg'
      await page.screenshot({ path: file, type: 'jpeg', quality: 70 })
      const bytes = statSync(file).size
      if (bytes <= MAX_BYTES || width === 960) {
        if (bytes > MAX_BYTES) fail('960폭 재캡처에도 ' + bytes + 'B로 상한 초과: ' + t.id)
        index[t.id] = {
          title: info.title || t.title || t.label,
          summary: info.summary, process: info.process,
          period: info.period, tools: info.tools,
          img: t.id + '.jpg',
        }
        console.log(`OK  ${t.group} / ${t.label} — ${bytes}B @${width} · 요약 ${info.summary.length}자 · 체인 ${info.process.length}자`)
        break
      }
      console.log(`... ${t.id} ${bytes}B > 상한 — 960폭 재캡처`)
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
