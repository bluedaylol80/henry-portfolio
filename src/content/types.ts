import type { Bi } from '../lib/i18n'

export type CareerPhase = 'ops' | 'qa' | 'biz' | 'plan'

export interface CareerEntry {
  company: Bi
  role: Bi
  period: string
  phase: CareerPhase
  titles?: Bi
}

/** One localized number for count-up display. */
export interface Stat {
  value: number
  decimals?: number
  prefix?: string
  suffix?: string
}

export interface Achievement {
  title: Bi
  tag: string // company tag, latin
  stat: { ko: Stat; en: Stat }
  label: Bi
  sub: Bi
  emphasis?: boolean // gradient number
}

export interface AICard {
  title: Bi
  body: Bi
  icon: 'orchestration' | 'finance' | 'content' | 'vibecoding'
  note?: Bi
}

export interface NavItem {
  id: string
  label: Bi
}
