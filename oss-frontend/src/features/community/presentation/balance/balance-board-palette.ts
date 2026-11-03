/**
 * 스코어보드 판 색(#305) — 히어로 판·접힌 바·로딩 뼈대가 함께 쓴다.
 *
 * "use client" 파일 밖에 두는 이유: 서버에서 그리는 로딩 뼈대(loading.tsx)도 이 값을 읽는다. 클라이언트
 * 모듈의 상수는 서버 컴포넌트에서 참조로 바뀌어 값으로 쓸 수 없다.
 *
 * 먹색 판: 무채색이라 홍·청 진영 색과 부딪히지 않는다(남색은 앱 파랑·청 진영 파랑 옆에서 "세 번째 파랑"이
 * 되어 겉돌았다). 원시값을 쓰는 이유: 판 바탕은 시맨틱 토큰이 없다(page.tsx와 같은 방식).
 */
export const BOARD_PALETTE = {
  bg: "bg-[var(--cool-gray-900)]",
  text: "text-text-on-dark",
  muted: "text-[var(--opacity-white-60)]",
  /** 꺼진 선수 줄·남은 시간 알약 — 판 위에 한 단 떠 보이는 면 */
  row: "bg-[color-mix(in_srgb,var(--bw-white)_9%,transparent)]",
} as const;
