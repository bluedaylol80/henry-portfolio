/**
 * EN 페이지 생성기 — site/index.html(KO 원본) + site/i18n/en.json → site/en/index.html
 *
 * 원본은 하나다(site/index.html). 런타임 토글이 아니라 빌드가 EN 사본을 만든다 —
 * 리크루터에게 보낸 링크가 상대 브라우저 상태와 무관하게 항상 같은 언어로 열려야 하기 때문.
 *
 * 규칙
 *  - 번역 대상 텍스트는 KO 원본에 data-i18n="key"로 표시돼 있다. 치환은 그 요소 범위 안에서만
 *    한다(전역 치환은 "린"·"기획" 같은 짧은 문자열이 엉뚱한 곳을 갈아엎는다).
 *  - 사전에 없는 key, 또는 원문을 못 찾으면 빌드를 실패시킨다(무음 KO 잔존 금지).
 *  - 마지막에 한글 잔존 검사를 한 번 더 돌린다.
 *
 * 의존성 추가 없음 — 설치된 HTML 파서가 없어 문자열 처리로만 한다.
 * Usage: node scripts/build-en.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const SRC = 'site/index.html'
const DICT = 'site/i18n/en.json'
const OUT_DIR = 'site/en'
const OUT = OUT_DIR + '/index.html'
const VOID = new Set(['meta','link','img','br','hr','input','source','use','path','circle','rect','area','col','embed','track','wbr'])
const MARK = ' data-i18n="'
const BS = String.fromCharCode(92)
const NL = String.fromCharCode(10)

const fail = (msg) => { console.error('빌드 실패: ' + msg); process.exit(1) }

const dict = JSON.parse(readFileSync(DICT, 'utf8'))
let html = readFileSync(SRC, 'utf8')

/* ---------- 1. data-i18n 요소: 요소 범위 안에서만 치환 ----------
   태그 매칭은 정규식 없이 indexOf로만 훑는다(중첩 같은 이름 태그를 깊이로 센다). */
function innerRange(s, gt, name) {
  const openTok = '<' + name, closeTok = '</' + name
  let depth = 1, i = gt + 1
  while (depth > 0) {
    const o = s.indexOf(openTok, i), c = s.indexOf(closeTok, i)
    if (c < 0) return null
    if (o >= 0 && o < c) {
      const after = s.charAt(o + openTok.length)
      if (after === '>' || after === ' ' || after === NL || after === String.fromCharCode(9) || after === String.fromCharCode(13) || after === '/') depth++
      i = o + openTok.length
    } else {
      depth--
      if (depth === 0) return { from: gt + 1, to: c }
      i = c + closeTok.length
    }
  }
  return null
}

const usedKeys = new Set()
let replaced = 0
for (;;) {
  const at = html.indexOf(MARK)
  if (at < 0) break
  const lt = html.lastIndexOf('<', at)
  const gt = html.indexOf('>', at)
  const name = html.slice(lt + 1).split(/[ />]/)[0].toLowerCase()
  const key = html.slice(at + MARK.length, html.indexOf('"', at + MARK.length))
  const en = dict.strings[key]
  const ko = dict.ko[key]
  if (en === undefined) fail('사전에 key가 없다: "' + key + '" (site/i18n/en.json → strings)')
  if (ko === undefined) fail('사전에 원문(ko)이 없다: "' + key + '"')
  // 표시 속성은 결과물에서 떼어낸다 (EN 페이지는 더 이상 치환 대상이 아니다)
  const attrEnd = html.indexOf('"', at + MARK.length) + 1
  html = html.slice(0, at) + html.slice(attrEnd)
  const gt2 = html.indexOf('>', lt)
  if (html.charAt(gt2 - 1) === '/' || VOID.has(name)) fail('빈 요소에 data-i18n이 붙었다: key="' + key + '"')
  const range = innerRange(html, gt2, name)
  if (!range) fail('요소 범위를 찾지 못했다: key="' + key + '" <' + name + '>')
  const inner = html.slice(range.from, range.to)
  const koAt = inner.indexOf(ko)
  if (koAt < 0) fail('요소 안에서 KO 원문을 못 찾았다: key="' + key + '" 원문=' + JSON.stringify(ko.slice(0, 40)))
  const newInner = inner.slice(0, koAt) + en + inner.slice(koAt + ko.length)
  html = html.slice(0, range.from) + newInner + html.slice(range.to)
  usedKeys.add(key); replaced++
}
const unused = Object.keys(dict.strings).filter((k) => !usedKeys.has(k))
if (unused.length) fail('사전에만 있고 원본에 안 쓰인 key ' + unused.length + '개: ' + unused.slice(0, 5).join(', '))

