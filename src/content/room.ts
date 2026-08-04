import type { Bi } from '../lib/i18n'

/**
 * ─────────────────────────────────────────────────────────────
 *  /room — 3D 룸 내비게이터 콘텐츠 (SPEC §11).
 *  방의 사물 = 메뉴. 문구는 여기서만 수정.
 * ─────────────────────────────────────────────────────────────
 */

export type RoomAction =
  | 'about' // → / (홈 Act 0)
  | 'career' // → /career
  | 'work' // → /#work
  | 'ai' // → /work/ai-os
  | 'contact' // → /#contact
  | 'sound' // BGM 토글
  | 'notion' // 상세 이력 (외부 새 탭)

export interface RoomHotspot {
  id: string
  action: RoomAction
  label: Bi
  hint: Bi
  /**
   * v21 P4 — 사물을 눌렀을 때 **바로 이동하지 않고** 먼저 보여주는 짧은 이야기.
   * 방이 "메뉴"가 아니라 "전시물"이 되는 지점. 이동은 카드의 버튼으로 한 번 더
   * 누를 때만 일어난다(둘러보다 실수로 나가버리지 않게).
   * 모든 문장은 기존 검증 콘텐츠(profile/journey)에 근거한다 — 새 사실 없음.
   */
  story?: Bi
  /** 카드의 이동 버튼 문구. 목적지가 읽히게 쓴다. */
  go?: Bi
}

/** v21 P4 — 탐험 UI 문구 */
export const explore = {
  progress: { ko: '둘러본 사물 {n} / {total}', en: 'Explored {n} of {total}' } as Bi,
  allSeen: {
    ko: '방을 다 둘러보셨습니다. 여기 있는 건 전부 본문에도 있으니, 편한 쪽으로 보시면 됩니다.',
    en: "That's the whole room. Everything here is in the main pages too — read it whichever way you prefer.",
  } as Bi,
  close: { ko: '닫기', en: 'Close' } as Bi,
  hintKeys: {
    ko: '← → 로 사물 이동 · Esc 로 닫기',
    en: '← → to move between objects · Esc to close',
  } as Bi,
  cardEyebrow: { ko: '무대 뒤', en: 'BEHIND THE STAGE' } as Bi,
}

/* 2026-08-05 정리(G4): 렌더되지 않던 유물 export 제거 — navLabel · menu(구 햄버거) ·
   heroLink · introBadge · identity.quick(구 /story 앵커 링크). */

/** 폴백(3D 미탑재) 화면 라벨 */
export const fallbackChrome = {
  heading: { ko: 'THE ROOM', en: 'THE ROOM' } as Bi,
  storyCta: { ko: '메인으로 →', en: 'Home →' } as Bi,
}

export const coach: Bi = {
  ko: '사물을 눌러 이야기를 보세요 · 아래 메뉴로 바로 이동할 수도 있어요',
  en: 'Tap an object to read its story · or jump straight from the menu below',
}

export const backLabel: Bi = { ko: '메인으로', en: 'Home' }

/**
 * 메뉴명 = 목적지(무엇을 보게 되는가), 힌트 = 사물(어디를 누르는가).
 * — 2026-07-09 본부장 지시: 가구명 메뉴는 목적지가 안 읽혀서 교체.
 */
