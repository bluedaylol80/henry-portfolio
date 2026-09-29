# 인수인계 — 포트폴리오 개편 세션 (2026-09-28 ~ 09-30)

## TL;DR
1. 공개 사이트 8회 배포(main `217711a` → `c58c0f4`): 헤드라인 개편·이력서 기준 용어 통일·슈퍼피플 카드·덱 18장(C3/E3 모션)·전 매체 링크·달콤 디렉터/서비스 방향성·띄어쓰기·Search Console 인증.
2. 노션: 이력서 KO(허브 0e48e826…)/EN(3e859de7…), 대표 사례 6페이지 카드뉴스+결과 지표, 나라카 분석 재구성, 서비스 방향성 2페이지(2025 사업 계획 `3ea59de7…` / 2026 상반기 `3c959de7…`, 09-30 원문 어휘 재작성).
3. **미배포 커밋 2개 대기**: `dc5332e`(WO-40 원문 어휘 재작성 근거 카드·PDF·덱) + WO-41(조직 재편 개편 후=기획·QA·CS 통합 1팀 리더 본인, 노션 본부장 수정분 동기화, PDF 버튼→발표자료, "A4 인쇄용 요약본" 삭제). 본부장 "올려줘" 후 ff-merge main → push → 라이브 바이트 대조.

## 배포 절차
`git checkout main && git merge --ff-only feat/deck-2026-09 && git push origin main && git push origin feat/deck-2026-09` → 라이브 `/`·`/en/`·`/deck/` 바이트 = site/ 로컬 · PDF 2종·evidence/index.json 200. 푸시 전 검문: diff에 전화번호·토큰·`C:\Users` 0.

## 발주서(정본)
`docs/handover/2026-09-28_WO31_copy_roles.md` · `WO33_resume_alignment.md` · `WO34_superpeople_naraka.md`. WO-32·35~41은 memory `portfolio-3d-website-2026-07.md`와 HT_multi `northstar-os/career/09_jobhunt/portfolio_research_2026-09/{rpack,cases_visuals,direction,superpeople,naraka,terms}/` 보고서.

## 확정 사실(09-28~30 본부장 결재)
- 카오스 98억=서비스 기간 누적 · 린 2017.01 · 넥슨=팀장 · 원더피플/에이스톰=사업팀 파트장 · 넵튠=개발PM(시스템 기획 4묶음, 7개국) · 네오위즈 18종 · 달콤 11종·"라이브기획팀 팀장 · 라이브 디렉터".
- 정기 상품: IVE 인당 IAP 34.23→38.64달러·unique PU 185→203·aespa 293→302(구글 시트 재현 🟢, 목표=최초 구매 허들 완화·PU 전환율 제고, A/B 후 유지).
- 조직 재편: 3조직 24명(라이브기획 12·개발기획 4·QA 8)→통합 1팀 13명(기획 7·QA 6·CS, 리더 본인), 타이틀 11→7, MM 기획 1.45→1.00·QA 0.73→0.86.
- 나이트워커 DAU 6.4만·D+1 52~56% · 슈퍼피플 중국 DAU 피크 7.1만·신규 56만+.
- 서비스 방향성 문서 2종 본인 작성 · 2026 "4축" 유지(원문 3대 핵심 전략 방향 병기) · 웹뷰 이벤트=형식을 고쳐 다시 도입.
- 용어: KO 라이브 서비스(운영직=라이브 운영) / EN live ops(운영직=game operations) · 이력서 국문 명사형 끝맺음 · 사례 문안은 원문 어휘.

## 산출물
사이트 KO/EN · `/deck/`(18장, 단일 파일 3.3MB) · PDF KO/EN 16쪽 · 노션 이력서 KO/EN · 헤드헌터 Word/PDF `OneDrive/내 자료 모음/Henry_Lim_Resume_EN_2026.*`(전화번호 포함, repo 금지) · 세션 보고서 아티팩트 https://claude.ai/artifact/Nx9TUbf8T35fwTygtePoEK

## 남은 것
- WO-41 완료 확인 → 퀴즈/요지 확인 → 배포.
- 후속 후보: 근거 썸네일 2장(4c6d6bba·8cbbe937) 콜아웃 잘림 · EN 390 h1 5줄 · Shadow Seven 넓은 카드 저해상도 · nanakage 확장자 404 · Figma 한도 풀리면 2026 슬라이드 s04·s09 원문 장표 추가.

## 함정
- r1-labor-guard 훅: 조종석의 .html/.py Write·Edit 차단(간헐) → 코드·HTML은 Opus 에이전트.
- 구글 문서(Slides·Drive)는 크롬 확장 조작 불가 → 본부장 직접.
- Figma MCP Starter 한도 → 슬라이드 캡처 10장 제한.
- 노션 콜아웃 첫 문장=근거 카드 요약(재빌드 시 카드 문구 바뀜), 업무 프로세스 체인 줄 필수.
- Bash run_in_background 10분 상한 · 서버 종료는 자기 PID만.
