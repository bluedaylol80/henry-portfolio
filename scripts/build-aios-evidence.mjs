/**
 * v21 P3 — AI-OS 증거 스냅샷 생성기 (SDD §4).
 *
 * 사이트에 나가는 운영 수치와 리플레이 타임라인을 **손으로 쓰지 않는다.** 이
 * 스크립트가 실제 운영 로그를 읽어 집계하고, 결과를 `src/content/aiosEvidence.json`
 * 으로 커밋한다. 사이트는 그 스냅샷만 읽는다(빌드가 개인 저장소 경로에 의존하지
 * 않게 하기 위해). 수치가 바뀌면 이 스크립트를 다시 돌려 스냅샷을 갱신한다.
 *
 * ★ 유출 방지는 "지우기"가 아니라 "구조"로 한다 ★
 * 로그에는 개인 재무 포지션·파일 경로·LLM 출력 꼬리말 같은 자유 텍스트가 섞여
 * 있다. 그래서 이 스크립트는 **어떤 자유 텍스트도 복사하지 않는다.** 화이트리스트에
 * 있는 열거형 필드(routine/event/status/이벤트 시각)만 읽고, 나머지는 통계로만
 * 환원한다. 새 필드를 퍼가고 싶으면 반드시 이 파일에서 명시적으로 허용해야 한다.
 *
 * Usage: node scripts/build-aios-evidence.mjs [htMultiRoot]
 *        (기본값 D:/Github/HT_multi — 공개 저장소 밖의 개인 시스템)
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.argv[2] ?? 'D:/Github/HT_multi'
const OUT = 'src/content/aiosEvidence.json'
const LOG = join(ROOT, 'superstar-ai-os/logs/auto_execution.jsonl')

if (!existsSync(LOG)) {
  console.error(`[build-aios-evidence] 로그를 찾지 못했습니다: ${LOG}`)
  console.error('개인 시스템 저장소 경로를 인자로 넘기세요. 스냅샷은 갱신되지 않았습니다.')
  process.exit(1)
}

// ── 1. 로그 파싱 ────────────────────────────────────────────────────────
const rows = []
for (const line of readFileSync(LOG, 'utf8').split(/\r?\n/)) {
  if (!line.trim()) continue
  try {
    const o = JSON.parse(line)
    // 시각 필드가 두 가지 스키마로 섞여 있다(ts / timestamp).
    const ts = o.ts ?? o.timestamp
    // 스키마가 섞여 있어 숫자 epoch 등 이질적인 값이 들어온 줄이 있다 —
    // ISO 형태만 신뢰한다(정렬·기간 계산이 통째로 어긋나는 걸 막는다).
    if (typeof ts !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(ts)) continue
    rows.push({ ts, routine: o.routine ?? null, event: o.event ?? null, status: o.status ?? null, queue: o.queue ?? null, reachable: o.reachable })
  } catch {
    /* 깨진 줄은 조용히 건너뛴다 — 집계 신뢰도보다 중단이 더 나쁘다 */
  }
}
rows.sort((a, b) => a.ts.localeCompare(b.ts))

const first = rows[0].ts
const last = rows[rows.length - 1].ts
const dayOf = (ts) => ts.slice(0, 10)
const days = new Set(rows.map((r) => dayOf(r.ts)))
const routines = new Set(rows.filter((r) => r.routine).map((r) => r.routine))
const notifyCount = rows.filter((r) => r.routine === 'notify').length

// ── 2. 시스템 규모 (현재 상태 실측) ─────────────────────────────────────
const countIn = (rel, kind) => {
  const dir = join(ROOT, rel)
  if (!existsSync(dir)) return 0
  return readdirSync(dir).filter((n) => {
    const full = join(dir, n)
    return kind === 'dir' ? statSync(full).isDirectory() : n.endsWith('.md') && statSync(full).isFile()
  }).length
}
const scale = {
  agents: countIn('.claude/agents', 'md'),
  skills: countIn('.claude/skills', 'dir'),
  rules: countIn('.claude/rules', 'md'),
}

