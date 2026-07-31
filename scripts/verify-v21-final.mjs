/**
 * v21 P5 — 배포 전 최종 검증. 개별 Phase 하니스(home/p3/p4)가 각자의 동작을 보는
 * 반면, 이 스크립트는 **사이트 전체가 배포 가능한 상태인가**만 본다.
 *
 *   1) 전 라우트가 콘솔 오류 0 · 실패 요청 0 · 가로 넘침 0 으로 뜨는가
 *   2) 지원용 PDF가 실제로 내려받아지는가(200 + PDF 시그니처) + 링크가 매니페스트와 일치
 *   3) 눈에 보이는 링크가 죽어 있지 않은가(내부 링크 전수)
 *   4) 문서 제목·설명이 라우트별로 채워지는가(검색 결과에 나가는 문구)
 *   5) 예산: eager 세트에 gsap이 없는가 — measure-eager.mjs가 별도로 본다
 *
 * Usage: node scripts/verify-v21-final.mjs [baseUrl]
 */
import puppeteer from 'puppeteer-core'
import { readFileSync } from 'node:fs'

const BASE = (process.argv[2] ?? 'http://localhost:4173/henry-portfolio/').replace(/\/$/, '')
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const pdfManifest = JSON.parse(readFileSync('src/content/briefPdf.json', 'utf8'))

const ROUTES = [
  '/',
  '/brief',
  '/work/ai-os',
  '/career',
  '/career/ops',
  '/career/business-pm',
  '/career/planning',
  '/career/ai-system',
  '/room',
  '/lab/scrolly',
]

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--hide-scrollbars'] })
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const checks = []
const ok = (name, pass, note = '') => checks.push({ name, pass, note })

// ── 1 · 라우트 전수 ──────────────────────────────────────────────────
const seenLinks = new Set()
for (const route of ROUTES) {
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
  const errors = []
  const failed = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('response', (r) => r.status() >= 400 && failed.push(`${r.status()} ${r.url()}`))
  await page.goto(BASE + route, { waitUntil: 'networkidle2', timeout: 60000 })
  await wait(4200)

  const info = await page.evaluate(() => ({
    title: document.title,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    h1: document.querySelector('h1, h2')?.textContent?.trim().slice(0, 30) ?? null,
    links: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')),
  }))
  info.links.forEach((h) => seenLinks.add(h))

  ok(`[${route}] 렌더 + 제목`, !!info.title && !!info.h1, `${info.title?.slice(0, 34)}…`)
  ok(`[${route}] 가로 넘침 0`, info.overflow === 0, `${info.overflow}px`)
  ok(`[${route}] 콘솔 오류 0`, errors.length === 0, errors.slice(0, 1).join(''))
  ok(`[${route}] 실패 요청 0`, failed.length === 0, failed.slice(0, 1).join(''))
  await page.close()
}

// ── 2 · PDF 실물 확인 ────────────────────────────────────────────────
{
  // ⚠ PDF는 page.goto로 받으면 안 된다 — 크롬 내장 뷰어가 가로채서 본문 대신
  //   뷰어 문서를 돌려주고, 1KB짜리 "성공"으로 보인다(실측). 앱 페이지 안에서
  //   fetch로 바이트를 직접 받아 시그니처(%PDF-)를 확인한다.
  const page = await browser.newPage()
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 })
  for (const [lang, f] of Object.entries(pdfManifest.files)) {
    const r = await page.evaluate(async (url) => {
      const res = await fetch(url)
      const buf = new Uint8Array(await res.arrayBuffer())
      return { status: res.status, bytes: buf.length, head: String.fromCharCode(...buf.subarray(0, 5)) }
    }, BASE + '/' + f.path)
    const kb = Math.round(r.bytes / 1024)
    ok(`PDF 내려받기(${lang})`, r.status === 200 && r.head === '%PDF-', `${r.status} · ${kb}KB · ${r.head}`)
    ok(`PDF 용량 = 매니페스트(${lang})`, Math.abs(kb - f.kb) <= 2, `실측 ${kb} vs 기록 ${f.kb}`)
  }
  await page.close()
}

// ── 3 · 내부 링크 전수(죽은 링크) ────────────────────────────────────
{
  const page = await browser.newPage()
  // 해시(#work 등)는 같은 문서 안 이동이라 goto가 응답을 만들지 않는다 —
  //   해시를 떼고 경로만 검사한다(빈 문자열이 되면 루트).
  const internal = [
    ...new Set(
      [...seenLinks]
        .filter((h) => h && h.startsWith('/') && !h.startsWith('//'))
        .map((h) => h.split('#')[0])
        .map((h) => h || '/'),
    ),
  ]
  const dead = []
  for (const href of internal) {
    const url = BASE.replace(/\/henry-portfolio$/, '') + href
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => null)
    if (!res || res.status() >= 400) dead.push(`${res?.status() ?? 'ERR'} ${href}`)
  }
  ok('내부 링크 살아 있음', dead.length === 0, dead.length ? dead.slice(0, 4).join(' | ') : `${internal.length}개 확인`)
  await page.close()
}

await browser.close()
let failedCount = 0
for (const c of checks) {
  if (!c.pass) failedCount++
  console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.note ? '  — ' + c.note : ''}`)
}
console.log(`\n${checks.length - failedCount}/${checks.length} passed`)
process.exit(failedCount ? 1 : 0)
