/**
 * 사용자 프로필 도메인 타입.
 *
 * 레거시: GET /user/profile (현재 로그인한 사용자의 프로필 조회) 응답 계약.
 * 프레임워크/인프라에 의존하지 않는 순수 타입만 둔다.
 */

export type ProfileImage = {
  id: number;
  imageUrl: string;
};

export type UserProfile = {
  userId: number;
  email: string;
  nickname: string;
  profileImage?: ProfileImage | null;
  /** 소셜 로그인 제공자. 예: "KAKAO" */
  snsProvider: string;
  ownerRequested: boolean;
  ownerRequestImage?: ProfileImage | null;
  /** 예: "USER" */
  role: string;
  /** 예: "ACTIVE" */
  status: string;
};
