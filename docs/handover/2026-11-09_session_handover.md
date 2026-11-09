# 인수인계 — 웹 포트폴리오 23~25차 + 노션 정리 (2026-11-09)

재개 키워드: "웹 포트폴리오 이어서"

## TL;DR
1. 본부장 지시 3건 반영: 183억 라벨 교체, 덱 3장 역할 범례 연도 수정, 가운뎃점과 긴 줄표 전량 제거(웹, 영문, 덱, 인쇄 PDF, 체험판 2쪽, 노션 12쪽, 노션 카드뉴스 27장).
2. 달콤소프트 재직 기간 담당 타이틀 매출 기여 172억(본부장 제공 수치) 카드, 상세창, 경력 행, EN, 덱, 인쇄물 반영.
3. 함정 1건 발견·복구: Notion MCP로 블록을 고치면 공개 링크가 app.notion.com으로 바뀌어 로그인 벽이 생김. 12개 링크 원복 완료.

## 이번 세션 배포 (henry-portfolio main, 라이브 반영 확인)
| 순서 | 내용 | 커밋 |
|---|---|---|
| 23 | 183억 라벨 「최대 매출 경험 (린 라이트 브링어 - 런칭 6개월 성적)」, 덱 3장 역할 범례(운영 2006-2011 / 사업PM 2011-2021, 2022-2024 / 기획, 디렉터 2021, 2024-2026), 보이는 문구 전체 부호 0건, 덱·인쇄 파서 쉼표·콜론 대응 | `293a5ce` |
| 24 | 체험판 2쪽(demo/deco.html, demo/ssjproto.html) 부호 제거 | `906be02` |
| 25 | 달콤 172억 기여(2024.10~12 31억, 2025 101억, 2026.01~06 41억, IAP+IAA) 카드·상세·경력 행·EN(₩17.2B)·덱 18장·인쇄 14장, 영문 인쇄 경력표 .tl 축소, 근거표 39번 행 | `3d317fb` |

## 노션 (공개 사이트 limhenry.notion.site 실측 완료)
- 사이트에서 링크되는 38개 페이지 전수 점검. 부호 있던 12개 수정(이력서 KO·EN, 메인, 사례 7, NARAKA, 미디어 쇼케이스), 26개는 원래 없음. 메인 인라인 DB 카드 제목 3개 수정.
- 카드뉴스 6세트 27블록 재렌더·제자리 PATCH 교체. 소스·PNG·백업은 HT_multi `northstar-os/career/09_jobhunt/portfolio_research_2026-09/` (커밋 `56c225a8`). 이전 PNG `cards/_bak_20261109/`, 페이지 백업 `backup_notion_<id>_20261109.json`, 교체 기록 `cases_visuals/_build/swap_log_2026-11-09.json`.
- 미수정: NARAKA 분석 페이지 장표 20장(PPT 이미지), 정기 상품 카드 3·4 본문(원본 스크립트 없음, 띠만 패치, 본문은 부호 없음).

## 함정 메모 (새로 확인)
- **Notion MCP update-page는 블록 안 `limhenry.notion.site/<id>` 링크를 `app.notion.com/p/<id>`로 바꾼다.** 멘션과 상대 경로는 무사. 복구는 크롬 로그인 탭(웹 내부 API)으로만 가능. 공개 페이지를 MCP로 고친 뒤에는 크롬에서 `a[href*="app.notion.com"]` 0건 확인 필수. memory `notion-mcp-rewrites-public-links-to-app-notion`.
- 노션 일괄 치환 시 하이픈 하위 목록이 줄표로 오인돼 합쳐지는 사고 1건(NARAKA) 발생·복구. 줄 단위로 바꿀 것.
- `site/evidence/index.json`은 손수정. `build-evidence.mjs` 재실행 시 Notion 원문의 「·」가 summary·process에 되돌아올 수 있음(tools join은 쉼표로 고침).
- 새 문구 작성 시 「·」「—」 금지(본부장 11-08 지시, memory `no-middle-dot-no-em-dash-anywhere`). 날짜 범위 「–」는 유지.
- rpack 카드 원본 `render.cjs`는 레포에 없음. `render5v3.cjs`는 `render12.cjs` 참조로 바꿔 둠.

## 이월 (본부장 판단 대기)
1. 덱 18장 달콤소프트 헤드라인 숫자: 현재 「11종」. 「172억」으로 바꿀지.
2. NARAKA 장표 20장 부호 수정 여부.
3. 이전 이월 유지: Shadow Seven 고해상도 원본, Clarity 대시보드 판독, `loop/motion-lab/` 보관·삭제, EN 640px h1.

## 사용 모델
R1 검수 Fable 5.1 / R3 시공 Opus 5.5 4건(웹 문구, 노션 글, 달콤 매출, 카드뉴스) / R2 감리 생략(Tier-1 문구). 소진 없음.
