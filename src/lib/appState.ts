type ReadyListener = () => void

let ready = false
const listeners = new Set<ReadyListener>()

export function isReady(): boolean {
  return ready
}

/** Preloader calls this exactly once when the intro is done. */
export function setReady(): void {
  if (ready) return
  ready = true
  document.body.classList.add('is-ready')
  listeners.forEach((l) => l())
  listeners.clear()
}

/** Fires cb after the preloader completes (immediately if already done). Returns unsubscribe. */
export function onReady(cb: ReadyListener): () => void {
  if (ready) {
    cb()
    return () => {}
  }
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}
