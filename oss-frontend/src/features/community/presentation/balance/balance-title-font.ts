import localFont from "next/font/local";

/**
 * 홈 밸런스 게임 카드 제목에만 쓰는 글꼴 — 여기어때 잘난체.
 *
 * 본문 글꼴(Pretendard)과 달리 파일을 앱에 함께 싣는다. 기기에 없는 글꼴이라 이름만 선언하면 폴백으로
 * 떨어진다. 한 화면 제목 한 줄에만 쓰고 파일이 커서(약 390KB) 미리 받지 않는다 — 받기 전에는 본문
 * 글꼴로 먼저 그리고 받으면 바꾼다(display: swap).
 *
 * 라이선스(fonts/LICENSE.md): 상업 사용·웹 임베딩 가능, 글꼴 수정·재배포·판매 금지. 그래서 글자를
 * 잘라내지(서브셋) 않고 원본 그대로 woff → woff2 형식만 바꿔 실었다.
 */
export const balanceTitleFont = localFont({
  src: "./fonts/jalnan.woff2",
  preload: false,
  display: "swap",
});
