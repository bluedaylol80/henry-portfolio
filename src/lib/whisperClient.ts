/**
 * ─────────────────────────────────────────────────────────────
 *  Whisper 방명록 클라이언트.
 *
 *  서버를 켜려면: sheets.new 로 시트 생성 → 확장 프로그램 > Apps Script 에
 *  scripts/whisper-backend.gs 를 붙여넣고 웹앱으로 배포(액세스: 모든 사용자) →
 *  발급된 /exec 로 끝나는 URL 을 아래 WHISPER_URL 에 붙여넣고 push.
 *
 *  WHISPER_URL 이 빈 문자열이면(=서버 미설정) 패널은 자동으로 오프라인 상태로
 *  표시됩니다 (입력 비활성화). 고장난 게 아니라 의도된 상태입니다.
 * ─────────────────────────────────────────────────────────────
 */

/** 여기에 Apps Script 웹앱 /exec URL 을 붙여넣으세요. 예: 'https://script.google.com/macros/s/AKfy.../exec' */
export const WHISPER_URL = ''

/** 서버가 돌려주는 방명록 한 줄. f = 국기 이모지, m = 메시지(≤30자). */
export interface WhisperMessage {
  f: string
  m: string
}

interface WhisperGetResponse {
  messages?: { f?: unknown; m?: unknown; t?: unknown }[]
}

/** GET — 최근 메시지 목록. 실패/미설정/타임아웃 시 빈 배열. (4초 타임아웃) */
export async function fetchWhispers(): Promise<WhisperMessage[]> {
  if (!WHISPER_URL) return []

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 4000)
  try {
    const res = await fetch(WHISPER_URL, {
      method: 'GET',
      signal: controller.signal,
    })
    if (!res.ok) return []
    const data = (await res.json()) as WhisperGetResponse
    if (!Array.isArray(data?.messages)) return []
    return data.messages
      .map((row) => ({
        f: typeof row?.f === 'string' ? row.f : '',
        m: typeof row?.m === 'string' ? row.m : '',
      }))
      .filter((row) => row.m.length > 0)
  } catch {
    return []
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * POST — 메시지 남기기. text/plain 으로 보내 CORS preflight 를 피합니다
 * (Apps Script 웹앱은 단순 요청에 대해 별도 헤더가 필요 없습니다).
 * 성공 시 true, 실패/미설정/타임아웃 시 false.
 */
export async function postWhisper(f: string, m: string): Promise<boolean> {
  if (!WHISPER_URL) return false

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 6000)
  try {
    const res = await fetch(WHISPER_URL, {
      method: 'POST',
      // 단순 요청 유지 → preflight 없음. 본문은 JSON 문자열이지만 Content-Type 은 text/plain.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ f, m }),
      signal: controller.signal,
    })
    if (!res.ok) return false
    const data = (await res.json().catch(() => null)) as { ok?: unknown } | null
    // 서버가 { ok: true } 를 주면 그 값을 신뢰, 아니면 200 자체를 성공으로 간주.
    return data ? data.ok !== false : true
  } catch {
    return false
  } finally {
    clearTimeout(timeout)
  }
}
