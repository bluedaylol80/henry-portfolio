/* PDF에 실으면 안 되는 문자열 — 인쇄 페이지 빌더와 판정기가 같은 목록을 본다.
   사이트에 게시 승인이 난 수치(PU·ARPPU 등)는 여기 넣지 않는다 — 넣으면 인쇄물에서 해당 행이 통째로 빠진다(WO-26). */
export const BANNED = ['NPS', '권고사직', '4개국', '4 markets', '590', '응답 수', '762', '37.5',
                       '카드를 누르면', 'DEV', 'v2.', '규칙1', 'nxtest', 'bluedaylol2']
export const hits = (s) => BANNED.filter(w => String(s).includes(w))
