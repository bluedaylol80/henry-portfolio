import type { Achievement } from './types'
import type { Bi } from '../lib/i18n'

/**
 * ─────────────────────────────────────────────────────────────
 *  콘텐츠 원천 파일 — 사이트의 모든 문구는 여기서만 수정하세요.
 *  { ko: '한국어', en: 'English' } 짝을 함께 고치면 됩니다.
 * ─────────────────────────────────────────────────────────────
 */

export const meta = {
  title: 'Henry Lim (임현택) — 기획자의 진화 · The Evolution of a Planner',
  description:
    '게임 기획·사업 19년에서 AI 자동화 시스템 아키텍트로. 임현택(Henry Lim)의 포트폴리오.',
}

/* 2026-08-05 정리(G4): 어디서도 렌더되지 않던 v19 이전 유물 export 제거 —
   nav · hero · about · career(구 타임라인 표) · intro · whisper · ai(구 /story AI 챕터).
   현행 콘텐츠는 home(Act 0~5) · work · skills · contact · workAiOs · footer가 전부. */

export const work = {
  label: { ko: '03 · SELECTED WORK', en: '03 · SELECTED WORK' } as Bi,
  title: {
    ko: '숫자로 남은 장면들',
    en: 'Moments that left numbers',
  } as Bi,
  subtitle: {
    ko: '기획과 사업이 시장에서 증명된 순간들입니다.',
    en: 'Where planning and business were proven in the market.',
  } as Bi,
  items: [
    {
      title: {
        ko: 'SuperStar 시리즈 · 라이브 기획의 AI 전환',
        en: 'SuperStar Series · AI-powered live planning',
      },
      tag: 'DALCOMSOFT',
      stat: {
        ko: { value: 60, suffix: '%' },
        en: { value: 60, suffix: '%' },
      },
      label: { ko: '팀 루틴 업무 시간 단축', en: 'Routine team workload reduced' },
      sub: {
        ko: 'K-pop 아이돌 IP 수집형 리듬게임 12종 · 카드·이벤트·상품 기획 · 30+ AI 스킬 · 10인 팀',
        en: 'K-pop idol-IP collectible rhythm games (12) · cards, events & products · 30+ AI skills · 10-person team',
      },
      emphasis: true,
      footnote: {
        ko: '담당: 라이브기획팀장(총괄) · 근거: 실제 팀 운영 실측, 인수인계 문서화',
        en: 'Role: live planning team lead · Proof: measured in real team ops, documented in handover',
      },
      linkTo: '/work/ai-os',
    },
    {
      title: { ko: '린: 더 라이트브링어', en: 'Lyn: The Lightbringer' },
      tag: 'NEXON',
      stat: {
        ko: { value: 183, suffix: '억' },
        en: { value: 18.3, decimals: 1, prefix: '₩', suffix: 'B' },
      },
      label: { ko: '누적 매출', en: 'Lifetime revenue' },
      sub: {
        ko: '한국 App Store · Google Play 매출 3위',
        en: '#3 top-grossing on KR App Store & Google Play',
      },
      emphasis: true,
      footnote: {
        ko: '담당: 사업PM (넥슨 모바일사업실) · 근거: 양대 마켓 공개 순위',
        en: 'Role: business PM (NEXON mobile div.) · Proof: public store rankings',
      },
    },
    {
      title: { ko: '카오스크로니클', en: 'Chaos Chronicle' },
      tag: 'NEXON',
      stat: {
        ko: { value: 98, suffix: '억' },
        en: { value: 9.8, decimals: 1, prefix: '₩', suffix: 'B' },
      },
      label: { ko: '누적 매출', en: 'Lifetime revenue' },
      sub: {
        ko: '북미 iOS · Google Play 피처드',
        en: 'Featured by Apple & Google in North America',
      },
      emphasis: true,
      footnote: {
        ko: '담당: 사업PM · 근거: 북미 스토어 공개 피처드',
        en: 'Role: business PM · Proof: public NA store featuring',
      },
    },
    {
      title: { ko: 'Five Stars', en: 'Five Stars' },
      tag: 'SKYPEOPLE',
      stat: {
        ko: { value: 24, suffix: '억' },
        en: { value: 2.4, decimals: 1, prefix: '₩', suffix: 'B' },
      },
      label: { ko: '매출', en: 'Revenue' },
      sub: {
        ko: '구글 매출 46위 · 사전예약 20만',
        en: '#46 grossing on Google Play · 200K pre-registrations',
      },
      footnote: {
        ko: '담당: 사업본부 총괄 · 내부 지표: 신규 28만 · 런칭 3개월 평균 ARPPU 16.8만원 · PU 1.61%',
        en: 'Role: head of business · internal: 280K new users · ARPPU ₩168K · PU 1.61% (3-month avg)',
      },
    },
    {
      title: { ko: '슈퍼피플 (중국)', en: 'Super People (China)' },
      tag: 'WONDER PEOPLE',
      stat: {
        ko: { value: 56, suffix: '만 명' },
        en: { value: 560, suffix: 'K' },
      },
      label: { ko: '신규 유저', en: 'New users' },
      sub: { ko: 'DAU 피크 7.1만', en: 'Peak DAU 71K' },
      footnote: {
        ko: '담당: 사업파트장(스팀 런칭·중국 라이브) · 개발 지원 없이 커뮤니티 기획만으로 ~35일 팔로워 급증 — WeChat +660% · QQ +769% · Weibo +51%',
        en: 'Role: business part lead (Steam launch · China live) · community planning alone — no dev support — drove ~35-day follower growth: WeChat +660% · QQ +769% · Weibo +51%',
      },
    },
    {
      title: { ko: 'Shadow Seven', en: 'Shadow Seven' },
      tag: 'NEPTUNE LEGEND',
      stat: {
        ko: { value: 4.4, decimals: 1, prefix: '3.29 → ' },
        en: { value: 4.4, decimals: 1, prefix: '3.29 → ' },
      },
      label: { ko: '구글 플레이 평점 개선', en: 'Google Play rating turnaround' },
      sub: {
        ko: '일본 3.29 → 글로벌 4.4 · 라이브 운영 개선',
        en: 'JP 3.29 → global 4.4 through live-ops improvements',
      },
      footnote: {
        ko: '담당: 사업PM · 근거: 구글 플레이 공개 평점',
        en: 'Role: business PM · Proof: public Google Play rating',
      },
    },
  ] as Achievement[],
}

