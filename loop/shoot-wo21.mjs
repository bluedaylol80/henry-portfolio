/* WO-21 캡처 — 풀페이지는 정상 화면 높이로 스크롤하며 구간을 찍어 세로로 이어붙인다.
   뷰포트를 문서 높이로 늘리면 히어로(min-height:100lvh)가 그만큼 늘어나고(1440),
   390에서는 하단이 반복·누락된다(Codex R7). 캡처 동안 히어로 높이를 화면 높이로 고정한다.
   WO-20 대비: ① full은 배율 1로 찍는다(배율 2는 14MB가 넘어 감리가 열지 못했다)
   ② 숫자 카운터는 스크롤 위치로 매번 다시 계산돼 'en-390-full' 하단이 10/5로 찍혔다(Codex R8-01)
      → 노드를 복제해 갈아끼워 스크롤 리스너가 잡고 있던 원본을 떼어 낸다
   ③ 상세창을 근거 카드까지 내린 프레임을 따로 남긴다(Codex 웹05). */
import puppeteer from 'puppeteer-core'
import { writeFileSync } from 'node:fs'
const OUT = process.argv[2] || 'loop/shots18'
const b = await puppeteer.launch({ executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:true })
const sleep = ms => new Promise(r=>setTimeout(r,ms))
const errs = []
const imgsDone = p => p.evaluate(() => Promise.race([
  Promise.all([...document.images].filter(i => !i.complete).map(i => new Promise(r => { i.onload = i.onerror = r }))),
  new Promise(r => setTimeout(r, 4000)),
]).then(() => true))

/* 카운터는 scroll 이벤트에서 화면 위치에 비례한 값을 다시 쓴다 — 한 번 최종값을 넣어도 다음 스크롤에 되돌아간다.
   복제 노드로 갈아끼우면 리스너가 들고 있는 원본은 문서 밖으로 나가 화면에 영향을 주지 못한다. */
const freezeCounts = p => p.evaluate(() => {
  document.querySelectorAll('[data-count]').forEach(el => {
    const c = el.cloneNode(true)
    c.textContent = el.dataset.count
    el.replaceWith(c)
  })
  return [...document.querySelectorAll('[data-count]')].map(e => e.textContent).join('/')
})

async function stitch(page, w, h, dpr, out) {
  // 캡처 중에는 히어로를 화면 높이로 고정하고, 리빌을 종단 상태로 둔다
  await page.evaluate((h) => {
    const st = document.createElement('style'); st.id = '__shot'
    st.textContent = `.hero-grid{min-height:${h}px !important}`
    document.head.append(st)
    document.querySelectorAll('[data-reveal],[data-lines]').forEach(e => e.classList.add('is-in'))
  }, h)
  const frozen = await freezeCounts(page)
  await sleep(900); await imgsDone(page)
  const total = await page.evaluate(() => document.documentElement.scrollHeight)
  const shots = []
  for (let y = 0; y < total; y += h) {
    const top = Math.min(y, total - h)
    await page.evaluate(t => window.scrollTo(0, t), top)
    await sleep(450)
    shots.push({ top, buf: (await page.screenshot({ encoding: 'base64' })) })
  }
  // 캔버스에 좌표대로 얹는다 — 겹치는 마지막 구간도 제자리에 놓여 반복이 생기지 않는다
  const png = await page.evaluate(async ({ shots, w, total, dpr }) => {
    const c = document.createElement('canvas')
    c.width = w * dpr; c.height = total * dpr
    const x = c.getContext('2d')
    for (const s of shots) {
      const img = new Image(); img.src = 'data:image/png;base64,' + s.buf; await img.decode()
      x.drawImage(img, 0, s.top * dpr)
    }
    return c.toDataURL('image/png').split(',')[1]
  }, { shots, w, total, dpr })
  writeFileSync(out, Buffer.from(png, 'base64'))
  await page.evaluate(() => document.getElementById('__shot')?.remove())
  return { total, slices: shots.length, frozen }
}

for (const [lang,url] of [['ko','http://127.0.0.1:8787/'],['en','http://127.0.0.1:8787/en/']]) {
  for (const [w,h] of [[1440,900],[390,844]]) {
    const p = await b.newPage()
    p.on('pageerror', e => errs.push(String(e)))
    p.on('console', m => { if (m.type()==='error' && !/Failed to load resource/.test(m.text())) errs.push(m.text().slice(0,60)) })
    await p.setViewport({ width:w, height:h, deviceScaleFactor:2 })
    await p.goto(url,{waitUntil:'networkidle2',timeout:60000})
    await p.waitForFunction(()=>!document.getElementById('loader'),{timeout:15000}).catch(()=>{})
    await sleep(2200)
    await p.screenshot({ path:`${OUT}/${lang}-${w}-top.png` })
    await p.evaluate(()=>document.querySelectorAll('[data-reveal],[data-lines]').forEach(e=>e.classList.add('is-in')))
    await sleep(900); await imgsDone(p)
    for (const [sel,name] of [['#cases','cases'],['#proto','proto'],['#works','works']]) {
      const el = await p.$(sel); if (el) await el.screenshot({ path:`${OUT}/${lang}-${w}-${name}.png` })
    }
    await p.evaluate(()=>document.querySelector('.card-open[data-work="case1"]').click())
    await sleep(1800); await imgsDone(p); await sleep(400)
    await p.screenshot({ path:`${OUT}/${lang}-${w}-cases-dialog.png` })
    // 같은 상세창을 근거 카드까지 내린다 — 썸네일이 실제로 뜨는지 감리가 눈으로 볼 수 있어야 한다
    await p.evaluate(()=>document.getElementById('wdlgN').scrollIntoView({ block:'start' }))
    await sleep(700); await imgsDone(p); await sleep(600)
    await p.screenshot({ path:`${OUT}/${lang}-${w}-cases-dialog-evidence.png` })
    await p.keyboard.press('Escape'); await sleep(600)
    await p.evaluate(()=>window.scrollTo(0,0)); await sleep(500)
    // full은 배율 1 — 배율 2 PNG는 14MB를 넘겨 감리가 열지 못했다
    await p.setViewport({ width:w, height:h, deviceScaleFactor:1 })
    await sleep(400)
    const r = await stitch(p, w, h, 1, `${OUT}/${lang}-${w}-full.png`)
    console.log(`${lang} ${w}  full ${r.total}px · 구간 ${r.slices}장 · 카운터 ${r.frozen}`)
    await p.close()
  }
}
console.log('캡처 ok · 콘솔/pageerror ' + errs.length + (errs.length ? ': ' + errs.slice(0,3).join(' | ') : ''))
await b.close()
