# 인수인계 — 포트폴리오 웹 개편 · PDF v2 · HTML 발표자료 (2026-09-09 ~ 09-12)

## TL;DR
1. **웹 개편 + PDF v2 배포 완료**(main `dc99d3f`, 74커밋). 라이브 실측 전부 통과, PDF 링크 26종 비로그인 200.
2. **HTML 발표자료(덱) 17장 제작 완료**(브랜치 `feat/deck-2026-09`, 6커밋). Codex 감리 7.6 → 수정 반영 완료, **배포 전**.
3. 다음 세션 = 본부장의 Codex 앱 의견 수령 → 반영 → "올려줘" 시 덱 배포.

## 1. 배포된 것 (main `dc99d3f`, 2026-09-10)
| 산출물 | 위치 | 상태 |
|---|---|---|
| 사이트 KO/EN | `site/index.html`·`site/en/index.html` | 라이브, Codex R9 웹 9.0 |
| 포트폴리오 PDF | `site/henry-lim-portfolio-ko.pdf`·`-en.pdf` (16:9 가로 15장) | 라이브, Codex R13 KO 9.0 / EN 8.7 |
| 인쇄 페이지 | `site/pdf/`·`site/pdf/en/` | 라이브 |
| 체험판 2종 | `site/demo/deco.html`·`ssjproto.html` | 라이브 |

- 라이브 실측: HTML 바이트 일치(157,610), `/en/`·PDF 2종·근거 JSON·썸네일·데모 2종·인쇄 페이지 전부 200.
- 링크 재검(R0 스크립트, Codex는 한도 소진): PDF 링크 주석 26종 **전부 비로그인 200**(EN 사이트 포함 → R13의 EN 제출 조건 해소).
- 6게이트 퀴즈 3/3 통과 후 배포(`six_gates_decisions.jsonl` 기록).

## 2. PDF v2 작업 경과 (WO-24 ~ WO-28)
본부장 판정(09-09): 기존 A4 세로 텍스트형 PDF는 제출용으로 부적합 → **16:9 가로 슬라이드 15장**으로 재설계. 발주서 `2026-09-09_WO24_portfolio_pdf_v2.md`.

| WO | 내용 | 커밋 |
|---|---|---|
| 24 ①② | 가로 골격·사례 1 | `770e228`·`e75dd35` |
| 24 ③④ | 채택 이미지 13장·표지 손질·EN | `b0e96c0`·`b96d0cb`(+정정 `f092ab4`) |
| 25 | R11 D3~D14(전 장 권리 줄·캡션 11pt·성과 장 본인 행동·KPI 정의·2쪽 간트) | `5d71f1c`·`a1f94be` |
| 26 | 금지어 정합(PU·ARPPU 승인분)·발행일 KST·verify 추적 | `caaf302` |
| 27 | 프로토 캡처를 빌더가 체험판에서 직접 생성·B19 기간 라벨·Acestorm | `ddf9ae7`·`cba1aab` |
| 28 | EN 캡션·기여 문장·꾸미기 대비·EN 보조 사례 축약 | `dc99d3f` |

**감리 점수 추이**: R11 KO 8.0/EN 7.8 → R12 8.7/8.3 → R13 **9.0/8.7**(제출 가능). 보고서 `2026-09-10_codex_r11~r13_review.md`.

## 3. HTML 발표자료 (WO-29·30, 브랜치 `feat/deck-2026-09` — 미배포)
본부장 지시(09-10): PDF 내용 기준 16:9 HTML 덱, 화면 중앙 꽉 참·비율 유지 확대축소, 사이트 페이지 + 별도 제출 파일. 발주서 `2026-09-10_WO29_html_deck.md`(디자인 규칙·17장 구성표 정본).

