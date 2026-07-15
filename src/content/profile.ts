import type { Achievement, AICard, CareerEntry, NavItem } from './types'
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

export const nav: NavItem[] = [
  { id: 'about', label: { ko: '소개', en: 'About' } },
  { id: 'career', label: { ko: '커리어', en: 'Career' } },
  { id: 'work', label: { ko: '대표 성과', en: 'Work' } },
  { id: 'ai', label: { ko: 'AI 챕터', en: 'AI' } },
  { id: 'skills', label: { ko: '스킬', en: 'Skills' } },
  { id: 'contact', label: { ko: '연락처', en: 'Contact' } },
]

export const hero = {
  eyebrow: {
    ko: 'BUSINESS PM & PLANNER × AI SYSTEMS ARCHITECT',
    en: 'BUSINESS PM & PLANNER × AI SYSTEMS ARCHITECT',
  } as Bi,
  title: {
    ko: '기획자의\n진화',
    en: 'The Evolution\nof a Planner',
  } as Bi,
  subtitle: {
    ko: '게임 기획·사업 19년. 이제 AI를 도구 삼아 시스템을 직접 짓습니다.',
    en: '19 years in game planning & business. Now I build AI systems — hands-on.',
  } as Bi,
  name: { ko: '임현택 · Henry Lim', en: 'Henry Lim · 임현택' } as Bi,
  quote: {
    ko: '모든 사람은 언제나 삶을 기획하며 살아갑니다.\n사업이든 개발이든, 그 기획으로 먹고 삽니다.',
    en: 'Everyone is always planning their own life.\nBusiness or code — planning is how I make mine.',
  } as Bi,
  scrollCue: { ko: 'SCROLL', en: 'SCROLL' } as Bi,
}

export const about = {
  label: { ko: '01 · ABOUT', en: '01 · ABOUT' } as Bi,
  title: {
    ko: 'IT와 창의력을 선호하는 사업PM & 기획자',
    en: 'A business PM & planner who runs on IT and creativity',
  } as Bi,
  body: {
    ko: '웹젠에서 시작해 NHN, 넥슨, 네오위즈, 달콤소프트까지 — 운영에서 FUN QA로, 사업에서 기획으로. 직군의 경계를 넘나들며 19년 동안 게임을 만들고 키웠습니다. 최근에는 K-pop IP 라이브 게임 12종의 기획팀을 이끌며 팀 루틴 업무의 60%를 AI로 자동화했고, 지금은 그 기획력으로 AI 에이전트 시스템을 설계하며 자연어 지시만으로 실제 동작하는 서비스를 만듭니다.',
    en: 'From Webzen to NHN, NEXON, NEOWIZ and Dalcomsoft — from live ops to FUN QA, from business to planning. For 19 years I crossed role boundaries to build and grow games. Most recently I led the live planning team for twelve K-pop IP titles, automating 60% of the team’s routine work with AI. Today that same planning craft goes into designing AI agent systems and shipping real working services from natural-language instructions alone.',
  } as Bi,
  arc: [
    { ko: '운영', en: 'Live Ops' },
    { ko: 'FUN QA', en: 'FUN QA' },
    { ko: '사업', en: 'Business' },
    { ko: '기획', en: 'Planning' },
  ] as Bi[],
  arcNext: { ko: '+ AI', en: '+ AI' } as Bi,
  // §22.2 v14: hint + a11y label for the /story#about character card, which now
  // acts as the intro-film play button (openIntro()).
  playIntro: {
    ko: '▶ 클릭하면 소개 영상이 재생됩니다',
    en: '▶ Click to play the intro film',
  } as Bi,
  stats: [
    { value: 19, suffix: '', label: { ko: '연차', en: 'Years' } },
    { value: 10, suffix: '', label: { ko: '회사', en: 'Companies' } },
    { value: 18, suffix: '+', label: { ko: '라이브 타이틀', en: 'Live titles' } },
  ],
  attitude: {
    ko: '“항상 즐거운 제안은 환영합니다.”',
    en: '“Fun proposals are always welcome.”',
  } as Bi,
}

