# DESIGN — 무엇을 만드는가 (루프용 정본 포인터)

이 파일은 새 정본이 아니라 **기존 정본으로 가는 이정표**다. 충돌 시 아래 원본이 이긴다.

## 정본 (구속력 순)
1. `design/concepts/V23_CONCEPT_SPEC.md` — v23 확정 설계. **확정 카피 전문(히어로·성과 4장·경력 10행·역량)은 수정 금지.**
2. `REBOOT_v23_BRIEF.md` — 리부트 브리프(6게이트·조직도·성능 기조).
3. `design-system/henry-lim-portfolio/MASTER.md` §0 — **"브리프가 이긴다"**: 디자인 도구·취향 제안이 확정 아이덴티티를 갈아엎는 것은 실패로 기록된 선례.
4. `design/reference/LUMORA_SPEC.md` — 레퍼런스(Quiet Paper 계열).

## 콘텐츠의 유일 근거
- `D:\Github\HT_multi\northstar-os\career\09_jobhunt\2026-08-11_career_fact_sheet.md`
- 카피 창작·수치 변경 절대 금지. 팩트시트 밖 수치 금지.

## 금지선
- 🔴 회사 내부자료 공개 금지.
- AI 슬롭 금지선: 보라/파랑 그라데이션, glassmorphism 남용, 이모지, 스톡 일러스트·아이콘 세트,
  동일 카드 3개 나열, "혁신적/열정적" 류 공허 카피.
- 가벼움 불변: 현재 site/index.html 단일 파일 약 52KB. 새 외부 의존 추가는 INBOX 승인 필요.

## 기지의 수용된 이탈 (버그로 재발견 금지)
- 창 너비 640/1024/1440px 경계에서 글자 크기 한 단계 스냅 — Lumora 캔버스 스케일 방식 고유.
  R2는 FAIL 의견, R1 부분 수용, 최종 판단 본부장 보류 상태 (`design/concepts/V23_BUILD_REPORT.md` §5).

## 배포 규칙
- main push = 39초 뒤 실사이트 발행(빌드·게이트 없음). **배포는 사람 전용.**
- 루프는 `loop-v23` 브랜치에 갇혀 작업하고, 머지·배포는 본부장 결재로만.