export const skills = {
  label: { ko: '05 · SKILLS', en: '05 · SKILLS' } as Bi,
  title: { ko: '쌓아온 것과 벼려낸 것', en: 'What I built, what I sharpened' } as Bi,
  hardTitle: { ko: 'Hard Skills', en: 'Hard Skills' } as Bi,
  hard: [
    { name: { ko: '사업기획 · BM 설계', en: 'Business planning · BM design' } },
    { name: { ko: '시스템 · 콘텐츠 기획', en: 'System & content design' } },
    { name: { ko: '데이터 지표 분석 · 시각화', en: 'Data analytics · visualization' } },
    { name: { ko: '글로벌 퍼블리싱', en: 'Global publishing' } },
    { name: { ko: '라이브 서비스 운영', en: 'Live service operations' } },
    { name: { ko: '엔터 IP 라이브 서비스 · 수집형/리듬 캐주얼', en: 'Entertainment-IP live service · collectible/rhythm casual' } },
    { name: { ko: '프로젝트 · 조직 관리', en: 'Project & org management' } },
    {
      name: { ko: '팀 운영 시스템의 AI 전환', en: 'AI transformation of team operations' },
      isNew: true,
    },
    {
      name: { ko: 'AI 오케스트레이션 · 바이브코딩', en: 'AI orchestration · vibe-coding' },
      isNew: true,
    },
  ] as { name: Bi; isNew?: boolean }[],
  softTitle: { ko: 'Soft Skills', en: 'Soft Skills' } as Bi,
  soft: [
    {
      ko: '허들 없는 크로스직군 커뮤니케이션',
      en: 'Cross-functional communication, zero hurdles',
    },
    { ko: '1장 장표로 압축하는 전달력', en: 'One-page storytelling' },
    { ko: '철저한 문서화 · 히스토리 관리', en: 'Rigorous documentation & history' },
    { ko: '게임 · 트렌드 리뷰 습관', en: 'A standing habit of game & trend review' },
  ] as Bi[],
}

