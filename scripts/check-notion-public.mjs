/**
 * Notion 공개 판정 (팩트시트 §9-2 후보) — WO 2026-09-04 WO-1 ①
 *
 * HTTP 200은 공개 증명이 아니다(비공개·없는 id도 200 + "찾을 수 없음" 셸을 준다).
 * 그래서 실브라우저로 열어 본문이 렌더된 것만 공개로 판정한다.
 *
 *   공개(public)   = 제목 텍스트가 있고 · 본문 블록이 있고 · not-found/로그인 문구가 없다
 *   비공개(private) = 위 조건 하나라도 깨짐
 *
 * 결과 -> docs/handover/2026-09-04_notion_public_check.json
 * Usage: node scripts/check-notion-public.mjs [outJson]
 */
import puppeteer from 'puppeteer-core'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const BASE = 'https://cord-timpani-ea7.notion.site/'
const OUT = process.argv[2] ?? 'docs/handover/2026-09-04_notion_public_check.json'

/* 팩트시트 §9-2 표 그대로. 금지 3건(2c099a8d·36359de7·1f999a8d)은 애초에 넣지 않는다. */
const CANDIDATES = [
  { group: '허브', label: '이력 및 경력 기술서', id: '0e48e826c73f4a7ab9c3522d7fb16ce5' },
  { group: '린', label: '인게임 개선 제안', id: '09624ec9cbdb4dd9a53085f168bfcfa7' },
  { group: '카오스크로니클', label: '초반 동선 폴리싱', id: '0fcb2233c75c4b04b5317fe2ded2fec4' },
  { group: '카오스크로니클', label: 'BM 기획 및 제안', id: '508469dc0586497f8ce75618b142e29a' },
  { group: '카오스크로니클', label: '이벤트 기획', id: 'aa5b9015b7c044809731b0e073012101' },
  { group: '나이트워커', label: '유료 재화 구매 연동', id: '49043d5d2bfa44d18384126bbbd86f14' },
  { group: '나이트워커', label: '쿠폰 시스템 연동', id: '2ade8f618bb945a6b0c0f6a711133b55' },
  { group: '나이트워커', label: '서버 선택창 UI/플로우', id: '581e150745124f13b3d6d3721841b1c2' },
  { group: '나이트워커', label: '프로모션 상품', id: '39a59de7280481888c8dff7c54446d1f' },
  { group: '나이트워커', label: '수습 평가안', id: 'f1fa5736d25f4b3798fa3849a66d5863' },
  { group: '나이트워커', label: '원티드 콜라보', id: '509a5cd4e8e44f1c907ec1cfabb87855' },
  { group: 'Five Stars', label: '쇼케이스', id: '4c6d6bbaaee24779ba80cce602592248' },
  { group: 'Five Stars', label: '업데이트 방향성', id: 'b14364484326425d981697677cf386ab' },
  { group: 'Five Stars', label: '경영진 보고', id: '29609a7acf9046be87cdee55d11d9f30' },
  { group: 'Shadow Seven', label: '재화/BM 개선', id: 'f6a1be10d1d645d48f62aa02e72198f2' },
  { group: 'Shadow Seven', label: '소프트런칭 비교 분석', id: '8cbbe93738e54e0d99020f2f6d03822f' },
  { group: 'Shadow Seven', label: '평점 관리 시스템', id: '87c69184413f4cb78d66af21a98de32f' },
  { group: '넥슨 공통', label: '주요 이슈 지표 분석', id: 'c2899733fed94b618af970a0796a7e6c' },
  { group: '넥슨 공통', label: '프로젝트별 포스트모템', id: '271affb46a12423bbb26dd3cdc183ae0' },
  { group: '넥슨 공통', label: '런닝맨 마일스톤 협의', id: '9a16f26d31cf438482942ce4baa00001' },
  { group: '네오위즈', label: '친구 시스템', id: '13f2864c7af74918b5a956367ddfdcb6' },
  { group: '네오위즈', label: '상점 시스템', id: '7298379e8a254d63b64747242afe60ff' },
  { group: '네오위즈', label: '인게임 밸런스', id: '34f448cf443b415181d7d8fe05f2d7b0' },
  { group: '네오위즈', label: '개발 회고', id: '69a7c535df97479e8e3539027b9566bd' },
  { group: '넷마블 블루', label: '튜토리얼 Flow', id: '47f569402610444e90b6944e84a2d235' },
  { group: '소프트닉스', label: 'FGI&FGT 기획', id: '32d0763c70714ce6af760a2312657da7' },
  { group: '소프트닉스', label: '유료화 타이틀 분석', id: 'cd308df4eafa4e66868de83e459fcdde' },
  { group: '소프트닉스', label: '게임 시장 현황', id: '98d467b255b34ee1a4942ae49d12f121' },
]

