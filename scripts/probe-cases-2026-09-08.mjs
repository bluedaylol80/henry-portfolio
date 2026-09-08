// WO-17 판정 — #cases 대표 사례 3(구조·카드·상세창·전체 클릭)과 역량/업무 방식 근거 칩.
// 사전 준비: python -m http.server 8787 -d site
import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:true })
const sleep = ms => new Promise(r=>setTimeout(r,ms))
let pass=0, fail=0
const ck=(n,ok,x='')=>{ ok?pass++:fail++; console.log(`${ok?'PASS':'FAIL'} ${n}${x?' — '+x:''}`) }
for (const [lang,url] of [['ko','http://127.0.0.1:8787/'],['en','http://127.0.0.1:8787/en/']]) {
  for (const w of [1440, 390]) {
    const p = await b.newPage(); const errs=[]
    p.on('pageerror',e=>errs.push('pageerror '+e))
    p.on('console',m=>{ if(m.type()==='error' && !/Failed to load resource/.test(m.text())) errs.push(m.text().slice(0,80)) })
    await p.setViewport({ width:w, height:900, deviceScaleFactor:1 })
    await p.goto(url,{waitUntil:'networkidle2',timeout:60000})
    await p.waitForFunction(()=>!document.getElementById('loader'),{timeout:15000}).catch(()=>{})
    await sleep(1800)
    const m = await p.evaluate(() => ({
      order: [...document.querySelectorAll('main section[id]')].map(s=>s.id),
      cases: document.querySelectorAll('#cases .case').length,
      steps: [...document.querySelectorAll('#cases .case')].map(c=>c.querySelectorAll('.case-steps > div').length),
      nav: [...document.querySelectorAll('.nav li')].map(li=>li.textContent.trim()),
      hdr: new Set([...document.querySelectorAll('.nav li')].map(li=>Math.round(li.getBoundingClientRect().top))).size,
      ovf: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ctaTarget: document.querySelector('.cta-row .pill--dark')?.dataset.scroll,
    }))
    ck(`${lang} ${w} 섹션 순서`, m.order.join('>')==='home>cases>works>proto>method>career>lab>skills', m.order.join(' > '))
    ck(`${lang} ${w} 사례 카드 3장·4단계`, m.cases===3 && m.steps.every(v=>v===4), `${m.cases}장 · 단계 ${m.steps.join('/')}`)
    ck(`${lang} ${w} 헤더 1줄·overflowX 0`, m.hdr===1 && m.ovf===0, `${m.hdr}줄 · ovf ${m.ovf} · 내비 ${m.nav.join('/')}`)
    ck(`${lang} ${w} 히어로 CTA → cases`, m.ctaTarget==='cases', String(m.ctaTarget))
    // 사례 카드 전체 클릭 → 상세창
    let opened=0, evs=[]
    for (const k of ['case1','case2','case3']) {
      await p.evaluate(k=>document.querySelector(`.card-open[data-work="${k}"]`).closest('.case').scrollIntoView({block:'center'}), k)
      await sleep(600)
      const g = await p.evaluate(k=>{ const r=document.querySelector(`.card-open[data-work="${k}"]`).closest('.case').getBoundingClientRect()
        return {x:Math.round(r.left+r.width/2), y:Math.round(r.top+r.height/2)} }, k)
      await p.mouse.click(g.x, g.y); await sleep(1800)
      const st = await p.evaluate(()=>({ open:document.getElementById('wdlg').open,
        rows:document.querySelectorAll('#wdlgR > div').length,
        ev:document.querySelectorAll('#wdlgN .ev-card').length,
        more:!document.getElementById('wdlgMore').hidden }))
      if (st.open) opened++
      evs.push(`${k}:${st.rows}행/근거${st.ev}${st.more?'/함께보기':''}`)
      if (st.open){ await p.keyboard.press('Escape'); await sleep(500) }
    }
    ck(`${lang} ${w} 사례 상세창 3종`, opened===3, evs.join(' '))
    if (w === 1440) {
      const x = await p.evaluate(() => ({
        skills: [...document.querySelectorAll('#skills .row-title')].map(e=>e.textContent.trim()),
        skillChips: document.querySelectorAll('#skills .row-case').length,
        methodChips: document.querySelectorAll('#method .row-case').length,
        demoNotes: [...document.querySelectorAll('#proto .demo-note')].map(d=>d.querySelectorAll('p').length),
        pdfSlots: [...document.querySelectorAll('[data-pdf-slot]')].map(e=>e.getClientRects().length===0),
      }))
      ck(`${lang} 역량 4분류`, x.skills.length===4, x.skills.join(' / '))
      ck(`${lang} 역량 칩 7 · 업무 방식 칩 5`, x.skillChips===7 && x.methodChips===5, `${x.skillChips} / ${x.methodChips}`)
      ck(`${lang} 체험판 안내 4줄 × 2장`, x.demoNotes.length===2 && x.demoNotes.every(v=>v===4), JSON.stringify(x.demoNotes))
      ck(`${lang} 포트폴리오 PDF 자리 2곳 hidden`, x.pdfSlots.length===2 && x.pdfSlots.every(Boolean), JSON.stringify(x.pdfSlots))
      await p.evaluate(()=>document.querySelector('#method .row-case[data-open-work]').scrollIntoView({block:'center'}))
      await sleep(700)
      const g2 = await p.evaluate(()=>{ const r=document.querySelector('#method .row-case[data-open-work]').getBoundingClientRect()
        return {x:Math.round(r.left+r.width/2), y:Math.round(r.top+r.height/2)} })
      await p.mouse.click(g2.x, g2.y); await sleep(1400)
      ck(`${lang} 업무 방식 칩 → 상세창`, await p.evaluate(()=>document.getElementById('wdlg').open))
      await p.keyboard.press('Escape'); await sleep(400)
    }
    ck(`${lang} ${w} 콘솔 0`, errs.length===0, errs.slice(0,2).join(' | ')||'0건')
    await p.close()
  }
}
await b.close()
console.log(`\n${fail===0?'ALL PASS':'FAIL 있음'} — pass ${pass} / fail ${fail}`)