/* ---------- 2. 속성: data-i18n-attr 마커가 붙은 요소의 여는 태그 안에서만 ---------- */
const AMARK = ' data-i18n-attr="'
const attrUsed = new Set()
let attrReplaced = 0
function lookupAttr(v) {
  if (dict.attrs[v] !== undefined) { attrUsed.add(v); return dict.attrs[v] }
  for (const k of Object.keys(dict.ko)) {
    if (dict.ko[k] === v) { if (dict.strings[k] === undefined) fail('ko는 있는데 strings가 없다: key="' + k + '"'); return dict.strings[k] }
  }
  return undefined
}
for (;;) {
  const at = html.indexOf(AMARK)
  if (at < 0) break
  const qEnd = html.indexOf('"', at + AMARK.length)
  if (qEnd < 0) fail('data-i18n-attr 마커가 닫히지 않았다')
  const names = html.slice(at + AMARK.length, qEnd).split('|')
  // 마커 자체를 결과물에서 떼어낸다
  html = html.slice(0, at) + html.slice(qEnd + 1)
  const lt = html.lastIndexOf('<', at)
  const gt = html.indexOf('>', at)
  if (lt < 0 || gt < 0) fail('data-i18n-attr 요소의 여는 태그 범위를 못 찾았다')
  let tag = html.slice(lt, gt + 1)
  for (const name of names) {
    const tok = ' ' + name + '="'
    const ai = tag.indexOf(tok)
    if (ai < 0) fail('요소에 속성이 없다: ' + name + ' — ' + JSON.stringify(tag.slice(0, 60)))
    const vs = ai + tok.length
    const ve = tag.indexOf('"', vs)
    if (ve < 0) fail('속성값이 닫히지 않았다: ' + name)
    const v = tag.slice(vs, ve)
    const en = lookupAttr(v)
    if (en === undefined) fail('속성 번역을 사전에서 못 찾았다: ' + name + '=' + JSON.stringify(v.slice(0, 40)))
    tag = tag.slice(0, vs) + en + tag.slice(ve)
    attrReplaced++
  }
  html = html.slice(0, lt) + tag + html.slice(gt + 1)
}
// <title>은 속성이 아니라 요소 텍스트 — 별도로 처리한다
{
  const m = html.match(/<title>([\s\S]*?)<\/title>/)
  if (!m) fail('<title>을 못 찾았다')
  const en = dict.attrs[m[1]]
  if (en === undefined) fail('title 번역이 사전(attrs)에 없다: ' + JSON.stringify(m[1].slice(0, 40)))
  attrUsed.add(m[1])
  html = html.split(m[0]).join('<title>' + en + '</title>')
  attrReplaced++
}
{
  const un = Object.keys(dict.attrs).filter((k) => !attrUsed.has(k))
  if (un.length) fail('사전(attrs)에만 있고 원본에 안 쓰인 key ' + un.length + '개: ' + un.slice(0, 5).map((s) => JSON.stringify(s.slice(0, 30))).join(', '))
}

