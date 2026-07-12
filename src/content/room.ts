import type { Bi } from '../lib/i18n'

/**
 * ─────────────────────────────────────────────────────────────
 *  /room — 3D 룸 내비게이터 콘텐츠 (SPEC §11).
 *  방의 사물 = 메뉴. 문구는 여기서만 수정.
 * ─────────────────────────────────────────────────────────────
 */

export type RoomAction =
  | 'about' // /story#about
  | 'career' // /career
  | 'work' // /story#work
  | 'ai' // /story#ai
  | 'contact' // /story#contact
  | 'sound' // BGM 토글
  | 'notion' // 상세 이력 (외부 새 탭)

export interface RoomHotspot {
  id: string
  action: RoomAction
  label: Bi
  hint: Bi
}

export const navLabel: Bi = { ko: '룸', en: 'Room' }

/** 룸(첫 화면)의 우상단 햄버거 메뉴 */
export const menu = {
  open: { ko: '메뉴 열기', en: 'Open menu' } as Bi,
  close: { ko: '메뉴 닫기', en: 'Close menu' } as Bi,
  title: { ko: '메뉴', en: 'Menu' } as Bi,
  storyLabel: { ko: '전체 스토리', en: 'The full story' } as Bi,
  storyHint: {
    ko: '한 페이지로 이어지는 소개 · 커리어 · 성과 · AI 챕터',
    en: 'About, career, work and the AI chapter — one scrolling page',
  } as Bi,
  brief: { ko: '3분 요약', en: '3-minute brief' } as Bi,
  briefHint: {
    ko: '빠른 검토용 한 페이지 — 숫자와 핵심만',
    en: 'One page for a quick review — just the numbers and the core',
  } as Bi,
}

/** 폴백(3D 미탑재) 화면 라벨 */
export const fallbackChrome = {
  heading: { ko: 'THE ROOM', en: 'THE ROOM' } as Bi,
  storyCta: { ko: '전체 스토리 보기 →', en: 'See the full story →' } as Bi,
}

export const heroLink: Bi = { ko: '방에서 둘러보기 →', en: 'Explore the room →' }

export const coach: Bi = {
  ko: '방 안의 사물을 눌러 이동하세요 · 아래 메뉴로도 이동할 수 있어요',
  en: 'Tap an object to navigate · or use the menu below',
}

export const backLabel: Bi = { ko: '메인으로', en: 'Home' }

/**
 * 메뉴명 = 목적지(무엇을 보게 되는가), 힌트 = 사물(어디를 누르는가).
 * — 2026-07-09 본부장 지시: 가구명 메뉴는 목적지가 안 읽혀서 교체.
 */
export const hotspots: RoomHotspot[] = [
  {
    id: 'desk',
    // §22.1 v14: the desk no longer auto-plays the intro film — it flows through
    // the plain 'about' navigation (→ /story#about); the intro plays instead from
    // the /story#about character card and the room's first-visit introBadge.
    action: 'about',
    label: { ko: '소개', en: 'About' },
    hint: { ko: '컴퓨터 · 소개 섹션으로', en: 'Computer · to About' },
  },
  {
    id: 'tv',
    action: 'notion',
    label: { ko: '상세 이력', en: 'Full history' },
    hint: { ko: 'TV · Notion ↗', en: 'TV · Notion ↗' },
  },
  {
    id: 'bookshelf',
    action: 'career',
    label: { ko: '커리어 여정', en: 'Career journey' },
    hint: { ko: '책장 · 다섯 층', en: 'Bookshelf · five layers' },
  },
  {
    id: 'server',
    action: 'ai',
    label: { ko: 'AI 챕터', en: 'AI chapter' },
    hint: { ko: '서버 랙', en: 'Server rack' },
  },
  {
    id: 'coffee',
    action: 'contact',
    label: { ko: '커피챗', en: 'Coffee chat' },
    hint: { ko: '커피 한 잔 · 연락처', en: 'A cup of coffee · contact' },
  },
  {
    id: 'speaker',
    action: 'sound',
    label: { ko: '배경 음악', en: 'Music' },
    hint: { ko: '스피커 · 켜기/끄기', en: 'Speaker · on/off' },
  },
  {
    id: 'frame',
    action: 'work',
    label: { ko: '대표 성과', en: 'Selected work' },
    hint: { ko: '액자', en: 'The frame' },
  },
]

/** 룸 좌하단 아이덴티티 스트립 — 3초 안에 "누구인지"가 읽히게 */
export const identity = {
  name: 'Henry Lim',
  line: {
    ko: '게임 기획·사업 19년 → AI 시스템 아키텍트',
    en: '19y in game business & planning → AI systems architect',
  } as Bi,
  quick: [
    { label: { ko: '대표 성과', en: 'Work' } as Bi, to: '/story#work' },
    { label: { ko: '커리어', en: 'Career' } as Bi, to: '/career' },
    { label: { ko: '연락', en: 'Contact' } as Bi, to: '/story#contact' },
  ],
}

/** 첫 방문 소개 영상 유도 배지 (자동 전체화면 대신) */
export const introBadge: Bi = { ko: '▶ 소개 영상 보기', en: '▶ Watch the intro' }

export const fallback = {
  title: { ko: '룸 메뉴', en: 'Room menu' } as Bi,
  lede: {
    ko: '이 기기에서는 3D 룸 대신 바로가기 메뉴를 보여드립니다.',
    en: 'On this device, here are the room shortcuts instead of the 3D scene.',
  } as Bi,
}
