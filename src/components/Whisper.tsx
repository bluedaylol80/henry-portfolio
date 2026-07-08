import { useEffect, useMemo, useRef, useState } from 'react'
import { useT } from '../lib/i18n'
import { whisper } from '../content/profile'
import { WHISPER_URL, postWhisper, type WhisperMessage } from '../lib/whisperClient'

const FLAGS = [
  '🇰🇷',
  '🇺🇸',
  '🇯🇵',
  '🇨🇳',
  '🇬🇧',
  '🇩🇪',
  '🇫🇷',
  '🇪🇸',
  '🇮🇹',
  '🇧🇷',
  '🇮🇳',
  '🌍',
]

const MAX_LEN = 30
const MAX_SHOWN = 30
const STORAGE_KEY = 'henry.whispered'

// 아주 가벼운 클라이언트 프로필터 (서버에서도 검증되어야 함).
const BANNED = [
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'cunt',
  'dick',
  '씨발',
  '시발',
  '병신',
  '개새',
  '좆',
  '지랄',
  '엿먹',
  '창녀',
]

function isClean(text: string): boolean {
  const lower = text.toLowerCase()
  return !BANNED.some((word) => lower.includes(word))
}

function hasWhispered(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function markWhispered() {
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    /* private mode — 화면 상태만으로 잠금 */
  }
}

/**
 * Whisper 방명록 — Contact 섹션 내부에 렌더.
 * WHISPER_URL 미설정 또는 초기 fetch 실패 시 오프라인 상태(입력 비활성).
 * 한 방문자당 하나(localStorage) + 클라이언트 프로필터 + 최신순 칩.
 */
