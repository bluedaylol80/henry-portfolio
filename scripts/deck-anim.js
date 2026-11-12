/* 덱 2~18장 진입 모션, build-deck.mjs가 덱 HTML에 그대로 인라인한다(외부 라이브러리 없음, 오프라인 동작).
   움직임 자체는 CSS 키프레임(.s.on 아래에서만 붙는다)이 맡고, 이 파일은 세 가지만 한다.
   ① prep(장에 들어가기 직전): 요소를 종류별로 나누고 읽는 순서대로 시작 시각(--d)을 단다(분류는 장마다 한 번).
      모션 동안만 필요한 임시 꾸밈 3가지를 입힌다: 제목 낱말 span, 큰 숫자의 숫자 span, 칸 위 가로선의 띠(::before).
   ② play(장에 들어간 직후): 큰 숫자를 0에서 제 값까지 올린다. 진행률은 그 숫자의 CSS 애니메이션(a-n)에서 읽는다.
   ③ 그 장의 애니메이션이 전부 끝나면(또는 장을 떠나면) 임시 꾸밈을 걷어 원래 DOM으로 되돌린다.
      span 경계는 글자 배치를 소수점 아래에서 바꾸고, 배경 띠는 테두리와 반올림이 달라서다. 끝난 화면 = 모션이 없던 덱.

   규칙(본부장 결재 11-12)
   - 한 장의 모션은 1.4초 안에 끝나고 끝나면 아무것도 움직이지 않는다. 사례 1 밑줄(.c1u)이 있는 장은 나머지를 1.0초 안에 끝내고 밑줄을 마지막 0.4초에 긋는다.
   - 글자는 위치를 옮기지 않는다(불투명도와 색만). 카드만 0.98→1 크기 변화.
   - 순서는 읽는 순서(눈썹 줄 → 제목 줄 → 부제 → 본문 왼쪽 위에서 오른쪽 아래). 같은 종류는 종류별 간격, 종류가 바뀌면 앞 요소 40% 진행 시점.
   - 동작 줄이기와 인쇄에서는 CSS가 애니메이션을 끄고, 숫자는 처음부터 제 값이다.
   - 표지와 마지막 장(.cover)은 손대지 않는다(scripts/deck-motion.js 담당). */
