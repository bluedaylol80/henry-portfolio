# Henry Lim — Interactive Portfolio

> **기획자의 진화 (The Evolution of a Planner)** — 게임 운영·사업·기획 19년 → AI 자동화 시스템 아키텍트.
> 홈이 Act 0~5로 이어지는 한 편의 스크롤 서사(히어로 → 연도 스크럽 2006→2026 → 지표가 결정이 되는 핀 구간 → 전환 → 컨트롤 룸 → 함께 일하기)이고, 대표 사례·커리어·3분 요약·탐험 무대가 별도 경로로 붙습니다.

- **Live**: https://bluedaylol80.github.io/henry-portfolio/
- **Stack**: Vite + React 19 + TypeScript · React Router · GSAP ScrollTrigger · Framer Motion(LazyMotion) · Lenis · Tailwind CSS
- 한/영 전환(우측 상단 KO/EN), 완전 반응형, 저사양·모바일·`prefers-reduced-motion` 폴백 내장.
- 연출은 정보의 관문이 아닙니다 — 스크롤 연출이 늦게 오거나 실패해도, 정지 상태 그대로 모든 문장과 숫자가 읽힙니다.

## 🗺 화면 구성

| 경로 | 화면 |
|---|---|
| `/` | 홈 — Act 0~5 스크롤 서사 |
| `/work/ai-os` | 대표 사례 AI-OS — 실측 카운터 + 운영 기록 리플레이 데모 |
| `/career` | 커리어 여정 허브 — 19년 타임라인 |
| `/career/:slug` | 단계별 딥다이브 4개 (`ops` · `business-pm` · `planning` · `ai-system`) |
| `/brief` | 3분 요약 — 지원용 PDF의 원천 |
| `/room` | 탐험 무대 — 사물을 열어보는 부가 화면 (홈 마지막 Act · 푸터에서 진입) |

## 🖊 콘텐츠 수정 방법 (비개발자용)

**문구·데이터는 `src/content/` 안에 있습니다** (검색결과·링크 미리보기 문구만 예외 — 아래 ⚠️):
- 홈(`/`) · 대표 사례(`/work/ai-os`) · 성과·스킬·연락처·푸터: `src/content/profile.ts`
- 커리어 딥다이브(`/career` 타임라인 + 4단계 페이지): `src/content/journey.ts`
- 3분 요약(`/brief`): `src/content/brief.ts`
- 탐험 무대(`/room`)의 사물·설명: `src/content/room.ts`

- 모든 텍스트는 `{ ko: '한국어', en: 'English' }` 짝으로 되어 있습니다. 두 언어를 함께 고치세요.
- 커리어 추가/수정: `journey.ts` 의 `phases` 배열 (슬러그, 기간, 회사, 역할, 한 줄 요약, 한 일). `/career` 타임라인 막대는 `timeline.spans` 가 따로 그립니다.
- 대표 성과 숫자: `profile.ts` 의 `work.items` — `stat.ko` / `stat.en`의 `value`(숫자), `prefix`/`suffix`(문자), `decimals`(소수 자릿수)로 카운트업 표시가 결정됩니다. 홈 Act 2의 결과 숫자도 여기서 가져옵니다.
- 홈 히어로의 검증 숫자 3개: `profile.ts` 의 `home.proof` (같은 `value`/`prefix`/`suffix`/`decimals` 규칙).
- 연락처: `contact` (email / kakao / instagram / calendly / Notion 상세이력 URL).
- ⚠️ `src/content/aiosEvidence.json` · `src/content/briefPdf.json` 은 **스크립트가 만드는 파일**입니다. 손으로 고치지 말고 아래 생성 스크립트를 다시 돌리세요.
- ⚠️ 검색결과·링크 미리보기 문구(제목·설명·OG/트위터 카드)는 **`index.html` 이 정본**입니다. 크롤러는 JS 실행 전 값을 읽으므로 `src/content/` 에 적어도 반영되지 않습니다. 히어로 문구를 고쳤다면 `index.html` 도 같이 고치고 `npm run og` 로 카드 이미지(`public/og.png`)를 다시 찍으세요.
- 저장 후 아래 "재배포"만 하면 반영됩니다.

