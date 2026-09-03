# WO 2026-09-04 — 이력서 피드백 반영 · Notion 근거 연결 · 영문판 (R1 Fable 5.1 설계 → R3 Opus 시공)

정본: 라이브 수정은 `site/index.html`만(React `src/`는 구버전). 브랜치 `feat/feedback-en-2026-09` (push 금지 — 배포는 본부장 "올려줘" 결재).
콘텐츠 유일 근거: `D:\Github\HT_multi\northstar-os\career\09_jobhunt\2026-08-11_career_fact_sheet.md` §1~§9. **표에 없는 수치·직위·기간 창작 금지.**
읽을 것: `docs/STATUS.md` "함정 목록" 절, `docs/DESIGN.md`. 판정 도구는 `scripts/`·`loop/`의 기존 하니스 재사용(새 하니스 발명 금지).

## 배경 (왜)
외부 이력서 피드백 3건 — ①성과가 "운영·관리" 같은 추상어 → 수치·전후비교로 ②상단 경력 요약(2~3줄)+핵심 역량 블록 부재 ③장문·소극 동사("진행·관리·수행") → 능동 동사("주도·달성·최적화·도입·재편·구축").
**본부장 어필 축(09-04)**: "근거를 지표로 확인하고, 그에 대응하는 개선 방향을 잡는다." 모든 서술은 가능한 한 **`지표(근거) → 판단·조치 → 결과`** 3박자로 쓴다. Notion 링크는 이 근거의 증빙이다 — 라벨은 "근거·과정 보기".
이력서 수준의 자료로 보여야 한다: 형용사 대신 숫자, 감상 대신 조치.

## WO-1 콘텐츠 (KO) — 시킨 것만

