/**
 * 핀 좌표 — 히어로 이미지(room-hero-b.webp) 기준의 분율(0–1).
 *
 * 이미지 안에서의 위치이므로 뷰포트 크기와 무관하게 사물에 고정된다. 히어로
 * 이미지를 교체하면 **반드시 다시 측정**해야 한다(다른 렌더는 가구가 다른 곳에
 * 있다). 컴포넌트 파일이 아니라 여기 두는 이유: RoomPage도 이 좌표를 읽어
 * 사물 카드를 어느 쪽에 띄울지 정한다(핀을 가리지 않게).
 */
export const PINS: Record<string, { x: number; y: number }> = {
  frame: { x: 0.157, y: 0.415 }, // framed poster, left wall (→ 대표 성과)
  bookshelf: { x: 0.216, y: 0.595 }, // tall bookshelf, left (→ 커리어)
  speaker: { x: 0.336, y: 0.388 }, // studio speaker on the shelf (→ 배경 음악)
  desk: { x: 0.372, y: 0.535 }, // desk + glowing monitor (→ 소개)
  tv: { x: 0.612, y: 0.458 }, // wall TV, right (→ 상세 이력)
  server: { x: 0.74, y: 0.52 }, // server rack tower, back-right (→ AI 챕터)
  coffee: { x: 0.633, y: 0.685 }, // right side-table with the coffee mug (→ 커피챗;
  // owner 2026-07-12: the coffee-chat spot is the sofa, but the PIN sits on the
  // right round side table where the mug is, not on the sofa itself)
}
