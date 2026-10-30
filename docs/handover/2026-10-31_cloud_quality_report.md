# 품질 점검 보고 — 클라우드 정기 점검 (2026-10-31)

브랜치 `claude/portfolio-quality-2026-10-31` · main 병합·배포 안 함.

## 고친 것
| 파일 | 내용 | 이유 |
|---|---|---|
| `site/index.html` | Shadow Seven 카드 이미지 슬롯에 `data-ext="webp"`, 슬롯 탐색 코드가 이 값이 있으면 그 확장자만 요청 | `works/nanakage`는 webp뿐인데 jpg→png→webp 순서로 찔러 페이지마다 404 2건·콘솔 오류 2건(09-30 인수인계 "nanakage 확장자 404"). 화면 결과는 같고, 고친 뒤 10장 카드 모두 이미지 정상 표시 확인 |
| `site/en/index.html` | `node scripts/build-en.mjs` 재생성(위 2줄만 바뀜) | KO 원본 변경 반영 |

문안·디자인·수치 변경 없음. 덱(`site/deck/`)은 문제가 없어 재빌드하지 않음(재빌드하면 표지 발행일이 바뀜).

## 못 고친 것 / 본부장 결정 필요
- 결정 필요한 결함은 이번 점검에서 나오지 않음.
- 외부 CDN 2건(`cdn.jsdelivr.net` Pretendard CSS, `unpkg.com` lenis 1.3.23)은 클라우드 샌드박스 프록시가 막아 로드를 확인하지 못함. 라이브에서는 기존처럼 동작할 것으로 보이나 이번에 실측하지 못함.
- 문안: 이번 범위에서 새로 찾은 문제는 없음. 09-30 인수인계에 남은 후속 후보(근거 썸네일 2장 콜아웃 잘림 · EN 390px h1 5줄 · Shadow Seven 넓은 카드 저해상도)는 디자인·이미지 판단이라 그대로 둠.
- 참고: `scripts/build-en.mjs`의 `KNOWN_MISSING`(nanakage-thumb/-1.webp)은 이제 참조되는 곳이 없음. 동작에 영향이 없어 그대로 둠.

## 실행한 검사와 결과
1. `node scripts/build-en.mjs` → 텍스트 305곳 · 속성 17건 · 스크립트 207건 · 한글 잔존 0 · 자산 결손 0. 수정 전 재생성 결과가 커밋본과 바이트 동일(EN이 KO와 일치). en.json `ko`↔`strings` 키 짝 누락 0, 사전에만 있는 키 0.
2. 정적 검사(Python `html.parser`, 스크래치 스크립트): 8개 페이지(KO·EN·덱·덱 단일 파일·PDF KO/EN·데모 2종)에서 닫히지 않은 태그·짝 없는 닫는 태그·중복 id·img alt 누락·없는 로컬 경로·깨진 `#앵커` → 0건.
3. 런타임 검사(Playwright Chromium, 로컬 `python3 -m http.server`, 1440·390 폭, 끝까지 스크롤): 콘솔 오류·pageerror·HTTP 4xx·깨진 이미지·alt 누락(JS로 생성된 요소 포함)·내부 링크 응답 → 수정 전 KO·EN에서 nanakage 404 2건씩, 수정 후 0건(샌드박스가 막은 외부 CDN 요청 제외).
