/* 덱 1과 20장 캔버스 모션 — build-deck.mjs가 덱 HTML에 그대로 인라인한다(외부 라이브러리 없음, 오프라인 동작).
   원형: loop/motion-lab/v2.html. 본부장 결재 11-05: 표지=C4 · 마지막 장=E4
   C4 신호 정렬(줄 다발이 모여 빨간 출시점) ↔ E4 잔향(한 줄이 다발로 펼쳐지고 빨간 점에서 파문) — 수미상관.

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
  const eback = x => { x = clamp(x); const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2) }
  function rng(seed) { return () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }
  let ctx = null

  function ring(x, y, r, a, color, lw) {
    if (a <= 0) return
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.globalAlpha = a
    ctx.strokeStyle = color; ctx.lineWidth = lw || 2; ctx.stroke(); ctx.globalAlpha = 1
  }
  function dot(x, y, r, color, a) {
    if ((a != null && a <= 0) || r <= 0) return
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.globalAlpha = a == null ? 1 : a
    ctx.fillStyle = color; ctx.fill(); ctx.globalAlpha = 1
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
  /* 포인터가 지나가면 줄이 손가락에 갈라지듯 비켜선다 — 위아래로 밀어냄. C4·E4 공용 */
  const part = (x, y) => { const dx = x - ptr.x, dy = y - ptr.y, g = Math.exp(-(dx * dx + dy * dy) / 9800); return (dy >= 0 ? 1 : -1) * 30 * g * ptr.on }
  /* 줄 다발의 왼쪽 끝을 흐리게 — 캔버스마다 한 번 만든다 */
  const fades = new WeakMap()
  const fadeOf = (xl) => { let g = fades.get(ctx); if (!g) { g = ctx.createLinearGradient(xl, 0, xl + 240, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, '#fff'); fades.set(ctx, g) } return g }

  const V = {}

  /* C4 — 신호 정렬: 가는 줄 34가닥이 잡음(흩어진 요구)으로 떨다가, 왼쪽부터 쓸고 가는 전선 뒤로 잠잠해지며(방향),
     게이트 3곳을 지날 때마다 다발이 좁아져(마일스톤) 한 줄로 모인다. 모인 점 = 빨간 출시점, 그 뒤로 빨간 신호가 계속 흐른다(라이브).
     라벨 없음. 헤드라인은 낱말마다 마스크 아래에서 떠오른다(WT = 낱말 9개의 등장 시각, 그림의 단계와 같은 박자) */
  {
    const NL = 34, SP = 17, XL = 900, XR = 1940, STEP = 8, NP = Math.ceil((XR - XL) / STEP) + 1
    const G = [1220, 1370, 1510], RX = 1650, TG = [1250, 1600, 1950], TR = 2350
    const WT = [150, 250, 700, 800, 900, 1300, 1400, 1500, 1600]
    const r = rng(4417), OFF = [], PH = [], AF = [], AL = []
    for (let i = 0; i < NL; i++) {
      const u = (i - (NL - 1) / 2) / ((NL - 1) / 2)
      OFF.push(u * SP * (NL - 1) / 2 + (r() - .5) * 7); PH.push(r() * TAU); AF.push(.4 + r() * .9); AL.push(.13 + .5 * Math.pow(1 - Math.abs(u), 1.4))
    }
    const XX = new Float32Array(NP), AMP = new Float32Array(NP), SS = new Float32Array(NP)
    for (let k = 0; k < NP; k++) XX[k] = XL + k * STEP
    const W3 = [.3, .3, .4]
    const spread = (x, t) => 1 - W3[0] * sstep(G[0] - 70, G[0] + 50, x) * sstep(TG[0], TG[0] + 700, t)
      - W3[1] * sstep(G[1] - 70, G[1] + 50, x) * sstep(TG[1], TG[1] + 700, t) - W3[2] * sstep(G[2] - 40, RX, x) * sstep(TG[2], TG[2] + 700, t)
    V.C4 = {
      T: 3200,
      setup(sec) { return { words: [...sec.querySelectorAll('.hl .wi')] } },
      frame(t) {
        ctx.clearRect(0, 0, W, H)
        const xh = XL + (XR - XL) * eout(clamp(t / 1100))           // 줄이 왼쪽에서 그려져 들어온다
        const xf = lerp(XL - 260, XR + 140, eio(clamp((t - 650) / 1400))) // 잠잠해지는 전선
        const kmax = Math.min(NP - 1, Math.ceil((xh - XL) / STEP))
        for (let k = 0; k <= kmax; k++) { AMP[k] = 26 * (.06 + .94 * sstep(xf - 220, xf + 20, XX[k])); SS[k] = spread(XX[k], t) }
        const pon = ptr.on > .01, ts1 = t * .0019, ts2 = t * .0027
        ctx.lineJoin = 'round'; ctx.lineWidth = 1.3; ctx.strokeStyle = fadeOf(XL)
        for (let i = 0; i < NL; i++) {
          const o = OFF[i], ph = PH[i], af = AF[i]
          ctx.beginPath()
          for (let k = 0; k <= kmax; k++) {
            const x = XX[k], s = SS[k]
            const n = Math.sin(x * .019 + ph + ts1) * .62 + Math.sin(x * .043 - ph * 1.7 - ts2) * .38
            let y = CY + o * s + AMP[k] * af * n * (.3 + .7 * s)
            if (pon) y += part(x, y)
            k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
          }
          ctx.globalAlpha = AL[i]; ctx.stroke()
        }
        ctx.globalAlpha = 1
        // 게이트(마일스톤) — 다발 위아래의 가는 눈금 한 쌍 + 아주 옅은 세로 머리카락선
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5
        for (let j = 0; j < 3; j++) {
          const a = sstep(TG[j], TG[j] + 500, t); if (a <= 0) continue
          const gx = G[j], hs = (NL - 1) / 2 * SP * spread(gx, t) + 24
          ctx.globalAlpha = .6 * a; ctx.beginPath()
          ctx.moveTo(gx, CY - hs - 16 * a); ctx.lineTo(gx, CY - hs); ctx.moveTo(gx, CY + hs); ctx.lineTo(gx, CY + hs + 16 * a); ctx.stroke()
          ctx.globalAlpha = .1 * a; ctx.setLineDash([2, 7]); ctx.beginPath(); ctx.moveTo(gx, CY - hs); ctx.lineTo(gx, CY + hs); ctx.stroke(); ctx.setLineDash([])
        }
        ctx.globalAlpha = 1
        // 출시점 + 라이브 신호
        if (t > TR) {
          const e = t - TR
          ring(RX, CY, 7 + eout(clamp(e / 1100)) * 120, .5 * (1 - clamp(e / 1100)), RED, 2)
          if (e > 900) { const ph = ((e - 900) % 2600) / 2600; ring(RX, CY, 7 + ph * 48, .45 * (1 - ph), RED, 1.5) }
          if (e > 500) {
            const ph = ((e - 500) % 2200) / 2200, hx = lerp(RX + 10, XR + 160, eio(ph)), tl = 170
            const g = ctx.createLinearGradient(hx - tl, 0, hx, 0); g.addColorStop(0, 'rgba(230,43,30,0)'); g.addColorStop(1, 'rgba(230,43,30,.95)')
            ctx.beginPath(); ctx.moveTo(Math.max(RX + 10, hx - tl), CY); ctx.lineTo(hx, CY); ctx.strokeStyle = g; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.stroke()
          }
          dot(RX, CY, 7 * eback(e / 450), RED)
        }
      },
      text(t, st) { // 헤드라인 낱말 — 마스크 아래(105%)에서 떠오른다
        const ws = st.words
        for (let i = 0; i < ws.length; i++) { const k = eout(clamp((t - WT[Math.min(i, WT.length - 1)]) / 650)); ws[i].style.transform = k < 1 ? `translateY(${(1 - k) * 105}%)` : '' }
      },
    }
  }

  /* E4 — 잔향: 표지 C4의 반대 방향. 한 줄이 들어와 다발로 펼쳐지고(출시 이후의 영향), 가운데 빨간 점에서 파문이 일어
     잔잔한 줄들을 천천히 흔들고 지나간다. 파문은 2.6초마다 새로 일고 7초에 걸쳐 잦아든다 — 끝나지 않는 여운. 캔버스 글자 0개 */
  {
    const NL = 26, SP = 19, XL = 900, XR = 1940, STEP = 8, NP = Math.ceil((XR - XL) / STEP) + 1
    const C = { x: 1400, y: CY }, TD = 1200, TK = 1300, PER = 2600, LIFE = 7200, SPD = .17
    const OFF = [], AL = []
    for (let i = 0; i < NL; i++) { const u = (i - (NL - 1) / 2) / ((NL - 1) / 2); OFF.push(u * SP * (NL - 1) / 2); AL.push(.12 + .42 * Math.pow(1 - Math.abs(u), 1.3)) }
    const AG = [], RR = [], DEC = []
    V.E4 = {
      T: 3000,
      nt: [450, 600, 750, 900, 1050, 1400], // 왼쪽 연락 항목 6줄의 등장 시각
      frame(t) {
        ctx.clearRect(0, 0, W, H)
        // 살아 있는 파문 목록
        AG.length = 0; RR.length = 0; DEC.length = 0
        if (t > TK) {
          const kn = Math.floor((t - TK) / PER)
          for (let k = Math.max(0, kn - 3); k <= kn; k++) {
            const age = t - TK - k * PER; if (age < 0 || age > LIFE) continue
            AG.push(age); RR.push(age * SPD); DEC.push(Math.exp(-age / 3200) * (1 - sstep(LIFE - 1800, LIFE, age)))
          }
        }
        const xh = XL + (XR - XL) * eout(clamp(t / 750)), S = eio(clamp((t - 350) / 1150))
        const kmax = Math.min(NP - 1, Math.ceil((xh - XL) / STEP)), pon = ptr.on > .01, nr = AG.length
        ctx.lineJoin = 'round'; ctx.lineWidth = 1.3; ctx.strokeStyle = fadeOf(XL)
        for (let i = 0; i < NL; i++) {
          const y0 = CY + OFF[i] * S
          ctx.beginPath()
          for (let k = 0; k <= kmax; k++) {
            const x = XL + k * STEP
            let y = y0
            if (nr) {
              const dx = x - C.x, dy = y0 - C.y, d = Math.sqrt(dx * dx + dy * dy), near = clamp(d / 110)
              for (let j = 0; j < nr; j++) { const q = d - RR[j]; if (q > -160 && q < 160) y += 18 * DEC[j] * near * Math.sin(q * .05) * Math.exp(-q * q / 5200) }
            }
            if (pon) y += part(x, y)
            k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
          }
          ctx.globalAlpha = AL[i]; ctx.stroke()
        }
        ctx.globalAlpha = 1
        for (let j = 0; j < nr; j++) ring(C.x, C.y, RR[j], .08 * DEC[j] * (1 - sstep(320, 500, RR[j])), '#fff', 1) // 원은 가까이서만 — 글자 칸을 넘지 않게
        // 빨간 점 — 파문이 일 때마다 짧게 울린다
        if (t > TD) {
          for (let j = 0; j < nr; j++) if (AG[j] < 1000) ring(C.x, C.y, 8 + eout(AG[j] / 1000) * 34, .55 * (1 - AG[j] / 1000), RED, 1.5)
          dot(C.x, C.y, 8 * eback((t - TD) / 450), RED)
        }
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
  return { show, fit, state: () => ({ id: act ? act.sec.dataset.mo : null, running: !!raf, t, w: act ? act.cv.width : 0, h: act ? act.cv.height : 0,
    work: work.length ? { n: work.length, avg: +(work.reduce((a, b) => a + b, 0) / work.length).toFixed(3), p95: +[...work].sort((a, b) => a - b)[Math.floor(work.length * .95)].toFixed(3) } : null }) }
})()