// ── 3. 리플레이 시나리오 — 실제 기록에서 구간을 잘라낸다 ────────────────
/**
 * 각 시나리오는 "그 날 실제로 이 순서로, 이 간격으로 일어났다"만 담는다.
 * step.label 은 로그의 event/status 코드를 사람 말로 옮긴 **고정 사전**이며,
 * 로그의 자유 텍스트가 아니다. offsetMs 는 첫 이벤트로부터의 실제 경과시간.
 */
const SCENARIOS = [
  {
    key: 'brief',
    name: { ko: '아침 증시 브리핑', en: 'Morning market brief' },
    intent: { ko: '예약 시각에 스스로 깨어나 리포트를 쓰고 슬랙으로 보낸다', en: 'Wakes on schedule, writes the report, posts it to Slack' },
    pick: (r) => r.routine === 'daily_stock_brief',
    // 하루치 = started → 종료 상태 한 쌍
    slice: (list) => {
      for (let i = list.length - 1; i > 0; i--) {
        if (list[i].status === 'DONE_HEADLESS') {
          const s = list.slice(0, i).reverse().find((x) => x.status === 'started')
          if (s) return [s, list[i]]
        }
      }
      return null
    },
    labels: {
      started: { ko: '예약 트리거 — 무인 실행 시작', en: 'Scheduled trigger — unattended run starts' },
      DONE_HEADLESS: { ko: '리포트 2종 저장 · 슬랙 발송 완료', en: 'Two reports saved · posted to Slack' },
    },
  },
  {
    key: 'failclosed',
    name: { ko: '실패한 날 (닫히는 쪽으로)', en: 'The day it failed (fails closed)' },
    intent: { ko: '완료 표식이 없으면 발송하지 않고 실패로 남긴다', en: 'No completion marker → nothing is sent; it is recorded as a failure' },
    pick: (r) => r.routine === 'daily_stock_brief',
    slice: (list) => {
      for (let i = list.length - 1; i >= 0; i--) {
        if (list[i].status !== 'FAIL_HEADLESS') continue
        // 같은 날의 started 만 짝으로 인정한다 — 다른 날 실행과 엮으면
        // 소요시간이 27시간짜리 거짓말이 된다(실측 중 발견).
        const day = list[i].ts.slice(0, 10)
        const s = list
          .slice(0, i)
          .reverse()
          .find((x) => x.status === 'started' && x.ts.slice(0, 10) === day)
        return s ? [s, list[i]] : [list[i]]
      }
      return null
    },
    labels: {
      started: { ko: '예약 트리거 — 무인 실행 시작', en: 'Scheduled trigger — unattended run starts' },
      FAIL_HEADLESS: { ko: '완료 표식 없음 → 발송 안 함 · 실패 기록', en: 'No completion marker → not sent · logged as failure' },
    },
  },
  {
    key: 'approval',
    name: { ko: '무인 발행 — 승인 게이트', en: 'Unattended publishing — the approval gate' },
    intent: { ko: '발행 파수꾼이 깨어나도, 승인이 없으면 발행하지 않고 닫는다', en: 'The watcher wakes on time — but without approval it closes without publishing' },
    pick: (r) => r.routine === 'blogo_publish_watcher' || r.routine === 'blogo_weekly_publish',
    slice: (list) => {
      const i = list.map((r) => r.event).lastIndexOf('watch_start')
      return i < 0 ? null : list.slice(i)
    },
    labels: {
      watch_start: { ko: '발행 파수꾼 기동', en: 'Publishing watcher wakes' },
      publish_call: { ko: '발행 작업 호출', en: 'Calls the publish job' },
      weekly_start: { ko: '주간 발행 절차 시작', en: 'Weekly publish routine starts' },
      approval_poll: { ko: '승인 확인 — 대기 상태(승인 없음)', en: 'Approval check — pending (not approved)' },
      weekly_end: { ko: '발행하지 않고 정상 종료', en: 'Ends cleanly without publishing' },
      child_done: { ko: '하위 작업 종료 보고', en: 'Child job reports completion' },
      watch_end: { ko: '파수꾼 종료', en: 'Watcher stands down' },
    },
  },
  {
    key: 'killswitch',
    name: { ko: '일꾼 기동 + 비상정지 점검', en: 'Worker start + kill-switch check' },
    intent: { ko: '일을 받기 전에 비상정지 신호를 어디서 받을지부터 확인한다', en: 'Before taking work, it verifies where the emergency stop will come from' },
    pick: (r) => r.routine === 'jarvis_worker',
    slice: (list) => {
      const i = list.map((r) => r.event).lastIndexOf('worker_start')
      return i < 0 ? null : list.slice(i)
    },
    labels: {
      worker_start: { ko: '원격 일꾼 기동 — 작업 큐 연결', en: 'Remote worker starts — connects to the queues' },
      kill_mirror_plane: { ko: '비상정지 경로 점검', en: 'Emergency-stop path checked' },
    },
    detail: (r) =>
      r.event === 'kill_mirror_plane'
        ? { ko: `${r.queue} 경로 — ${r.reachable ? '연결됨' : '응답 없음'}`, en: `${r.queue} plane — ${r.reachable ? 'reachable' : 'no response'}` }
        : null,
  },
]

