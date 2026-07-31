/**
 * v21 P5 — 지원용 PDF 발췌 생성기 (SDD §2).
 *
 * 국내 지원 서류의 표준은 여전히 **PDF 한 장**이다. 그래서 사이트의 `/brief`
 * (3분 요약)를 그대로 인쇄해 PDF로 만들어 `public/` 에 커밋한다. 사이트가 곧
 * 원천이므로 **문구가 두 벌로 갈라지지 않는다** — 콘텐츠를 고치면 이 스크립트를
 * 다시 돌리는 것으로 끝난다.
 *
 * 종이 룩은 `@media print`(src/index.css)가 만든다: 어두운 관제실 → 밝은 문서.
 * 채용 담당자가 실제로 출력할 수 있어야 하기 때문이다.
 *
 * Usage: node scripts/build-pdf.mjs [baseUrl] [lang]
 *   npm run preview 를 먼저 띄워 둘 것(4173).
 */
import puppeteer from 'puppeteer-core'
import { mkdirSync, statSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname } from 'node:path'

const BASE = (process.argv[2] ?? 'http://localhost:4173/henry-portfolio/').replace(/\/$/, '')
const LANG = process.argv[3] ?? 'ko'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const OUT = `public/brief/henry-lim-brief-${LANG}.pdf`

mkdirSync(dirname(OUT), { recursive: true })
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage()
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))

await page.evaluateOnNewDocument((l) => localStorage.setItem('henry.lang', l), LANG)
await page.setViewport({ width: 1100, height: 1400, deviceScaleFactor: 2 })
await page.goto(BASE + '/brief', { waitUntil: 'networkidle2', timeout: 60000 })
// 프리로더가 걷히고 리빌(framer)이 끝나야 본문이 불투명해진다.
await new Promise((r) => setTimeout(r, 6000))

// 인쇄 스타일을 적용한 상태로 렌더 — 화면 미디어로 뽑으면 어두운 배경이 그대로 인쇄된다.
await page.emulateMediaType('print')
await new Promise((r) => setTimeout(r, 500))

// 인쇄 스타일이 실제로 먹었는지 확인(먹지 않으면 어두운 PDF가 조용히 나온다).
const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
const light = /rgb\(255,\s*255,\s*255\)/.test(bg)

await page.pdf({
  path: OUT,
  format: 'A4',
  printBackground: false,
  margin: { top: '14mm', bottom: '16mm', left: '14mm', right: '14mm' },
})
await browser.close()

const kb = statSync(OUT).size / 1024

/**
 * 매니페스트 — 화면에 "언제 만든 PDF인지"를 손으로 적지 않기 위해서다.
 * (카운터 스냅샷과 같은 원칙: 날짜·크기는 만든 쪽이 기록한다.)
 */
const MANIFEST = 'src/content/briefPdf.json'
const prev = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : { files: {} }
// 현지 날짜로 찍는다 — toISOString()은 UTC라 한국 새벽에는 어제 날짜가 박힌다.
const now = new Date()
const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
const manifest = {
  $comment: '자동 생성 — scripts/build-pdf.mjs. 직접 수정하지 마세요.',
  generatedOn: stamp,
  files: { ...prev.files, [LANG]: { path: OUT.replace(/^public\//, ''), kb: Math.round(kb), generatedOn: stamp } },
}
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n')

console.log(`[build-pdf] → ${OUT}  ${kb.toFixed(0)} KB`)
console.log(`  인쇄 스타일 적용: ${light ? 'OK (흰 바탕)' : `⚠ 실패 — body 배경이 ${bg}`}`)
if (errors.length) console.log(`  콘솔 오류 ${errors.length}건: ${errors.slice(0, 3).join(' | ')}`)
if (!light) process.exit(1)
