/**
 * Tiny event bus: '소개' 메뉴/룸의 컴퓨터 클릭 → IntroVideo 오버레이 열기.
 * opts.afterNavigate: 오버레이가 닫힌 뒤 이동할 경로 (예: '/story#about').
 */
export interface IntroOpenOptions {
  afterNavigate?: string
}

type Listener = (opts?: IntroOpenOptions) => void

const listeners = new Set<Listener>()

export function openIntro(opts?: IntroOpenOptions): void {
  listeners.forEach((l) => l(opts))
}

export function onIntroRequest(cb: Listener): () => void {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}
