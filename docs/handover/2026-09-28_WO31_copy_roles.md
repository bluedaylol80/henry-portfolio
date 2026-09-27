# WO-31 — 역할 문구 개편(PM·기획·디렉터) · Shadow Seven·네오위즈 재서술 · 띄어쓰기/줄바꿈 교정

본부장 지시 2026-09-28. 브랜치 `feat/deck-2026-09`. 대상 = 사이트 KO/EN · 인쇄 PDF(KO/EN) · HTML 발표자료(덱).
원칙: 사이트 KO가 원천 → EN(`site/i18n/en.json`+`scripts/build-en.mjs`) → 인쇄·PDF → 덱(스크레이프) 순으로 재빌드. 덱·PDF 전용 문구는 각 빌더 표에서만 고친다.

## 1. 헤드라인 (결재: 완주형)
| | 현재 | 변경 |
|---|---|---|
| KO h1 3줄 | 사용자 요구를 / 제품 방향으로, 개발 우선순위를 / 실행으로 연결합니다. | **사용자 요구로 / 제품 방향을 정하고, / 마일스톤으로 출시와 라이브까지 완주합니다.** |
| EN h1 3줄 | Turn user needs / into product direction, and dev priorities / into shipped work. | **User needs set the direction. / Milestones carry it / through launch and live ops.** |

- 390폭 ≤4줄 유지(3줄째가 길면 `.nb` 묶음 위치로 조정 — 단어 중간 잘림 금지).
- 같은 문장을 쓰는 곳 전부: 사이트 메타(description·og·twitter 등 head 전부), og 이미지 생성기가 있으면 재생성, 인쇄 페이지 `site/pdf/` 머리글, 덱 표지·meta description·요약 장.
- 덱 표지 모션(흩어진 점 → 정렬된 흐름)은 그대로 둔다.

## 2. 히어로 소개 문단 (결재: 본부장 문장 다듬기)
- KO: **PC·모바일 게임의 글로벌 출시와 Live-ops를 A부터 Z까지, PM·기획·디렉터 역할로 경험했습니다. 사용자 요구와 지표 분석을 제품 방향·개발 우선순위로 연결하고, 디렉터로서 개발·기획·사업·운영 업무를 직접 진행하며 조율했습니다. 최근에는 AI로 이벤트 프로토타입을 만들고 반복 업무를 자동화했습니다.**
- EN: **Global launches and live ops for PC and mobile games, A to Z — as PM, designer and director. I turn user needs and metrics into product direction and dev priorities, and as a director I ran and coordinated dev, design, business and operations work. Lately I prototype events with AI and automate routine work.**
- 인쇄 PDF의 같은 문단(역량 장 lede)도 동일하게.

## 3. 기준 문구 삭제 (결재: 삭제)
- `총 경력 (이력서 기준)` → `총 경력` / EN `Total experience (per resume)` → `Total experience`
- 권리 줄 `수치는 공개 이력 기준입니다 · 게임 명칭은 각 권리자의 상표입니다.` → `게임 명칭은 각 권리자의 상표입니다.` (덱 `L.rightsPlain`, 인쇄 페이지 전 장)
- 푸터 `본 사이트의 모든 수치는 공개 이력서 기준입니다.` 삭제(KO/EN 사이트, 인쇄 마지막 장 foot). 빈 구분자(` · `)가 남지 않게.
- 검증기(`scripts/pdf-verify.mjs`·`scripts/verify-deck.mjs`)가 이 문구를 기대값으로 갖고 있으면 기대값도 갱신.

## 4. 역량 섹션
- 제목 `라이브 서비스를 굴리는 네 가지 일` → **`라이브 서비스의 핵심 업무`** / EN **`Core work of a live service`** (본부장 문안 "핵심 주요 업무"에서 중복어 정리)
- 02 출시·라이브 실행 설명 → **`소프트런칭부터 런칭·라이브 운영·서비스 종료까지, A~Z 모든 단계를 직접 진행했습니다. 린·카오스크로니클·Shadow Seven 소프트런칭, 나이트워커 퍼블리싱 연동, 서비스 종료 5개의 잔여 이슈까지 맡았습니다.`** / EN **`Soft launch, launch, live ops and sunset — I ran every stage, A to Z. Soft launches for Lyn, Chaos Chronicle and Shadow Seven, publishing integration for Night Walker, and the remaining issues from 5 sunset services.`**
- 01 제품 판단·마일스톤 설명 → **`조사·지표로 무엇을 만들지 정하고, 기획·개발 마일스톤으로 실행까지 끌고 가는 디렉터·PM 역할입니다. 네오위즈에서는 기획 팀장으로 기반 시스템 18종(신규 10·개편 8)을 기획하고 알파·베타 마일스톤을 관리했습니다.`** / EN **`Deciding what to build from research and metrics, then driving it to delivery through design and dev milestones. At NEOWIZ, as design lead, I designed 18 core systems (10 new, 8 reworked) and ran the alpha and beta milestones.`**

## 5. 달콤 11→7 → 11종 (결재: 11종으로 교체)
- 큰 숫자 `11→7` → **`11종`**, 라벨 → **`SuperStar 시리즈 타이틀 11종 앱 서비스 총괄`** / EN **`11 titles`** · **`Led app services for 11 SuperStar titles`**
- 적용 위치: 성과 카드 `card-wm`, 상세창 `s` 칸, 경력 행 `SuperStar 시리즈 11→7 재편 (K-pop IP)` → `SuperStar 시리즈 11종 앱 서비스 총괄 (K-pop IP)`, 수치 근거표 `docs/handover/2026-09-08_numbers_basis_table.md` 6행(숫자·정의), 덱 `KPI_NUM.dalcom`과 관련 주석, 인쇄 KPI 칸.
- 상세창 '운영 포트폴리오' 행(입사 11개 분석 → 5개 종료·SSWO 신규 → 7개 운영)은 사실 서술이라 유지.

