/** Tiny event bus: Nav의 '소개' 클릭 → IntroVideo 오버레이 열기. */
type Listener = () => void

const listeners = new Set<Listener>()

export function openIntro(): void {
  listeners.forEach((l) => l())
}

export function onIntroRequest(cb: Listener): () => void {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}
