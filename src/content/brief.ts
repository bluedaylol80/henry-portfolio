import type { Bi } from '../lib/i18n'

/**
 * ─────────────────────────────────────────────────────────────
 *  /brief — 3분 요약 (빠른 검토용 한 페이지). 문구는 여기서만 수정.
 * ─────────────────────────────────────────────────────────────
 */

export const brief = {
  label: { ko: '3-MINUTE BRIEF', en: '3-MINUTE BRIEF' } as Bi,
  title: { ko: '3분 요약', en: 'The 3-minute brief' } as Bi,
  lede: {
    ko: '바쁘신 분들을 위해 — 숫자와 핵심만 한 페이지에 담았습니다.',
    en: 'For the busy reader — just the numbers and the core, on one page.',
  } as Bi,

  identity: {
    name: 'Henry Lim · 임현택',
    line: {
      ko: '라이브 게임 운영·사업·기획 19년 — 그리고 AI로 줄인 팀 루틴 60%',
      en: '19 years in live-game ops, business & planning — and 60% of team routine cut with AI',
    } as Bi,
    // B6: 종착지가 'AI 시스템'이면 게임을 떠난 사람으로 읽힌다 — 적층은 유지하되 AI를 '그 위'로.
    arc: {
      ko: '운영 → 사업 PM → 기획, 그 위에 AI — 이직의 나열이 아니라 역할의 적층',
      en: 'Live ops → business PM → planning, with AI on top — layers accumulated, not jobs listed',
    } as Bi,
    // B2: 지원서 1페이지엔 "무엇을 맡을 수 있는가"가 있어야 한다.
    roles: {
      ko: '맡을 수 있는 자리 — 라이브 서비스 디렉팅 · 사업/BM 총괄 · 기획 조직 리드 · 글로벌 퍼블리싱',
      en: 'Roles I can own — live-service directing · business & BM ownership · planning-org leadership · global publishing',
    } as Bi,
  },

  // B3: '10개사'는 서사에선 적층이지만 PDF 첫 줄 숫자로는 '이직 10회'로 먼저 읽힌다.
  stats: [
    { value: '19년', valueEn: '19y', label: { ko: '게임 업계', en: 'In games' } },
    { value: '12종', valueEn: '12', label: { ko: 'K-pop IP 라이브 총괄', en: 'K-pop IP titles led' } },
    { value: '18+', valueEn: '18+', label: { ko: '라이브 타이틀', en: 'Live titles' } },
    { value: '60%', valueEn: '60%', label: { ko: 'AI로 줄인 팀 루틴 업무', en: 'Routine work cut with AI' } },
  ] as { value: string; valueEn: string; label: Bi }[],

  workTitle: { ko: '숫자로 남은 것', en: 'What the numbers say' } as Bi,
  work: [
    {
      ko: '달콤소프트 — K-pop 아이돌 IP 수집형 리듬게임(SuperStar 12종) 라이브 총괄, 기획팀장(10인) · 카드·이벤트·상품 기획 · 30+ AI 스킬로 루틴 60% 단축',
      en: 'Dalcomsoft — ran live service for K-pop idol-IP collectible rhythm games (SuperStar, 12 titles), leading planning (10) · cards, events & products · 30+ AI skills cut routine 60%',
    },
    {
      ko: '린: 더 라이트브링어 — 누적 183억, 한국 양대 마켓 매출 3위 (넥슨, 사업PM)',
      en: 'Lyn: The Lightbringer — ₩18.3B lifetime, #3 grossing on both KR stores (NEXON, business PM)',
    },
    {
      ko: '카오스크로니클 — 누적 98억, 북미 iOS·구글 피처드',
      en: 'Chaos Chronicle — ₩9.8B lifetime, featured by Apple & Google in NA',
    },
    {
      ko: '나이트워커(한국) — 신규 33만+ · DAU 피크 6.3만 · D+1 리텐션 평균 약 50% (원더피플, 국내 사업 파트장)',
      en: 'Night Walker (KR) — 330K+ new users · peak DAU 63K · ~50% D+1 retention (Wonder People, domestic business lead)',
    },
    {
      ko: '네오위즈 — 신규 10건 · 개편 10건 · 밸런스 10건, 총 30건의 기획서 직접 작성',
      en: 'NEOWIZ — authored 30 system specs hands-on (10 new · 10 reworked · 10 balancing)',
    },
  ] as Bi[],

  // B1: '지금 하는 것'이면 현재=AI만 하는 사람으로 읽힌다. 같은 내용을 '차별화'로 프레이밍한다.
  aiTitle: { ko: '남들과 다른 점', en: 'What sets me apart' } as Bi,
  ai: [
    {
      ko: '개인 AI OS — 규칙 29 · 스킬 70 · 에이전트 23, 산출물은 6축 루브릭 + 블라인드 채점(평균 90.1)',
      en: 'A personal AI OS — 29 rules · 70 skills · 23 agents; output gated by a 6-axis rubric + blind grading (avg 90.1)',
    },
    {
      ko: '3-AI 협업 버스 — GPT 발주 · Claude 실행 · Codex 검증, 모델 계열 수준에서 "만든 자 ≠ 검증자"',
      en: 'A 3-AI collaboration bus — GPT orders, Claude executes, Codex verifies; maker ≠ verifier by model family',
    },
    {
      ko: '이 사이트 자체가 증거 — 자연어 지시만으로 설계·구현·배포된 결과물입니다',
      en: 'This very site is the proof — designed, built and shipped from natural-language instructions alone',
    },
  ] as Bi[],

  howTitle: { ko: '일하는 방식 한 줄', en: 'How I work, in one line' } as Bi,
  how: {
    ko: '기록이 시스템이 될 때까지 — 위임은 설계하고, 내 산출물도 남이 검증하게 합니다.',
    en: 'Records until they become systems — delegation is designed, and my own output gets verified by someone else.',
  } as Bi,

  ctaTitle: { ko: '더 보기 · 연락', en: 'More · Contact' } as Bi,
  ctas: {
    coffee: { ko: '커피챗 예약', en: 'Book a coffee chat' } as Bi,
    email: { ko: '이메일', en: 'Email' } as Bi,
    notion: { ko: '상세 이력 (Notion)', en: 'Full history (Notion)' } as Bi,
    story: { ko: '메인으로', en: 'Home' } as Bi,
    career: { ko: '커리어 딥다이브', en: 'Career deep-dive' } as Bi,
  },
}