export const contact = {
  label: { ko: '06 · CONTACT', en: '06 · CONTACT' } as Bi,
  title: { ko: '다음 기획을 함께', en: "Let's plan what's next" } as Bi,
  lede: {
    ko: '항상 즐거운 제안은 환영합니다.',
    en: 'Fun proposals are always welcome.',
  } as Bi,
  email: 'bluedaylol80@gmail.com',
  kakao: 'bluedaylol',
  kakaoLabel: { ko: '카카오톡 ID 복사', en: 'Copy KakaoTalk ID' } as Bi,
  copied: { ko: '복사됨 ✓', en: 'Copied ✓' } as Bi,
  instagram: 'https://www.instagram.com/bluedaylol/',
  instagramLabel: { ko: '인스타그램', en: 'Instagram' } as Bi,
  calendly: 'https://calendly.com/bluedaylol80/coffe-chat',
  calendlyLabel: { ko: '커피챗 예약하기', en: 'Book a coffee chat' } as Bi,
  navCta: { ko: '커피챗', en: 'Coffee chat' } as Bi,
  /** 상세 이력이 담긴 Notion 페이지 — 반드시 Notion에서 "웹에 게시" 상태여야 방문자가 볼 수 있음 */
  notion: 'https://app.notion.com/p/limhenry/71b99dcfd07f4493b019bfb4bac2acab',
  notionNavLabel: { ko: '상세 이력', en: 'Résumé' } as Bi,
  notionLabel: { ko: '상세 이력 보기 (Notion)', en: 'Full history (Notion)' } as Bi,
  note: {
    ko: '메일과 커피챗 제안에는 빠르게 답합니다.',
    en: 'I reply quickly to email and coffee-chat requests.',
  } as Bi,
}

/**
 * v20 front-door (`/`) composition copy (LOCKED §5.1). All strings are
 * public-safe and sourced from the v20 content pack (🟢). Hero proof strip =
 * checkable numbers only; the system scale (measured snapshot) lives inside the diagram.
 */
type StatN = { value: number; prefix?: string; suffix?: string; decimals?: number }