const scenarios = []
for (const s of SCENARIOS) {
  const list = rows.filter(s.pick)
  const cut = list.length ? s.slice(list) : null
  if (!cut || !cut.length) {
    console.warn(`[skip] ${s.key} — 해당하는 실제 기록을 찾지 못했습니다`)
    continue
  }
  const t0 = new Date(cut[0].ts).getTime()
  const steps = cut
    .map((r) => {
      const label = s.labels[r.event] ?? s.labels[r.status]
      if (!label) return null // 사전에 없는 코드는 내보내지 않는다(화이트리스트)
      return {
        offsetMs: new Date(r.ts).getTime() - t0,
        label,
        detail: s.detail?.(r) ?? null,
        // 상태 색만 넘긴다 — 원문 상태 문자열은 내보내지 않는다.
        tone: r.status === 'FAIL_HEADLESS' || r.reachable === false ? 'warn' : 'ok',
      }
    })
    .filter(Boolean)
  if (!steps.length) continue
  scenarios.push({
    key: s.key,
    name: s.name,
    intent: s.intent,
    recordedOn: dayOf(cut[0].ts),
    startedAt: cut[0].ts.slice(11, 19),
    elapsedMs: steps[steps.length - 1].offsetMs,
    steps,
  })
}

// ── 4. 스냅샷 기록 ──────────────────────────────────────────────────────
const snapshot = {
  $comment:
    '자동 생성 — scripts/build-aios-evidence.mjs. 직접 수정하지 마세요. 원천=개인 AI-OS 운영 로그(auto_execution.jsonl) + .claude 구성 실측.',
  asOf: last.slice(0, 10),
  window: { from: first.slice(0, 10), to: last.slice(0, 10), activeDays: days.size },
  counters: {
    runs: rows.length,
    routines: routines.size,
    notifications: notifyCount,
    agents: scale.agents,
    skills: scale.skills,
    rules: scale.rules,
  },
  scenarios,
}
writeFileSync(OUT, JSON.stringify(snapshot, null, 2) + '\n')

console.log(`[build-aios-evidence] → ${OUT}`)
console.log(`  기간 ${snapshot.window.from} ~ ${snapshot.window.to} (기록된 날 ${snapshot.window.activeDays}일)`)
console.log(`  실행 ${snapshot.counters.runs}건 · 루틴 ${snapshot.counters.routines}종 · 알림 ${snapshot.counters.notifications}건`)
console.log(`  규모: 에이전트 ${scale.agents} · 스킬 ${scale.skills} · 규칙 ${scale.rules}`)
console.log(`  시나리오 ${scenarios.length}종: ${scenarios.map((s) => `${s.key}(${s.steps.length}단계·${s.recordedOn})`).join(', ')}`)
