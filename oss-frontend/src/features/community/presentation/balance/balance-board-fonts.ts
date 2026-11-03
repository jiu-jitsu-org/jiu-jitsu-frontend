import { Black_Han_Sans, Kanit } from "next/font/google";

/*
 * 밸런스 게임 스코어보드 폰트(#305). 둘 다 Google Fonts(OFL)라 상업 이용·임베딩이 된다.
 *
 * WHY 여기서 불러오는가: next/font는 이 모듈을 쓰는 라우트에만 폰트를 받는다. 루트 레이아웃에 두면
 * 밸런스 게임이 없는 화면까지 받는다.
 */

/**
 * 제목 "오늘의 밸런스 게임" — 블랙 한 산스. 굵은 헤드라인 고딕이라 스포츠 신문 제목처럼 읽힌다.
 * 한글 글리프는 Google이 유니코드 범위별로 쪼개 주므로 화면에 쓰인 글자 묶음만 받는다. 미리 받기는
 * 라틴 묶음만 걸린다(subsets) — 한글 묶음은 쓰일 때 받는다.
 */
export const balanceTitleFont = Black_Han_Sans({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  fallback: ["Pretendard", "Noto Sans KR", "sans-serif"],
});

/**
 * 숫자 — 카니트 엑스트라볼드. 경기 시계, 점수 자리의 A·B, 상세 득표율이 함께 쓴다. 기울이지 않는다
 * (기울인 서체는 굴러가는 숫자 칸 밖으로 획이 삐져 잘린다).
 */
export const balanceNumeralFont = Kanit({
  weight: "800",
  subsets: ["latin"],
  display: "swap",
  fallback: ["Pretendard", "sans-serif"],
});
