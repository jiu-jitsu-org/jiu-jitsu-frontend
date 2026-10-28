/**
 * 주짓수 띠·그랄 도메인 타입 (#265).
 *
 * 원본은 커뮤니티 프로필(GET /community/profile)의 beltRank·beltStripe다. 커뮤니티 화면은
 * 작성자 사진에 띠 색과 그랄 줄을 함께 그린다. 성인 5띠만 다룬다(키즈 띠는 제외).
 */
export type BeltRank = "white" | "blue" | "purple" | "brown" | "black";

/** 그랄(띠 끝 검은 칸의 줄) 수. 0~4. */
export type BeltGrau = 0 | 1 | 2 | 3 | 4;

export type Belt = {
  rank: BeltRank;
  grau: BeltGrau;
};
