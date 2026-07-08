/**
 * ─────────────────────────────────────────────────────────────
 *  Whisper 방명록 백엔드 (Google Apps Script + 시트)
 *
 *  배포 방법 (3줄):
 *   1) sheets.new 로 새 시트 → 확장 프로그램 > Apps Script 에 이 파일 전체를 붙여넣기.
 *   2) 배포 > 새 배포 > 유형: 웹 앱 / 실행: 나 / 액세스: 모든 사용자 → 배포.
 *   3) 발급된 '.../exec' URL 을 src/lib/whisperClient.ts 의 WHISPER_URL 에 붙여넣고 push.
 *
 *  시트 컬럼(A~D): timestamp | hash | flag | message
 *  - message 는 30자 제한 + HTML 태그 제거.
 *  - hash(방문자 IP 해시 또는 token)로 1인 1메시지 중복 방지.
 *  - 시트는 최근 200행으로 자동 트림, doGet 은 최근 100개를 최신순으로 반환.
 *
 *  ※ 프론트가 POST 를 text/plain 으로 보내므로 CORS preflight 가 없고,
 *    Apps Script 웹앱은 단순 요청에 대해 별도 헤더 설정이 필요 없습니다.
 * ─────────────────────────────────────────────────────────────
 */

var MAX_LEN = 30
var KEEP_ROWS = 200
var RETURN_ROWS = 100

/** 시트(첫 번째 탭) 핸들 — 헤더가 없으면 만들어 둡니다. */
function getSheet_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0]
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['timestamp', 'hash', 'flag', 'message'])
  }
  return sheet
}

/** JSON 응답 헬퍼 (ContentService). */
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  )
}

/** HTML 태그 제거 + 제어문자 정리 + 길이 컷. */
function sanitize_(raw) {
  var s = String(raw == null ? '' : raw)
  s = s.replace(/<[^>]*>/g, '') // 태그 제거
  s = s.replace(new RegExp('[\\u0000-\\u001F\\u007F]', 'g'), '') // 제어문자 제거
  s = s.trim()
  if (s.length > MAX_LEN) s = s.substring(0, MAX_LEN)
  return s
}

/** 국기 이모지만 통과(그 외는 기본값). 아주 느슨한 길이 제한. */
function sanitizeFlag_(raw) {
  var s = String(raw == null ? '' : raw).trim()
  // 이모지 1~2 코드포인트 정도 → 8자 이하로 제한, 아니면 지구본.
  if (!s || s.length > 8) return '🌍'
  return s
}

/** 요청자 식별 해시: 명시 token 우선, 없으면 IP(가능 시) + UA 조합. */
function requestHash_(e, body) {
  var token = (body && body.token) || (e && e.parameter && e.parameter.token)
  var seed
  if (token) {
    seed = 'tok:' + token
  } else {
    // Apps Script 는 클라이언트 IP 를 직접 주지 않으므로, 헤더가 있으면 사용.
    var headers = (e && e.headers) || {}
    var ip =
      headers['X-Forwarded-For'] ||
      headers['x-forwarded-for'] ||
      headers['X-AppEngine-User-IP'] ||
      ''
    var ua = headers['User-Agent'] || headers['user-agent'] || ''
    seed = 'ipua:' + ip + '|' + ua
  }
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, seed)
  var hex = ''
  for (var i = 0; i < bytes.length; i++) {
    var b = (bytes[i] + 256) % 256
    hex += (b < 16 ? '0' : '') + b.toString(16)
  }
  return hex.substring(0, 24)
}

/** GET → 최근 100개 메시지를 최신순 JSON 으로. */
function doGet() {
  try {
    var sheet = getSheet_()
    var last = sheet.getLastRow()
    if (last < 2) return json_({ messages: [] })

    var start = Math.max(2, last - RETURN_ROWS + 1)
    var count = last - start + 1
    var values = sheet.getRange(start, 1, count, 4).getValues()

    var out = []
    for (var i = 0; i < values.length; i++) {
      var row = values[i]
      var m = String(row[3] || '')
      if (!m) continue
      out.push({
        t: row[0] ? new Date(row[0]).getTime() : 0,
        f: String(row[2] || '🌍'),
        m: m,
      })
    }
    out.reverse() // 최신순
    return json_({ messages: out })
  } catch (err) {
    return json_({ messages: [], error: String(err) })
  }
}

/** POST → 검증 후 append. body: text/plain 로 담긴 JSON { f, m, token? }. */
function doPost(e) {
  try {
    var body = {}
    if (e && e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents)
      } catch (parseErr) {
        body = {}
      }
    }
    // 폼 인코딩으로 온 경우도 관용 처리.
    if ((!body || (!body.m && !body.f)) && e && e.parameter) {
      body = { f: e.parameter.f, m: e.parameter.m, token: e.parameter.token }
    }

    var message = sanitize_(body.m)
    var flag = sanitizeFlag_(body.f)
    if (!message) return json_({ ok: false, reason: 'empty' })

    var sheet = getSheet_()
    var hash = requestHash_(e, body)

    // 중복 방지: hash 컬럼(B)에 이미 있으면 거부.
    var last = sheet.getLastRow()
    if (last >= 2 && hash) {
      var hashes = sheet.getRange(2, 2, last - 1, 1).getValues()
      for (var i = 0; i < hashes.length; i++) {
        if (String(hashes[i][0]) === hash) {
          return json_({ ok: false, reason: 'duplicate' })
        }
      }
    }

    sheet.appendRow([new Date(), hash, flag, message])

    // 200행 초과 시 오래된 데이터 행부터 삭제(헤더는 유지).
    var total = sheet.getLastRow()
    var overflow = total - 1 - KEEP_ROWS
    if (overflow > 0) {
      sheet.deleteRows(2, overflow)
    }

    return json_({ ok: true })
  } catch (err) {
    return json_({ ok: false, error: String(err) })
  }
}