## 6. Shadow Seven (결재: 개발 PM + 시스템 기획)
- 직함 `사업PM` → **`개발PM`**: 카드 meta, 태그, 상세창 `m`·담당 행, 경력 행 `스튜디오 사업PM` → `스튜디오 개발PM`, 인쇄·덱 파생 위치 전부. EN `Business PM` 계열 → `Development PM`.
- 카드 요약 → **`개발 PM으로 콘텐츠 순환·BM·트래킹 등 핵심 시스템을 기획하고, 7개국 소프트런칭에서 한국·미국·대만 그랜드런칭까지 이끌었습니다.`** / EN **`As development PM I designed the core systems — content loop, monetization, tracking — and took the game from a 7-market soft launch to the Korea, US and Taiwan grand launch.`**
- 카드 태그: `개발PM` · `시스템 기획` · `소프트런칭`
- 경력 행 impact → **`콘텐츠 순환·BM·트래킹 시스템 기획 · 7개국 소프트런칭 → 그랜드런칭 · 구글 평점 일본 3.29→글로벌 4.4`**
- 상세창 행(순서대로):
  1. 담당 — `개발PM (2019.10 ~ 2020.04)`
  2. 시스템 기획 — `콘텐츠 순환(재화 흐름)·레벨별 콘텐츠 언락·보상 체계 · BM·패키지 구조(상자·코스튬·즉시 열기) · Tapjoy 퍼널·광고 배치와 전 스테이지 트래킹 이벤트 표준 · 5개 언어 친구초대 페이지 · 평점 관리 시스템`
  3. 지표 → 조치 → 결과 — 현행 유지
  4. 소프트런칭 — 현행 유지
  5. 그랜드런칭 — 현행 유지
  EN도 같은 구조로.
- 덱 13장 `RESULT_ROWS.nanakage`: 역할=담당, 가운데 칸=시스템 기획 행, 결과=지표 → 조치 → 결과 행. 칸 이름표가 맞지 않으면 덱 전용 표에서만 조정.
- 근거: 원본 자료 `OneDrive/내 자료 모음/섀도우세븐/`(컨텐츠 순서도·순환도·언락·보상 목록·BM 제안·Tapjoy 설계·친구초대 웹페이지·게임소개서) — 비공개, 인용 금지. 매출·UA·CPI 등 수치 추가 금지.
- 네오위즈 경력 행 impact → **`기획 팀장 · 알파·베타 기반 시스템 신규 10종·개편 8종 기획, 개발 마일스톤 관리 · 기획팀 채용`** / EN 대응.

## 7. 띄어쓰기·줄바꿈 교정
- 목록 = `loop/shots28/spacing/REPORT.md` 중 조종석이 채택한 항목(§7-1). 위 §1~6으로 문장이 바뀌는 항목은 새 문장 기준으로 다시 본다.
- 교정 후 같은 폭(1440·390, 덱 1920)으로 재촬영해 신규 문장까지 다시 점검.

### 7-1. 채택 항목 (R1 판정 09-28)
- **순서**: REPORT.md '권장 순서' 그대로 — CSS `text-wrap: balance/pretty`(사이트+덱 빌더) 먼저 → 재캡처 → 남은 것만 개별 처리.
- **이번 WO에서 처리(사이트·EN·덱·수치 근거표 원천)**: A1·A2·A4·A9·A13, A′2·A′4·A′5, A′6(괄호는 앞말에 붙임 / 단어 나열 묶음=붙인 `·`, 항목 구분자=` · ` — 지적된 위치만), B1~B4·B7~B31·B33~B38(B-5는 짧은 묶음만), E1~E12, D1~D9, 범위 밖 항목(case1 상세창 첫 행이 닫기 버튼에 가려짐 → 오른쪽 여백).
- **§1~6으로 대체·소멸**: A12·D4(11종), D10·B14의 "이력서" 부분(삭제), B15·B36(새 문장 기준 재확인), D1(새 헤드라인 — 사이트 3줄 분할을 덱에서도 `<br>`로 보존).
- **이번 WO에서 제외 — Notion 원천(근거 카드 ev:·Notion 페이지 제목)**: A3·A5·A6·A7·A8·A10·A11, A′1·A′3, B5·B6·B32. 사이트 쪽 손으로 옮긴 칩 문구(`n[].t`, 예: A11 "유료재화")만 고치지 말고 그대로 둔다 — Notion 제목과 함께 후속 WO에서 한 번에 바꾼다(어긋남 방지).
- B31(상세창 요약 숫자 라벨 90px): 라벨 단축 대신 칸 폭 조정 우선. 불가하면 보고.

## 8. 검증
- EN 재빌드 후 KO 키 누락 0.
- `scripts/pdf-verify.mjs`·`scripts/verify-deck.mjs` exit 0(대비 검산 포함), 금지어 0.
- 사이트 390/1440 가로 넘침 0·콘솔 에러 0, 덱 17장 렌더.
- 옛 문구 잔존 grep 0: `실행으로 연결합니다`, `이력서 기준`, `공개 이력 기준`, `굴리는`, `실제로 돌린`, `11→7`(사실 서술 행 제외), Shadow Seven의 `사업PM`.
