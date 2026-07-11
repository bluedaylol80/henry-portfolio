import type { Bi } from '../lib/i18n'

/**
 * ─────────────────────────────────────────────────────────────
 *  커리어 딥다이브(/career, /career/*) 콘텐츠 원천 파일.
 *  모든 문구는 { ko, en } 짝. 여기만 고치면 됩니다.
 *  ※ 공개 기준: 내부 인명·비용·계약·미공개 수치 금지 (패턴 레벨 서술만)
 * ─────────────────────────────────────────────────────────────
 */

export type PhaseColor = 'amber' | 'coral' | 'violet' | 'cyan' | 'sky'

export interface PhaseStory {
  title: Bi
  body: Bi
}

export interface PhaseOutput {
  stat: Bi
  label: Bi
  sub?: Bi
}

/**
 * 작업 화면 갤러리 항목. 이미지는 public/work/<slug>/ 아래에 두고
 * src는 'work/<slug>/파일명' 형태로 적습니다. 항목이 없으면 섹션 자체가 숨겨집니다.
 * 예: { src: 'work/planning/dashboard.png', caption: { ko: '팀 업무현황판', en: 'Team dashboard' } }
 */
export interface GalleryItem {
  src: string
  caption: Bi
}

export interface JourneyPhase {
  slug: string
  num: string
  color: PhaseColor
  name: Bi // 짧은 이름 (허브 카드/네비)
  tagline: Bi // 허브 카드용 한 줄
  period: string
  companies: Bi
  roleLine: Bi
  title: Bi // 페이지 헤드라인
  oneLiner: Bi
  intro: Bi
  did: Bi[]
  problems: Bi[]
  outputs: PhaseOutput[]
  stories: PhaseStory[]
  gallery?: GalleryItem[]
  carried: Bi
}

/** 페이지 템플릿의 고정 섹션 라벨 */
export const sectionLabels = {
  did: { ko: '맡았던 것', en: 'What I owned' } as Bi,
  problems: { ko: '반복해서 풀던 문제', en: 'Problems I kept solving' } as Bi,
  outputs: { ko: '숫자와 산출물', en: 'Numbers & artifacts' } as Bi,
  stories: { ko: '장면들', en: 'Moments' } as Bi,
  gallery: { ko: '작업 화면', en: 'Work in view' } as Bi,
  carried: { ko: '다음 층으로', en: 'To the next layer' } as Bi,
  prev: { ko: '이전 단계', en: 'Previous' } as Bi,
  next: { ko: '다음 단계', en: 'Next' } as Bi,
  backToMap: { ko: '커리어 지도로', en: 'Back to the map' } as Bi,
  backToHome: { ko: '메인으로', en: 'Home' } as Bi,
  close: { ko: '닫기', en: 'Close' } as Bi,
}

/** Nav에 추가되는 딥다이브 링크 라벨 */
export const navLabel: Bi = { ko: '여정', en: 'Journey' }

