import type { Bi } from '../lib/i18n'

/**
 * ─────────────────────────────────────────────────────────────
 *  /room — 3D 룸 내비게이터 콘텐츠 (SPEC §11).
 *  방의 사물 = 메뉴. 문구는 여기서만 수정.
 * ─────────────────────────────────────────────────────────────
 */

export type RoomAction =
  | 'intro' // 소개 영상 오버레이
  | 'about' // /#about
  | 'career' // /career
  | 'work' // /#work
  | 'ai' // /#ai
  | 'contact' // /#contact
  | 'sound' // BGM 토글

export interface RoomHotspot {
  id: string
  action: RoomAction
  label: Bi
  hint: Bi
}

export const navLabel: Bi = { ko: '룸', en: 'Room' }

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
    label: { ko: '데스크', en: 'The desk' },
    hint: { ko: '소개 영상', en: 'Intro film' },
  },
  {
    id: 'arcade',
    action: 'work',
    label: { ko: '아케이드 캐비닛', en: 'Arcade cabinet' },
    hint: { ko: '대표 성과', en: 'Selected work' },
  },
  {
    id: 'bookshelf',
    action: 'career',
    label: { ko: '책장 — 다섯 권', en: 'The five books' },
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
    action: 'about',
    label: { ko: '액자', en: 'The frame' },
    hint: { ko: '소개', en: 'About' },
  },
]

export const fallback = {
  title: { ko: '룸 메뉴', en: 'Room menu' } as Bi,
  lede: {
    ko: '이 기기에서는 3D 룸 대신 바로가기 메뉴를 보여드립니다.',
    en: 'On this device, here are the room shortcuts instead of the 3D scene.',
  } as Bi,
}
