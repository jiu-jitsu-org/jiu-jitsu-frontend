import type { UserProfile } from "@/features/profile/domain/profile";

/**
 * 프로필 도메인 계약.
 *
 * application 레이어는 이 인터페이스에만 의존하고, 실제 엔드포인트/헤더/HTTP 세부는
 * infrastructure 구현이 안다. 인증 토큰은 클라이언트 구성 시점에 주입되므로
 * 이 메서드는 토큰을 인자로 받지 않는다.
 */
export interface ProfileRepository {
  getMyProfile(): Promise<UserProfile>;
}
