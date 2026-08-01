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
/** 문서 응답이 404인데 화면은 정상인 라우트 = GitHub Pages SPA 폴백(정보용). */
const spaFallback = []
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

  /**
   * ⚠ GitHub Pages는 서버 라우팅이 없어서 `/career` 같은 딥링크에 404를 주고
   * `404.html`(= index.html 사본)을 내려준다. 그러면 앱은 정상 부팅해 화면은
   * 제대로 뜨지만 문서 응답 코드는 404다. **v20부터의 구조이며 이번 변경의 회귀가
   * 아니다.** 그래서 "문서 자체의 404 + 화면은 렌더됨"은 실패가 아니라 별도
   * 항목(SPA 폴백)으로 분류한다 — 진짜 깨진 리소스(이미지·폰트·PDF 404)와
   * 섞이면 다음 사람이 매번 헷갈린다.
   * (근본 해결은 라우트별 정적 HTML 프리렌더 — 미착수, 인수인계 참조.)
   */
  const docUrl = BASE + route
  const docFallback = failed.filter((f) => f.startsWith('404 ') && f.slice(4).replace(/\/$/, '') === docUrl.replace(/\/$/, ''))
  const realFailures = failed.filter((f) => !docFallback.includes(f))
  const consoleNoise = errors.filter((e) => !/Failed to load resource: the server responded with a status of 404/.test(e))

  const info = await page.evaluate(() => ({
    title: document.title,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    h1: document.querySelector('h1, h2')?.textContent?.trim().slice(0, 30) ?? null,
    links: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')),
  }))
  info.links.forEach((h) => seenLinks.add(h))

  ok(`[${route}] 렌더 + 제목`, !!info.title && !!info.h1, `${info.title?.slice(0, 34)}…`)
  ok(`[${route}] 가로 넘침 0`, info.overflow === 0, `${info.overflow}px`)
  ok(`[${route}] 콘솔 오류 0`, consoleNoise.length === 0, consoleNoise.slice(0, 1).join(''))
  ok(`[${route}] 깨진 리소스 0`, realFailures.length === 0, realFailures.slice(0, 1).join(''))
  if (docFallback.length) spaFallback.push(route)
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
        // 파일 링크(PDF 등)는 라우트가 아니다 — 화면 렌더 기준으로 재면 항상
        // "죽은 링크"가 된다. 파일은 위의 PDF 항목이 따로 검사한다.
        .filter((h) => !/\.(pdf|png|jpe?g|webp|svg|mp4|mp3)$/i.test(h.split('#')[0]))
        .map((h) => h.split('#')[0])
        .map((h) => h || '/'),
    ),
  ]
  // "살아 있다"의 기준은 응답 코드가 아니라 **화면이 뜨는가**다. Pages 딥링크는
  // 404를 주고도 SPA 폴백으로 정상 렌더되므로, 상태코드만 보면 전부 죽은 링크로
  // 보인다(실측). 실제로 못 여는 링크만 잡는다.
  const dead = []
  for (const href of internal) {
    const url = BASE.replace(/\/henry-portfolio$/, '') + href
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => null)
    await wait(2500)
    const rendered = await page.evaluate(() => !!document.querySelector('#main, main')).catch(() => false)
    if (!rendered) dead.push(`${res?.status() ?? 'ERR'} ${href}`)
  }
  ok('내부 링크 살아 있음(화면 기준)', dead.length === 0, dead.length ? dead.slice(0, 4).join(' | ') : `${internal.length}개 확인`)
  await page.close()
}

await browser.close()
let failedCount = 0
for (const c of checks) {
  if (!c.pass) failedCount++
  console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.note ? '  — ' + c.note : ''}`)
}
console.log(`\n${checks.length - failedCount}/${checks.length} passed`)
if (spaFallback.length) {
  console.log(
    `\nNOTE  문서 응답 404 + 화면 정상(GitHub Pages SPA 폴백): ${spaFallback.join(', ')}` +
      `\n      v20부터의 구조이며 방문자에게는 정상 동작한다. 상태코드까지 200으로 만들려면` +
      `\n      라우트별 정적 HTML 프리렌더가 필요하다(미착수).`,
  )
}
process.exit(failedCount ? 1 : 0)