export const career = {
  label: { ko: '02 · CAREER', en: '02 · CAREER' } as Bi,
  title: {
    ko: '19년, 직군을 넘나든 여정',
    en: '19 years across every role',
  } as Bi,
  subtitle: {
    ko: '운영에서 시작해 QA, 사업, 기획까지 — 게임이 만들어지고 팔리는 모든 단계를 직접 통과했습니다. 최신 경력부터 봅니다.',
    en: 'From live ops through QA, business and planning — I worked every stage of how a game is made and sold. Newest first.',
  } as Bi,
  /** 표시 순서 = 배열 순서 (최신 경력이 위) */
  entries: [
    {
      company: { ko: '달콤소프트', en: 'Dalcomsoft' },
      role: { ko: '라이브기획팀장 (라이브 디렉터)', en: 'Live Planning Team Lead (Live Director)' },
      period: '2024.10 — 2026.07',
      phase: 'plan',
      titles: {
        ko: 'SuperStar 시리즈 라이브 12종 (SM · JYP 등 K-pop IP)',
        en: 'SuperStar series — 12 live titles (SM, JYP and more K-pop IPs)',
      },
      highlight: {
        ko: '엔터 IP 리듬게임 12종 라이브 총괄(퇴사 시점 7종 서비스 중) · 10인 팀 리드 · 미니게임 · 웹뷰 이벤트 시스템 기획(프로토타입→구현 조율) · 지표 기반 신규 상품 설계 · Notion 협업체계 · 스토어 product ID 자동화 · 30+ AI 스킬로 루틴 업무 60% 단축',
        en: 'Ran 12 live K-pop IP rhythm games (7 in service at departure) · led a 10-person team · designed minigame & webview event systems (prototype → implementation) · metric-driven new products · Notion collaboration system · store product-ID automation · 30+ AI skills cut routine work by 60%',
      },
    },
    {
      company: { ko: '원더피플 / 에이스톰', en: 'Wonder People / A-Storm' },
      role: { ko: '사업 PM (파트장)', en: 'Business PM (Part Lead)' },
      period: '2022 — 2024',
      phase: 'biz',
      titles: { ko: '슈퍼피플 · 나이트워커', en: 'Super People · Night Walker' },
    },
    {
      company: { ko: '네오위즈', en: 'NEOWIZ' },
      role: { ko: '스노우볼 스튜디오 기획팀장', en: 'Planning Team Lead, Snowball Studio' },
      period: '2021',
      phase: 'plan',
      titles: { ko: '마스터 오브 나이츠', en: 'Master of Knights' },
      highlight: {
        ko: '신규 시스템 기획 10건 · 기존 시스템 개편 10건 · 밸런스 기획 10건 — 총 30건을 직접 작성 (공지 · 랭킹 · 길드 · 시즌패스 · 가챠 연출 외) — 사업에서 기획으로의 전환을 완성한 시기',
        en: 'Authored 30 specs hands-on — 10 new systems, 10 reworks and 10 balancing (notices, ranking, guilds, season pass, gacha staging and more) — completing the pivot from business to planning',
      },
    },
    {
      company: { ko: '스카이피플', en: 'SkyPeople' },
      role: { ko: '사업본부 총괄', en: 'Head of Business Division' },
      period: '2020 — 2021',
      phase: 'biz',
      titles: { ko: 'Five Stars', en: 'Five Stars' },
    },
    {
      company: { ko: '넵튠 레전드', en: 'Neptune Legend' },
      role: { ko: '사업PM', en: 'Business PM' },
      period: '2019 — 2020',
      phase: 'biz',
      titles: { ko: 'Shadow Seven', en: 'Shadow Seven' },
    },
    {
      company: { ko: '넥슨코리아', en: 'NEXON Korea' },
      role: { ko: '모바일사업실 팀장/부팀장', en: 'Team Lead, Mobile Business Div.' },
      period: '2015 — 2019',
      phase: 'biz',
      titles: {
        ko: '린: 더 라이트브링어 · 카오스크로니클 · 런닝맨 히어로즈 · 드래곤네스트2 · 영웅의 군단 글로벌',
        en: 'Lyn: The Lightbringer · Chaos Chronicle · RunningMan Heroes · Dragon Nest 2 · Legion of Heroes (Global)',
      },
    },
    {
      company: { ko: '넷마블 블루', en: 'Netmarble Blue' },
      role: { ko: 'KON 사업PM', en: 'Business PM — KON' },
      period: '2015',
      phase: 'biz',
      titles: { ko: 'KON', en: 'KON' },
    },
    {
      company: { ko: '소프트닉스', en: 'Softnyx' },
      role: { ko: '전략사업팀 사업PM', en: 'Business PM, Strategic Business Team' },
      period: '2011 — 2015',
      phase: 'biz',
      titles: { ko: 'NTD 프로젝트 · 라키온2 영웅의 귀환 · 그랑에이지', en: 'NTD · Rakion 2 · GranAge' },
    },
    {
      company: { ko: 'NHN Service (G-plus)', en: 'NHN Service (G-plus)' },
      role: { ko: '운영 / FUN QA 파트장', en: 'Ops / FUN QA Part Lead' },
      period: '2008 — 2011',
      phase: 'qa',
      titles: { ko: 'Tera · 아틀란티카 · R2 · 울프팀 외', en: 'Tera · Atlantica · R2 · Wolfteam and more' },
    },
    {
      company: { ko: '웹젠', en: 'Webzen' },
      role: { ko: 'SUN 온라인 운영', en: 'Live Ops — SUN Online' },
      period: '2006 — 2007',
      phase: 'ops',
      titles: { ko: 'SUN 온라인', en: 'SUN Online' },
    },
  ] as CareerEntry[],
  arcNote: {
    ko: '2006년 운영에서 시작해 — 사업과 기획을 지나, 지금은 AI와 함께. 19년의 여정.',
    en: 'Started in live ops in 2006 — through business and planning, now with AI. A 19-year journey.',
  } as Bi,
  deepDive: {
    ko: '각 단계에서 무엇을 맡았고, 어떤 문제를 풀었는지 — 단계별 딥다이브가 있습니다.',
    en: 'What I owned and what I solved at every stage — there’s a deep-dive for each.',
  } as Bi,
  deepDiveCta: { ko: '커리어 지도 열기', en: 'Open the career map' } as Bi,
  moreLabel: { ko: '자세히', en: 'More' } as Bi,
}