1. **히어로 경력 요약**: `.hero-sub`를 사실 밀도 높은 2~3문장으로 교체. 첫 문장은 어필 축("지표로 확인하고 개선 방향으로 대응")을 담되 사실로 뒷받침. 재료: 19년·10개사 / 소프트런칭 3건(린·카오스·Shadow Seven) / 런칭→라이브→종료 전 주기(종료 2건) / 사업 PM(BM·정산·계약)·조직 셋업·채용 / 조사·VOC·지표 기반 제품 방향 / AI 프로토타이핑·GAS 자동화. 그 아래 **핵심 역량 칩 6개**(`.hero-keys`, 텍스트 칩, 링크 아님): 지표·VOC 기반 방향 / 글로벌 런칭·소프트런칭 / 라이브 운영·서비스 종료 / 사업 PM·BM·계약 / 조직 셋업·채용 / AI 프로토타이핑·자동화. 390에서 칩 줄바꿈 허용, 히어로 카드(hcard)와 겹침 0.
2. **경력 목록(#career) 회사별 임팩트 1줄** `.row-impact`: 숫자·전후비교 우선, 능동 동사, 1줄(≤60자). 모바일에서도 표시(row-note 숨김은 유지). 근거는 괄호의 팩트시트 항목만:
   - 달콤: 11개 타이틀 → 5개 종료·SSWO 론칭 병행 → 7개 재편 · GAS로 7개 프로젝트 SKU 자동화 도입 (§8-1·B11-3)
   - 원더피플: 나이트워커 신규 33만+·DAU 피크 6.3만·D+1 리텐션 약 50% / 슈퍼피플 중국 신규 56만+·DAU 7.1만 (B2·§3)
   - 네오위즈: 알파·베타 신규 시스템 10종·개편 8종 기획 주도, 기획팀 채용·마일스톤 관리 (B11-7)
   - 스카이피플: Five Stars 사전예약 20만·신규 28만+·매출 24억 — 사업·운영 조직 셋업부터 런칭까지 주도 (A3·B4)
   - 넵튠: 일본 저조 지표 → 평점 관리 시스템 도입 → 구글 평점 3.29→4.4 · 4개국 소프트런칭 (B11-1·B8)
   - 넥슨: 린 매출 183억·양대 마켓 3위 / 카오스크로니클 98억·7위·피처드 / 영웅의 군단 매출 5배 (§3·A2·B1)
   - 넷마블: KON 튜토리얼 플로우 기획·경쟁 타이틀 분석으로 런칭 기반 구축 (B11-10)
   - 소프트닉스: NTD 사내테스트 2·FGI 4·FGT 2 설계, 5개 타이틀 유료화 분석, 남미 런칭 준비 (B5·B11-8)
   - NHN: Tera 웹운영 파트 관리·FUN QA 4종 게임성 분석, 아틀란티카·R2 라이브 운영 (B11-11)
   - 웹젠: SUN 온라인 런칭 라이브 운영·VOC 분석·로그 감사 (§1·Notion 원문)
3. **동사·구조 교정**: 성과 카드 앞면 `p`·WORKS `r[]`·What I do 4칸·How I Work — "진행·관리·수행" → 능동형, 가능한 곳은 `지표 → 조치 → 결과` 순서로 재배열. 길이 증가 금지(카드 461px 통일 유지). 달콤 WORKS `r[]`에 B11-3(GAS product ID 자동 반영·SKU 자동화·Slack/Notion 통합 현황판)·B11-4(어뷰징 당일 차단·5단계 SOP)·B11-5(현황 분석→신규 시스템·상품·이벤트) 반영 — 피드백이 "강점"으로 꼽은 대목. Shadow Seven `r[]`에 B11-1 추가. 나이트워커 `r[]`에 "주간 판매·라이브 지표 분석→상품·허들 개선 제안"(B11-6).
4. **Notion 근거 연결**:
   - R0 먼저: `scripts/check-notion-public.mjs`(puppeteer) — 팩트시트 §9-2 후보 id 전부를 `https://cord-timpani-ea7.notion.site/<id>`로 열어 본문 렌더(제목 텍스트 존재·"찾을 수 없음/not found/private" 부재)로 공개 판정, 결과 `docs/handover/2026-09-04_notion_public_check.json`. 미공개는 링크에서 제외하고 보고.
   - WORKS 항목에 선택 필드 `n:[{t:'인게임 개선 제안', href}]` → 다이얼로그에 "근거·과정 보기 (Notion)" 행으로 링크 칩(새 탭·`rel="noopener"`·외부 아이콘). 카드당 최대 4개.
   - #career 각 행에 `.row-links` 소형 링크(최대 3개, 라벨=페이지명). 카드 없는 회사(네오위즈·넷마블·소프트닉스·넥슨 공통)가 여기서 근거를 보여준다. 모바일 유지.
   - 허브 링크 3곳: 숫자 섹션 CTA "이력서와 경력기술서는 요청 주시면 보내드립니다" → "이력서·경력기술서는 Notion에서 바로 확인할 수 있습니다" + 버튼(허브 `0e48e826…`) / 푸터 Elsewhere "Notion 이력서" / 연락처 다이얼로그 Notion 행.
   - 🔴 §9-2 금지 3건 절대 링크 금지. 🔴 `.card-open::after{inset:0}` 함정 — 카드 앞면엔 링크 추가 안 함(다이얼로그 안만).
5. 팩트시트 §4 금지선·§6-1 카드 순서·§8-3 새니타이즈 규칙 그대로.

판정(WO-1): 기존 하니스로 1440·390 overflowX 0 · 카드 8장 높이 동일 · 다이얼로그 7종 열림+Notion href 정확 · `git diff --stat`이 site/index.html+scripts+docs만. 게시 전 grep `36359de7|2c099a8d|1f999a8d|NPS|41,141` 0건. 커밋 1개, STATUS "지금 위치"에 1줄.

## WO-2 영문판 (WO-1 커밋 후 착수) — 09-04 R4 벤치마크 반영해 **정적 별도 페이지** 방식으로 확정
근거: `docs/research/2026-09-04_pm_portfolio_benchmark.md` — 리크루터에게 보낸 링크가 상대 브라우저 상태와 무관하게 항상 같은 언어로 열려야 하고, `<html lang>`은 페이지별 고정이 안전. 단 **원본은 하나**(site/index.html)여야 하므로 런타임 토글이 아니라 **빌드 스크립트가 EN 페이지를 생성**한다.
- 구조: `site/index.html`(KO 원본)의 번역 대상 텍스트 노드·속성에 `data-i18n="key"`(속성은 `data-i18n-attr="aria-label|content|alt|title"`)를 붙이고, 사전은 **별도 파일 `site/i18n/en.json`**(key→EN). WORKS는 `WORKS_EN` 오버라이드를 같은 JSON 안 `works` 키로. R0 스크립트 `scripts/build-en.mjs`(node, 의존성 추가 없이 cheerio 등 이미 설치된 것만 — 없으면 정규식/jsdom 중 설치된 것)가 `site/en/index.html`을 생성: `<html lang="en">`, `<title>`·description·og:title·og:url·canonical(`…/henry-portfolio/en/`), 상대 경로(`works/`·`media/`·`demo/`·`og.png`·`favicon`)를 `../`로 재작성, hreflang `ko`/`en`/`x-default` 양방향(KO 원본에도 추가), 인라인 스크립트의 `WORKS`를 EN 값으로 치환. 생성물은 커밋한다(Pages는 `site/`를 그대로 배포).
- 토글 버튼: 헤더 `.hdr-r` 맨 앞 `.lang` **링크**(KO 페이지엔 "EN"→`en/`, EN 페이지엔 "KO"→`../`). 연락처 다이얼로그·푸터에도 반대 언어 링크 1개. 런타임 자동 감지·localStorage 없음(링크가 곧 언어).
- 범위: 보이는 텍스트 전부 + aria-label + `<title>`/meta + stat 단위(년→yrs, 억→₩B: 183억 = ₩18.3B, 98억 = ₩9.8B, 24억 = ₩2.4B) + 시계 라벨. 체험판·플레이 2종은 한국어 그대로, EN 라벨에 "(Korean)". Notion 링크 라벨 "Evidence & process (Notion, Korean)".
- 번역 원칙: 팩트시트 사실 그대로, 숫자 추가 0. 순위 "#3 grossing (App Store · Google Play, Korea)". 회사명: Dalcomsoft · Wonderpeople/Acestorm · Neowiz · Skypeople · Neptune Legend · Nexon Korea · Netmarble Blue · Softnyx · NHN Service · Webzen. 어필 축 영문 1문장(예: "Read the metrics, set the fix, ship it.") — 과장 금지.
- 함정: h1 `data-lines` 줄 span 3개 고정 — EN도 3줄. 카운트업 `data-count` 숫자 유지. EN 페이지도 카드 높이 통일·헤더 줄바꿈 0(1024·1280·1440 실측). 폰트 스택 그대로(Pretendard는 라틴 글리프 포함). 히어로 h1 EN 글자수는 KO보다 길어지므로 390에서 hcard 겹침 실측.
- 유지 규칙(STATUS 함정 목록에 추가): KO 원본을 고치면 `node scripts/build-en.mjs` 재실행 후 같이 커밋. 사전에 없는 key는 빌드가 **실패**(무음 KO 잔존 금지).
- 판정: 두 페이지 × 1440·390 overflowX 0 · 헤더 1줄 · `site/en/index.html` 안에 한글 잔존 0(체험판 라벨 "(Korean)" 예외) · 다이얼로그 7종 EN · 에셋 404 0 · 콘솔 0. 커밋 1개.

## 고삐
- 시킨 것만. 섹션 신설·디자인 변경·리팩터 금지. 서브에이전트 상한 2. 보고는 "바꾼 것 / 못 한 것 / 실측 수치" 3단 15줄 이내.
