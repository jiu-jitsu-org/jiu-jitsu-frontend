/**
 * 사진 가장자리 옅은 선 — 흰 바탕 사진이 흰 화면에 묻혀 경계가 사라지지 않게 한다.
 * 사진 위에 얹는 안쪽 선(::after)이라 크기·자리를 바꾸지 않는다.
 * 진한 회색(border-strong)을 8%만 깔아 흰 사진엔 연한 회색 선, 어두운 사진엔 거의 안 보이는 선이 된다.
 * 감싸는 칸에 relative·rounded 가 있어야 한다.
 */
export const IMAGE_OUTLINE_CLASS =
  "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:border after:border-border-strong/8";