export const home = {
  eyebrow: { ko: 'AI SYSTEMS ARCHITECT · HENRY LIM 임현택', en: 'AI SYSTEMS ARCHITECT · HENRY LIM 임현택' } as Bi,
  h1: {
    ko: '라이브 게임 운영·사업·기획 19년,\n이제 그 일을 돌리는 AI 운영체제를 짓습니다.',
    en: '19 years in live-game ops, business & planning —\nnow I build the AI operating systems that run the work.',
  } as Bi,
  sub: {
    ko: '넥슨·네오위즈에서 라이브 게임의 운영·사업·기획을 이끈 19년. 그 운영 문법을 그대로 AI 위에 옮겨, 자연어 지시만으로 도는 시스템을 만듭니다.',
    en: 'Nineteen years of live-game operations, business and planning at NEXON and NEOWIZ — that operating grammar, rebuilt on AI, into systems that run from natural-language intent.',
  } as Bi,
  now: {
    ko: 'Now — AI 시스템 · 프로덕트 리더십 역할과 컨설팅 제안을 받고 있습니다.',
    en: 'Now — open to AI-systems / product-leadership roles & consulting.',
  } as Bi,
  /** Checkable numbers only (LOCKED §4.3-2 / A3). amber count-up. */
  proof: [
    {
      ko: { value: 19, suffix: '' },
      en: { value: 19, suffix: '' },
      label: { ko: '년, 라이브 게임 운영·사업·기획', en: 'years — live-game ops, business & planning' },
    },
    {
      ko: { value: 183, suffix: '억', prefix: '₩' },
      en: { value: 18.3, decimals: 1, prefix: '₩', suffix: 'B' },
      label: { ko: '린 누적 매출 · 양대 스토어 3위', en: 'Lyn lifetime · #3 on both KR stores' },
    },
    {
      ko: { value: 60, suffix: '%' },
      en: { value: 60, suffix: '%' },
      label: { ko: 'AI로 줄인 팀 루틴 (실무 검증)', en: 'team routine cut with AI (field-proven)' },
    },
  ] as { ko: StatN; en: StatN; label: Bi }[],
  proofReceipt: {
    ko: '증거: 달콤소프트 실무에서 메일→Notion 히스토리 자동화 · 스토어 product ID 명세 자동 반영(GAS). 개인 실험 아님.',
    en: 'Receipt: at Dalcomsoft — email→Notion history automation · store product-IDs auto-filled into specs (GAS). Not a personal experiment.',
  } as Bi,
  ctaPrimary: { ko: '연락하기', en: 'Get in touch' } as Bi,
  ctaBrief: { ko: '3분 브리프 →', en: '3-minute brief →' } as Bi,

  manifesto: {
    eyebrow: { ko: '명제', en: 'THE PREMISE' } as Bi,
    title: { ko: '이직의 나열이 아니라, 역할의 적층.', en: 'Layers, not jobs.' } as Bi,
    body: {
      ko: '운영·사업·기획·AI — 앞 단계의 역량은 버려진 적 없이 다음 단계의 기반이 됐습니다. 도메인 깊이가 새로운 해자이고, 저는 19년치를 보유했습니다.',
      en: 'Live ops, business, planning, AI — no layer was ever discarded; each became the base of the next. Domain depth is the new moat, and I hold nineteen years of it.',
    } as Bi,
    bridgeTitle: { ko: '19년 운영 문법 → AI', en: '19 years of operating grammar → AI' } as Bi,
    bridge: [
      { from: { ko: '라이브옵스', en: 'Live ops' }, to: { ko: 'always-on 운영 · 상주 에이전트 · 킬스위치', en: 'always-on ops · resident agents · kill-switch' } },
      { from: { ko: 'FUN QA', en: 'FUN QA' }, to: { ko: 'eval 설계 · 6축 품질 게이트', en: 'eval design · 6-axis quality gate' } },
      { from: { ko: '기획팀장', en: 'Planning lead' }, to: { ko: '에이전트 오케스트레이션 · 승인 게이트', en: 'agent orchestration · approval gates' } },
      { from: { ko: '인수인계 SSOT', en: 'Handover SSOT' }, to: { ko: 'LLM 세컨드브레인', en: 'LLM second brain' } },
    ] as { from: Bi; to: Bi }[],
  },

  aiTeaser: {
    eyebrow: { ko: '플래그십', en: 'FLAGSHIP' } as Bi,
    title: { ko: '개인 AI 자동화 운영체제', en: 'A personal AI automation OS' } as Bi,
    body: {
      ko: '오케스트레이터·실행자·검증자 3계층 에이전트가 24/7 클라우드에서 협업합니다. 만든 자와 검증자를 모델 계열 수준에서 분리하고, LLM을 거치지 않는 킬스위치로 폭주를 막습니다. 이 사이트도 그 시스템이 만든 산출물입니다.',
      en: 'Orchestrator, executor and verifier agents collaborate 24/7 in the cloud. Maker and verifier are separated at the model-family level, and a kill-switch that bypasses the LLM keeps it from running away. This very site is an artifact of that system.',
    } as Bi,
    cta: { ko: 'AI 시스템 자세히 보기', en: 'See the AI system' } as Bi,
  },

  workIntro: {
    eyebrow: { ko: '증명', en: 'PROVEN IN MARKET' } as Bi,
    title: { ko: '숫자로 남은 장면들', en: 'Moments that left numbers' } as Bi,
    sub: { ko: '기획과 사업이 시장에서 증명된 순간들 — 공개 순위·평점 중심이며, 내부 수치는 각주에 출처를 밝혔습니다.', en: 'Where planning and business were proven — public rankings and ratings first; internal figures are footnoted with their source.' } as Bi,
  },

  foundationIntro: {
    eyebrow: { ko: '적층', en: 'THE STACK' } as Bi,
    title: { ko: '19년, 네 개의 층', en: '19 years, four layers' } as Bi,
    cta: { ko: '커리어 딥다이브 열기', en: 'Open the career deep-dive' } as Bi,
  },

  workstyleIntro: {
    eyebrow: { ko: '일하는 방식', en: 'HOW I WORK' } as Bi,
    title: { ko: '사람에게든 AI에게든, 같은 원칙', en: 'Same principles — for people or for AI' } as Bi,
  },

  contactIntro: {
    eyebrow: { ko: '연락', en: 'CONTACT' } as Bi,
    title: { ko: '다음 기획을 함께', en: "Let's plan what's next" } as Bi,
    body: {
      ko: '채용 제안이든 컨설팅이든 — 메일과 커피챗엔 빠르게 답합니다. 항상 즐거운 제안은 환영합니다.',
      en: 'Roles or consulting — I reply quickly to email and coffee-chat requests. Fun proposals are always welcome.',
    } as Bi,
  },

  /**
   * v21 Act 서사 카피 (SDD §3). 홈은 Act 0~5로 진행하는 한 편의 내러티브가 되고,
   * 각 Act의 "무대 지시문"만 여기 있습니다. 사실·수치는 전부 기존 검증 콘텐츠에서
   * 끌어오며(work.items · journey phases · hub.workstyle), 여기서 새로 만든 숫자는
   * 하나도 없습니다. Act 2 케이스의 문제/결정 문장도 journey.ts의 problems·did에
   * 근거합니다(🟢). 연출은 정보의 관문이 아니므로 모든 Act는 정적으로도 완결됩니다.
   */
  acts: {
    scrollCue: { ko: '스크롤', en: 'SCROLL' } as Bi,

    a1: {
      eyebrow: { ko: 'ACT 1 · 1층부터', en: 'ACT 1 · FROM THE GROUND FLOOR' } as Bi,
      title: { ko: '2006년, 1층에서 시작했습니다.', en: 'It started on the ground floor, in 2006.' } as Bi,
      body: {
        ko: '운영 · 사업 · 기획 · AI — 앞 단계의 역량은 버려진 적 없이 다음 단계의 기반이 됐습니다. 열 개의 회사를 지나오는 동안 쌓인 건 이력이 아니라 층이었습니다.',
        en: 'Live ops, business, planning, AI — no layer was ever discarded; each became the base of the next. Across ten companies, what accumulated was not a résumé but a stack.',
      } as Bi,
      layersTitle: { ko: '네 개의 층', en: 'Four layers' } as Bi,
    },

    a2: {
      eyebrow: { ko: 'ACT 2 · 지표가 의사결정이 되는 곳', en: 'ACT 2 · WHERE METRICS BECOME DECISIONS' } as Bi,
      title: { ko: '사업 PM 13년 — 감각이 시장의 의사결정이 되는 자리', en: 'Thirteen years as a business PM — where instinct becomes a market decision' } as Bi,
      // 한 장면을 3비트로. 사실 근거: 문제=journey business-pm.problems[0],
      // 결정=business-pm.did(지표 기반 의사결정 · BM/이벤트/업데이트 조율),
      // 결과=work.items 린(공개 순위·누적 매출). 새로 만든 수치 없음.
      caseTag: { ko: '넥슨 모바일사업실 · 2015 — 2019', en: 'NEXON Mobile Business Div. · 2015 — 2019' } as Bi,
      beats: [
        {
          label: { ko: '문제', en: 'PROBLEM' } as Bi,
          body: {
            ko: '숫자와 사람, 일정과 산출물을 동시에 봐야 했습니다.',
            en: 'Numbers and people, schedules and deliverables — all at once.',
          } as Bi,
        },
        {
          label: { ko: '결정', en: 'DECISION' } as Bi,
          body: {
            ko: '감이 아니라 지표를 근거로 BM · 이벤트 · 업데이트 방향을 조율했습니다.',
            en: 'Steered BM, events and update direction on metrics — not on instinct alone.',
          } as Bi,
        },
        { label: { ko: '결과', en: 'RESULT' } as Bi },
      ] as { label: Bi; body?: Bi }[],
      restTitle: { ko: '같은 방식으로 남은 숫자들', en: 'The same method, more numbers' } as Bi,
    },

    a3: {
      eyebrow: { ko: 'ACT 3 · 전환 (2024)', en: 'ACT 3 · THE PIVOT (2024)' } as Bi,
      title: { ko: '새 도구를 배운 게 아닙니다.', en: "I didn't learn a new tool." } as Bi,
      body: {
        ko: '19년간 사람 조직을 돌리던 운영 문법 — 위임 · 결재선 · 인수인계 · 24/7 대응 — 을 AI 위에 그대로 옮겼습니다.',
        en: 'The operating grammar that ran human orgs for 19 years — delegation, approval lines, handover, 24/7 duty — moved onto AI, one for one.',
      } as Bi,
    },

    a4: {
      eyebrow: { ko: 'ACT 4 · 컨트롤 룸', en: 'ACT 4 · THE CONTROL ROOM' } as Bi,
      title: { ko: '지금, 이 방에서 돌아가고 있는 것', en: 'What runs in this room now' } as Bi,
    },

    a5: {
      eyebrow: { ko: 'ACT 5 · 함께 일하기', en: 'ACT 5 · WORKING TOGETHER' } as Bi,
      roomTitle: { ko: '무대 뒤 구경하기', en: 'Look behind the stage' } as Bi,
      roomBody: {
        ko: '19년이 쌓인 방을 사물 단위로 둘러볼 수 있습니다. 급하시면 건너뛰셔도 됩니다 — 필요한 내용은 전부 이 페이지에 있습니다.',
        en: 'A room where nineteen years piled up, explorable object by object. Skip it if you are in a hurry — everything you need is already on this page.',
      } as Bi,
      roomCta: { ko: '방 열어보기', en: 'Open the room' } as Bi,

      /**
       * P5 — 지원용 PDF 발췌. 국내 지원 서류의 표준은 여전히 PDF 한 장이라,
       * 사이트의 3분 요약을 그대로 인쇄한 파일을 내려받게 한다. 경로·생성일·용량은
       * `content/briefPdf.json`(생성기 산출물)에서 오며 손으로 적지 않는다.
       */
      pdfTitle: { ko: '지원용 한 장 요약 (PDF)', en: 'One-page brief for applications (PDF)' } as Bi,
      pdfBody: {
        ko: '서류로 제출하실 수 있게, 이 사이트의 3분 요약을 그대로 인쇄한 파일입니다. 웹에서 보신 내용과 같습니다.',
        en: 'The same 3-minute brief from this site, printed as a file you can attach to an application.',
      } as Bi,
      pdfCta: { ko: 'PDF 내려받기', en: 'Download the PDF' } as Bi,
      pdfMeta: { ko: '{kb}KB · {date} 생성', en: '{kb}KB · generated {date}' } as Bi,
    },
  },

  // E4 로고월 — 모노톤 워드마크 타이포(실제 상표 로고 금지, LOCKED §6 E4).
  // 회사명 출처 = journey.ts phases[].companies (🟢).
  companiesWall: {
    eyebrow: { ko: '함께한 회사들 · 2006 — 2026', en: 'COMPANIES ALONG THE WAY · 2006 — 2026' } as Bi,
    items: [
      { ko: '웹젠', en: 'WEBZEN' },
      { ko: 'NHN 한게임', en: 'NHN HANGAME' },
      { ko: '소프트닉스', en: 'SOFTNYX' },
      { ko: '넷마블블루', en: 'NETMARBLE BLUE' },
      { ko: '넥슨', en: 'NEXON' },
      { ko: '넵튠 레전드', en: 'NEPTUNE LEGEND' },
      { ko: '스카이피플', en: 'SKYPEOPLE' },
      { ko: '원더피플', en: 'WONDER PEOPLE' },
      { ko: '네오위즈', en: 'NEOWIZ' },
      { ko: '달콤소프트', en: 'DALCOMSOFT' },
    ] as Bi[],
  },
}

