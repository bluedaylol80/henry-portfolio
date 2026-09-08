// WO-1 판정 (loop/ 산출물 — 커밋 금지)
// 1440·390 overflowX 0 · 카드 8장 높이 동일 · 다이얼로그 7종 열림 · 히어로 칩 겹침 0 · 모바일 임팩트 노출 · 콘솔
import puppeteer from 'puppeteer-core'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const FILE = process.argv[2] || 'D:/Github/henry-portfolio/site/en/index.html'
let pass = 0, fail = 0
const ck = (n, ok, x = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'} ${n}${x ? ' — ' + x : ''}`) }
const sleep = ms => new Promise(r => setTimeout(r, ms))

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true })
const errors = []
for (const [name, w, h] of [['1440', 1440, 900], ['390', 390, 844]]) {
  const page = await browser.newPage()
  page.on('console', m => { if (m.type() === 'error') errors.push(`${name}: ${m.text().slice(0, 110)}`) })
  page.on('pageerror', e => errors.push(`${name}: ${String(e).slice(0, 110)}`))
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 2 })
  await page.goto('file:///' + FILE, { waitUntil: 'networkidle2', timeout: 60000 })
  await sleep(1900)
  const m = await page.evaluate(() => {
    const de = document.documentElement
    const rect = s => { const e = document.querySelector(s); return e ? e.getBoundingClientRect() : null }
    const cards = [...document.querySelectorAll('#works .card, #proto .card')]
      .map(c => Math.round(c.getBoundingClientRect().height))
    const keys = rect('.hero-keys'), hcard = rect('.hcard')
    const overlap = keys && hcard
      ? !(keys.right <= hcard.left || hcard.right <= keys.left || keys.bottom <= hcard.top || hcard.bottom <= keys.top)
      : null
    const impacts = [...document.querySelectorAll('#career .row-impact')]
    return {
      overflowX: de.scrollWidth - de.clientWidth,
      cards, cardSet: [...new Set(cards)],
      chipCount: [...document.querySelectorAll('.hero-keys li')].filter(li => li.getClientRects().length > 0).length,
      chipRows: new Set([...document.querySelectorAll('.hero-keys li')].filter(li => li.getClientRects().length > 0).map(li => Math.round(li.getBoundingClientRect().top))).size,
      overlap,
      impactCount: impacts.length,
      impactVisible: impacts.filter(p => p.getClientRects().length > 0 && getComputedStyle(p).display !== 'none').length,
      impactMax: Math.max(...impacts.map(p => p.textContent.trim().length)),
      subLen: (document.querySelector('.hero-sub')?.textContent ?? '').trim().length,
      h1Lines: document.querySelectorAll('h1 .line').length,
      blanks: [...document.querySelectorAll('a[target="_blank"]')].map(a => a.rel).filter(r => !r.includes('noopener')).length,
      rowLinks: [...document.querySelectorAll('#career .row-links')].map(el => ({
        k: el.dataset.links, n: el.querySelectorAll('a').length,
        vis: el.getClientRects().length > 0,
        bad: [...el.querySelectorAll('a')].filter(a => !a.href.startsWith('https://limhenry.notion.site/')).length,
      })),
      hub: [...document.querySelectorAll('[data-notion-hub]')].map(a => a.href),
      lang: document.documentElement.lang,
      // hreflang이 붙은 대체 링크만 센다 — PDF alternate(type=application/pdf)는 hreflang이 없다
      hreflang: [...document.querySelectorAll('link[rel=alternate][hreflang]')].map(l => l.hreflang + '=' + l.getAttribute('href')),
      pdfAlt: (document.querySelector('link[rel=alternate][type="application/pdf"]') || {}).getAttribute?.('href') || '',
      langLink: [...document.querySelectorAll('a.lang')].map(a => a.textContent.trim() + '->' + a.getAttribute('href')),
      visibleHangul: (document.body.innerText.match(/[가-힣]+/g) || []).slice(0, 8),
      headerRows: new Set([...document.querySelectorAll('.nav li')].map(li => Math.round(li.getBoundingClientRect().top))).size,
    }
  })
  ck(`${name} overflowX=0`, m.overflowX === 0, String(m.overflowX))
  // #works(6장)와 #proto(2장)는 별개 그리드다. 1440은 두 그리드가 같은 높이로 떨어지지만
  // 390은 HEAD(dd945f2)에서도 530/561로 갈린다 — 회귀 판정은 HEAD 기준선과 대조한다.
  // EN은 문장 길이가 달라 KO와 같은 픽셀이 될 수 없다. 그리드별 균일(성과 6장 동일 · 프로토 2장 동일)만 본다.
  const works6 = m.cards.slice(0, 6), proto2 = m.cards.slice(6)
  const uniform = new Set(works6).size === 1 && new Set(proto2).size === 1
  ck(`${name} 카드 높이 그리드별 균일`, m.cards.length === 8 && uniform,
     `성과 ${[...new Set(works6)].join('/')}px · 프로토 ${[...new Set(proto2)].join('/')}px`)
  ck(`${name} 역량 칩 5개`, m.chipCount === 5, `${m.chipCount}개 · ${m.chipRows}줄`)
  ck(`${name} 칩↔hcard 겹침 0`, m.overlap === false || m.overlap === null, String(m.overlap))
  ck(`${name} 임팩트 10줄 전부 노출`, m.impactCount === 10 && m.impactVisible === 10, `${m.impactVisible}/${m.impactCount} · 최장 ${m.impactMax}자`)
  // 에코 복제층을 걷어내(WO-14) DOM의 .line은 원본 3줄뿐이다 — 목적(h1 3줄 유지)은 그대로다
  ck(`${name} h1 3줄 유지`, m.h1Lines === 3, String(m.h1Lines))
  ck(`${name} target=_blank noopener 전수`, m.blanks === 0, `${m.blanks}건 누락`)
  const rlTotal = m.rowLinks.reduce((a, r) => a + r.n, 0)
  ck(`${name} #career 근거 링크 5행·회사당 ≤3·전부 노출`,
     m.rowLinks.length === 5 && m.rowLinks.every(r => r.n >= 1 && r.n <= 3 && r.vis && r.bad === 0),
     m.rowLinks.map(r => `${r.k}:${r.n}${r.vis ? '' : '(숨김)'}${r.bad ? '(도메인' + r.bad + ')' : ''}`).join(' ') + ` 합계 ${rlTotal}`)
  ck(`${name} 화면 한글 0`, m.visibleHangul.length === 0, m.visibleHangul.join(',') || '0건')
  ck(`${name} html lang`, m.lang === 'en', m.lang)
  ck(`${name} hreflang 3종`, m.hreflang.length === 3, m.hreflang.join(' '))
  ck(`${name} 언어 링크 KO->../`, m.langLink.join('') === 'KO->../', m.langLink.join(''))
  ck(`${name} 헤더 1줄`, m.headerRows === 1, m.headerRows + '줄')
  ck(`${name} PDF alternate = EN 파일`, m.pdfAlt === '../henry-lim-portfolio-en.pdf', m.pdfAlt)
  ck(`${name} 허브 링크 3곳 동일 URL`,
     m.hub.length === 3 && new Set(m.hub).size === 1 && m.hub[0].endsWith('0e48e826c73f4a7ab9c3522d7fb16ce5'),
     `${m.hub.length}곳 · ${[...new Set(m.hub)].join(',')}`)
  console.log(`  (${name} hero-sub ${m.subLen}자)`)

  // 다이얼로그 7종
  // WO-17: 대표 사례 3종이 같은 .wdlg를 쓴다 — 판정 대상에 함께 넣는다
  const keys = ['case1', 'case2', 'case3', 'dalcom', 'lyn', 'chaos', 'nightwalker', 'fivestars', 'nanakage', 'budget']
  let opened = 0, rows = [], badLinks = 0, nTotal = 0
  for (const k of keys) {
    await page.evaluate(k => document.querySelector(`.card-open[data-work="${k}"]`)?.click(), k)
    await sleep(420)
    const st = await page.evaluate(() => {
      const links = [...document.querySelectorAll('#wdlgN a')]
      return {
        open: document.getElementById('wdlg').open,
        t: document.getElementById('wdlgT').textContent,
        rows: document.querySelectorAll('#wdlgR > div').length,
        n: links.length,
        bad: links.filter(a => !a.href.startsWith('https://limhenry.notion.site/') || a.rel !== 'noopener noreferrer' || a.target !== '_blank').length,
        hdr: (document.querySelector('#wdlgN h4') || {}).textContent || '',
        hidden: document.getElementById('wdlgN').hidden,
      }
    })
    if (st.open && st.t) opened++
    if (st.n > 6 || st.bad > 0) badLinks++   // 카드 상한 6(WO-17)
    if (st.n > 0 && st.hdr !== 'Key cases (Notion · pages in Korean)') badLinks++
    if (st.n === 0 && !st.hidden) badLinks++
    nTotal += st.n
    rows.push(`${k}:${st.rows}행/n${st.n}${st.bad ? '(불량' + st.bad + ')' : ''}`)
    await page.keyboard.press('Escape')
    await sleep(320)
  }
  ck(`${name} 다이얼로그 10종 열림`, opened === 10, `${opened}/10 · ${rows.join(' ')}`)
  ck(`${name} 다이얼로그 근거 링크 29개·규격 전건`, nTotal === 29 && badLinks === 0, `${nTotal}개 · 불량 ${badLinks}`)
  await page.close()
}
await browser.close()
ck('콘솔 오류 (404 외) 0', errors.every(e => /ERR_FILE_NOT_FOUND|Failed to load resource/.test(e)), errors.join(' | ') || '0건')
console.log(`\n${fail === 0 ? 'ALL PASS' : 'FAIL 있음'} — pass ${pass} / fail ${fail}`)