/* ---------- 3. 인라인 스크립트 리터럴: 블록 스코프 안에서만 ---------- */
const esc = (s) => s.split(BS).join(BS + BS).split("'").join(BS + "'")
const scriptUsed = new Set()
let scriptReplaced = 0
function replaceInRegion(src, startMarker, endMarker, fn) {
  const a = src.indexOf(startMarker)
  if (a < 0) fail('스크립트 블록 시작을 못 찾았다: ' + JSON.stringify(startMarker))
  const b = src.indexOf(endMarker, a + startMarker.length)
  if (b < 0) fail('스크립트 블록 끝을 못 찾았다: ' + JSON.stringify(endMarker) + ' (시작=' + JSON.stringify(startMarker) + ')')
  const to = b + endMarker.length
  return src.slice(0, a) + fn(src.slice(a, to)) + src.slice(to)
}
function translateRegion(region) {
  let out = region
  for (const ko of Object.keys(dict.script)) {
    const lit = "'" + ko + "'"
    if (out.indexOf(lit) < 0) continue
    out = out.split(lit).join("'" + esc(dict.script[ko]) + "'")
    scriptUsed.add(ko); scriptReplaced++
  }
  // 같은 문장이 마크업과 스크립트에 함께 쓰인 경우(사전 추출 시 문자열 단위 중복 제거)
  for (const key of Object.keys(dict.ko)) {
    const lit = "'" + dict.ko[key] + "'"
    if (out.indexOf(lit) < 0) continue
    out = out.split(lit).join("'" + esc(dict.strings[key]) + "'")
    scriptReplaced++
  }
  return out
}
for (const start of ['const CAREER_LINKS = {', 'const WORKS = {']) {
  html = replaceInRegion(html, start, NL + '};', translateRegion)
}
// 근거 카드 생성기는 블록 스코프가 아니라 주석 마커로 범위를 못 박는다
html = replaceInRegion(html, '/* i18n-region: evidence */', '/* /i18n-region */', translateRegion)
// 블록 밖 단독 라인: 등장 횟수를 못 박고 그 자리에서만 치환한다
for (const [line, times] of [["h.textContent = '주요 사례 (Notion)';", 1],
                             ["showToast('이메일 주소를 복사했습니다 — bluedaylol80@gmail.com');", 1],
                             ["sr.textContent = ' (새 창에서 열림)';", 2]]) {
  const n = html.split(line).length - 1
  if (n !== times) fail('스크립트 단독 라인 등장 횟수가 ' + times + '이 아니라 ' + n + ': ' + JSON.stringify(line.slice(0, 50)))
  html = html.split(line).join(translateRegion(line))
}
{
  const un = Object.keys(dict.script).filter((k) => !scriptUsed.has(k))
  if (un.length) fail('사전(script)에만 있고 원본에 안 쓰인 key ' + un.length + '개: ' + un.slice(0, 5).map((s) => JSON.stringify(s.slice(0, 30))).join(', '))
}

/* ---------- 4. 상대 경로 → ../ (en/ 하위로 한 단계 들어간다) ---------- */
for (const attr of ['href="', 'src="', 'content="']) {
  for (const p of ['works/', 'media/', 'demo/', 'evidence/', 'deck/', 'og.png', 'favicon']) {
    html = html.split(attr + p).join(attr + '../' + p)
  }
}
for (const q of ["'", '"']) {
  for (const p of ['works/', 'media/', 'evidence/']) html = html.split(q + p).join(q + '../' + p)
}
html = html.split('../../').join('../')

/* ---------- 4-b. 로컬 상대경로 자산 존재 검사 (알려진 결손은 예외) ---------- */
const KNOWN_MISSING = ['../works/nanakage-thumb.webp', '../works/nanakage-1.webp']
{
  const refs = new Set()
  for (const m of html.matchAll(/(?:src|href)="(\.\.\/[^"]+)"/g)) refs.add(m[1])
  for (const m of html.matchAll(/'(\.\.\/(?:works|media|demo)\/[^']+)'/g)) refs.add(m[1])
  const missing = [...refs].filter((r) => {
    const clean = r.split('#')[0].split('?')[0]
    if (!clean) return false
    return !existsSync(join(OUT_DIR, clean))
  })
  const unexpected = missing.filter((r) => KNOWN_MISSING.indexOf(r) < 0)
  if (unexpected.length) fail('결과물이 없는 로컬 자산을 참조한다 ' + unexpected.length + '건: ' + unexpected.slice(0, 8).join(', '))
  console.log('  자산 참조 ' + refs.size + '건 · 결손 ' + missing.length + '건(알려진 예외)')
}