## 🚀 재배포 방법

`main` 브랜치에 push하면 GitHub Actions가 자동으로 빌드·배포합니다 (1~2분 소요).

```bash
git add -A
git commit -m "content: update profile"
git push
```

수동 재실행: GitHub 저장소 → Actions → "Deploy to GitHub Pages" → Run workflow.

## 🛠 로컬 개발

```bash
npm install        # 최초 1회
npm run dev        # http://localhost:5173/henry-portfolio/
npm run build      # 프로덕션 빌드 (타입체크 포함)
npm run typecheck  # 타입체크만
npm run lint       # oxlint
npm run preview    # 빌드 결과 미리보기 (http://localhost:4173/henry-portfolio/)
npm run shoot      # 스크린샷 자가 점검 (dev 서버 켜둔 상태에서, 로컬 Chrome 필요)
npm run og         # 링크 미리보기 카드 public/og.png 재생성 (preview 4173 켜둔 상태에서)
```

`scripts/` 에는 화면 캡처(`shoot-*.mjs`)와 검증 하니스(`verify-*.mjs`, `measure-*.mjs`)가 버전별로 쌓여 있습니다.
모두 로컬 Chrome을 직접 몰아 실제 화면을 찍고 재는 용도이며, 빌드·배포에는 관여하지 않습니다.

## 🧾 자동 생성물 (스냅샷 · PDF)

사이트에 나가는 운영 수치와 지원용 PDF는 손으로 쓰지 않고 스크립트가 만듭니다.

```bash
node scripts/build-aios-evidence.mjs <개인시스템저장소경로>
#   → src/content/aiosEvidence.json  (/work/ai-os 의 카운터 + 리플레이 타임라인)
#   실제 운영 로그를 집계합니다. 자유 텍스트는 복사하지 않고,
#   허용 목록에 있는 열거형 필드만 읽어 통계로 환원합니다(유출 방지).

npm run preview                 # 먼저 4173 을 띄워 둘 것
node scripts/build-pdf.mjs http://localhost:4173/henry-portfolio/ ko
node scripts/build-pdf.mjs http://localhost:4173/henry-portfolio/ en
#   → public/brief/henry-lim-brief-{ko,en}.pdf + src/content/briefPdf.json
#   `/brief` 화면을 인쇄 스타일(@media print, src/index.css)로 렌더해 A4로 뽑습니다.
#   사이트가 곧 원천이라 문구가 두 벌로 갈라지지 않습니다.
```

## 📁 구조

```
src/
  content/profile.ts   ← 홈 · 대표 사례 · 성과 · 스킬 · 연락처 문구·데이터
  content/journey.ts   ← 커리어 딥다이브(/career*) 문구·데이터
  content/brief.ts     ← 3분 요약(/brief) 문구
  content/room.ts      ← 탐험 무대(/room) 사물·설명
  content/types.ts     콘텐츠 타입 정의
  content/*.json       스크립트가 만드는 스냅샷 (aiosEvidence · briefPdf) — 직접 수정 금지
  pages/               Home(/) · WorkAiOs(/work/ai-os) · CareerHub(/career) · PhasePage(/career/:slug)
                       BriefPage(/brief) · RoomPage(/room) · LabScrolly(/lab/scrolly, 링크 없는 실험용)
  home/homeScrolly.ts  홈 Act 서사 컨트롤러 — 동적 import 전용(gsap을 첫 로딩 번들 밖에 둠)
  room/                탐험 무대 부품: 히어로 이미지 내비, 핀, 상세 카드, 범례, 폴백 그리드
  lib/                 공용: i18n(한/영), scroll(Lenis), quality(품질 티어), appState, motion, sound
  components/          크롬·부품: 프리로더, 헤더, 커스텀 커서, 푸터, 디버그 패널,
                       ArchDiagram(3계층 시그니처 도식) · OpsEvidence(리플레이 데모) ·
                       CareerTimeline · WorkGallery · WorkLoop
SPEC.md                디자인·구현 스펙 (설계 원본)
index.html             검색결과·링크 미리보기 메타(제목·설명·OG/트위터) 정본
design-system/         디자인 기준 MASTER.md — 색·타이포·간격 실측 기록
scripts/               캡처·검증 하니스(shoot/verify/measure) + 스냅샷·PDF·OG 카드 생성기
.github/workflows/     GitHub Pages 자동 배포
```

