import gsap from 'gsap'

/**
 * 공유 BGM 싱글턴 — Nav의 SoundToggle과 룸의 스피커가 같은 오디오를 제어합니다.
 * 절대 자동재생하지 않음(항상 사용자 제스처에서 enable).
 */

const TRACK = import.meta.env.BASE_URL + 'music/baguira.mp3'
const TARGET_VOLUME = 0.3
const FADE = 0.8

let audio: HTMLAudioElement | null = null
let soundOn = false
let wantOn = false
const subs = new Set<(on: boolean) => void>()

function emit() {
  subs.forEach((s) => s(soundOn))
}

function ensureAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio(TRACK)
    audio.loop = true
    audio.volume = 0
    audio.preload = 'auto'
  }
  return audio
}

export function isSoundOn(): boolean {
  return soundOn
}

/** 상태 변경 구독. 반환값 = 해지 함수. */
export function onSoundChange(cb: (on: boolean) => void): () => void {
  subs.add(cb)
  return () => {
    subs.delete(cb)
  }
}

export function enableSound(): void {
  const el = ensureAudio()
  wantOn = true
  const p = el.play()
  Promise.resolve(p)
    .then(() => {
      soundOn = true
      emit()
      gsap.to(el, { volume: TARGET_VOLUME, duration: FADE, ease: 'power1.inOut' })
    })
    .catch(() => {
      wantOn = false
      soundOn = false
      emit()
    })
}

export function disableSound(): void {
  wantOn = false
  soundOn = false
  emit()
  if (audio) {
    gsap.to(audio, {
      volume: 0,
      duration: FADE,
      ease: 'power1.inOut',
      onComplete: () => audio?.pause(),
    })
  }
}

export function toggleSound(): void {
  if (soundOn) disableSound()
  else enableSound()
}

// 탭이 숨겨지면 일시정지, 사용자가 켜뒀다면 복귀 시 재개.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!audio) return
    if (document.hidden) {
      audio.pause()
    } else if (wantOn) {
      audio.play().catch(() => {})
      gsap.to(audio, { volume: TARGET_VOLUME, duration: FADE, ease: 'power1.inOut' })
    }
  })
}
