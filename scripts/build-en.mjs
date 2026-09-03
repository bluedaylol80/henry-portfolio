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
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

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

/* ---------- 2. 속성·메타·타이틀: 값 전체가 일치할 때만 ---------- */
for (const ko of Object.keys(dict.attrs)) {
  const before = html
  html = html.split('"' + ko + '"').join('"' + dict.attrs[ko] + '"')
  html = html.split('>' + ko + '</title>').join('>' + dict.attrs[ko] + '</title>')
  if (html === before) fail('속성/메타 원문을 못 찾았다: ' + JSON.stringify(ko.slice(0, 40)))
}

/* ---------- 2-b. 같은 문장이 텍스트와 속성에 함께 쓰인 경우 ----------
   추출 때 문자열 단위로 중복을 없앴기 때문에 aria-label 쪽이 사전의 attrs가 아니라 strings에 들어간다.
   속성값 전체가 정확히 일치할 때만 바꾼다(부분일치 금지). */
for (const key of Object.keys(dict.ko)) {
  html = html.split('"' + dict.ko[key] + '"').join('"' + dict.strings[key] + '"')
}

/* ---------- 3. 인라인 스크립트 리터럴 (WORKS · CAREER_LINKS · UI 문구) ---------- */
const esc = (s) => s.split(BS).join(BS + BS).split("'").join(BS + "'")
for (const ko of Object.keys(dict.script)) {
  const before = html
  html = html.split("'" + ko + "'").join("'" + esc(dict.script[ko]) + "'")
  if (html === before) fail('스크립트 리터럴을 못 찾았다: ' + JSON.stringify(ko.slice(0, 40)))
}

/* ---------- 3-b. 같은 문장이 마크업과 스크립트에 함께 쓰인 경우 ----------
   2-b와 같은 이유(문자열 단위 중복 제거). WORKS 안의 '사용자 조사'·'린' 같은 값이 여기서 처리된다. */
for (const key of Object.keys(dict.ko)) {
  html = html.split("'" + dict.ko[key] + "'").join("'" + esc(dict.strings[key]) + "'")
}

/* ---------- 4. 상대 경로 → ../ (en/ 하위로 한 단계 들어간다) ---------- */
for (const attr of ['href="', 'src="', 'content="']) {
  for (const p of ['works/', 'media/', 'demo/', 'og.png', 'favicon']) {
    html = html.split(attr + p).join(attr + '../' + p)
  }
}
for (const q of ["'", '"']) {
  for (const p of ['works/', 'media/']) html = html.split(q + p).join(q + '../' + p)
}
html = html.split('../../').join('../')

/* ---------- 5. lang · canonical · og:url · 언어 링크 ---------- */
html = html.split('<html lang="ko"').join('<html lang="' + dict.page.lang + '"')
html = html.split('href="' + dict.page.koUrl + '" rel="canonical"').join('')
html = html.split('rel="canonical" href="' + dict.page.koUrl + '"').join('rel="canonical" href="' + dict.page.canonical + '"')
html = html.split('property="og:url" content="' + dict.page.koUrl + '"').join('property="og:url" content="' + dict.page.ogUrl + '"')
// 언어 전환 링크: KO 페이지는 en/ 으로, EN 페이지는 ../ 로
html = html.split('data-lang-link href="en/" hreflang="en"').join('data-lang-link href="../" hreflang="ko"')
html = html.split('>EN<').join('>KO<')
html = html.split('>English<').join('>Korean<')

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
const leftovers = [...stripComments(html).matchAll(/[가-힣][^<>"']{0,40}/g)].map((m) => m[0])
if (leftovers.length) {
  fail('EN 결과물에 한글이 ' + leftovers.length + '건 남았다:' + NL + '  ' +
       [...new Set(leftovers)].slice(0, 12).map((s) => JSON.stringify(s)).join(NL + '  '))
}

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(OUT, html, 'utf8')
console.log('생성: ' + OUT)
console.log('  텍스트 ' + replaced + '곳 · 속성 ' + Object.keys(dict.attrs).length + '건 · 스크립트 ' + Object.keys(dict.script).length + '건 · 한글 잔존 0')
