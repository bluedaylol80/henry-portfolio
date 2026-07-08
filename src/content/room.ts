import type { Bi } from '../lib/i18n'

/**
 * ─────────────────────────────────────────────────────────────
 *  /room — 3D 룸 내비게이터 콘텐츠 (SPEC §11).
 *  방의 사물 = 메뉴. 문구는 여기서만 수정.
 * ─────────────────────────────────────────────────────────────
 */

export type RoomAction =
  | 'intro' // 소개 영상 오버레이 → 닫히면 소개 섹션으로 이동
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
}

export const heroLink: Bi = { ko: '방에서 둘러보기 →', en: 'Explore the room →' }

export const coach: Bi = {
  ko: '물건을 클릭해 보세요 · 드래그로 둘러보기',
  en: 'Click the objects · drag to look around',
}

export const backLabel: Bi = { ko: '메인으로', en: 'Home' }

export const hotspots: RoomHotspot[] = [
  {
    id: 'desk',
    action: 'intro',
    label: { ko: '컴퓨터', en: 'Computer' },
    hint: { ko: '소개 영상 → 소개', en: 'Intro film → About' },
  },
  {
    id: 'tv',
    action: 'notion',
    label: { ko: 'TV', en: 'TV' },
    hint: { ko: '상세 이력 (Notion)', en: 'Full history (Notion)' },
  },
  {
    id: 'bookshelf',
    action: 'career',
    label: { ko: '책장', en: 'Bookshelf' },
    hint: { ko: '커리어 여정', en: 'Career journey' },
  },
  {
    id: 'server',
    action: 'ai',
    label: { ko: '서버 랙', en: 'Server rack' },
    hint: { ko: 'AI 챕터', en: 'AI chapter' },
  },
  {
    id: 'coffee',
    action: 'contact',
    label: { ko: '커피 한 잔', en: 'A cup of coffee' },
    hint: { ko: '커피챗 · 연락처', en: 'Coffee chat · contact' },
  },
  {
    id: 'speaker',
    action: 'sound',
    label: { ko: '스피커', en: 'Speaker' },
    hint: { ko: '배경 음악 켜기/끄기', en: 'Music on/off' },
  },
  {
    id: 'frame',
    action: 'work',
    label: { ko: '액자', en: 'The frame' },
    hint: { ko: '대표 성과', en: 'Selected work' },
  },
]

export const fallback = {
  title: { ko: '룸 메뉴', en: 'Room menu' } as Bi,
  lede: {
    ko: '이 기기에서는 3D 룸 대신 바로가기 메뉴를 보여드립니다.',
    en: 'On this device, here are the room shortcuts instead of the 3D scene.',
  } as Bi,
}