/* ---------- 5. lang · canonical · og:url · 언어 링크 (건수 단언) ---------- */
function swap(marker, to) {
  const n = html.split(marker).length - 1
  if (n === 0) fail('치환 대상을 못 찾았다(0건): ' + JSON.stringify(marker.slice(0, 60)))
  html = html.split(marker).join(to)
  return n
}
swap('<html lang="ko"', '<html lang="' + dict.page.lang + '"')
html = html.split('href="' + dict.page.koUrl + '" rel="canonical"').join('')
swap('rel="canonical" href="' + dict.page.koUrl + '"', 'rel="canonical" href="' + dict.page.canonical + '"')
swap('property="og:url" content="' + dict.page.koUrl + '"', 'property="og:url" content="' + dict.page.ogUrl + '"')
const langLinks = swap('data-lang-link href="en/" hreflang="en"', 'data-lang-link href="../" hreflang="ko"')
swap('>EN<', '>KO<')
// 포트폴리오 PDF — 헤드 alternate·연락처 창·푸터 세 곳을 EN 파일로 한 번에 바꾼다
swap('henry-lim-portfolio-ko.pdf', '../henry-lim-portfolio-en.pdf')
swap('>English<', '>Korean<')
// Notion 이력 — KO는 허브, EN은 영문 이력서로 (본부장 09-29). 근거 사례 페이지(다른 id)는 그대로
const hubN = swap(dict.page.notionHubId, dict.page.notionResumeId)
if (hubN !== 4) fail('Notion 허브 id가 4곳이 아니라 ' + hubN + '곳')
swap('aria-label="Switch to English"', 'aria-label="한국어로 전환"')
console.log('  언어 전환 링크 ' + langLinks + '곳')

/* ---------- 6. 게이트: 한글 잔존 0 ----------
   주석(HTML·CSS·JS)은 화면에 안 나오고 원본 설명이라 그대로 둔다 — 검사에서만 뺀다.
   "보이는 한글 0"은 별도로 브라우저 렌더 텍스트로 실측한다(loop/probe-en). */
function stripComments(s) {
  let out = s
  for (const [a, b] of [['<!--', '-->'], ['/*', '*/']]) {
    for (;;) {
      const i = out.indexOf(a); if (i < 0) break
      const j = out.indexOf(b, i + a.length); if (j < 0) break
      out = out.slice(0, i) + ' ' + out.slice(j + b.length)
    }
  }
  return out.split(NL).map((line) => {
    const i = line.indexOf('//')
    return i >= 0 && line.slice(0, i).indexOf(':') < 0 ? line.slice(0, i) : line
  }).join(NL)
}
// EN 페이지가 의도적으로 갖는 한국어 문구(언어 전환 안내·(Korean) 라벨)는 검사에서 뺀다
const ALLOW_KO = ['한국어로 전환']
const leftovers = [...stripComments(html).matchAll(/[가-힣][^<>"']{0,40}/g)]
  .map((m) => m[0]).filter((t) => !ALLOW_KO.some((a) => t.indexOf(a) === 0))
if (leftovers.length) {
  fail('EN 결과물에 한글이 ' + leftovers.length + '건 남았다:' + NL + '  ' +
       [...new Set(leftovers)].slice(0, 12).map((s) => JSON.stringify(s)).join(NL + '  '))
}

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(OUT, html, 'utf8')
console.log('생성: ' + OUT)
console.log('  텍스트 ' + replaced + '곳 · 속성 ' + attrReplaced + '건 · 스크립트 ' + scriptReplaced + '건 · 한글 잔존 0')
