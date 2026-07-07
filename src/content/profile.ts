import type { Achievement, AICard, CareerEntry, NavItem } from './types'
import type { Bi } from '../lib/i18n'

/**
 * ─────────────────────────────────────────────────────────────
 *  콘텐츠 원천 파일 — 사이트의 모든 문구는 여기서만 수정하세요.
 *  { ko: '한국어', en: 'English' } 짝을 함께 고치면 됩니다.
 * ─────────────────────────────────────────────────────────────
 */

export const meta = {
  title: 'Henry Lim — 기획자의 진화 · The Evolution of a Planner',
  description:
    '게임 사업기획 17년에서 AI 자동화 시스템 아키텍트로. 임현택(Henry Lim)의 3D 인터랙티브 포트폴리오.',
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
    ko: '게임 사업기획 17년. 이제 AI를 도구 삼아 시스템을 직접 짓습니다.',
    en: '17 years in game business planning. Now I build AI systems — hands-on.',
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
    ko: '웹젠에서 시작해 NHN, 넥슨, 네오위즈까지 — 운영에서 FUN QA로, 사업에서 기획으로. 직군의 경계를 넘나들며 17년 동안 게임을 만들고 키웠습니다. 지금은 그 기획력으로 AI 에이전트 시스템을 설계하고, 자연어 지시만으로 실제 동작하는 서비스를 만듭니다.',
    en: 'From Webzen to NHN, NEXON and NEOWIZ — from live ops to FUN QA, from business to planning. For 17 years I crossed role boundaries to build and grow games. Today that same planning craft goes into designing AI agent systems, shipping real working services from natural-language instructions alone.',
  } as Bi,
  arc: [
    { ko: '운영', en: 'Live Ops' },
    { ko: 'FUN QA', en: 'FUN QA' },
    { ko: '사업', en: 'Business' },
    { ko: '기획', en: 'Planning' },
  ] as Bi[],
  arcNext: { ko: '+ AI', en: '+ AI' } as Bi,
  stats: [
    { value: 17, suffix: '+', label: { ko: '연차', en: 'Years' } },
    { value: 9, suffix: '', label: { ko: '회사', en: 'Companies' } },
    { value: 12, suffix: '+', label: { ko: '라이브 타이틀', en: 'Live titles' } },
  ],
  attitude: {
    ko: '“항상 즐거운 제안은 환영합니다.”',
    en: '“Fun proposals are always welcome.”',
  } as Bi,
}