/**
 * /work/ai-os — the flagship AI-OS case (LOCKED §5.4), 5-act structure. 100% the
 * owner's own IP (no employer assets). Copy sourced from the v20 content pack §2.1
 * + journey ai-system (🟢). The title is a checkable result, not a vanity claim.
 */
export const workAiOs = {
  eyebrow: { ko: 'FLAGSHIP CASE · AI OPERATING SYSTEM', en: 'FLAGSHIP CASE · AI OPERATING SYSTEM' } as Bi,
  title: {
    ko: '팀 루틴의 60%를 지운\n개인 AI 운영체제',
    en: "The personal AI OS that\nerased 60% of a team's routine",
  } as Bi,
  lede: {
    ko: '19년간 사람 조직을 돌리던 운영 문법 — 위임 · 결재선 · 인수인계 · 24/7 대응 — 을 AI 위에 1:1로 옮긴 결과물입니다. 회사 자산과 무관한 100% 본인 IP.',
    en: 'The operating grammar that ran human orgs for 19 years — delegation, approval lines, handover, 24/7 duty — transplanted one-for-one onto AI. 100% own IP, independent of any employer.',
  } as Bi,
  acts: [
    {
      key: 'WALL',
      label: { ko: '벽', en: 'THE WALL' } as Bi,
      title: { ko: 'AI 자동화의 진짜 문제는 만드는 게 아니다', en: "The hard part of AI automation isn't building it" } as Bi,
      body: {
        ko: '만든 자가 자기 결과를 검증하면 편향이 남고, 자동화는 감시가 없으면 폭주하며, 지식은 대화창과 함께 휘발됩니다. 19년 라이브 운영자의 눈엔 이 셋 다 낯익은 함정이었습니다.',
        en: 'When the maker verifies their own output, bias survives; unwatched automation runs away; knowledge evaporates with the chat window. To a 19-year live-ops veteran, all three were familiar traps.',
      } as Bi,
    },
    {
      key: 'BET',
      label: { ko: '베팅', en: 'THE BET' } as Bi,
      title: { ko: '사람을 돌리던 문법을 그대로 AI에 이식한다', en: 'Transplant the grammar that ran people — onto AI' } as Bi,
      body: {
        ko: '위임 → 서브에이전트, 결재선 → 승인 게이트, 인수인계 SSOT → 세컨드브레인, 24/7 GM → 상주 에이전트 + 킬스위치. 새 기술이 아니라 19년간 검증된 운영 원칙을 옮기는 베팅이었습니다.',
        en: 'Delegation → sub-agents; approval lines → gates; the handover SSOT → a second brain; the 24/7 GM → resident agents with a kill switch. Not a bet on new tech, but on operating principles proven over 19 years.',
      } as Bi,
    },
    {
      key: 'BUILD',
      label: { ko: '구축', en: 'THE BUILD' } as Bi,
      title: { ko: '3계층 에이전트 + 품질 게이트 + 안전장치', en: 'Three tiers + a quality gate + a fail-safe' } as Bi,
      body: {
        ko: '오케스트레이터가 의도를 작업으로 쪼개 실행자(23 에이전트 · 70 스킬)에 위임하고, 다른 모델 계열의 검증자가 6축 루브릭으로 블라인드 채점합니다. 폭주는 LLM을 거치지 않는 결정론적 킬스위치로 막습니다.',
        en: 'The orchestrator splits intent into tasks and delegates to executors (23 agents · 70 skills); a verifier from a different model family blind-grades on a 6-axis rubric. Runaway is stopped by a deterministic kill switch that bypasses the LLM entirely.',
      } as Bi,
    },
    {
      key: 'RESULT',
      label: { ko: '결과', en: 'THE RESULT' } as Bi,
      title: { ko: '실무에서 60% 단축, 그리고 재귀적 증거', en: '60% cut in the field — and recursive proof' } as Bi,
      body: {
        ko: '달콤소프트 라이브 기획팀(10인)의 루틴 업무가 60% 줄었습니다(실무 검증). 그리고 이 커리어 문서들 자체가 블라인드 채점·자동 재시도 루프를 통과한 산출물입니다 — 케이스 10건 평균 90.1점, 8건 S등급. 시스템이 돈다는 가장 재귀적인 증거.',
        en: "Routine work on Dalcomsoft's 10-person live-planning team dropped 60% (field-proven). And these very career documents are output that passed the blind-grading + auto-retry loop — 10 cases, avg 90.1, 8 graded S. The most recursive possible proof it works.",
      } as Bi,
    },
    {
      key: 'LESSON',
      label: { ko: '배움', en: 'THE LESSON' } as Bi,
      title: { ko: '어려운 건 만드는 게 아니라 안 풀리게 만드는 것', en: "The hard part is making it fail closed" } as Bi,
      body: {
        ko: '"만든 자 ≠ 검증자"는 구호가 아니라 로그로 남았고(실행 AI의 딴짓을 다른 계열 검증관이 근거를 달아 반려), 킬스위치 실사격 드릴은 문서 리뷰가 못 잡는 오발 경로를 당일 봉쇄했습니다. 자동화의 진짜 난이도는 fail-closed에 있습니다.',
        en: '"Maker ≠ verifier" became a log entry, not a slogan (a cross-family verifier rejected the executor\'s slack-off with evidence); a live-fire kill-switch drill sealed a misfire path that no document review would catch. The real difficulty of automation is failing closed.',
      } as Bi,
    },
  ] as { key: string; label: Bi; title: Bi; body: Bi }[],
  diagramCaption: {
    ko: '실제로 돌아가는 시스템 — 클릭해 각 계층을 살펴보세요.',
    en: 'The system, actually running — click a tier to inspect it.',
  } as Bi,
  field: {
    badge: { ko: 'FIELD-PROVEN · 달콤소프트', en: 'FIELD-PROVEN · Dalcomsoft' } as Bi,
    lede: {
      ko: '개인 실험이 아닙니다. 실제 10인 팀 운영에서 검증됐고, 아티팩트 자체가 자격증입니다.',
      en: 'Not a personal experiment. Proven running a real 10-person team — the artifact is the credential.',
    } as Bi,
    items: [
      { ko: '부서 간 메일 협업 → Notion 히스토리 체계로 이관', en: 'Email-only collaboration → moved into a Notion history system' },
      { ko: '스토어 product ID 명세서 자동 반영 (Google Apps Script)', en: 'Store product-IDs auto-filled into specs (Google Apps Script)' },
      { ko: '메일 · Slack · Notion 흐름을 한 화면에 모은 업무현황판(HTML) 직접 구축', en: 'A live HTML dashboard pulling mail, Slack and Notion into one view' },
      { ko: '30+ AI 자동화 스킬로 팀 루틴 업무 60% 단축', en: '30+ AI automation skills cut routine team work by 60%' },
    ] as Bi[],
  },
  /**
   * P3 증거 블록 — 카운터와 리플레이 데모의 **라벨**만 여기 있다.
   * 수치·단계·날짜는 전부 `content/aiosEvidence.json`(집계 스크립트 산출물)에서 오며,
   * 이 파일에 손으로 적는 수치는 없다. 정직성 라벨은 SDD §4의 하드 요건.
   */
  evidence: {
    eyebrow: { ko: '실측 · 재생', en: 'MEASURED · REPLAY' } as Bi,
    title: { ko: '말 대신, 기록', en: 'Records, not claims' } as Bi,
    lede: {
      ko: '아래 숫자는 손으로 쓴 게 아니라 운영 로그를 집계 스크립트가 세어 만든 스냅샷입니다. 그 아래 데모는 실제로 있었던 실행을 그대로 재생합니다 — 지금 돌리는 게 아니라, 그날의 기록입니다.',
      en: 'These numbers are not typed by hand — an aggregation script counted them from the operations log. The demo below replays runs that actually happened; it is a record of that day, not a live invocation.',
    } as Bi,
    counters: {
      runs: { ko: '자동 실행 기록', en: 'Automated runs logged' },
      routines: { ko: '상시 루틴 종류', en: 'Standing routines' },
      notifications: { ko: '자동 알림 발송', en: 'Automated notifications' },
      scale: { ko: '에이전트 · 스킬 · 규칙', en: 'Agents · skills · rules' },
    } as Record<string, Bi>,
    windowNote: {
      ko: '집계 구간 {from} ~ {to} · 기록이 남은 날 {days}일 · 기준일 {asOf}',
      en: 'Window {from} – {to} · {days} days with records · as of {asOf}',
    } as Bi,
    sourceNote: {
      ko: '원천: 개인 AI-OS 운영 로그 + 구성 파일 실측. 집계 스크립트와 스냅샷은 이 사이트 저장소에 함께 커밋되어 있습니다. 회사 자산과 무관한 100% 본인 IP.',
      en: 'Source: personal AI-OS operations log + configuration counted on disk. The aggregation script and the snapshot are committed alongside this site. 100% own IP, unrelated to any employer.',
    } as Bi,
    replayTitle: { ko: '그날의 실행을 재생해 보세요', en: 'Replay a run that actually happened' } as Bi,
    replayLede: {
      ko: '시나리오를 고르면 단계와 실제 소요시간이 그대로 재생됩니다. 긴 대기는 압축했지만, 표시되는 시각은 실제 기록입니다.',
      en: 'Pick a scenario and the steps replay with their real timings. Long waits are compressed, but every time shown is from the record.',
    } as Bi,
    liveDisclaimer: {
      ko: '실제 운영 기록 재생 · {date} {time} 기록 — 라이브 호출이 아닙니다',
      en: 'Replay of a real run · recorded {date} {time} — not a live invocation',
    } as Bi,
    whyNotLive: {
      ko: '왜 라이브가 아닌가: 이 사이트는 정적 호스팅이라 실제 AI 호출을 붙이면 API 키가 공개되고 비용·악용을 막을 방법이 없습니다. 그래서 진짜 기록을 재생하는 쪽을 택했습니다.',
      en: 'Why not live: this site is statically hosted, so wiring a real AI call would expose the API key with no way to cap cost or abuse. Replaying the real record is the honest option.',
    } as Bi,
    play: { ko: '재생', en: 'Play' } as Bi,
    replay: { ko: '다시 재생', en: 'Replay' } as Bi,
    playing: { ko: '재생 중', en: 'Playing' } as Bi,
    elapsedLabel: { ko: '실제 소요', en: 'Real elapsed' } as Bi,
    stepsLabel: { ko: '단계', en: 'steps' } as Bi,
  },

  shotsTitle: { ko: '실제 시스템 화면 — 준비 중', en: 'Live system captures — coming soon' } as Bi,
  // 스크린샷 슬롯: src를 비워두면 라벨된 플레이스홀더로 렌더된다. 나중에
  // public/work/ai-os/... 에 이미지를 두고 src만 채우면 실제 이미지로 교체.
  shots: [
    { src: '', caption: { ko: '업무현황판 — 메일·Slack·Notion 통합 (HTML)', en: 'Team dashboard — mail · Slack · Notion in one view' } },
    { src: '', caption: { ko: 'Notion 히스토리 체계', en: 'Notion history system' } },
    { src: '', caption: { ko: '스토어 product ID 자동 반영 (Google Apps Script)', en: 'Store product-ID automation (GAS)' } },
    { src: '', caption: { ko: '3계층 에이전트 시스템 로그 · 검증 리포트', en: '3-tier agent logs · verification report' } },
  ] as { src?: string; caption: Bi }[],
  backCta: { ko: '19년 커리어 전체 보기', en: 'See the full 19-year career' } as Bi,
}

export const footer = {
  tagline: { ko: '기획자의 진화', en: 'The Evolution of a Planner' } as Bi,
  credit: {
    ko: 'Vibe-coded with AI',
    en: 'Vibe-coded with AI',
  } as Bi,
  music: {
    ko: 'Music — ‘Midnight Study’ · AI 작곡',
    en: 'Music — “Midnight Study” · AI-composed',
  } as Bi,
}
