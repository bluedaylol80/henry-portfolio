/* 덱 1·18장 캔버스 모션 — build-deck.mjs가 덱 HTML에 그대로 인라인한다(외부 라이브러리 없음, 오프라인 동작).
   원형: loop/motion-lab/index.html. 본부장 결재(09-29) 표지 = C3 키네틱 타임라인 · 마지막 장 = E3 궤도(수미상관).
   E3은 표지 C3과 한 벌로 읽히도록 C3의 어휘(흰 선 한 가닥 · 같은 라벨의 노드 5개 · 빨간 출시 노드 · 심전도 신호)로 다시 그렸다.

   규칙
   - 캔버스는 1920×1080 스테이지 좌표. 실해상도 = 스테이지 표시 크기 × DPR(최대 2). 창 크기가 바뀌면 다시 잡는다(fit).
   - 한 번에 한 장만 돈다. 장에 들어오면 t=0부터, 나가면 멈춘다(show). 탭이 숨으면 멈추고 돌아오면 이어서.
   - prefers-reduced-motion이면 완성 상태 한 장만 그린다.
   - 캔버스는 pointer-events:none — 링크 클릭·키보드 조작을 가로채지 않는다. 포인터는 있으면 반응, 없어도 성립.
   - 모든 장면은 시간 t의 순수 함수다(같은 t면 같은 그림). */
