# 웹 포트폴리오 — 루프 이터레이션 지시서 (헤드리스 새 세션용)

너는 기억이 없는 새 세션이다. 이 지시서와 `docs/` 파일 3개가 기억의 전부다.
이번 세션에서 처리하는 작업은 정확히 1건. 그 외 범위 확장 금지.

작업 루트: `D:\Github\henry-portfolio` · 배포물은 `site/index.html` 단일 파일(빌드 없음).

## 칸 0 — 브랜치 확인 + 중단 복구
- `git branch --show-current`가 `loop-v23`가 아니면 `git switch loop-v23`(없으면 `git switch -c loop-v23`).
- **main 접근 금지.** main에 push하면 39초 뒤 실사이트가 발행된다.
- `git status --porcelain`에 미커밋 변경이 있으면 **새 작업을 시작하지 마라**. 직전 회차가 검증·커밋 전에
  죽었을 수 있다(모델 한도·타임아웃). 그 변경이 STATUS.md 큐 최상단 작업의 산출물로 읽히면 —
  **그것부터 마무리한다**: 촬영 → 눈 판정 → 커밋 → STATUS 갱신. 그게 이번 회차의 작업 1건이다.
  직전 회차 산출물인지 확신이 서지 않으면(무관한 파일·사람 작업으로 보임) 손대지 말고
  `docs/feedback/INBOX.md`에 질문을 남기고 `loop/STOP`을 만든 뒤 종료한다.

## 칸 1 — 읽기 순서 (반드시 이 순서)
1. `docs/feedback/INBOX.md` — 본부장 지시, 최우선. 처리한 줄에 `[처리됨 <날짜>]` 표기.
2. `docs/DESIGN.md` — 무엇을 만드는가(정본 포인터·금지선).
3. `docs/STATUS.md` — 지금 위치·다음 할 일 큐·완료 기록·함정 목록.

## 칸 2 — 작업 1건 선택
- STATUS.md 다음 할 일 큐 최상단 1건만. 완성도 우선, 개수 아님.
- 큐가 비었으면 `loop/STOP` 생성 + STATUS.md에 사유 기록 후 종료.
- 본부장 판단이 필요한 갈림길이면 `docs/feedback/INBOX.md`에 질문을 남기고 STOP.

## 칸 3 — 시공
- `site/index.html` 직접 편집. `design/concepts/V23_CONCEPT_SPEC.md`의 **확정 카피·수치는 수정 금지**.
- 새 외부 의존(CDN·라이브러리) 추가 금지 — 필요하면 INBOX에 질문을 남기고 STOP.

## 칸 4 — 촬영 (R0 스크립트)
```
node scripts/shot-file.mjs D:\Github\henry-portfolio\site\index.html loop\shots\<타임스탬프>
```
- 반복마다 **새 폴더**(파일명이 고정이라 같은 폴더면 덮어쓴다).
- 네트워크 필요(CDN 폰트·Lenis) — 스크립트 출력의 콘솔 오류·실패 요청도 확인.

## 칸 5 — 눈 판정 (핵심)
- PNG 4장(wide/mobile × top/full)을 Read 도구로 **직접 열어 보고** 판정하라.
  "스크립트 통과"는 고장 없음일 뿐, 좋은 화면이 아니다.
- 가로 넘침(스크롤바)·깨진 폰트·겹침을 확인.
- ⚠ 640/1024/1440px 경계의 글자 크기 스냅은 **기지의 수용된 이탈**(`design/concepts/V23_BUILD_REPORT.md` §5) —
  버그로 재발견해서 "고치지" 마라.
- 판정 위반이면 고치고 칸 4로 돌아간다.

## 칸 6 — 커밋
- git add는 변경 파일 **개별 경로 명시**(`site/index.html`, `docs/...`). `loop/` 산출물 add 금지.
- 1작업=1커밋, 커밋 메시지에 스샷 판정 결과 1줄 포함.
- 🔴 `git push` 금지 · main 금지 · `gh workflow run` 금지(구조적으로도 차단됨). **커밋이 종점, 배포는 사람 전용.**

## 칸 7 — 인수인계
- `docs/STATUS.md` 갱신: 완료 기록·큐 재정렬·새 함정 발견 시 함정 목록 추가.
  다음 세션이 이 파일만 읽고 이어갈 수 있게 쓸 것.
- 마지막 출력 줄: `HEADLESS_DONE: D:\Github\henry-portfolio\docs\STATUS.md`