/** 최초 방문 인트로 영상 오버레이 */
export const intro = {
  videoSrc: 'intro.mp4', // public/ 기준 (BASE_URL 하위)
  skip: { ko: '건너뛰기', en: 'Skip' } as Bi,
  soundOn: { ko: '소리 켜기', en: 'Sound on' } as Bi,
  soundOff: { ko: '소리 끄기', en: 'Sound off' } as Bi,
  ariaLabel: { ko: '소개 영상', en: 'Intro video' } as Bi,
}

/** Whisper 방명록 (서버 미설정 시 오프라인 상태로 표시) */
export const whisper = {
  title: { ko: 'Whisper', en: 'Whisper' } as Bi,
  lede: {
    ko: '짧은 인사를 남겨주세요 — 최대 30자, 한 사람당 하나.',
    en: 'Leave a short hello — 30 characters max, one per visitor.',
  } as Bi,
  placeholder: { ko: '반갑습니다 :)', en: 'Nice to meet you :)' } as Bi,
  submit: { ko: '남기기', en: 'Leave it' } as Bi,
  thanks: { ko: '남겨졌습니다 ✓', en: 'Left ✓' } as Bi,
  already: { ko: '이미 하나 남기셨어요', en: 'You already left one' } as Bi,
  offline: {
    ko: 'Whisper 서버가 잠시 오프라인입니다 — 곧 열립니다.',
    en: 'The whisper server is offline for now — opening soon.',
  } as Bi,
  countryLabel: { ko: '국가', en: 'Country' } as Bi,
}

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

