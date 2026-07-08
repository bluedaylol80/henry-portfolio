# Henry Lim — 3D Interactive Portfolio

> **기획자의 진화 (The Evolution of a Planner)** — 게임 사업기획 17년 → AI 자동화 시스템 아키텍트.
> 스크롤에 따라 3D 파티클 월드가 6개 장면(은하 스웜 → 소용돌이 → 나선 경로 → 상승 기둥 → 3계층 네트워크 → 별밭)으로 변형되는 몰입형 원페이지 포트폴리오.

- **Live**: https://bluedaylol80.github.io/henry-portfolio/
- **Stack**: Vite + React 19 + TypeScript · React Three Fiber + drei · GSAP ScrollTrigger · Framer Motion · Lenis · Tailwind CSS
- 한/영 전환(우측 상단 KO/EN), 완전 반응형, 저사양·모바일·`prefers-reduced-motion` 폴백 내장.

## 🖊 콘텐츠 수정 방법 (비개발자용)

**문구·데이터는 두 파일에 있습니다:**
- 메인 페이지 전체: `src/content/profile.ts`
- 커리어 딥다이브(`/career` 지도 + 5단계 페이지): `src/content/journey.ts`

- 모든 텍스트는 `{ ko: '한국어', en: 'English' }` 짝으로 되어 있습니다. 두 언어를 함께 고치세요.
- 커리어 추가/수정: `career.entries` 배열 (회사, 역할, 기간, phase, 대표 타이틀).
- 대표 성과 숫자: `work.items` — `stat.ko` / `stat.en`의 `value`(숫자), `prefix`/`suffix`(문자), `decimals`(소수 자릿수)로 카운트업 표시가 결정됩니다.
- 연락처: `contact` (email / kakao / instagram / calendly URL).
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
npm run shoot      # 스크린샷 자가 점검 (dev 서버 켜둔 상태에서, 로컬 Chrome 필요)
```

## 📁 구조

```
src/
  content/profile.ts   ← 메인 페이지 문구·데이터
  content/journey.ts   ← 커리어 딥다이브(/career*) 문구·데이터
  content/types.ts     콘텐츠 타입 정의
  pages/               Landing(메인) · CareerHub(/career) · PhasePage(/career/:slug)
  lib/                 공용: i18n(한/영), scroll(Lenis+ScrollTrigger+진행도), quality(품질 티어), appState, motion
  three/               3D 씬: 파티클 모프 시스템, 아티팩트, 네트워크 라인, 카메라 리그
  components/          크롬: 프리로더, 내비, 커스텀 커서, 푸터, 2D 폴백 배경, SectionShell
  sections/            Hero / About / Career / Achievements(work) / AIChapter(ai) / Skills / Contact
SPEC.md                디자인·구현 스펙 (설계 원본)
scripts/shoot.mjs      스크린샷 QA 하니스
.github/workflows/     GitHub Pages 자동 배포
```

## ⚙️ 품질 티어 (자동 감지)

| 티어 | 조건 | 동작 |
|---|---|---|
| `full` | 데스크톱 + WebGL | 파티클 6,000 + Bloom + 커스텀 커서 + 마우스 패럴랙스 |
| `lite` | 모바일/저사양 | 파티클 2,200, 포스트프로세싱 없음 |
| `fallback` | `prefers-reduced-motion` 또는 WebGL 불가 | 3D 미탑재, 정적 그라디언트 배경, 모션 최소화 |

## 🖼 작업 스크린샷 넣는 법

커리어 딥다이브 페이지(`/career/:slug`)의 **작업 화면** 섹션은 스크린샷이 있을 때만 나타납니다.
(비어 있으면 섹션 자체가 숨겨집니다.)

1. 이미지를 `public/work/<slug>/` 폴더에 넣습니다.
   - `<slug>` = 단계 슬러그: `ops` · `fun-qa` · `business-pm` · `planning` · `ai-system`
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

## 💬 Whisper 서버 켜는 법

Contact 섹션의 **Whisper** 방명록은 서버가 설정되기 전까지 오프라인 상태(입력 비활성)로 표시됩니다.
서버는 구글 시트 + Apps Script 로 무료로 켤 수 있습니다.

1. 브라우저에서 [`sheets.new`](https://sheets.new) 로 새 스프레드시트를 만듭니다.
2. 상단 메뉴 **확장 프로그램 → Apps Script** → 열린 편집기에 `scripts/whisper-backend.gs` 내용을 **전체 붙여넣기** 후 저장.
3. **배포 → 새 배포 → 유형: 웹 앱**, 실행: **나**, 액세스 권한: **모든 사용자** → 배포. 최초 1회 권한 승인.
4. 발급된 `.../exec` 로 끝나는 웹앱 URL 을 복사해, `src/lib/whisperClient.ts` 의 `WHISPER_URL` 에 붙여넣습니다.

   ```ts
   export const WHISPER_URL = 'https://script.google.com/macros/s/AKfy.../exec'
   ```
5. `main` 에 push → 자동 배포. 이제 방명록이 온라인 상태가 됩니다.

- 규칙: 메시지 최대 30자, 한 방문자당 하나(localStorage + 서버 hash 중복 방지), 국기 이모지 선택, 가벼운 비속어 필터, 최신순 표시.
- 백엔드가 시트를 최근 200행으로 자동 정리하고, 화면에는 최신 30개까지 칩으로 보여줍니다.

---
Vibe-coded with AI · 2026