## ⚙️ 품질 티어 (자동 감지)

| 티어 | 조건 | 동작 |
|---|---|---|
| `full` | 데스크톱 + WebGL | 부드러운 스크롤(Lenis) + 커스텀 커서 + 스크롤 연출 전부 |
| `lite` | 모바일 · 저사양(코어/메모리 낮음) | 커스텀 커서 없음, 나머지는 동일 |
| `fallback` | `prefers-reduced-motion` 또는 WebGL 불가 | 부드러운 스크롤·커서 끔, `/room` 은 텍스트 메뉴 그리드로 대체 |

동작 최소화(`prefers-reduced-motion`)일 때는 홈의 스크롤 연출 모듈을 아예 내려받지 않습니다.
마크업의 정지 상태가 곧 완성 상태라서(3비트는 세로로 다 읽히고 숫자는 최종값), 붙일 연출이 없기 때문입니다.

## 🖼 작업 스크린샷 넣는 법

커리어 딥다이브 페이지(`/career/:slug`)의 **작업 화면** 섹션은 `gallery` 배열이 비어 있으면 통째로 숨겨집니다.
`src` 가 빈 항목은 "스크린샷 예정 · coming soon" 자리표시 카드로 보이므로, 캡션만 먼저 적어 자리를 잡아둘 수 있습니다.

1. 이미지를 `public/work/<slug>/` 폴더에 넣습니다.
   - `<slug>` = 단계 슬러그: `ops` · `business-pm` · `planning` · `ai-system`
   - 예: `public/work/planning/dashboard.png`
2. `src/content/journey.ts` 에서 해당 단계의 `gallery` 배열에 항목을 추가합니다.

   ```ts
   gallery: [
     { src: 'work/planning/dashboard.png', caption: { ko: '팀 업무현황판', en: 'Team dashboard' } },
     { src: 'work/planning/notion.png',    caption: { ko: 'Notion 히스토리 체계', en: 'Notion history system' } },
   ],
   ```

   - `src` 는 `public/` 기준 상대경로(맨 앞 `/` 없이). 화면에는 `BASE_URL` 이 자동으로 붙습니다.
   - `caption` 은 `{ ko, en }` 짝. 갤러리 카드 캡션 + 라이트박스 캡션 + 이미지 대체텍스트로 쓰입니다.
3. `main` 에 push → 자동 배포. 이미지를 클릭하면 라이트박스로 크게 볼 수 있습니다(배경 클릭 · ESC · X 로 닫힘).

## 💬 Whisper 방명록 (지금은 화면에 없음)

v20 개편 때 Contact 의 **Whisper** 방명록이 화면에서 내려갔습니다.
백엔드 스크립트(`scripts/whisper-backend.gs`)는 그대로 남아 있지만,
문구(`profile.ts` 의 `whisper`)는 2026-08-05 콘텐츠 정리 때 지웠고 이를 호출하는 클라이언트와 UI도 없어
사이트에는 나타나지 않습니다. 다시 켜려면 문구·클라이언트·Contact 섹션 UI를 새로 붙여야 합니다.

---
Vibe-coded with AI · 2026