export const hub = {
  label: { ko: 'CAREER JOURNEY', en: 'CAREER JOURNEY' } as Bi,
  title: { ko: '19년, 다섯 개의 층', en: '19 Years, Five Layers' } as Bi,
  lede: {
    ko: '이직의 나열이 아니라 역할의 적층입니다. 운영에서 시작해 품질·사업·기획을 지나 AI 시스템까지 — 앞 단계의 역량은 버려진 적 없이, 언제나 다음 단계의 기반이 됐습니다.',
    en: 'Not a list of job changes — an accumulation of layers. From live ops through quality, business and planning to AI systems: no capability was ever discarded; each became the foundation of the next.',
  } as Bi,
  mission: {
    ko: '“각 프로젝트의 시작부터 라이브까지, 광범위한 영역의 효율성을 끌어내기 위해 유관부서와 협업하는 프로젝트 오너와 매니저의 업무를 선호합니다. 그 과정에서 발생하는 이슈를 다양한 스킬로 해결하며 발전해 왔습니다.”',
    en: '“From kickoff to live service, I prefer the work of a project owner and manager — collaborating across departments to draw efficiency out of the widest possible scope, and growing by solving the issues that come with it.”',
  } as Bi,
  missionSource: {
    ko: '— 19년을 관통해온 업무 철학. 다섯 번의 직무 전환을 지나며 다듬어진 한 문장.',
    en: '— A working philosophy running through 19 years, honed across five role transitions.',
  } as Bi,
  workstyleTitle: {
    ko: '커리어를 관통하는 일하는 방식',
    en: 'How I work — constants across 19 years',
  } as Bi,
  workstyle: [
    {
      title: { ko: '기록이 시스템이 될 때까지', en: 'Records, until they become systems' },
      body: {
        ko: '수기 노트에서 313 레코드 SSOT 데이터베이스, 그리고 자동 아카이브까지. 히스토리 관리는 습관이 아니라 인프라입니다.',
        en: 'From handwritten notes to a 313-record SSOT database to automated archives. History-keeping is infrastructure, not a habit.',
      },
    },
    {
      title: { ko: '1장으로 말하기', en: 'Say it in one page' },
      body: {
        ko: '표준 양식과 원페이지 장표. 50분 만에 6개 기능을 6명에게 분배할 수 있는 건 순발력이 아니라, 양식이 이미 준비되어 있기 때문입니다.',
        en: 'Standard templates and one-page briefs. Dispatching six features to six people in fifty minutes is not reflexes — the format was ready in advance.',
      },
    },
    {
      title: { ko: '위임은 설계다', en: 'Delegation is a design problem' },
      body: {
        ko: '사람에게든 AI에게든 — 3층 위임 구조, 표준 결재선, 서브에이전트. 위임이 시스템이면 내가 없어도 돌아갑니다.',
        en: 'To people or to AI — tiered delegation, standardized approval lines, sub-agents. When delegation is a system, things run without me.',
      },
    },
    {
      title: { ko: '내 산출물도 남이 검증한다', en: 'My output gets verified by someone else' },
      body: {
        ko: '리뷰 습관에서 블라인드 채점, 교차 모델 검증까지. 만든 자와 검증자는 분리합니다.',
        en: 'From review habits to blind grading and cross-model verification. The maker and the verifier are never the same.',
      },
    },
    {
      title: { ko: '한계를 정직하게 남기기', en: 'Leave the limits in writing' },
      body: {
        ko: '확인되지 않은 수치는 쓰지 않고, 검증 불가 영역은 그렇게 표시합니다. 신뢰는 정확한 숫자보다 정직한 각주에서 나옵니다.',
        en: 'Unverified numbers stay out; unverifiable areas are labeled as such. Trust comes from honest footnotes, not just impressive figures.',
      },
    },
  ] as { title: Bi; body: Bi }[],
}