export default function Whisper() {
  const t = useT()
  const [status, setStatus] = useState<'loading' | 'online' | 'offline'>('loading')
  const [messages, setMessages] = useState<WhisperMessage[]>([])
  const [flag, setFlag] = useState(FLAGS[0])
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(hasWhispered)
  // 'blocked' = 프로필터 차단(부적절), 'failed' = 전송 실패(서버 오프라인 취급).
  const [error, setError] = useState<'blocked' | 'failed' | null>(null)
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true

    // URL 미설정 → 오프라인.
    if (!WHISPER_URL) {
      setStatus('offline')
      return () => {
        alive.current = false
      }
    }

    // 서버 도달 가능 여부 프로브 — 실제 네트워크 실패면 오프라인, 아니면 온라인.
    // (fetchWhispers 는 실패 시에도 [] 를 돌려주므로, 도달 여부는 별도 raw 요청으로 판정.)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)
    ;(async () => {
      try {
        const res = await fetch(WHISPER_URL, { method: 'GET', signal: controller.signal })
        if (!alive.current) return
        if (!res.ok) {
          setStatus('offline')
          return
        }
        const data = (await res.json().catch(() => null)) as {
          messages?: { f?: unknown; m?: unknown }[]
        } | null
        if (!alive.current) return
        const rows: WhisperMessage[] = Array.isArray(data?.messages)
          ? data.messages
              .map((r) => ({
                f: typeof r?.f === 'string' ? r.f : '',
                m: typeof r?.m === 'string' ? r.m : '',
              }))
              .filter((r) => r.m.length > 0)
          : []
        setMessages(rows)
        setStatus('online')
      } catch {
        if (alive.current) setStatus('offline')
      } finally {
        clearTimeout(timeout)
      }
    })()

    return () => {
      alive.current = false
      controller.abort()
      clearTimeout(timeout)
    }
  }, [])

  const shown = useMemo(() => messages.slice(0, MAX_SHOWN), [messages])
  const offline = status === 'offline'
  const disabled = offline || submitting || done
  const remaining = MAX_LEN - text.length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmed = text.trim()
    if (!trimmed) return
    if (trimmed.length > MAX_LEN) return
    if (!isClean(trimmed)) {
      // 부적절한 내용은 조용히 거부 — 입력을 비우고 전송하지 않음(별도 문구 없이).
      setError('blocked')
      setText('')
      return
    }
    if (hasWhispered()) {
      setDone(true)
      return
    }

    setSubmitting(true)
    const ok = await postWhisper(flag, trimmed)
    if (!alive.current) return
    setSubmitting(false)

    if (ok) {
      markWhispered()
      setDone(true)
      // 방금 남긴 메시지를 맨 앞에 낙관적으로 추가.
      setMessages((prev) => [{ f: flag, m: trimmed }, ...prev])
      setText('')
    } else {
      setError('failed')
    }
  }

  return (
    <div className="glass mx-auto mt-4 w-full max-w-xl rounded-2xl p-6 text-left md:p-8">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-lg font-semibold text-ink md:text-xl">
          {t(whisper.title)}
        </h3>
        {!offline && (
          <span className="font-display text-xs tabular-nums text-ink-mute">
            {shown.length > 0 ? `${shown.length}` : ''}
          </span>
        )}
      </div>

      <p className="mt-2 break-keep text-sm text-ink-dim">
        {offline ? t(whisper.offline) : t(whisper.lede)}
      </p>

      {/* 메시지 칩 (최신순) */}
      {!offline && shown.length > 0 && (
        <ul className="mt-5 flex flex-wrap gap-2">
          {shown.map((msg, i) => (
            <li
              key={`${i}-${msg.m}`}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-ink-dim"
            >
              <span aria-hidden className="shrink-0 text-base leading-none">
                {msg.f || '🌍'}
              </span>
              <span className="min-w-0 truncate break-keep">{msg.m}</span>
            </li>
          ))}
        </ul>
      )}

      {/* 입력 폼 */}
      <form onSubmit={handleSubmit} className="mt-5 flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="whisper-flag">
          {t(whisper.countryLabel)}
        </label>
        <select
          id="whisper-flag"
          aria-label={t(whisper.countryLabel)}
          value={flag}
          onChange={(e) => setFlag(e.target.value)}
          disabled={disabled}
          className="h-11 shrink-0 rounded-xl border border-white/15 bg-white/[0.04] px-3 text-base text-ink outline-none transition-colors duration-200 hover:border-white/30 focus-visible:border-era-cyan disabled:cursor-not-allowed disabled:opacity-50"
        >
          {FLAGS.map((f) => (
            <option key={f} value={f} className="bg-elev text-ink">
              {f}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            if (error) setError(null)
          }}
          maxLength={MAX_LEN}
          disabled={disabled}
          placeholder={t(whisper.placeholder)}
          aria-label={t(whisper.title)}
          className="h-11 min-w-0 flex-1 rounded-xl border border-white/15 bg-white/[0.04] px-4 text-sm text-ink placeholder:text-ink-mute outline-none transition-colors duration-200 hover:border-white/30 focus-visible:border-era-cyan disabled:cursor-not-allowed disabled:opacity-50 md:text-base"
        />

        <button
          type="submit"
          disabled={disabled || text.trim().length === 0}
          className="glass h-11 shrink-0 rounded-xl border-era-cyan/30 px-5 text-sm font-semibold text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-era-cyan/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {submitting ? '…' : t(whisper.submit)}
        </button>
      </form>

      {/* 상태 라인 */}
      <div className="mt-3 flex min-h-[1.25rem] items-center justify-between gap-3 text-xs">
        <span aria-live="polite" className={error === 'failed' ? 'text-ink-mute' : 'text-era-cyan'}>
          {error === 'failed'
            ? t(whisper.offline)
            : error === 'blocked'
              ? '·'
              : done
                ? t(whisper.thanks)
                : ''}
        </span>
        {!offline && !done && (
          <span className="shrink-0 tabular-nums text-ink-mute">{remaining}</span>
        )}
        {!offline && done && (
          <span className="shrink-0 text-ink-mute">{t(whisper.already)}</span>
        )}
      </div>
    </div>
  )
}
