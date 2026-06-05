import type { UserProfile } from "@/features/profile/domain/profile";
import type { ProfileRepository } from "@/features/profile/domain/profile-repository";
import { HttpClient } from "@/shared/lib/http/http-client";

/**
 * 업스트림 프로필 API를 사용하는 infrastructure 구현.
 *
 * 레거시: GET /user/profile — Authorization 헤더는 주입된 authed HttpClient가 부착한다.
 * 업스트림 응답이 UserProfile 형태와 동일하므로 그대로 매핑한다.
 */
const PROFILE_ENDPOINT_PATH = "/user/profile";

export class ExternalProfileRepository implements ProfileRepository {
  constructor(private readonly httpClient: HttpClient) {}

  async getMyProfile(): Promise<UserProfile> {
    return this.httpClient.get<UserProfile>({ path: PROFILE_ENDPOINT_PATH });
  }
}