/* Notion 미공개 셸의 실제 문구(2026-09-04 실측): 한국어 '페이지 찾지 못함 / 사용 권한이 없거나 …',
   영어 "This page couldn't be found / You may not have access …". 곡선 아포스트로피(U+2019)에 주의. */
const DENY = [
  '찾지 못함', '찾을 수 없', '페이지를 찾을', '권한이 없', '삭제 또는 이동',
  'not found', "couldn't be found", '’t be found', 'may not have access',
  "don't have access", 'request access', 'private page', 'no longer exists',
]

const sleep = ms => new Promise(r => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--lang=ko-KR'],
})

const results = []
for (const c of CANDIDATES) {
  const url = BASE + c.id
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 900 })
  const row = { ...c, url, public: false, title: '', reason: '' }
  try {
    const res = await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 })
    row.status = res ? res.status() : 0
    await page.waitForSelector('.notion-page-content, [class*="notion-page-content"]', { timeout: 20000 }).catch(() => {})
    await sleep(1200)
    const probe = await page.evaluate(() => {
      const t = document.querySelector('.notion-page-block, main h1, [class*="notion-page-content"] h1')
      const content = document.querySelector('.notion-page-content, [class*="notion-page-content"]')
      const blocks = content ? content.querySelectorAll('[data-block-id], .notion-text-block, .notion-header-block, .notion-sub_header-block, .notion-bulleted_list-block, .notion-numbered_list-block, .notion-image-block, .notion-table-block, .notion-toggle-block').length : 0
      return {
        docTitle: (document.title || '').trim(),
        heading: (t ? t.innerText : '').trim().slice(0, 120),
        blocks,
        body: (document.body.innerText || '').slice(0, 4000).toLowerCase(),
      }
    })
    row.title = probe.heading   // docTitle은 미공개 셸에서도 페이지명을 흘리므로 판정 근거로 쓰지 않는다
    row.docTitle = probe.docTitle
    row.blocks = probe.blocks
    const hit = DENY.find(d => probe.body.includes(d.toLowerCase()))
    if (hit) row.reason = '차단 문구: "' + hit + '"'
    else if (!row.title) row.reason = '제목 텍스트 없음'
    else if (!probe.blocks) row.reason = '본문 블록 0개'
    else { row.public = true; row.reason = '본문 블록 ' + probe.blocks + '개 렌더' }
  } catch (e) {
    row.reason = '로드 실패: ' + String(e.message).slice(0, 120)
  }
  await page.close()
  results.push(row)
  console.log((row.public ? 'PUBLIC  ' : 'PRIVATE ') + c.group + ' / ' + c.label + '  — ' + row.reason)
}

await browser.close()

const out = {
  checkedAt: new Date().toISOString(),
  base: BASE,
  method: '실브라우저 본문 렌더 판정(제목 + 본문 블록 존재 · not-found/권한 문구 부재)',
  denyListed: ['2c099a8d… SuperStar 2026 비전', '36359de7… 만족도 설문 요약', '1f999a8d… SSPH 3'],
  total: results.length,
  publicCount: results.filter(r => r.public).length,
  results,
}
mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n', 'utf8')
console.log('\n공개 ' + out.publicCount + ' / ' + out.total + ' -> ' + OUT)
