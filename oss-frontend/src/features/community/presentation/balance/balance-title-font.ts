import localFont from "next/font/local";

/**
 * 홈 밸런스 게임 카드 제목 전용 폰트 — 롯데리아 딱붙어체(#249).
 *
 * WHY 여기서 불러오는가: next/font는 이 모듈을 쓰는 라우트에만 폰트를 미리 받는다. 루트 레이아웃에
 * 두면 상세·글쓰기 웹뷰까지 쓰지도 않는 178KB를 받는다.
 *
 * 라이선스: 상업 이용·임베딩은 가능하지만 **수정·재배포 금지**다. 서브셋으로 글자를 덜어내지 말고
 * 받은 파일 그대로 둔다.
 */
export const balanceTitleFont = localFont({
  src: "./fonts/LotteriaDdag.woff2",
  weight: "400",
  display: "swap",
  fallback: ["Pretendard", "Noto Sans KR", "sans-serif"],
});