export const ai = {
  label: { ko: '04 · NEW CHAPTER (2024 — )', en: '04 · NEW CHAPTER (2024 — )' } as Bi,
  titleA: { ko: '새로운 챕터 — ', en: 'A new chapter — ' } as Bi,
  titleB: {
    ko: 'AI 자동화 시스템 아키텍트',
    en: 'AI Automation Systems Architect',
  } as Bi,
  lede: {
    ko: '19년간 갈고닦은 기획력을, 이제 AI를 도구 삼아 직접 시스템으로 구현합니다.',
    en: 'Nineteen years of planning craft — now implemented directly as systems, with AI as the toolkit.',
  } as Bi,
  badge: { ko: '24/7 CLOUD', en: '24/7 CLOUD' } as Bi,
  diagram: {
    orchestrator: { ko: '오케스트레이터', en: 'Orchestrator' } as Bi,
    executors: { ko: '실행자', en: 'Executors' } as Bi,
    verifier: { ko: '검증자', en: 'Verifier' } as Bi,
    caption: {
      ko: '3계층 에이전트가 클라우드에서 24시간 협업하는 개인 AI 자동화 시스템',
      en: 'A personal AI automation system — three agent tiers collaborating in the cloud, around the clock',
    } as Bi,
  },
  field: {
    badge: { ko: 'FIELD-PROVEN', en: 'FIELD-PROVEN' } as Bi,
    title: {
      ko: '현장 검증 — 달콤소프트 라이브기획팀',
      en: 'Proven in the field — Dalcomsoft Live Planning',
    } as Bi,
    body: {
      ko: 'K-pop IP 리듬게임 12종의 라이브 기획팀(10인)을 이끌며 팀의 일하는 방식 자체를 시스템으로 바꿨습니다. 부서 간 메일 협업을 Notion 히스토리 체계로 전환하고, 스토어 product ID가 명세서에 자동 반영되는 스크립트 자동화를 만들고, 메일 · Slack · Notion의 흐름을 한 화면에 모으는 업무현황판을 직접 구축했습니다. 여기에 30개 이상의 AI 자동화 스킬이 더해져 팀 루틴 업무가 60% 줄었습니다. 개인 실험이 아니라, 실제 팀 운영에서 검증된 방식입니다.',
      en: 'Leading a 10-person live planning team across twelve K-pop IP rhythm games, I rebuilt how the team itself worked: email-only collaboration moved into a Notion history system, store product IDs flowed into specs automatically via scripting, and a live team dashboard pulled mail, Slack and Notion into one view. On top of that, 30+ AI automation skills cut routine workload by 60%. Not a personal experiment — proven in real team operations.',
    } as Bi,
  },
  cards: [
    {
      icon: 'orchestration',
      title: { ko: '멀티에이전트 오케스트레이션', en: 'Multi-agent orchestration' },
      body: {
        ko: '오케스트레이터 · 실행자 · 검증자 3계층 에이전트가 24/7 클라우드에서 협업하는 개인 AI 자동화 시스템을 설계하고 운영합니다.',
        en: 'Designing and operating a personal AI automation system where orchestrator, executor and verifier agents collaborate 24/7 in the cloud.',
      },
    },
    {
      icon: 'finance',
      title: { ko: 'AI 재무 · 업무 자동화', en: 'AI finance & work automation' },
      body: {
        ko: '포트폴리오와 가계 데이터를 자동으로 수집 · 집계 · 시각화하는 파이프라인을 구축해 운영합니다.',
        en: 'Pipelines that automatically collect, aggregate and visualize portfolio and household data.',
      },
    },
    {
      icon: 'content',
      title: { ko: 'AI 콘텐츠 자동화', en: 'AI content automation' },
      body: {
        ko: '블로그 발행까지 이어지는 콘텐츠 파이프라인을 자동화했습니다.',
        en: 'An automated content pipeline that runs all the way to blog publishing.',
      },
    },
    {
      icon: 'vibecoding',
      title: { ko: '바이브코딩', en: 'Vibe-coding' },
      body: {
        ko: '자연어 지시만으로 실제 동작하는 서비스를 설계하고 구현합니다.',
        en: 'Designing and shipping real working services from natural-language instructions alone.',
      },
      note: {
        ko: '이 사이트도 그렇게 만들어졌습니다.',
        en: 'This very site was built that way, too.',
      },
    },
  ] as AICard[],
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
 * checkable numbers only; the 20/65/31 system scale lives inside the diagram.
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
      ko: '운영·품질·사업·기획 — 앞 단계의 역량은 버려진 적 없이 다음 단계의 기반이 됐습니다. 도메인 깊이가 새로운 해자이고, 저는 19년치를 보유했습니다.',
      en: 'Live ops, quality, business, planning — no layer was ever discarded; each became the base of the next. Domain depth is the new moat, and I hold nineteen years of it.',
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
    sub: { ko: '기획과 사업이 시장에서 증명된 순간들 — 전부 공개된 순위·평점 기반입니다.', en: 'Where planning and business were proven — all on public rankings and ratings.' } as Bi,
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
        ko: '오케스트레이터가 의도를 작업으로 쪼개 실행자(20 에이전트 · 65 스킬)에 위임하고, 다른 모델 계열의 검증자가 6축 루브릭으로 블라인드 채점합니다. 폭주는 LLM을 거치지 않는 결정론적 킬스위치로 막습니다.',
        en: 'The orchestrator splits intent into tasks and delegates to executors (20 agents · 65 skills); a verifier from a different model family blind-grades on a 6-axis rubric. Runaway is stopped by a deterministic kill switch that bypasses the LLM entirely.',
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
