# 인수인계 — Microsoft Clarity 방문 분석 도입 (2026-10-01 ~ 10-03)

## TL;DR
1. Microsoft Clarity(프로젝트 ID `yatji6jh65`) 추적 코드를 KO `/`·EN `/en/`·덱 `/deck/`·덱 단일 파일에 넣고 main `71bd507`로 배포 완료(Pages run success).
2. 라이브 실측: 4개 페이지 모두 `yatji6jh65` 1회 포함, `https://www.clarity.ms/tag/yatji6jh65` 200.
3. 미확인: Clarity 대시보드에 실제 세션이 잡히는지(본부장 방문 후 몇 시간 뒤 확인).

## 넣은 방식
- 원본 `site/index.html` `<head>` — Search Console 인증 meta 바로 아래. EN은 `node scripts/build-en.mjs`로 재생성(변경 10줄뿐).
- 덱은 `scripts/build-deck.mjs` 템플릿 `<meta name="robots" content="noindex">` 아래에 넣고 재빌드(로컬 서버 `python -m http.server 8787 --bind 127.0.0.1 --directory site` 선행). 재빌드로 덱 표지 발행일 2026-09-30→2026-10-01 자동 갱신.
- 공식 스니펫을 `if (location.hostname === 'bluedaylol80.github.io')`로 감쌈 — 덱·PDF 빌더(127.0.0.1 렌더)와 내려받은 덱 파일 열람이 방문으로 집계되지 않게.
- PDF는 추적 불가 형식이라 미변경.

## 다음에 손댈 때
- KO 원본을 고치면 EN·덱도 재빌드해야 Clarity 코드가 유지됨(빌더가 원본·템플릿에서 가져옴). 별도 조치 불필요.
- 유입 채널 구분이 필요하면 이력서·노션·원티드 링크에 `?utm_source=<채널>` 부착 → Clarity 필터로 분리.
- 유럽·영국 방문자는 Clarity 정책상 쿠키 동의 신호가 필요할 수 있음 — 해외 헤드헌터 유입이 중요해지면 동의 배너 검토(현재 미적용).

## 정정
HT_multi `superstar-ai-os/logs/session_handover/2026-10-03_portfolio_careerpilot_handover.md` 11행의 "`71bd507` 다른 세션 산출물, 내용 미확인" → 본 문서가 해당 커밋의 내용.
