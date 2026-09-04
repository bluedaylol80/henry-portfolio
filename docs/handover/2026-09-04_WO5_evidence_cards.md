# WO-5 2026-09-04 — 근거 카드(성과 상세창) · 경력 링크 칩 (R1 설계 → R3 Opus 시공)

시공 발주(R3). 저장소 `D:\Github\henry-portfolio`, 브랜치 `feat/feedback-en-2026-09`(체크아웃됨, push 금지).
파이프라인: KO 원본 `site/index.html`(`data-i18n`/`data-i18n-attr` 마킹) + 사전 `site/i18n/en.json` →
`node scripts/build-en.mjs` → `site/en/index.html`(생성물 직접 편집 금지). LF 유지.
먼저 `docs/STATUS.md` 함정 목록·`docs/handover/2026-09-04_feedback_notion_en_WO.md`·
`docs/handover/2026-09-04_notion_public_check.json`(공개 페이지 27건 id·라벨)을 읽어라.
이 발주 전문을 `docs/handover/2026-09-04_WO5_evidence_cards.md`로 저장하고 시작.

배경(본부장 지시 09-04): "성과 상세창이 Notion처럼 스크린샷이 보이거나 Notion으로 가는 구조가 더 어필된다" +
"경력의 Notion 링크가 텍스트뿐이라 링크인지 인지가 안 된다". 실측: `https://limhenry.notion.site/<id>`는
익명 렌더되며 페이지 구조가 일정하다 — 이모지 아이콘·제목·속성(태그/참여 기간/프로젝트/활용 Tool)·
💡 콜아웃 한 줄 요약·"✅ 업무 프로세스" 불릿(→ 체인)·"✅ 주요 내용". 1200×750 캡처 JPEG q70 ≈ 32KB.

## A. R0 `scripts/build-evidence.mjs` (puppeteer-core, 기존 의존성만)
- 입력: 공개 JSON의 27개 id. 각 페이지를 1200×750으로 열어(networkidle2 + 2.5s, 요청 간 1.5s) 상단 툴바 숨기고
  캡처 → `site/evidence/<id>.jpg`(q70, ≤60KB; 초과 시 폭 960으로 재캡처). 동시에 DOM에서 추출: 제목,
  💡 콜아웃 텍스트(요약), "업무 프로세스" 첫 불릿(체인), 참여 기간, 활용 Tool →
  `site/evidence/index.json`{id:{title,summary,process,period,tools,img}}.
  어느 페이지든 본문 미렌더면 exit 1(무음 실패 금지). 재실행 결정적.
- 🔴 금지 id 3건(2c099a8d·36359de7·1f999a8d) 절대 포함 금지. 캡처에 내부 수치·개인정보가 보이는 페이지가
  있으면 목록에 적어 보고(판단은 본부장).

## B. 성과 상세창(`#wdlg`) — 근거 카드
- 현재 `#wdlgN` 칩 행을 **근거 카드 그리드 `.ev-grid`**로 교체: 1440 2열, 390 1열. 카드 = 썸네일(16:10 잘라 표시,
  `loading="lazy"`, src는 상세창 열 때만 주입 — budget 시연 영상과 같은 지연 방식) + 제목 + 요약 1줄(💡, ≤80자 말줄임) +
  프로세스 체인 1줄(작은 글씨, ≤90자 말줄임) + 우하단 "Notion에서 보기 ↗". 카드 전체가 링크
  (새 탭·`rel="noopener noreferrer"`·aria-label "제목 — Notion에서 열기(새 창)").
  데이터는 WORKS `n[]`의 id로 `evidence/index.json`을 조회(런타임 fetch 1회, 상세창 첫 오픈 시).
  index 로드 실패 시 기존 칩 폴백.
- 위치는 현재대로 핵심 수치 아래·상세 행 위. 근거 없는 카드(달콤·가계부)는 그리드 자체를 렌더하지 않는다(빈 자리 금지).
- 디자인 토큰·라운드·그림자는 기존 `.card`/`.pill` 체계 재사용. 새 색 값 금지.

## C. 경력(#career) 링크 어포던스
- `.row-links`의 밑줄 텍스트 링크를 **칩(pill)**으로: 테두리+외부 아이콘(`#i-arrup`)+hover/focus-visible 반응
  (포커스 링 규칙은 STATUS 함정대로 둥근 자식에 outline). 행 앞에 작은 eyebrow "근거·과정 (Notion)" /
  EN "Evidence (Notion, KO)". 390에서 줄바꿈 허용, 행 높이 통일 무관(경력 행은 그리드 아님).

## D. 영문·성능
- 새 텍스트 전부 `data-i18n` 마킹 + 사전 등재 → 재빌드. 근거 카드 제목·요약은 Notion 원문(한국어) 그대로 두고
  카드 우하단 라벨만 EN "Open in Notion (KO) ↗".
- 첫 화면 eager 바이트 증가 0(index.json·썸네일은 상세창 오픈 시에만). `site/evidence/` 총량 보고.

## 판정
- `node scripts/build-evidence.mjs` 27/27, 파일 존재·≤60KB 전건. 프로브 KO 25·EN 33 ALL PASS + 신규 검사:
  상세창 6종(린·카오스·나이트워커·Five Stars·Shadow Seven + 폴백 1) 열었을 때 근거 카드 개수 = n[] 개수,
  1440에서 첫 화면(스크롤 0)에 근거 카드 ≥1 보임, 390에서도 ≥1, 썸네일 요청이 상세창 열기 전 0건(네트워크 탭).
  헤더 1줄. `node loop/shoot-preview-2026-09-04.mjs <출력폴더>`로 캡처 재생성 + `loop/dlg-chaos-2026-09-04.mjs`로 상세창 캡처.
- 커밋 2개(① 스크립트+evidence 산출물 ② 마크업·CSS·JS·사전·EN 빌드·STATUS). 메시지 한국어,
  끝에 `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

고삐: 시킨 것만(카드 앞면·히어로·다른 섹션 불변), 서브에이전트 0, 40분 넘으면 ①만 커밋하고 보고.
보고 "바꾼 것 / 못 한 것 / 실측 수치 / 내부정보 의심 페이지" 4단 15줄.