| 산출물 | 위치 |
|---|---|
| 빌더 | `scripts/build-deck.mjs` (사이트에서 텍스트 읽어 조립) |
| 사이트 페이지 | `site/deck/index.html` (헤더·히어로·푸터에 "발표자료" 링크, KO/EN) |
| 제출용 단일 파일 | `site/henry-lim-portfolio-deck.html` (폰트·이미지 base64 내장 2.88MB, 오프라인 동작) |
| 폰트 | `site/deck/fonts/SUIT-Variable.woff2` (OFL) |
| 검증 하니스 | `scripts/verify-deck.mjs` — 🔴 `.gitignore`(loop/*.mjs)라 **미추적**, `scripts/`로 옮길 것 |

- 조작: ←/→·Space·PageUp/Down, 클릭 좌우, 스와이프, `F` 전체화면, 해시 `#12`, 세로 화면 회전 안내.
- **Codex R15 감리 7.6/10** → WO-30 반영(`4ada74c`·`7f53a2a`): 대비 검산 내장(450건 미달 0, 작은 글자 최저 4.73:1), 빨강은 28px+ 굵은 글자·도형 전용, 경력축 종료월 버그 수정·현재 구간만 빨강, 사례1 KPI=출시 3건, 13·16장 복원, 도식 연결, 11장 캡처 2장 확대, Enter 링크 보존.
- **잔여(경미)**: 3장 중간 여백, 일부 문장 60~90자.

## 4. 다음 할 일
1. 본부장이 Codex 앱에서 받는 별도 의견 수령 → R15 잔여와 합쳐 WO-31.
2. "올려줘" 지시 시 배포: `git checkout main && git merge --ff-only feat/deck-2026-09 && git push` → 라이브 `/deck/` 200·단일 파일 200·헤더 링크 실측.
3. `scripts/verify-deck.mjs` → `scripts/`로 이동(추적).
4. 웹 후속: `site/works/deco.jpg`·`ssjproto.jpg`(웹 카드 이미지)에 규칙 탭·DEV 배지 잔존 → PDF처럼 빌더 캡처로 교체.
5. 색인 요청: 이 repo엔 도구 없음 → Search Console에서 `/`·`/en/` 수동 1클릭(본부장).

## 5. 함정 (이번 세션에서 배운 것)
- **이미지 채택은 원본을 단독으로 열어 확인**. 콘택트시트 라벨 오독으로 내부 지표 차트를 넣을 뻔했고(교체), 합성 이미지 구석 캡처에 로그인 ID·테스트 서버 주소·설치 경로가 있었다(크롭). 표·기획서 캡처는 구석까지 원본 배율로 볼 것.
- **근거 카드 문장의 원천은 Notion 💡 콜아웃**. 사이트만 고치면 재빌드 때 되돌아온다.
- **서브에이전트에게 프로세스 종료를 맡길 때는 PID 지정**. `taskkill /IM python.exe`로 상시 감시 작업(WatchInputs)이 죽은 사고 1건(재시작함).
- **Notion 공개 사이트가 Cloudflare 봇 확인으로 캡처 불가**(09-09 밤~). 이미지는 Notion API(`NOTION_LIMHENRY_TOKEN`)로 직접 내려받는다.
- **가변 폰트는 Chrome PDF에서 Type3 윤곽선으로 구워진다**(글꼴명 없음·용량 4배). 정적 폰트를 쓸 것.
- **Codex 한도 소진 시**(fail-limit) 대체: Sonnet 1층 체크리스트 + R0 스크립트 검증. 재시도 시각은 로그의 ERROR 줄에 나온다.
- 긴 대기는 Bash 백그라운드(10분 상한) 대신 `schtasks` 1회 예약.

## 6. 기록
- 원장: `HT_multi/superstar-ai-os/logs/orgchart_ledger` — 이번 세션 16줄(R3 Opus 9·R2 Astra 5·R4 Sonnet 3·R0 1).
- 내부 자료(비공개): `HT_multi/northstar-os/career/09_jobhunt/portfolio_research_2026-09/` — 채택표·스토어 소스·pptm 캡처·Notion 캡처·본부장 답변 정본.
- 메모리: `portfolio-3d-website-2026-07.md`, 신규 `image-adoption-open-original-before-pick.md`·`subagent-kill-by-pid-only.md`.