var DeckAnim = (() => {
  'use strict'
  const E1 = 'cubic-bezier(.16,1,.3,1)'
  /* 종류 → [길이(초), 같은 종류 간격(초), 간격을 공유하는 묶음, 키프레임 클래스] */
  const K = {
    t: [.35, .08, 't', 'a-t'], n: [.7, .07, 'n', 'a-n'], c: [.45, .07, 'c', 'a-c'], s: [.5, .07, 'c', 'a-s'],
    l: [.5, .09, 'l', 'a-l'], r: [.5, .09, 'l', 'a-g'], g: [.5, .06, 'g', 'a-g'],
  }
  const DOT = .2
  const CARD = '.pn,.fs,.chip,.cobtn,.msb>div,.st,.ico'
  const NUM = /^(\s*)(\d[\d,]*(?:\.\d+)?)/
  const ownText = el => [...el.childNodes].some(x => x.nodeType === 3 && x.textContent.trim())
  const onlyTop = cs => parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none' &&
    !parseFloat(cs.borderLeftWidth) && !parseFloat(cs.borderRightWidth) && !parseFloat(cs.borderBottomWidth)
  const setD = (el, s) => el.style.setProperty('--d', s.toFixed(3) + 's')

  function kindOf(el) {
    if (el.matches('.a-tdot')) return 'd'
    if (el.matches('.a-tln')) return 'r'
    if (el.matches('.n,.cor .k')) { const x = el.textContent.trim(); return !x ? '' : NUM.test(x) ? 'n' : 't' }
    if (el.matches('.shot')) return 's'
    if (el.matches(CARD)) return 'c'
    if (el.matches('.gantt i,.farr')) return 'g'
    if (onlyTop(getComputedStyle(el))) return 'l'
    return ownText(el) ? 't' : ''
  }
  /* 종류가 정해진 요소는 안쪽을 통째로 데려간다. 선(l)은 그릇이라 안쪽 글자를 따로 센다.
     카드 안의 큰 숫자는 카드와 함께 나타나되 숫자 올리기는 따로 돈다. */
  function collect(root, out) {
    for (const el of root.children) {
      const k = kindOf(el)
      if (k) out.push({ el, k })
      if (!k || k === 'l') collect(el, out)
      else if (k === 'c') el.querySelectorAll('.n').forEach(n => { if (kindOf(n) === 'n') out.push({ el: n, k: 'n' }) })
    }
    return out
  }

  /* --- 임시 꾸밈 --- */
  /* 제목, 낱말을 span으로 감싸고 줄(offsetTop)별로 묶는다. 원래 자식 노드는 걷을 때 그대로 되돌린다 */
  function wrapTitle(h) {
    h._orig = [...h.childNodes]
    for (const x of h._orig) {
      if (x.nodeType !== 3) continue
      const f = document.createDocumentFragment()
      x.textContent.split(/(\s+)/).forEach(p => {
        if (!p) return
        if (/^\s+$/.test(p)) { f.appendChild(document.createTextNode(p)); return }
        const s = document.createElement('span'); s.className = 'a-t'; s.textContent = p; f.appendChild(s)
      })
      h.replaceChild(f, x)
    }
    const lines = []
    h.querySelectorAll('.a-t').forEach(w => {
      const last = lines[lines.length - 1]
      if (last && Math.abs(last.top - w.offsetTop) < 4) last.ws.push(w)
      else lines.push({ top: w.offsetTop, ws: [w] })
    })
    return lines
  }
  /* 큰 숫자, 숫자 부분만 span으로 */
  function wrapNum(el) {
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    for (let x; (x = w.nextNode());) {
      if (!x.textContent.trim()) continue
      const m = x.textContent.match(NUM)
      if (!m) return
      el._orig = x.textContent
      const rest = x.splitText(m[1].length + m[2].length)
      const v = document.createElement('span'); v.className = 'a-nv'
      x.textContent = m[1]; v.textContent = m[2]
      x.parentNode.insertBefore(v, rest)
      return
    }
  }
  function undress(slide) {
    const h = slide.querySelector('.h')
    if (h && h._orig) { h.replaceChildren(...h._orig); h._orig = null }
    slide.querySelectorAll('.a-nv').forEach(v => { const p = v.parentNode; v.replaceWith(v._fin || v.textContent); p.normalize() })
    slide.querySelectorAll('.a-lb').forEach(el => el.classList.remove('a-lb'))
  }

  /* --- 분류와 시각(장마다 한 번) --- */
  function layout(slide, nLines, hasLede) {
    /* 머리: 눈썹 줄 0~0.3초(CSS) → 제목은 줄이 40% 그어졌을 때부터 줄마다 0.08초 → 부제는 마지막 줄 뒤 0.1초 */
    const tLast = .12 + Math.max(0, nLines - 1) * .08
    const tLede = tLast + .1
    const hEnd = (hasLede ? tLede : tLast) + K.t[0]
    const b0 = (hasLede ? tLede : tLast) + .4 * K.t[0]
    /* 본문: 읽는 순서 = 같은 줄(위치 차 12px 이내)은 왼쪽부터, 줄은 위에서 아래로 */
    const bd = slide.querySelector('.bd')
    const sc = slide.getBoundingClientRect().width / 1920 || 1
    const all = bd ? collect(bd, []) : []
    const items = all.filter(x => x.k !== 'd').map(x => ({ ...x, r: x.el.getBoundingClientRect() }))
    items.sort((a, b) => a.r.top - b.r.top)
    const rows = []
    for (const it of items) {
      const row = rows[rows.length - 1]
      if (row && Math.abs(it.r.top - row[0].r.top) <= 12 * sc) row.push(it); else rows.push([it])
    }
    const seq = rows.flatMap(row => row.sort((a, b) => a.r.left - b.r.left))
    let prev = null
    for (const it of seq) {
      it.s = !prev ? b0 : prev.s + (K[prev.k][2] === K[it.k][2] ? K[it.k][1] : .4 * K[prev.k][0])
      prev = it
    }
    /* 1.4초(밑줄이 있으면 1.0초) 안에 끝나도록 본문 시작 간격만 같은 비율로 줄인다, 각 요소의 길이는 그대로 */
    const ul = slide.querySelector('.c1u')
    const cap = ul ? 1.0 : 1.4
    const endOf = x => x.s + K[x.k][0] + (x.k === 'r' ? DOT : 0)
    if (seq.length && Math.max(...seq.map(endOf)) > cap) {
      const f = Math.min(...seq.filter(x => x.s > b0).map(x => (cap - (endOf(x) - x.s) - b0) / (x.s - b0)))
      seq.forEach(x => { x.s = b0 + (x.s - b0) * f })
    }
    for (const it of seq) { it.el.classList.add(K[it.k][3]); setD(it.el, it.s) }
    /* 타임라인 점, 첫 점은 선과 함께, 다음 점은 앞 선이 그 점에 닿는 순간 */
    const lns = seq.filter(x => x.k === 'r')
    all.filter(x => x.k === 'd').forEach((x, i) => { x.el.classList.add('a-d'); setD(x.el, i ? lns[i - 1].s + K.r[0] : lns[0].s) })
    if (ul) setD(ul, Math.max(hEnd, ...seq.map(endOf)))
    return { lines: seq.filter(x => x.k === 'l').map(x => x.el), nums: seq.filter(x => x.k === 'n').map(x => x.el) }
  }

  function prep(slide) {
    if (slide.classList.contains('cover')) return
    undress(slide)
    const h = slide.querySelector('.h'), lede = slide.querySelector('.lede')
    const lines = h ? wrapTitle(h) : []
    lines.forEach((ln, i) => ln.ws.forEach(w => setD(w, .12 + i * .08)))
    if (lede) { lede.classList.add('a-t'); setD(lede, .12 + Math.max(0, lines.length - 1) * .08 + .1) }
    /* 글꼴이 다 붙기 전 분류는 다음 진입 때 다시 한다(제목 줄 수가 바뀔 수 있다) */
    if (!slide._ap) { slide._ap = layout(slide, lines.length, !!lede); slide._apOk = document.fonts.status === 'loaded' }
    else if (!slide._apOk) { slide._ap = layout(slide, lines.length, !!lede); slide._apOk = document.fonts.status === 'loaded' }
    for (const el of slide._ap.lines) {
      const cs = getComputedStyle(el)
      el.style.setProperty('--lc', cs.borderTopColor); el.style.setProperty('--lw', cs.borderTopWidth)
      el.classList.add('a-lb')
    }
    slide._ap.nums.forEach(wrapNum)
  }

  /* 숫자 올리기, 돌 때만 숫자 부분을 자리별 칸으로 나눈다. 칸의 자리와 폭은 최종 화면에서 그 글자가 놓인 자리 그대로(소수점 px),
     도는 숫자는 자기 칸 가운데에 그리고(넓으면 양옆으로 고르게 넘침), 아직 없는 앞자리 칸은 최종 글자를 숨겨 둔다(기준선 유지).
     그래서 단위 글자와 이미 최종값과 같은 자리는 처음부터 제자리, 마지막 값은 최종 화면과 같은 자리다 */
  function count(v) {
    const host = v.closest('.a-n')
    const a = host.getAnimations().find(x => x.animationName === 'a-n')
    if (!a) return
    a.effect.updateTiming({ easing: E1 })
    const fin = v._fin = v.textContent
    const dec = (fin.split('.')[1] || '').length, num = parseFloat(fin.replace(/,/g, '')), comma = fin.includes(',')
    const fmt = p => { const s = (num * p).toFixed(dec); return comma ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : s }
    /* 최종 글자 자리, 장면 크기와 카드 크기 변화(transform)를 걷어 v 기준 CSS px로 */
    v.classList.add('run')
    const t = v.firstChild, vr = v.getBoundingClientRect(), W = parseFloat(getComputedStyle(v).width)
    const k = vr.width / W || 1
    const leftOf = (n, i) => { const r = document.createRange(); if (i < 0) r.selectNodeContents(n); else { r.setStart(n, i); r.setEnd(n, i + 1) } return (r.getBoundingClientRect().left - vr.left) / k }
    const xs = [...fin].map((_, i) => leftOf(t, i))
    const cells = xs.map((x, i) => {
      const c = document.createElement('span'); c.textContent = fin[i]
      c.style.width = ((i + 1 < xs.length ? xs[i + 1] : W) - x) + 'px'
      return c
    })
    v.style.width = W + 'px'; v.replaceChildren(...cells)
    /* 글자 사이 커닝(예: 11)만큼 칸 가운데와 최종 자리가 어긋나는 것을 칸마다 보정한다 */
    cells.map(c => leftOf(c, -1)).forEach((x, i) => { cells[i].style.left = (xs[i] - x) + 'px' })
    const tick = () => {
      if (!v.isConnected || a.playState === 'finished' || a.playState === 'idle') return
      const s = fmt(a.effect.getComputedTiming().progress || 0), off = Math.max(0, fin.length - s.length)
      cells.forEach((c, i) => {
        const ch = i < off ? fin[i] : s[i - off]
        if (c.textContent !== ch) c.textContent = ch
        c.classList.toggle('e', i < off)
      })
      requestAnimationFrame(tick)
    }
    tick()
  }

  function play(slide) {
    if (slide.classList.contains('cover')) return
    slide.querySelectorAll('.a-nv').forEach(count)
    const tok = slide._tok = {}
    const xs = slide.getAnimations({ subtree: true }).filter(a => a.animationName)
    Promise.allSettled(xs.map(a => a.finished)).then(() => { if (slide._tok === tok) undress(slide) })
  }
  return { prep, play }
})()
