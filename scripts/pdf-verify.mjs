/* PDF 판정 — 쪽수·링크 주석·쪽별 첫 줄·금지어. 텍스트는 pdf.js로 뽑는다.
   로컬 pdftotext는 Xpdf 4.00(2017)이라 여러 줄 문단을 한 줄로 합쳐 섞는다(빈 2문단 문서로 재현).
   위반이 하나라도 있으면 종료 코드 1로 끝낸다 — 출력만 하면 아무도 안 본다(Codex R11 D14).
   금지어는 텍스트 레이어만 본다. 이미지 속 글자는 여기서 못 잡으니 캡처 자체를 갈아야 한다. */
import puppeteer from 'puppeteer-core'
import { BANNED as BAD } from './pdf-banned.mjs'
/* EN 표지·연락 장의 /henry-portfolio/en/ 은 이 브랜치가 배포돼야 생기는 주소다 — 미배포 EN 경로는 링크 검사에서 허용한다(Codex R12 N1) */
const PAGES = 15
const LINKS_MIN = 19
const b = await puppeteer.launch({ executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:'new', args:['--no-sandbox'] })
const p = await b.newPage()
await p.goto('http://127.0.0.1:8787/pdf/', { waitUntil:'domcontentloaded' })
const bad = []
for (const lang of ['ko','en']) {
  const r = await p.evaluate(async (lang) => {
    const pdfjs = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.6.82/build/pdf.min.mjs')
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.6.82/build/pdf.worker.min.mjs'
    const doc = await pdfjs.getDocument('/henry-lim-portfolio-' + lang + '.pdf').promise
    const pages = [], out = []
    let links = 0
    for (let i = 1; i <= doc.numPages; i++) {
      const pg = await doc.getPage(i)
      links += (await pg.getAnnotations()).filter(a => a.subtype === 'Link' && (a.url || a.unsafeUrl)).length
      const t = (await pg.getTextContent()).items.map(x => x.str + (x.hasEOL ? ' ' : '')).join('').replace(/\s+/g, ' ').trim()
      pages.push(t); out.push(t.slice(0, 72))
    }
    return { n: doc.numPages, links, heads: out, all: pages }
  }, lang)
  const all = r.all.join(' ')
  const hits = BAD.filter(w => all.includes(w))
  /* 16:9 슬라이드 15장이 정본이다(WO-24). "이미지 대기"는 채택 전 빈 슬롯이라 최종본에서는 0이어야 한다 */
  const pend = (all.match(/이미지 대기/g) || []).length
  console.log(`\n== ${lang} — ${r.n}쪽${r.n === PAGES ? '' : ` (기대 ${PAGES}쪽)`} · 링크 주석 ${r.links}개 · 금지어 ${hits.length ? hits.join(',') : 0} · 이미지 대기 ${pend}개`)
  r.heads.forEach((h, i) => console.log(`  p${i+1}: ${h}`))
  if (r.n !== PAGES) bad.push(`${lang} 쪽수 ${r.n} ≠ ${PAGES}`)
  if (r.links < LINKS_MIN) bad.push(`${lang} 링크 주석 ${r.links} < ${LINKS_MIN}`)
  if (hits.length) bad.push(`${lang} 금지어 ${hits.join(',')}`)
  if (pend) bad.push(`${lang} 이미지 대기 ${pend}개`)
}
await b.close()
if (bad.length) { console.error('\n판정 실패:\n  ' + bad.join('\n  ')); process.exit(1) }
console.log('\n판정 통과 — 쪽수·링크·금지어·이미지 대기 모두 이상 없음')
