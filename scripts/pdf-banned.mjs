/* PDF에 실으면 안 되는 문자열 — 인쇄 페이지 빌더와 판정기가 같은 목록을 본다.
   사이트에는 게시 승인이 났지만 인쇄물 배포는 막은 항목(ARPPU·PU 등)이 섞여 있다. */
export const BANNED = ['NPS', '권고사직', '4개국', '4 markets', '590', '응답 수', '762', '37.5',
                       'ARPPU', 'PU 1.6', '카드를 누르면', 'DEV', 'v2.', '규칙1', 'nxtest', 'bluedaylol2']
export const hits = (s) => BANNED.filter(w => String(s).includes(w))