var DeckMotion = (() => {
  'use strict'
  const W = 1920, H = 1080, CY = 540, RED = '#E62B1E', TAU = Math.PI * 2
  const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x
  const lerp = (a, b, k) => a + (b - a) * k
  const sstep = (a, b, x) => { x = clamp((x - a) / (b - a)); return x * x * (3 - 2 * x) }
  const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
  const eout = x => 1 - Math.pow(1 - x, 3)
  const frac = x => x - Math.floor(x)
  /* 빨강 → 흰색 (마일스톤 점등 직후 잠깐 빨강) */
  const mix = k => `rgb(${Math.round(lerp(230, 255, k))},${Math.round(lerp(43, 255, k))},${Math.round(lerp(30, 255, k))})`
  let ctx = null

  /* 라벨 — 켜질 때 8px 아래에서 살짝 떠오르며 페이드인. 흰색 72%(차콜 위 약 9:1) */
  function label(txt, x, y, a, align, base) {
    if (a <= 0) return
    ctx.font = '600 22px SUIT, sans-serif'; ctx.textAlign = align || 'center'; ctx.textBaseline = base || 'alphabetic'
    ctx.fillStyle = `rgba(255,255,255,${.72 * a})`; ctx.fillText(txt, x, y + (1 - a) * 8)
  }
  function ring(x, y, r, a, color, lw) {
    if (a <= 0) return
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.globalAlpha = a
    ctx.strokeStyle = color; ctx.lineWidth = lw || 2; ctx.stroke(); ctx.globalAlpha = 1
  }
  function dot(x, y, r, color, a) {
    if (a != null && a <= 0) return
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.globalAlpha = a == null ? 1 : a
    ctx.fillStyle = color; ctx.fill(); ctx.globalAlpha = 1
  }
  /* 라이브 신호(심전도) — x0에서 len만큼, 파형은 e에 따라 흐른다. 점 사이를 2차 곡선으로 이어 매끄럽게.
     stops = 가로 그라데이션 [위치, 불투명도]. C3·E3 공용 */
  function ecg(x0, len, e, stops) {
    if (len <= 0) return
    const yAt = x => { const w = frac((x - e * .1) / 128) * 128
      return (w > 44 && w < 78) ? -Math.sin((w - 44) / 34 * Math.PI * 2) * 20 * Math.sin((w - 44) / 34 * Math.PI) : 0 }
    ctx.beginPath(); ctx.moveTo(x0, CY + yAt(0))
    let qx = x0, qy = CY + yAt(0)
    for (let x = 3; x <= len; x += 3) { const nx = x0 + x, ny = CY + yAt(x); ctx.quadraticCurveTo(qx, qy, (qx + nx) / 2, (qy + ny) / 2); qx = nx; qy = ny }
    ctx.lineTo(qx, qy)
    const g = ctx.createLinearGradient(x0, 0, x0 + 128, 0)
    for (const [p, a] of stops) g.addColorStop(p, `rgba(255,255,255,${a})`)
    ctx.strokeStyle = g; ctx.lineWidth = 2.5; ctx.stroke()
  }

  /* 포인터 — 스테이지 좌표로 환산해 부드럽게 따라간다 */
  const ptr = { x: 0, y: 0, tx: 0, ty: 0, on: 0, ton: 0, fresh: true }
  const stage = document.getElementById('stage')
  let scale = 1
  function toStage(e) {
    const r = stage.getBoundingClientRect()
    ptr.tx = (e.clientX - r.left) / scale; ptr.ty = (e.clientY - r.top) / scale; ptr.ton = e.pointerType === 'touch' ? 0 : 1
    if (ptr.fresh) { ptr.x = ptr.tx; ptr.y = ptr.ty; ptr.fresh = false }
  }
  addEventListener('pointermove', toStage, { passive: true })
  addEventListener('pointerout', e => { if (!e.relatedTarget) ptr.ton = 0 })
  addEventListener('blur', () => { ptr.ton = 0 })
  function ptrStep(dt) {
    const k = 1 - Math.pow(1 - .14, dt / 16.7)
    ptr.x = lerp(ptr.x, ptr.tx, k); ptr.y = lerp(ptr.y, ptr.ty, k); ptr.on = lerp(ptr.on, ptr.ton, k * .6)
    if (ptr.on < .002) ptr.fresh = true
  }

  const V = {}

  /* C3 — 키네틱 타임라인: 엉킨 실(요구)이 직선(방향)으로 펴지고, 마일스톤 노드가 점등되며, 빨간 출시 노드 + 심전도(라이브).
     헤드라인은 한 글자씩 빨간 커서와 함께 같은 박자로 */
  {
    const K = 320, SX = new Float32Array(K), SY = new Float32Array(K), LX = new Float32Array(K)
    for (let j = 0; j < K; j++) { // 엉킨 실타래 — 여러 주기의 사인을 겹친 리사주 곡선
      const u = j / (K - 1)
      SX[j] = 1070 + 150 * Math.sin(TAU * 2.3 * u + .4) + 55 * Math.sin(TAU * 7.7 * u) + 20 * Math.sin(TAU * 17 * u + 2)
      SY[j] = CY + 210 * Math.sin(TAU * 1.7 * u + 1.1) + 80 * Math.sin(TAU * 9.3 * u + .2) + 24 * Math.cos(TAU * 21 * u)
      LX[j] = 930 + u * 192
    }
    const HS = 1122, HE = 1640, LV = HE + 142, T0 = 2250, TD = 1500
    const hx = t => lerp(HS, HE, eio(clamp((t - T0) / TD)))
    const tAt = x => { let a = T0, b = T0 + TD; for (let i = 0; i < 30; i++) { const m = (a + b) / 2; if (hx(m) < x) a = m; else b = m } return b }
    const MS = [1272, 1389, 1506], MT = MS.map(tAt), TL = T0 + TD
    const LINES = [[150, 1150], [1300, 2150], [2300, 3750]] // 헤드라인 3줄의 글자 등장 구간(ms)
    V.C3 = {
      T: 4800,
      setup(sec) {
        return { cs: [...sec.querySelectorAll('.hl .ln')].map(l => [...l.querySelectorAll('.ch')]), caret: sec.querySelector('.caret') }
      },
      frame(t) {
        ctx.clearRect(0, 0, W, H)
        ctx.lineJoin = 'round'; ctx.lineCap = 'round'
        // 1) 낙서 그리기 → 2) 곧게 펴기
        const cnt = Math.max(2, Math.floor(K * eout(clamp(t / 1100))))
        const k2 = eio(clamp((t - 1250) / 950))
        ctx.beginPath() // 중점 사이를 2차 곡선으로 — 각진 꺾임 없이
        let qx = lerp(SX[0], LX[0], k2), qy = lerp(SY[0], CY, k2); ctx.moveTo(qx, qy)
        for (let j = 1; j < cnt; j++) { const x = lerp(SX[j], LX[j], k2), y = lerp(SY[j], CY, k2); ctx.quadraticCurveTo(qx, qy, (qx + x) / 2, (qy + y) / 2); qx = x; qy = y }
        ctx.lineTo(qx, qy)
        ctx.strokeStyle = `rgba(255,255,255,${lerp(.55, .9, k2)})`; ctx.lineWidth = lerp(2, 3, k2); ctx.stroke()
        if (t < 2300) { const j = cnt - 1; dot(lerp(SX[j], LX[j], k2), lerp(SY[j], CY, k2), 5, '#fff', 1 - sstep(2000, 2300, t)) }
        dot(930, CY, 5, '#fff', sstep(1900, 2200, t))
        dot(HS, CY, 5, '#fff', t > T0 ? 1 : .35 * sstep(1800, 2300, t)) // 방향 노드
        // 3) 방향선 연장
        const h = hx(t)
        if (t > T0) {
          ctx.beginPath(); ctx.moveTo(HS, CY); ctx.lineTo(h, CY); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3; ctx.stroke()
          if (t < TL) dot(h, CY, 5, '#fff')
        }
        // 예정된 마일스톤(희미) → 통과 시 점등
        const pre = sstep(1800, 2300, t)
        MS.forEach((x, i) => {
          if (t < MT[i]) { dot(x, CY, 4, '#fff', .35 * pre); return }
          const e = t - MT[i]
          dot(x, CY, 9, mix(sstep(250, 800, e)))
          ring(x, CY, 9 + eout(clamp(e / 800)) * 46, .6 * (1 - clamp(e / 800)), '#fff', 2)
        })
        // 4) 출시 노드 + 라이브 신호
        if (t < TL) { dot(HE, CY, 5, '#fff', .35 * pre); dot(LV, CY, 4, '#fff', .35 * pre) }
        else {
          const e = t - TL
          dot(HE, CY, 13, RED)
          ring(HE, CY, 13 + eout(clamp(e / 1200)) * 130, .55 * (1 - clamp(e / 1200)), RED, 2.5)
          if (e > 600) { const ph = ((e - 600) % 2400) / 2400; ring(HE, CY, 13 + ph * 60, .4 * (1 - ph), RED, 2) }
          ecg(HE + 14, clamp((e - 250) / 500) * 128, e, [[0, .95], [1, .3]])
          // 라이브 노드 — 신호 끝
          const q = e - 750
          if (q < 0) dot(LV, CY, 4, '#fff', .35)
          else { dot(LV, CY, 7, mix(sstep(250, 800, q))); ring(LV, CY, 7 + eout(clamp(q / 800)) * 40, .6 * (1 - clamp(q / 800)), '#fff', 2) }
        }
        // 완성 후 — 요구에서 출시까지 흐르는 빛(반복)
        if (t > TL + 800) {
          const ph = ((t - TL - 800) % 3200) / 3200, cx = lerp(930, HE, eio(ph))
          const g = ctx.createLinearGradient(cx - 140, 0, cx, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, `rgba(255,255,255,${.9 * Math.sin(Math.PI * ph)})`)
          ctx.beginPath(); ctx.moveTo(Math.max(930, cx - 140), CY); ctx.lineTo(cx, CY); ctx.strokeStyle = g; ctx.lineWidth = 7; ctx.stroke()
        }
        label('요구', 930, CY + 70, sstep(2000, 2400, t))
        label('방향', HS, CY + 70, sstep(T0, T0 + 400, t))
        label('마일스톤', MS[1], CY + 70, sstep(MT[1] - 100, MT[1] + 300, t))
        label('출시', HE, CY + 70, sstep(TL, TL + 400, t))
        label('라이브', LV, CY + 70, sstep(TL + 750, TL + 1200, t))
      },
      text(t, st) { // 헤드라인 글자별 등장 + 빨간 커서
        let cx = null
        for (let l = 0; l < LINES.length; l++) {
          const [a, b] = LINES[l], arr = st.cs[l] || [], n = arr.length
          for (let j = 0; j < n; j++) {
            const t0 = a + (b - a - 380) * j / Math.max(1, n - 1), k = eout(clamp((t - t0) / 380))
            const el = arr[j]; el.style.opacity = k; el.style.transform = k < 1 ? `translateY(${(1 - k) * .45}em)` : ''
            if (t >= t0 && t < b + 250) cx = el
          }
        }
        const c = st.caret
        if (cx) { c.style.opacity = 1; c.style.left = (cx.offsetLeft + cx.offsetWidth + 4) + 'px'; c.style.top = (cx.offsetTop + 8) + 'px'; c.style.height = (cx.offsetHeight - 14) + 'px' }
        else c.style.opacity = 0
      },
    }
  }

  /* E3 — 궤도(수미상관): 표지에서 완주한 한 줄이 들어와 궤도를 한 바퀴 그린다. 궤도 위 노드 5개가 표지와 같은 라벨
     (요구·방향·마일스톤·출시·라이브)로 순서대로 켜지고, 고리는 빨간 출시 노드에서 닫힌다. 닫힌 뒤 빨간 점이 궤도를 돌며
     라이브 노드를 켜고, 안쪽 동심 궤도 2개가 서로 다른 속도로 돌고, 중심에서 심전도·파문이 이어진다.
     선 = 넓고 옅은 선을 겹친 글로우(캔버스 좌표로 그려 DPR·배율과 무관) + 진행 머리의 혜성 꼬리.
     포인터 쪽으로 고리가 부풀고, 동심 궤도·먼지는 반대로 조금 밀린다(패럴랙스) */
  {
    const C = { x: 1370, y: CY }, R = 250, A0 = Math.PI, XS = 880, JX = C.x - R
    const L1 = JX - XS, LR = TAU * R, S = L1 + LR, D = 3000, TL = D // 고리가 닫히는 순간 = 출시
    const sAt = t => eio(clamp(t / D)) * S                           // 한 줄 + 한 바퀴를 한 이징으로 — 머리 속도가 끊기지 않는다
    const tAt = s => { let a = 0, b = D; for (let i = 0; i < 32; i++) { const m = (a + b) / 2; if (sAt(m) < s) a = m; else b = m } return b }
    const LIVE0 = TL + 400, SPIN = TAU / 6000                         // 빨간 점 출발 · 각속도
    /* 노드: 궤도 위 위치(바퀴 비율)와 점등 시각. 출시 = 닫힘점(왼쪽), 라이브 = 닫힌 뒤 빨간 점이 처음 지나는 곳 */
    const NODES = [['요구', .3], ['방향', .52], ['마일스톤', .74], ['출시', 1], ['라이브', .12]].map(([txt, f], i) => ({
      txt, th: A0 + f * TAU, tm: i < 3 ? tAt(L1 + f * LR) : i === 3 ? TL : LIVE0 + f * TAU / SPIN, red: i === 3 }))
    const DUST = []
    { let s = 20260929; const r = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648
      for (let i = 0; i < 36; i++) DUST.push({ x: r() * 924, y: r() * 880, vx: (r() - .5) * .012, vy: (r() - .5) * .008, s: .9 + r() * .9, a: .12 + r() * .2, ph: r() * TAU }) }
    const pt = { x: 0, y: 0 }
    let pa = 0, pk = 0, ox = 0, oy = 0
    const rad = th => { if (pk < .001) return R; let da = th - pa; da = Math.atan2(Math.sin(da), Math.cos(da)); return R + 40 * pk * Math.exp(-da * da / .22) }
    const at = (th, dr) => { const r = rad(th) + (dr || 0); pt.x = C.x + Math.cos(th) * r; pt.y = C.y + Math.sin(th) * r; return pt }
    const onPath = s => s < L1 ? (pt.x = XS + s, pt.y = CY, pt) : at(A0 + (s - L1) / R)
    const trace = (a, b) => { // 경로 거리 a→b를 선으로
      ctx.beginPath(); a = Math.max(0, a)
      for (let s = a, i = 0; ; s += 6, i++) { const e = s > b ? b : s; onPath(e); i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y); if (e === b) break }
    }
    const glowStroke = (rgb, a) => { // 글로우 두 겹 + 본선
      for (const [w, k] of [[14, .05], [7, .1], [3, .9]]) { ctx.strokeStyle = `rgba(${rgb},${a * k})`; ctx.lineWidth = w; ctx.stroke() }
    }
    const comet = (pos, len, rgb, a, w) => { // 머리 뒤로 사라지는 꼬리 — pos(u) = 꼬리 비율 u(0 꼬리끝 → 1 머리)의 점
      const n = 22; let px, py
      for (let i = 0; i <= n; i++) {
        const u = i / n, p = pos(u)
        if (i) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(p.x, p.y); ctx.strokeStyle = `rgba(${rgb},${a * u * u})`; ctx.lineWidth = w * (.4 + .6 * u); ctx.stroke() }
        px = p.x; py = p.y
      }
      const g = ctx.createRadialGradient(px, py, 0, px, py, 22); g.addColorStop(0, `rgba(${rgb},${.45 * a})`); g.addColorStop(1, `rgba(${rgb},0)`)
      ctx.fillStyle = g; ctx.fillRect(px - 22, py - 22, 44, 44)
    }
    const nodeLabel = (n, a) => { // 궤도 바깥 여백 — 선과 16px 이상
      if (a <= 0) return
      let x, y, al
      if (n.red) { at(n.th); x = pt.x - 24; y = CY - 34; al = 'right' } // 들어오는 선 위쪽
      else {
        const c = Math.cos(n.th); al = c > .35 ? 'left' : c < -.35 ? 'right' : 'center'
        at(n.th, al === 'center' ? 40 : 30); x = pt.x; y = pt.y
      }
      label(n.txt, x, y, a, al, 'middle')
    }
    V.E3 = {
      T: 4800,
      nt: [...NODES.map(n => n.tm - 150), NODES[4].tm + 200], // 왼쪽 연락 항목 6줄의 등장 시각(노드 점등에 맞춘다)
      frame(t) {
        ctx.clearRect(0, 0, W, H)
        ctx.lineJoin = 'round'; ctx.lineCap = 'round'
        pk = 0; ox = 0; oy = 0
        if (ptr.on > .01) {
          pa = Math.atan2(ptr.y - C.y, ptr.x - C.x)
          pk = ptr.on * clamp(1 - Math.abs(Math.hypot(ptr.x - C.x, ptr.y - C.y) - R) / 280)
          ox = -(ptr.x - C.x) * .025 * ptr.on; oy = -(ptr.y - C.y) * .025 * ptr.on
        }
        // 먼지 — 아주 드물게, 느리게 표류
        const da = sstep(0, 1500, t)
        for (const p of DUST) {
          const x = 900 + ((p.x + p.vx * t) % 924 + 924) % 924 + ox * 1.6, y = 100 + ((p.y + p.vy * t) % 880 + 880) % 880 + oy * 1.6
          dot(x, y, p.s, '#fff', p.a * da * (.6 + .4 * Math.sin(t * .0011 + p.ph)))
        }
        const s = sAt(t), done = t >= TL, e = t - TL
        // 고리 완성 후 — 안쪽 동심 궤도 2개(서로 다른 속도) · 파문 3겹
        if (done) {
          const k = sstep(0, 1400, e), cx = C.x + ox, cy = C.y + oy
          for (const [r, sp, dash, a] of [[195, .00006, [1.5, 12], .2], [128, -.00011, [1.5, 9], .16]]) {
            const rot = e * sp
            ctx.setLineDash(dash); ctx.beginPath(); ctx.arc(cx, cy, r, rot, rot + TAU); ctx.strokeStyle = `rgba(255,255,255,${a * k})`; ctx.lineWidth = 1.5; ctx.stroke(); ctx.setLineDash([])
            dot(cx + Math.cos(rot * 9 + r) * r, cy + Math.sin(rot * 9 + r) * r, 2.5, '#fff', .55 * k)
          }
          for (let j = 0; j < 3; j++) {
            const q = e - 900 - j * 1200; if (q <= 0) continue
            const ph = (q % 3600) / 3600; ring(C.x, C.y, 20 + ph * R * 1.1, .2 * Math.pow(1 - ph, 1.5), '#fff', 1.5)
          }
        }
        // 한 줄 + 궤도 — 글로우를 겹쳐 그린다(들어오는 줄은 왼쪽이 흐려진 채로)
        if (s > 0) {
          const g = ctx.createLinearGradient(XS, 0, JX, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,1)')
          ctx.beginPath(); ctx.moveTo(XS, CY); ctx.lineTo(Math.min(s, L1) + XS, CY)
          for (const [w, k] of [[14, .05], [7, .1], [3, .9]]) { ctx.globalAlpha = k; ctx.strokeStyle = g; ctx.lineWidth = w; ctx.stroke() }
          ctx.globalAlpha = 1
          if (s > L1) { trace(L1, s); glowStroke('255,255,255', 1) }
          if (!done) comet(u => onPath(s - 170 * (1 - u)), 170, '255,255,255', .95, 5)
        }
        // 노드 — 예정(희미) → 점등(링 펄스, 잠깐 빨강 → 흰색). 출시는 빨강으로 남는다
        const pre = sstep(300, 900, t)
        for (const n of NODES) {
          at(n.th); const x = pt.x, y = pt.y
          if (t < n.tm) { dot(x, y, 4, '#fff', .35 * pre); continue }
          const q = t - n.tm
          if (n.red) {
            ring(x, y, 13 + eout(clamp(q / 1200)) * 130, .55 * (1 - clamp(q / 1200)), RED, 2.5)
            if (q > 600) { const ph = ((q - 600) % 2400) / 2400; ring(x, y, 13 + ph * 60, .4 * (1 - ph), RED, 2) }
          } else {
            dot(x, y, 9, mix(sstep(250, 800, q)))
            ring(x, y, 9 + eout(clamp(q / 800)) * 46, .6 * (1 - clamp(q / 800)), '#fff', 2)
          }
        }
        // 라이브 — 빨간 점이 궤도를 돌며 꼬리를 남긴다 · 중심 심전도
        if (done) {
          const ra = sstep(LIVE0 - 200, LIVE0 + 400, t)
          if (ra > 0) {
            const th = A0 + Math.max(0, t - LIVE0) * SPIN
            comet(u => at(th - .9 * (1 - u)), 0, '230,43,30', .8 * ra, 4)
            at(th); dot(pt.x, pt.y, 6, RED, ra)
          }
          ecg(C.x - 64, clamp((e - 250) / 500) * 128, e, [[0, 0], [.25, .95], [.75, .95], [1, 0]])
        }
        if (done) { at(A0); dot(pt.x, pt.y, 13, RED) }
        for (const n of NODES) nodeLabel(n, sstep(n.tm, n.tm + 450, t))
      },
    }
  }

  /* ───────── 엔진 ───────── */
  const rmq = matchMedia('(prefers-reduced-motion: reduce)')
  const cache = new Map()
  let act = null, t = 0, last = 0, raf = 0
  const work = [] // 프레임당 JS 계산 시간(ms) — 성능 기록용
  function entry(sec) {
    if (cache.has(sec)) return cache.get(sec)
    const cv = sec.querySelector('canvas.mo'), v = V[sec.dataset.mo]
    const e = cv && v ? { sec, cv, c: cv.getContext('2d'), v, k: 1, fx: [...sec.querySelectorAll('[data-d],[data-n]')].map(el => ({ el, d: el.dataset.n != null ? v.nt[+el.dataset.n] : +el.dataset.d })), st: v.setup ? v.setup(sec) : null } : null
    cache.set(sec, e); return e
  }
  function size(e) {
    const k = scale * Math.min(2, devicePixelRatio || 1), w = Math.round(W * k), h = Math.round(H * k)
    if (e.cv.width !== w || e.cv.height !== h) { e.cv.width = w; e.cv.height = h }
    e.k = k
  }
  function draw() {
    ctx = act.c; ctx.setTransform(act.k, 0, 0, act.k, 0, 0)
    act.v.frame(t)
    for (const { el, d } of act.fx) { const k = eout(clamp((t - d) / 700)); el.style.opacity = k; el.style.transform = k < 1 ? `translateY(${(1 - k) * 16}px)` : '' }
    if (act.v.text) act.v.text(t, act.st)
  }
  function tick(now) {
    raf = requestAnimationFrame(tick)
    let dt = last ? now - last : 16.7; last = now
    if (dt > 50) dt = 50
    ptrStep(dt); t += dt
    const w0 = performance.now(); draw(); work.push(performance.now() - w0); if (work.length > 600) work.shift()
  }
  function stop() { cancelAnimationFrame(raf); raf = 0 }
  function run() { if (!raf && act && !rmq.matches && !document.hidden) { last = 0; raf = requestAnimationFrame(tick) } }
  function show(sec) {
    stop(); act = sec ? entry(sec) : null
    if (!act) return
    size(act)
    if (rmq.matches) { t = act.v.T + 3000; ptr.on = 0; draw(); return } // 완성 정지 화면
    t = 0; work.length = 0; draw(); run()
  }
  function fit(s) { scale = s; if (act) { size(act); draw() } }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else run() })
  rmq.addEventListener('change', () => { if (act) show(act.sec) })
  /* 글꼴이 늦게 붙으면 캔버스 라벨을 한 번 다시 그린다(정지 화면일 때만 — 도는 중이면 다음 프레임이 그린다) */
  if (document.fonts) document.fonts.ready.then(() => { if (act && !raf) draw() })
  return { show, fit, state: () => ({ id: act ? act.sec.dataset.mo : null, running: !!raf, t, w: act ? act.cv.width : 0, h: act ? act.cv.height : 0,
    work: work.length ? { n: work.length, avg: +(work.reduce((a, b) => a + b, 0) / work.length).toFixed(3), p95: +[...work].sort((a, b) => a - b)[Math.floor(work.length * .95)].toFixed(3) } : null }) }
})()
