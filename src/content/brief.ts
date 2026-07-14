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
      ko: '게임 기획·사업 19년 → AI 자동화 시스템 아키텍트',
      en: '19 years in game business & planning → AI automation systems architect',
    } as Bi,
    arc: {
      ko: '운영 → FUN QA → 사업 PM → 기획 → AI 시스템 — 이직의 나열이 아니라 역할의 적층',
      en: 'Live ops → FUN QA → business PM → planning → AI systems — layers accumulated, not jobs listed',
    } as Bi,
  },

  stats: [
    { value: '19년', valueEn: '19y', label: { ko: '게임 업계', en: 'In games' } },
    { value: '10개사', valueEn: '10', label: { ko: '웹젠 → 달콤소프트', en: 'Webzen → Dalcomsoft' } },
    { value: '18+', valueEn: '18+', label: { ko: '라이브 타이틀', en: 'Live titles' } },
    { value: '60%', valueEn: '60%', label: { ko: 'AI로 줄인 팀 루틴 업무', en: 'Routine work cut with AI' } },
  ] as { value: string; valueEn: string; label: Bi }[],

  workTitle: { ko: '숫자로 남은 것', en: 'What the numbers say' } as Bi,
  work: [
    {
      ko: '달콤소프트 — K-pop IP 라이브 12종 기획팀장(10인), 30+ AI 스킬로 루틴 업무 60% 단축',
      en: 'Dalcomsoft — led live planning (10 people) for 12 K-pop IP titles; 30+ AI skills cut routine work 60%',
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
      ko: '네오위즈 — 신규 10건 · 개편 10건 · 밸런스 10건, 총 30건의 기획서 직접 작성',
      en: 'NEOWIZ — authored 30 system specs hands-on (10 new · 10 reworked · 10 balancing)',
    },
  ] as Bi[],

  aiTitle: { ko: '지금 하는 것', en: 'What I do now' } as Bi,
  ai: [
    {
      ko: '개인 AI OS — 규칙 31 · 스킬 65 · 에이전트 20, 산출물은 6축 루브릭 + 블라인드 채점(평균 90.1)',
      en: 'A personal AI OS — 31 rules · 65 skills · 20 agents; output gated by a 6-axis rubric + blind grading (avg 90.1)',
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
    story: { ko: '전체 스토리 보기', en: 'See the full story' } as Bi,
    career: { ko: '커리어 딥다이브', en: 'Career deep-dive' } as Bi,
  },
}
