/* 덱 1·18장 캔버스 모션 — build-deck.mjs가 덱 HTML에 그대로 인라인한다(외부 라이브러리 없음, 오프라인 동작).
   원형: loop/motion-lab/index.html. 본부장 결재(09-29) 표지 = C3 키네틱 타임라인 · 마지막 장 = E3 궤도(수미상관).
   E3은 표지 C3과 한 벌로 읽히도록 C3의 어휘(흰 선 한 가닥 · 마일스톤 노드 점등 · 빨간 출시 노드 · 심전도 신호)로 다시 그렸다.

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

  function label(txt, x, y, a, align) {
    if (a <= 0) return
    ctx.font = '600 22px SUIT, sans-serif'; ctx.textAlign = align || 'center'; ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = `rgba(255,255,255,${.72 * a})`; ctx.fillText(txt, x, y)
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
  /* 라이브 신호(심전도) — x0에서 len만큼, 파형은 e에 따라 흐른다. C3·E3 공용 */
  function ecg(x0, len, e, fadeIn) {
    if (len <= 0) return
    ctx.beginPath()
    for (let x = 0; x <= len; x += 2) {
      const w = frac((x - e * .1) / 128) * 128
      const y = (w > 44 && w < 78) ? -Math.sin((w - 44) / 34 * Math.PI * 2) * 20 * Math.sin((w - 44) / 34 * Math.PI) : 0
      x ? ctx.lineTo(x0 + x, CY + y) : ctx.moveTo(x0, CY)
    }
    const g = ctx.createLinearGradient(x0, 0, x0 + 128, 0)
    if (fadeIn) { g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.25, 'rgba(255,255,255,.95)'); g.addColorStop(.75, 'rgba(255,255,255,.95)') }
    else g.addColorStop(0, 'rgba(255,255,255,.95)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
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
      LX[j] = 930 + u * 230
    }
    const HS = 1160, HE = 1780, T0 = 2250, TD = 1500
    const hx = t => lerp(HS, HE, eio(clamp((t - T0) / TD)))
    const tAt = x => { let a = T0, b = T0 + TD; for (let i = 0; i < 30; i++) { const m = (a + b) / 2; if (hx(m) < x) a = m; else b = m } return b }
    const MS = [1340, 1480, 1620], MT = MS.map(tAt), TL = T0 + TD
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
        if (t < TL) dot(HE, CY, 5, '#fff', .35 * pre)
        else {
          const e = t - TL
          dot(HE, CY, 13, RED)
          ring(HE, CY, 13 + eout(clamp(e / 1200)) * 130, .55 * (1 - clamp(e / 1200)), RED, 2.5)
          if (e > 600) { const ph = ((e - 600) % 2400) / 2400; ring(HE, CY, 13 + ph * 60, .4 * (1 - ph), RED, 2) }
          ecg(HE + 14, clamp((e - 250) / 500) * 128, e, false)
        }
        // 완성 후 — 요구에서 출시까지 흐르는 빛(반복)
        if (t > TL + 800) {
          const ph = ((t - TL - 800) % 3200) / 3200, cx = lerp(930, HE, eio(ph))
          const g = ctx.createLinearGradient(cx - 140, 0, cx, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, `rgba(255,255,255,${.9 * Math.sin(Math.PI * ph)})`)
          ctx.beginPath(); ctx.moveTo(Math.max(930, cx - 140), CY); ctx.lineTo(cx, CY); ctx.strokeStyle = g; ctx.lineWidth = 7; ctx.stroke()
        }
        label('요구', 1040, CY + 70, sstep(2000, 2400, t))
        label('방향', HS, CY + 70, sstep(T0, T0 + 400, t))
        label('마일스톤', 1480, CY + 70, sstep(MT[1] - 100, MT[1] + 300, t))
        label('출시', HE, CY + 70, sstep(TL, TL + 400, t))
        label('라이브', 1878, CY + 70, sstep(TL + 500, TL + 900, t))
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

  /* E3 — 궤도(수미상관): 표지에서 완주한 한 줄이 들어와 궤도를 한 바퀴 그리며 마일스톤 3개를 다시 점등하고,
     고리가 닫히는 곳이 빨간 출시 노드가 된다. 빨간 점이 궤도를 돌고(라이브) 중심에서 심전도·파문이 이어진다.
     포인터 쪽으로 고리가 부푼다 */
  {
    const C = { x: 1370, y: CY }, R = 250, A0 = Math.PI, JX = C.x - R, XS = 880
    const LD = 800, O0 = 750, OD = 2100, TL = O0 + OD
    const pAt = t => eio(clamp((t - O0) / OD))
    const tAt = p => { let a = O0, b = TL; for (let i = 0; i < 30; i++) { const m = (a + b) / 2; if (pAt(m) < p) a = m; else b = m } return b }
    const MP = [.25, .5, .75], MT = MP.map(tAt) // 위 · 오른쪽 · 아래
    const pt = { x: 0, y: 0 }
    let pa = 0, pk = 0
    const at = th => { // 궤도 위 한 점(포인터 쪽이면 부풂)
      let r = R
      if (pk > .001) { let da = th - pa; da = Math.atan2(Math.sin(da), Math.cos(da)); r += 40 * pk * Math.exp(-da * da / .22) }
      pt.x = C.x + Math.cos(th) * r; pt.y = C.y + Math.sin(th) * r; return pt
    }
    const arc = (a, b) => { ctx.beginPath(); for (let th = a, i = 0; ; th += .02, i++) { const e = th > b ? b : th; at(e); i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y); if (e === b) break } }
    V.E3 = {
      T: 4400,
      frame(t) {
        ctx.clearRect(0, 0, W, H)
        ctx.lineJoin = 'round'; ctx.lineCap = 'round'
        pk = 0
        if (ptr.on > .01) {
          pa = Math.atan2(ptr.y - C.y, ptr.x - C.x)
          pk = ptr.on * clamp(1 - Math.abs(Math.hypot(ptr.x - C.x, ptr.y - C.y) - R) / 280)
        }
        // 1) 들어오는 한 줄 — 표지의 완성선(왼쪽은 흐려진 채로)
        const hx = lerp(XS, JX, eout(clamp(t / LD)))
        const g = ctx.createLinearGradient(XS, 0, JX, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,.9)')
        ctx.beginPath(); ctx.moveTo(XS, CY); ctx.lineTo(hx, CY); ctx.strokeStyle = g; ctx.lineWidth = 3; ctx.stroke()
        if (t < O0) dot(hx, CY, 5, '#fff')
        // 2) 궤도 한 바퀴 — 시계 방향(왼쪽 → 위 → 오른쪽 → 아래 → 왼쪽)
        const p = pAt(t), pre = sstep(300, 800, t)
        if (p > 0) {
          arc(A0, A0 + p * TAU); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3; ctx.stroke()
          if (t < TL) { at(A0 + p * TAU); dot(pt.x, pt.y, 5, '#fff') }
        }
        MP.forEach((q, i) => {
          at(A0 + q * TAU)
          if (t < MT[i]) { dot(pt.x, pt.y, 4, '#fff', .35 * pre); return }
          const e = t - MT[i]
          dot(pt.x, pt.y, 9, mix(sstep(250, 800, e)))
          ring(pt.x, pt.y, 9 + eout(clamp(e / 800)) * 46, .6 * (1 - clamp(e / 800)), '#fff', 2)
        })
        // 3) 고리가 닫히는 곳 = 출시 노드
        at(A0); const jx = pt.x, jy = pt.y
        if (t < TL) dot(jx, jy, 5, '#fff', .35 * pre)
        else {
          const e = t - TL
          ring(jx, jy, 13 + eout(clamp(e / 1200)) * 130, .55 * (1 - clamp(e / 1200)), RED, 2.5)
          if (e > 600) { const ph = ((e - 600) % 2400) / 2400; ring(jx, jy, 13 + ph * 60, .4 * (1 - ph), RED, 2) }
          // 중심 — 라이브 신호와 파문
          ecg(C.x - 64, clamp((e - 250) / 500) * 128, e, true)
          if (e > 900) { const ph = ((e - 900) % 3000) / 3000; ring(C.x, C.y, 20 + ph * R * 1.25, .22 * (1 - ph), '#fff', 1.5) }
          // 4) 궤도를 도는 빨간 점 + 꼬리(라이브)
          const ra = sstep(500, 1100, e)
          if (ra > 0) {
            const th = A0 + (e - 500) * TAU / 6000
            arc(th - .7, th); ctx.strokeStyle = `rgba(230,43,30,${.55 * ra})`; ctx.lineWidth = 2.5; ctx.stroke()
            at(th); dot(pt.x, pt.y, 6, RED, ra)
          }
          dot(jx, jy, 13, RED)
        }
        at(A0 + .25 * TAU)
        label('마일스톤', pt.x, pt.y - 30, sstep(MT[0] - 100, MT[0] + 300, t))
        label('출시', jx - 24, CY - 24, sstep(TL, TL + 400, t), 'right')
        label('라이브', C.x, CY + 60, sstep(TL + 500, TL + 900, t))
      },
    }
  }

  /* ───────── 엔진 ───────── */
  const rmq = matchMedia('(prefers-reduced-motion: reduce)')
  const cache = new Map()
  let act = null, t = 0, last = 0, raf = 0
  function entry(sec) {
    if (cache.has(sec)) return cache.get(sec)
    const cv = sec.querySelector('canvas.mo'), v = V[sec.dataset.mo]
    const e = cv && v ? { sec, cv, c: cv.getContext('2d'), v, k: 1, fx: [...sec.querySelectorAll('[data-d]')], st: v.setup ? v.setup(sec) : null } : null
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
    for (const el of act.fx) { const k = eout(clamp((t - +el.dataset.d) / 700)); el.style.opacity = k; el.style.transform = k < 1 ? `translateY(${(1 - k) * 16}px)` : '' }
    if (act.v.text) act.v.text(t, act.st)
  }
  function tick(now) {
    raf = requestAnimationFrame(tick)
    let dt = last ? now - last : 16.7; last = now
    if (dt > 50) dt = 50
    ptrStep(dt); t += dt; draw()
  }
  function stop() { cancelAnimationFrame(raf); raf = 0 }
  function run() { if (!raf && act && !rmq.matches && !document.hidden) { last = 0; raf = requestAnimationFrame(tick) } }
  function show(sec) {
    stop(); act = sec ? entry(sec) : null
    if (!act) return
    size(act)
    if (rmq.matches) { t = act.v.T + 3000; ptr.on = 0; draw(); return } // 완성 정지 화면
    t = 0; draw(); run()
  }
  function fit(s) { scale = s; if (act) { size(act); draw() } }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else run() })
  rmq.addEventListener('change', () => { if (act) show(act.sec) })
  /* 글꼴이 늦게 붙으면 캔버스 라벨을 한 번 다시 그린다(정지 화면일 때만 — 도는 중이면 다음 프레임이 그린다) */
  if (document.fonts) document.fonts.ready.then(() => { if (act && !raf) draw() })
  return { show, fit, state: () => ({ id: act ? act.sec.dataset.mo : null, running: !!raf, t, w: act ? act.cv.width : 0, h: act ? act.cv.height : 0 }) }
})()