export const hotspots: RoomHotspot[] = [
  {
    id: 'desk',
    action: 'about', // → 홈(Act 0)
    label: { ko: '소개', en: 'About' },
    hint: { ko: '컴퓨터 · 소개 섹션으로', en: 'Computer · to About' },
    story: {
      ko: '이 자리에서 이 사이트가 만들어졌습니다. 코드를 손으로 친 게 아니라 자연어로 지시하고 검증해서 세운 결과물이고, 지금 보고 계신 방도 그중 하나입니다.',
      en: 'This site was built at this desk — not typed by hand but instructed in plain language and verified. The room you are standing in is one of those outputs.',
    },
    go: { ko: '19년 요약 보기', en: 'See the 19-year summary' },
  },
  {
    id: 'tv',
    action: 'notion',
    label: { ko: '상세 이력', en: 'Full history' },
    hint: { ko: 'TV · Notion ↗', en: 'TV · Notion ↗' },
    story: {
      ko: '사이트에 담기지 않은 원본 이력이 따로 있습니다. 회사별 프로젝트와 기획 문서 목록까지, 가공하지 않은 형태로 정리해 뒀습니다.',
      en: 'The unabridged record lives outside this site — projects and design docs company by company, kept in raw form.',
    },
    go: { ko: '원본 이력 열기 ↗', en: 'Open the full record ↗' },
  },
  {
    id: 'bookshelf',
    action: 'career',
    label: { ko: '커리어 여정', en: 'Career journey' },
    hint: { ko: '책장 · 네 개의 층', en: 'Bookshelf · four layers' },
    story: {
      ko: '2006년 운영에서 시작해 사업과 기획을 지나 지금의 AI까지 — 열 개의 회사를 지나며 쌓인 네 개의 층입니다. 앞 층은 한 번도 버려지지 않았습니다.',
      en: 'From live ops in 2006 through business and planning to AI today — four layers stacked across ten companies. No layer was ever discarded.',
    },
    go: { ko: '층별로 들어가 보기', en: 'Walk through the layers' },
  },
  {
    id: 'server',
    action: 'ai',
    label: { ko: 'AI 챕터', en: 'AI chapter' },
    hint: { ko: '서버 랙', en: 'Server rack' },
    story: {
      ko: '실제로 돌고 있는 개인 AI 운영체제입니다. 지시를 나누는 층, 실행하는 층, 다른 계열의 모델이 채점하는 층 — 그리고 AI를 거치지 않고 즉시 멈추는 비상정지가 붙어 있습니다.',
      en: 'A personal AI operating system, actually running: a tier that routes intent, a tier that executes, a tier from a different model family that grades — plus an emergency stop that bypasses the AI entirely.',
    },
    go: { ko: '실행 기록 재생해 보기', en: 'Replay a real run' },
  },
  {
    id: 'coffee',
    action: 'contact',
    label: { ko: '커피챗', en: 'Coffee chat' },
    hint: { ko: '커피 한 잔 · 연락처', en: 'A cup of coffee · contact' },
    story: {
      ko: '채용 제안이든 그냥 궁금해서든, 메일과 커피챗에는 빠르게 답합니다. 항상 즐거운 제안은 환영합니다.',
      en: 'A role, a project, or plain curiosity — email and coffee-chat requests get quick replies. Fun proposals are always welcome.',
    },
    go: { ko: '연락 방법 보기', en: 'See how to reach me' },
  },
  {
    id: 'speaker',
    action: 'sound',
    label: { ko: '배경 음악', en: 'Music' },
    hint: { ko: '스피커 · 켜기/끄기', en: 'Speaker · on/off' },
    story: {
      ko: '작업할 때 틀어두는 재즈 한 곡이 걸려 있습니다. 이 곡도 AI로 만들었고, 끊기지 않게 이어 붙이는 데 손이 꽤 갔습니다.',
      en: 'A jazz loop that plays while working. It was AI-composed too, and making the loop seamless took more work than writing it.',
    },
    go: { ko: '틀기 / 끄기', en: 'Play / stop' },
  },
  {
    id: 'frame',
    action: 'work',
    label: { ko: '대표 성과', en: 'Selected work' },
    hint: { ko: '액자', en: 'The frame' },
    story: {
      ko: '벽에 걸어둘 만한 장면들 — 순위와 평점처럼 밖에서 확인 가능한 숫자를 중심으로 골랐고, 내부 수치는 각주에 출처를 밝혔습니다.',
      en: 'The moments worth framing — led by numbers anyone can verify from outside, like rankings and ratings; internal figures carry their source in a footnote.',
    },
    go: { ko: '숫자로 남은 장면들', en: 'Moments that left numbers' },
  },
]

/** 룸 좌하단 아이덴티티 스트립 — 3초 안에 "누구인지"가 읽히게 */
export const identity = {
  name: 'Henry Lim · 임현택',
  line: {
    ko: '게임 기획·사업 19년 → AI 시스템 아키텍트',
    en: '19y in game business & planning → AI systems architect',
  } as Bi,
}

export const fallback = {
  title: { ko: '룸 메뉴', en: 'Room menu' } as Bi,
  lede: {
    ko: '이 기기에서는 3D 룸 대신 바로가기 메뉴를 보여드립니다.',
    en: 'On this device, here are the room shortcuts instead of the 3D scene.',
  } as Bi,
}
