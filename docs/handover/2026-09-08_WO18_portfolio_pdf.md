# WO-18 2026-09-08 — 공개용 포트폴리오 PDF (R1 Fable 5.1 설계 → R3 Opus 시공)

본부장 결재(Q4): **포트폴리오 PDF 필요, 이력서는 불필요**. 선행 = WO-17(사이트 카피 확정). 브랜치 `feat/feedback-en-2026-09`, push 금지, 커밋 2개(① 인쇄 페이지·빌더 ② PDF 산출·사이트 링크). 서브에이전트 0.
원칙: 사이트가 원천 — **문구를 두 벌로 만들지 않는다**. 인쇄 페이지는 `site/index.html`·`site/i18n/en.json`·`site/evidence/index.json`의 텍스트를 빌드 시 읽어 조립한다(손으로 복사 금지). 수치는 팩트시트 §9-3 범위, 🔴 내부 수치·실명 금지.

## 1. 폐기
- `scripts/build-pdf.mjs`(v21 React `/brief` 전용)·`public/brief/` 잔재 삭제. 대체 = 아래 2·3.

## 2. 인쇄 페이지 `site/pdf/index.html` (KO) · `site/pdf/en/index.html` (EN, build-en 규칙 재사용)
A4 세로, 종이 룩(사이트 토큰·Pretendard), `@page` 여백 16mm, 페이지 나눔은 섹션 단위 `break-before`. 화면에서도 열리되 내비·애니메이션·잉크 없음. 구성(총 10~12쪽):
1. **표지**: 이름 · "게임 라이브서비스 PM·디렉터 · 19년" · 첫 화면 헤드라인(WO-17 문안) · 연락(이메일·사이트 URL·Notion 허브 URL) · 발행일.
2. **한 줄 요약 + 역량 4분류**: 히어로 요약 3문장 + 4분류 표(정의 1문장·대표 사례 1줄) — #skills 데이터.
3~5. **대표 사례 3** (달콤 → 린 → 나이트워커): 각 1쪽. 제목 · 기간·역할 · 6항목 표(문제/판단/본인 행동/결과·상태/증거) · 상태 pill · 근거 카드 썸네일 2~3장(`site/evidence/*.jpg`, Notion URL 캡션). 달콤 쪽 하단에 보조 사례 2건(R팩·조직 재편) 요약 4줄씩.
6~7. **프로젝트 타임라인 30개**: 팩트시트 §1 기간 기준 연표(회사 · 타이틀 · 기간 · 역할 1줄). **8/22 구분은 표기하지 않음**(항목별 배정 근거 없음). 성과 카드 6장의 KPI(사이트 표기 그대로: 11→7 · 183억 · 98억 · 33만+ · 24억 · 7개국)는 해당 행에 작은 숫자로.
8. **AI 프로토타입 2** + 개인 프로덕트 1: 카드 이미지(`site/works/deco.jpg`·`ssjproto.jpg`) + 체험판 안내 4줄(WO-17 문안) + 체험판 URL(QR 불필요, URL 텍스트). 가계부 1줄.
9. **연락**: 이메일 · 사이트 · Notion 허브 · "이 문서는 사이트에서 자동 생성됨(발행일)".
저작권: 성과 카드 이미지가 들어가는 쪽마다 사이트와 같은 권리 문구 1줄.

## 3. 빌더 `scripts/build-pdf.mjs` (재작성)
- 로컬 서버 8787에서 `site/pdf/`·`site/pdf/en/`을 puppeteer로 열어 `page.pdf({format:'A4', printBackground:true, preferCSSPageSize:true})` → `site/henry-lim-portfolio-ko.pdf`·`site/henry-lim-portfolio-en.pdf`. 폰트 로드 대기(document.fonts.ready) 후 출력. 파일 크기 ≤ 3MB(썸네일은 evidence jpg 그대로, works 이미지는 폭 900 재인코딩).
- 텍스트 원천 검사: 빌드 시 인쇄 페이지의 대표 사례 6항목 텍스트가 `site/index.html`의 상세창 데이터와 바이트 일치하는지 assert(불일치면 빌드 실패).

## 4. 사이트 링크
- 히어로 보조 CTA 옆 또는 연락 창·푸터의 "포트폴리오 PDF" 자리(WO-17 hidden) 활성화: KO → `henry-lim-portfolio-ko.pdf`, EN → `-en.pdf`, `download` 속성 없이 새 탭. `<link rel="alternate" type="application/pdf">` 헤드 추가.

## 5. 판정
- PDF 2개 생성·쪽수 10~12·크기 ≤3MB·텍스트 선택 가능(이미지 PDF 아님)·pdftotext 또는 puppeteer 텍스트 추출로 🔴 금지어 grep 0(NPS·응답 수·실명·"권고사직"·가격 수치) · "4개국" 0.
- 프로브 3종 ALL PASS(사이트 링크 추가 후) · 콘솔 0 · 링크 200.
- 캡처: PDF 1·3·6쪽 PNG `loop/shots14/`. 보고 ≤10줄 + 커밋 해시 2개.