export const phases: JourneyPhase[] = [
  // ── Phase 1 · 운영 ────────────────────────────────────────
  {
    slug: 'ops',
    num: '01',
    color: 'amber',
    name: { ko: '운영', en: 'Live Ops' },
    tagline: { ko: '모든 것의 1층', en: 'The ground floor' },
    period: '2006 — 2007',
    companies: { ko: '웹젠', en: 'Webzen' },
    roleLine: { ko: 'SUN 온라인 라이브 운영', en: 'Live operations — SUN Online' },
    title: { ko: '운영 — 게임이 살아있다는 것', en: 'Live Ops — what it means for a game to be alive' },
    oneLiner: {
      ko: '모든 것의 1층. 게임이 “살아있다”는 게 무엇인지 몸으로 배운 시기.',
      en: 'The ground floor — learning, hands-on, what keeps a game alive.',
    },
    intro: {
      ko: 'MORPG SUN 온라인의 라이브 운영으로 커리어를 시작했습니다. 유저 이슈의 최전선에서 하루하루의 서비스를 지켰고 — 반복되는 업무를 기록하고 정리하는 습관, 그러니까 이 커리어 전체를 관통하게 될 히스토리 관리가 여기서 시작됐습니다.',
      en: 'The career began with live operations on the MORPG SUN Online. On the front line of player issues, keeping the service running day by day — and this is where the habit of recording and organizing recurring work began: the history-keeping that would run through the entire career.',
    },
    did: [
      { ko: '라이브 서비스 일일 운영', en: 'Day-to-day live service operations' },
      { ko: '유저 이슈 최전선 대응', en: 'Front-line response to player issues' },
      { ko: '반복 업무의 기록과 정리 — 히스토리 관리의 출발', en: 'Recording and organizing recurring work — the start of history-keeping' },
      { ko: '개발 · QA · CS 유관부서와의 일상적 협업', en: 'Daily collaboration with dev, QA and CS' },
    ],
    problems: [
      {
        ko: '오늘 터진 이슈를 내일도 설명할 수 있게 만드는 것',
        en: 'Making today’s incident explainable tomorrow',
      },
      {
        ko: '반복되는 문의와 이슈에서 패턴을 찾아 처리 시간을 줄이는 것',
        en: 'Finding patterns in recurring issues to cut handling time',
      },
    ],
    outputs: [
      {
        stat: { ko: '1.5년', en: '1.5 yrs' },
        label: { ko: '라이브 운영', en: 'Live operations' },
        sub: { ko: 'SUN 온라인 (MORPG)', en: 'SUN Online (MORPG)' },
      },
      {
        stat: { ko: '1층', en: 'Layer 1' },
        label: { ko: '커리어 적층의 시작', en: 'First layer of the stack' },
        sub: {
          ko: '운영 감각은 이후 모든 단계의 기반이 됩니다',
          en: 'The ops instinct underpins every later layer',
        },
      },
    ],
    stories: [
      {
        title: { ko: '운영은 버려지지 않았다', en: 'Ops was never thrown away' },
        body: {
          ko: '19년 뒤, 라이브 기획팀장으로 24/7 GM과 장애 1차 대응을 맡을 수 있었던 뿌리가 이 시기입니다. 커리어는 점프가 아니라 적층이었습니다.',
          en: 'Nineteen years later, being the 24/7 GM and first responder for live incidents traced straight back to this period. The career was never a jump — it was an accumulation.',
        },
      },
    ],
    gallery: [], // 작업 스크린샷: public/work/<slug>/에 파일을 두고 { src, caption } 추가
    carried: {
      ko: '라이브 서비스의 일일 운영 감각 — 다음 층에서는 “운영되는 게임의 품질”을 재미의 관점에서 평가하는 잣대로 확장됩니다.',
      en: 'The daily instinct for a running service — which the next layer would expand into a way of judging a live game’s quality through the lens of fun.',
    },
  },

  // ── Phase 2 · FUN QA ─────────────────────────────────────
  {
    slug: 'fun-qa',
    num: '02',
    color: 'coral',
    name: { ko: 'FUN QA', en: 'FUN QA' },
    tagline: { ko: '재미를 검수하다', en: 'Testing for fun' },
    period: '2008 — 2011',
    companies: { ko: 'NHN Service (G-plus)', en: 'NHN Service (G-plus)' },
    roleLine: {
      ko: '한게임운영실 파트장 — 라이브 운영 & FUN QA',
      en: 'Part Lead, Hangame Ops — Live Ops & FUN QA',
    },
    title: { ko: 'FUN QA — 버그가 아니라 재미를 검수하다', en: 'FUN QA — testing for fun, not just for bugs' },
    oneLiner: {
      ko: '일반 QA가 “깨졌는가”를 본다면, FUN QA는 “재미있는가”를 평가합니다.',
      en: 'Regular QA asks “is it broken?” — FUN QA asks “is it fun?”',
    },
    intro: {
      ko: '주관적인 재미를 검수 가능한 기준으로 바꾸는 훈련. 3년 2개월 동안 한게임운영실 파트장으로 Tera · 아틀란티카 · R2 · 울프팀의 라이브 운영을 지키면서, FUN QA로는 Tera 개발빌드 · 드래곤볼 온라인 · 십이지천2 · 메트로컨플릭트의 게임성과 플레이 경험을 평가하고 그 기준을 조직의 언어로 만들었습니다.',
      en: 'The craft of turning subjective fun into testable criteria. For three years and two months as part lead in Hangame Ops — running live operations for Tera, Atlantica, R2 and Wolfteam, while as FUN QA evaluating gameplay and player experience on the Tera dev build, Dragon Ball Online, Twelve Sky 2 and Metro Conflict — and turning those judgments into a shared organizational language.',
    },
    did: [
      { ko: '라이브 운영 — Tera(웹 운영) · 아틀란티카 · R2 · 울프팀', en: 'Live operations — Tera (web ops) · Atlantica · R2 · Wolfteam' },
      { ko: 'FUN QA — Tera 개발빌드 · 드래곤볼 온라인 · 십이지천2 · 메트로컨플릭트 게임성 분석 · 개선 방향 설계', en: 'FUN QA — gameplay analysis & improvement direction on the Tera dev build, Dragon Ball Online, Twelve Sky 2 and Metro Conflict' },
      { ko: '게임 재미(fun) 관점의 품질 평가 기준 수립', en: 'Building quality criteria from the “fun” perspective' },
      { ko: '파트장으로서 운영 · 검수 파트 운영', en: 'Running the ops & review part as its lead' },
    ],
    problems: [
      {
        ko: '“재미있다”는 감각을 팀이 공유할 수 있는 평가 기준으로 정량화하는 것',
        en: 'Quantifying the feeling of “fun” into criteria a team can share',
      },
      {
        ko: '품질 피드백이 개발 조직에서 실제 개선으로 이어지게 만드는 것',
        en: 'Making quality feedback actually turn into fixes on the dev side',
      },
    ],
    outputs: [
      {
        stat: { ko: '3년 2개월', en: '3y 2m' },
        label: { ko: '한게임운영실 파트장', en: 'Part lead, Hangame Ops' },
        sub: { ko: '라이브 운영 & FUN QA', en: 'Live ops & FUN QA' },
      },
      {
        stat: { ko: '7종', en: '7' },
        label: { ko: '담당 타이틀 — 운영 4 · FUN QA 4', en: 'Titles — 4 in ops · 4 in FUN QA' },
        sub: {
          ko: '운영: Tera · 아틀란티카 · R2 · 울프팀 / FUN QA: Tera 개발빌드 · 드래곤볼 온라인 · 십이지천2 · 메트로컨플릭트',
          en: 'Ops: Tera · Atlantica · R2 · Wolfteam / FUN QA: Tera dev build · Dragon Ball Online · Twelve Sky 2 · Metro Conflict',
        },
      },
    ],
    stories: [
      {
        title: {
          ko: '한 회사 안에서 직무를 갈아탄 첫 경험',
          en: 'The first role switch — inside one company',
        },
        body: {
          ko: '직무 전환의 첫 경험은 NHN 안에서 일어났습니다 — 운영에서 FUN QA로. 사업으로의 전환은 소프트닉스 이직과 함께였지만, “전환은 점프가 아니라 인접 영역으로의 확장”이라는 커리어 문법은 여기서 만들어졌습니다.',
          en: 'The first role switch happened inside NHN — from live ops into FUN QA. The move to business came later, with Softnyx; but the career grammar of “transition as adjacent expansion, not a leap” was written here.',
        },
      },
    ],
    gallery: [], // 작업 스크린샷: public/work/<slug>/에 파일을 두고 { src, caption } 추가
    carried: {
      ko: '“재미를 지표로 바꾸는 습관”은 사업 PM의 리텐션 · AU 분석으로 이어졌고 — 훗날 AI 산출물을 6개 축으로 채점하는 품질 게이트의 사상이 됩니다.',
      en: 'The habit of turning fun into metrics carried into retention and AU analysis as a business PM — and much later, into the six-axis quality gate that grades AI output.',
    },
  },

  // ── Phase 3 · 사업 PM ─────────────────────────────────────
  {
    slug: 'business-pm',
    num: '03',
    color: 'violet',
    name: { ko: '사업 PM', en: 'Business PM' },
    tagline: { ko: '지표가 의사결정이 되는 곳', en: 'Where metrics become decisions' },
    period: '2011 — 2024',
    companies: {
      ko: '소프트닉스 · 넷마블 블루 · 넥슨 · 넵튠 레전드 · 스카이피플 · 원더피플',
      en: 'Softnyx · Netmarble Blue · NEXON · Neptune Legend · SkyPeople · Wonder People',
    },
    roleLine: { ko: '사업 PM · 팀장 — 사업 프로젝트 13건', en: 'Business PM & Team Lead — 13 projects' },
    title: {
      ko: '사업 PM — 감각을 시장의 의사결정으로',
      en: 'Business PM — turning instinct into market decisions',
    },
    oneLiner: {
      ko: '운영과 품질의 감각을 시장의 의사결정으로 연결한 13년.',
      en: 'Thirteen years connecting ops and quality instincts to market decisions.',
    },
    intro: {
      ko: '여섯 회사에서 열세 개의 사업 프로젝트를 맡았습니다. 지표 기반 의사결정, 런칭과 라이브의 사업 일정, 글로벌 퍼블리싱, BM과 업데이트 방향 — 개발 · 기획 · 마케팅 · 외부 파트너 사이의 조율이 일상이었습니다. 넥슨 모바일사업실에서의 4년 3개월이 커리어 최장 재직입니다.',
      en: 'Thirteen business projects across six companies. Metric-driven decisions, launch and live-ops business schedules, global publishing, BM and update direction — with daily coordination between dev, planning, marketing and external partners. Four years and three months at NEXON’s mobile business division remains the longest tenure of the career.',
    },
    did: [
      { ko: '지표 기반 사업 의사결정 (매출 · 리텐션 · AU)', en: 'Metric-driven business decisions (revenue · retention · AU)' },
      { ko: '런칭 · 라이브 사업 일정 관리', en: 'Launch and live-ops schedule ownership' },
      { ko: '글로벌 퍼블리싱 협업 — 북미 피처드, 중국 · 동남아 시장', en: 'Global publishing — NA featuring, China & SEA markets' },
      { ko: 'BM · 이벤트 · 업데이트 방향 조율', en: 'Steering BM, events and update direction' },
      { ko: '개발 · 기획 · 마케팅 · 외부 파트너 간 조정', en: 'Mediating between dev, planning, marketing and partners' },
    ],
    problems: [
      {
        ko: '숫자와 사람, 일정과 산출물을 동시에 보는 것',
        en: 'Watching numbers and people, schedules and deliverables — at the same time',
      },
      {
        ko: '회사가 흔들려도 성과를 만드는 것 — 조직 해체 · 폐업 · 희망퇴직을 세 번 통과하며, 커리어는 회사가 아니라 역량에 쌓인다는 것을 증명',
        en: 'Delivering even when companies shook — through a disbanded org, a shutdown and a voluntary-exit round, proving a career accrues to capability, not to a company name',
      },
    ],
    outputs: [
      {
        stat: { ko: '183억', en: '₩18.3B' },
        label: { ko: '린: 더 라이트브링어 누적 매출', en: 'Lyn: The Lightbringer lifetime revenue' },
        sub: { ko: '한국 양대 마켓 매출 3위 · 넥슨', en: '#3 grossing on both KR stores · NEXON' },
      },
      {
        stat: { ko: '13건', en: '13' },
        label: { ko: '사업 PM 프로젝트', en: 'Business PM projects' },
        sub: { ko: '6개 회사 · 13년', en: '6 companies · 13 years' },
      },
      {
        stat: { ko: '4년 3개월', en: '4y 3m' },
        label: { ko: '넥슨 모바일사업실 팀장', en: 'Team lead, NEXON mobile biz div.' },
        sub: { ko: '커리어 최장 재직', en: 'Longest tenure of the career' },
      },
      {
        stat: { ko: '98억', en: '₩9.8B' },
        label: { ko: '카오스크로니클 누적 매출', en: 'Chaos Chronicle lifetime revenue' },
        sub: { ko: '북미 iOS · Google Play 피처드', en: 'Featured in North America' },
      },
    ],
    stories: [
      {
        title: { ko: '회사는 사라져도 역량은 남는다', en: 'Companies vanish; capability stays' },
        body: {
          ko: '조직 해체, 폐업, 희망퇴직 — 세 번의 회사 리스크를 통과했습니다. 그때마다 다음 자리를 만든 건 회사 이름이 아니라, 이전 층에서 쌓인 이전 가능한 역량이었습니다.',
          en: 'A disbanded team, a company shutdown, a voluntary-exit round — three times the ground moved. What opened the next door each time was never a company name, but the transferable capability stacked in the layers below.',
        },
      },
    ],
    gallery: [], // 작업 스크린샷: public/work/<slug>/에 파일을 두고 { src, caption } 추가
    carried: {
      ko: '매출과 지표를 다루는 감각은 “BM을 설계하는 기획자”의 기반이 됐고, 다국가 · 다장르 운영 경험은 훗날 글로벌 4개 라인 동시 운영의 베이스가 됩니다.',
      en: 'Fluency with revenue and metrics became the base of a planner who designs BMs — and the multi-market, multi-genre experience later powered running four global lines at once.',
    },
  },

  // ── Phase 4 · 기획 ────────────────────────────────────────
  {
    slug: 'planning',
    num: '04',
    color: 'cyan',
    name: { ko: '기획', en: 'Planning' },
    tagline: { ko: '팀이 나 없이도 돌아가게', en: 'Teams that run without me' },
    period: '2021 · 2024.10 — 2026.05',
    companies: { ko: '네오위즈 · 달콤소프트', en: 'NEOWIZ · Dalcomsoft' },
    roleLine: {
      ko: '기획팀장 → 라이브기획팀장 (라이브 디렉터)',
      en: 'Planning Team Lead → Live Planning Team Lead (Live Director)',
    },
    title: {
      ko: '기획 — 기획서를 쓰는 팀장, 시스템을 남기는 설계자',
      en: 'Planning — a lead who writes the specs and leaves systems behind',
    },
    oneLiner: {
      ko: '기획서를 직접 쓰는 팀장이자, 팀이 나 없이도 돌아가게 만드는 설계자.',
      en: 'A team lead who writes the specs himself — and designs the team to run without him.',
    },
    intro: {
      ko: '네오위즈에서 신규 시스템 기획 10건 · 기존 시스템 개편 10건 · 밸런스 기획 10건, 총 30건의 기획서를 직접 쓰며 사업에서 기획으로의 전환을 완성했고, 달콤소프트에서는 K-pop IP 리듬게임 12종의 라이브 기획팀(10인)을 이끌었습니다. 서비스 플랜과 상품 기획은 분석에서 시작해 담당자가 바로 논의할 수 있는 제안으로 끝났고, 위임과 표준화, 히스토리 관리는 이 층에서 “시스템”이 됐습니다.',
      en: 'At NEOWIZ, authoring 30 specs hands-on — 10 new systems, 10 reworks and 10 balancing — completed the pivot from business to planning. At Dalcomsoft, leading a 10-person live planning team across twelve K-pop IP rhythm games: service plans and product ideas started as analysis and landed as proposals owners could act on immediately. This is the layer where delegation, standardization and history-keeping became systems.',
    },
    did: [
      { ko: '시스템 기획서 직접 작성 — 네오위즈 신규 10 · 개편 10 · 밸런스 10 (총 30건)', en: 'Wrote system specs hands-on — 10 new · 10 reworked · 10 balancing at NEOWIZ (30 in total)' },
      {
        ko: '라이브 서비스 플랜 수립 — 이벤트 · 상품 기획을 분석→제안까지, 프로젝트별 담당자가 바로 논의할 수 있는 수준으로 (K-pop IP 12종)',
        en: 'Built live service plans — event & product planning from analysis to proposal, ready for per-project owners to act on (12 K-pop IP titles)',
      },
      {
        ko: '시스템 기획의 최초 기획 · 프로토타입 제작 → 개발팀과 구현 조율 — 미니게임 · 웹뷰 이벤트 (3.26.0 이후 마일스톤)',
        en: 'First drafts & prototypes for system features, then implementation alignment with dev — minigames & webview events (the post-3.26.0 milestones)',
      },
      {
        ko: '지표 분석 기반 신규 상품 기획 — 테마 2종 · RP팩 · 정규/상시 상품 개선',
        en: 'Metric-driven new products — two themes, RP packs, improvements to regular & permanent offers',
      },
      {
        ko: '협업의 시스템화 — 메일 중심 협업을 Notion 히스토리 체계로 전환 · 업무 프로세스 단일화 · 스토어 product ID 명세서 자동 반영(Google Apps Script)',
        en: 'Systemized collaboration — email-only workflows moved into a Notion history system, unified processes, store product IDs auto-filled into specs (Google Apps Script)',
      },
      {
        ko: 'HTML 업무현황판 구축 — 메일 · Slack · Notion의 히스토리를 한 화면에, 담당자 간 정보 전달을 빠르게',
        en: 'Built an HTML team dashboard — mail, Slack and Notion history in one view, faster hand-offs between owners',
      },
      {
        ko: '유저 설문 기반 2025 · 2026 서비스 방향성 제안 — 근거를 수집해 기획의 방향을 세움',
        en: 'Proposed the 2025 & 2026 service directions from user surveys — grounding planning in evidence',
      },
      {
        ko: '10인 팀 리드(3층 위임) · 24/7 GM · 장애 1차 대응 · 글로벌 4개 라인 조율',
        en: 'Led the 10-person team (tiered delegation) · 24/7 GM · incident first response · four global lines',
      },
    ],
    problems: [
      {
        ko: '기획을 “의견”이 아니라 담당자가 바로 움직일 수 있는 “제안”으로 만드는 것 — 분석으로 시작해 검증으로 끝내기',
        en: 'Turning planning from opinion into proposals owners can act on — starting with analysis, ending with verification',
      },
      {
        ko: '팀장이 병목이 되지 않는 위임 구조를 만드는 것',
        en: 'Building delegation so the team lead never becomes the bottleneck',
      },
      {
        ko: '메일에 흩어지는 협업을, 히스토리가 쌓이는 시스템으로 바꾸는 것',
        en: 'Replacing email-scattered collaboration with systems that accumulate history',
      },
      {
        ko: '퇴사 이후에도 팀이 돌아가는 인수인계',
        en: 'A handover that keeps running after you leave',
      },
    ],
    outputs: [
      {
        stat: { ko: '50분', en: '50 min' },
        label: { ko: '6개 기능 → 6명 일괄 분배', en: '6 features dispatched to 6 people' },
        sub: { ko: '표준 양식 기반 디스패치', en: 'On a pre-built standard format' },
      },
      {
        stat: { ko: '39건', en: '39' },
        label: { ko: '1년 디스패치 · PMO 9명', en: 'Dispatches in a year · 9 PMO members' },
        sub: { ko: '의도 설계된 3층 위임 구조', en: 'A deliberately tiered 3-level delegation' },
      },
      {
        stat: { ko: '313', en: '313' },
        label: { ko: '음원 업데이트 SSOT 레코드', en: 'Music-update SSOT records' },
        sub: {
          ko: '퇴사 D+30까지의 운영 캘린더 사전 입력',
          en: 'Ops calendar pre-filled to D+30 after departure',
        },
      },
      {
        stat: { ko: '30건', en: '30' },
        label: { ko: '시스템 기획·개편·밸런스', en: 'Systems designed, reworked & balanced' },
        sub: { ko: '네오위즈 — 신규 10 · 개편 10 · 밸런스 10', en: 'NEOWIZ — 10 new · 10 reworked · 10 balancing' },
      },
    ],
    stories: [
      {
        title: { ko: '50분, 6개 기능, 6명', en: '50 minutes, 6 features, 6 people' },
        body: {
          ko: '마일스톤 킥오프 채널에서 담당자 · 기획서 · 일정까지 표준 양식으로 50분 만에 일괄 분배. 가능했던 이유는 순발력이 아니라, 미리 설계된 양식과 위임 구조였습니다.',
          en: 'In a milestone kickoff channel: six features assigned — owner, spec, schedule — in fifty minutes flat. Not reflexes; a format and a delegation structure designed in advance.',
        },
      },
      {
        title: { ko: '어뷰징이 터진 24시간', en: 'The 24 hours of an exploit' },
        body: {
          ko: '상품 어뷰징이 발생한 당일, 임시점검으로 확산을 차단하고 회수 · 보상 정책을 단일 결재로 확정한 뒤, 5단계 사후 SOP로 문서화했습니다. 이 사건 이후 경영진은 대형 장애의 1차 상황통제자로 그를 직접 지명했습니다.',
          en: 'The day a purchase exploit surfaced: an emergency maintenance to stop the spread, a single-approval decision on clawback and compensation, then a five-step SOP written down. Afterward, management named him the designated first-line incident controller.',
        },
      },
      {
        title: { ko: '퇴사하는 날까지 돌아가는 팀', en: 'A team that runs to the last day — and past it' },
        body: {
          ko: '퇴사 한 달 전, 퇴사 후 한 달치 운영 캘린더까지 미리 입력했습니다. “후임자가 오면 인수인계”가 아니라 “후임자가 없어도 도는” 위임형 모델.',
          en: 'A month before leaving, the operations calendar was pre-filled a month past the departure date. Not “hand over when a successor arrives” — a delegation model that runs even without one.',
        },
      },
    ],
    gallery: [], // 작업 스크린샷: public/work/<slug>/에 파일을 두고 { src, caption } 추가
    carried: {
      ko: '사람에게 위임하던 구조 — 3층 위임, 표준 결재선, SSOT — 가 다음 층에서 그대로 AI에게 위임하는 구조로 치환됩니다.',
      en: 'The structures once used to delegate to people — tiered delegation, standard approval lines, an SSOT — get transplanted, one for one, into delegating to AI.',
    },
  },

  // ── Phase 5 · AI 시스템 빌더 ──────────────────────────────
  {
    slug: 'ai-system',
    num: '05',
    color: 'sky',
    name: { ko: 'AI 시스템 빌더', en: 'AI System Builder' },
    tagline: { ko: '운영 문법의 재구현', en: 'Operating grammar, rebuilt' },
    period: '2024 — 현재',
    companies: { ko: '개인 프로젝트 · 100% 본인 IP', en: 'Personal projects · 100% own IP' },
    roleLine: { ko: 'AI 자동화 시스템 아키텍트', en: 'AI Automation Systems Architect' },
    title: {
      ko: 'AI 시스템 — 19년의 운영 문법을 AI 위에 다시 짓다',
      en: 'AI Systems — nineteen years of operating grammar, rebuilt on AI',
    },
    oneLiner: {
      ko: '새 직무가 아니라, 앞 네 개 층의 방식을 AI 위에 재구현한 것.',
      en: 'Not a new job — the previous four layers, reimplemented on AI.',
    },
    intro: {
      ko: '위임 구조는 서브에이전트로, 결재선은 승인 게이트로, 인수인계 SSOT는 세컨드브레인으로, 24/7 대응은 상주 에이전트와 킬스위치로. 앞 단계에서 사람과 조직에 적용하던 방식이 AI 위에 그대로 재구현됐습니다 — 전부 회사 자산과 무관한 개인 IP로, 실제 팀 운영(루틴 업무 60% 단축)에서 검증됐습니다.',
      en: 'Delegation became sub-agents; approval lines became gates; the handover SSOT became a second brain; 24/7 duty became resident agents with a kill switch. What was once applied to people and organizations was rebuilt on AI — all of it personal IP, independent of any employer, and proven in real team operations (60% less routine work).',
    },
    did: [
      {
        ko: '1인 운영 AI OS 구축 — 규칙 25 · 스킬 47 · 에이전트 11',
        en: 'Built a one-person AI OS — 25 rules · 47 skills · 11 agents',
      },
      {
        ko: '품질 게이트 — 6축 루브릭 + 블라인드 채점 + 자동 재시도',
        en: 'Quality gate — six-axis rubric, blind grading, auto-retry',
      },
      {
        ko: '3-AI 협업 버스 — 두뇌(GPT) · 실행자(Claude) · 검증관(Codex) 교차 계열 분리',
        en: 'A 3-AI collaboration bus — brain (GPT), executor (Claude), verifier (Codex), separated by model family',
      },
      {
        ko: '원격 킬스위치 — LLM을 거치지 않는 결정론적 비상정지',
        en: 'Remote kill switch — a deterministic emergency stop that bypasses any LLM',
      },
      {
        ko: 'LLM 위키 세컨드브레인 — 제로마찰 캡처와 자동 정리',
        en: 'An LLM wiki second brain — zero-friction capture, automated curation',
      },
    ],
    problems: [
      {
        ko: '“만든 자가 검증하는” 편향을 구조로 끊는 것',
        en: 'Structurally severing the bias of makers verifying their own work',
      },
      {
        ko: '자동화가 폭주하지 않게 — 만드는 것보다 “안 풀리게” 만드는 게 어렵다',
        en: 'Keeping automation from running away — the hard part isn’t building it, it’s making it fail closed',
      },
      {
        ko: '지식이 휘발되지 않는 개인 인프라',
        en: 'Personal infrastructure where knowledge doesn’t evaporate',
      },
    ],
    outputs: [
      {
        stat: { ko: '47', en: '47' },
        label: { ko: '자동화 스킬', en: 'Automation skills' },
        sub: { ko: '규칙 25 · 에이전트 11 · MCP 4종', en: '25 rules · 11 agents · 4 MCP integrations' },
      },
      {
        stat: { ko: '60%', en: '60%' },
        label: { ko: '팀 루틴 업무 단축', en: 'Routine team workload cut' },
        sub: { ko: '라이브 기획팀 실전 적용으로 검증', en: 'Proven in real live-planning operations' },
      },
      {
        stat: { ko: '90.1점', en: '90.1' },
        label: { ko: '블라인드 채점 평균', en: 'Average blind-review score' },
        sub: { ko: '자기 커리어 케이스 10건 — 8건 S등급', en: '10 of his own career cases — 8 graded S' },
      },
      {
        stat: { ko: '3계열', en: '3 families' },
        label: { ko: '교차 모델 검증', en: 'Cross-family verification' },
        sub: { ko: 'GPT 발주 · Claude 실행 · Codex 검증', en: 'GPT orders · Claude executes · Codex verifies' },
      },
    ],
    stories: [
      {
        title: {
          ko: '검증 AI가 실행 AI의 딴짓을 잡아낸 날',
          en: 'The day the verifier caught the executor slacking',
        },
        body: {
          ko: '실행자가 원 과제를 빼먹은 결과물을, 다른 계열의 검증관이 근거를 달아 반려했습니다(FAIL·D). “만든 자 ≠ 검증자”가 구호가 아니라 로그로 남은 사건.',
          en: 'The executor returned work that skipped the actual task — and a verifier from a different model family rejected it, evidence attached (FAIL·D). “Maker ≠ verifier” stopped being a slogan and became a log entry.',
        },
      },
      {
        title: {
          ko: '대화방을 여는 것만으로 브레이크가 풀린다면',
          en: 'What if opening a chat releases the brakes?',
        },
        body: {
          ko: '킬스위치 실사격 드릴에서, 메신저의 /start 자동 발신이 해제 명령과 겹치는 오발 경로를 발견해 당일 봉쇄했습니다. 문서 검토로는 못 잡는 결함을 드릴이 잡습니다.',
          en: 'A live-fire kill-switch drill exposed a misfire path — the messenger’s automatic /start colliding with the release command — sealed the same day. Drills catch what document reviews can’t.',
        },
      },
      {
        title: {
          ko: '자기 포트폴리오를 AI에게 채점시키다',
          en: 'Having AI grade his own portfolio',
        },
        body: {
          ko: '이 커리어 문서들 자체가 블라인드 채점과 자동 재시도 루프를 통과한 산출물입니다(평균 90.1점). 시스템이 작동한다는 가장 재귀적인 증거.',
          en: 'These very career documents went through the blind-grading and auto-retry loop (average 90.1). The most recursive possible proof that the system works.',
        },
      },
    ],
    gallery: [], // 작업 스크린샷: public/work/<slug>/에 파일을 두고 { src, caption } 추가
    carried: {
      ko: '이 층의 끝은 아직 없습니다. 다음 층은 지금 만들어지는 중입니다 — 이 사이트도 그 일부입니다.',
      en: 'This layer has no ceiling yet. The next one is being built right now — this site is part of it.',
    },
  },
]