export const career = {
  label: { ko: '02 · CAREER', en: '02 · CAREER' } as Bi,
  title: {
    ko: '17년, 직군을 넘나든 여정',
    en: '17 years across every role',
  } as Bi,
  subtitle: {
    ko: '운영에서 시작해 QA, 사업, 기획까지 — 게임이 만들어지고 팔리는 모든 단계를 직접 통과했습니다.',
    en: 'From live ops through QA, business and planning — I worked every stage of how a game is made and sold.',
  } as Bi,
  entries: [
    {
      company: { ko: '웹젠', en: 'Webzen' },
      role: { ko: 'SUN 온라인 운영', en: 'Live Ops — SUN Online' },
      period: '2006 — 2007',
      phase: 'ops',
      titles: { ko: 'SUN 온라인', en: 'SUN Online' },
    },
    {
      company: { ko: 'NHN 한게임', en: 'NHN Hangame' },
      role: { ko: '운영 / FUN QA 파트장', en: 'Ops / FUN QA Part Lead' },
      period: '2008 — 2011',
      phase: 'qa',
      titles: { ko: 'Tera 외', en: 'Tera and more' },
    },
    {
      company: { ko: '소프트닉스', en: 'Softnyx' },
      role: { ko: '전략사업팀 사업PM', en: 'Business PM, Strategic Business Team' },
      period: '2011 — 2015',
      phase: 'biz',
    },
    {
      company: { ko: '넷마블 블루', en: 'Netmarble Blue' },
      role: { ko: 'KON 사업PM', en: 'Business PM — KON' },
      period: '2015',
      phase: 'biz',
      titles: { ko: 'KON', en: 'KON' },
    },
    {
      company: { ko: '넥슨코리아', en: 'NEXON Korea' },
      role: { ko: '모바일사업실 팀장/부팀장', en: 'Team Lead, Mobile Business Div.' },
      period: '2015 — 2019',
      phase: 'biz',
      titles: {
        ko: '린: 더 라이트브링어 · 카오스크로니클 · 런닝맨 히어로즈 · 드래곤네스트2',
        en: 'Lyn: The Lightbringer · Chaos Chronicle · RunningMan Heroes · Dragon Nest 2',
      },
    },
    {
      company: { ko: '넵튠', en: 'Neptune' },
      role: { ko: '사업PM', en: 'Business PM' },
      period: '2019 — 2020',
      phase: 'biz',
      titles: { ko: 'Shadow of Death', en: 'Shadow of Death' },
    },
    {
      company: { ko: '스카이피플', en: 'SkyPeople' },
      role: { ko: '사업팀장', en: 'Business Team Lead' },
      period: '2020 — 2021',
      phase: 'biz',
      titles: { ko: 'Five Stars', en: 'Five Stars' },
    },
    {
      company: { ko: '네오위즈', en: 'NEOWIZ' },
      role: { ko: '기획팀장', en: 'Planning Team Lead' },
      period: '2021',
      phase: 'plan',
      titles: { ko: '마스터 오브 나이츠', en: 'Master of Knights' },
    },
    {
      company: { ko: '원더피플 / 에이스톰', en: 'Wonder People / A-Storm' },
      role: { ko: '사업파트장', en: 'Business Part Lead' },
      period: '2022 — 2024',
      phase: 'biz',
      titles: { ko: '슈퍼피플 · 나이트워커', en: 'Super People · Night Walker' },
    },
  ] as CareerEntry[],
  arcNote: {
    ko: '운영 → FUN QA → 사업 → 기획, 그리고 다음 챕터로.',
    en: 'Ops → FUN QA → Business → Planning — and on to the next chapter.',
  } as Bi,
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
    },
    {
      title: { ko: 'Shadow of Death', en: 'Shadow of Death' },
      tag: 'NEPTUNE',
      stat: {
        ko: { value: 4.4, decimals: 1, prefix: '3.29 → ' },
        en: { value: 4.4, decimals: 1, prefix: '3.29 → ' },
      },
      label: { ko: '구글 플레이 평점 개선', en: 'Google Play rating turnaround' },
      sub: {
        ko: '라이브 운영 개선으로 평점 반등',
        en: 'Rating rebuilt through live-ops improvements',
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
    ko: '17년간 갈고닦은 기획력을, 이제 AI를 도구 삼아 직접 시스템으로 구현합니다.',
    en: 'Seventeen years of planning craft — now implemented directly as systems, with AI as the toolkit.',
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
    { name: { ko: '데이터 지표 분석 · 시각화', en: 'Data analytics · visualization' } },
    { name: { ko: '글로벌 퍼블리싱', en: 'Global publishing' } },
    { name: { ko: '라이브 서비스 운영', en: 'Live service operations' } },
    { name: { ko: 'UI/UX 기획', en: 'UI/UX planning' } },
    { name: { ko: '프로젝트 · 조직 관리', en: 'Project & org management' } },
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
  note: {
    ko: '메일과 커피챗 제안에는 빠르게 답합니다.',
    en: 'I reply quickly to email and coffee-chat requests.',
  } as Bi,
}

export const footer = {
  tagline: { ko: '기획자의 진화', en: 'The Evolution of a Planner' } as Bi,
  credit: {
    ko: 'Vibe-coded with AI · React Three Fiber',
    en: 'Vibe-coded with AI · React Three Fiber',
  } as Bi,
}
