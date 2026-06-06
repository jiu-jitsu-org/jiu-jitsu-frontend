import type { UserProfile } from "@/features/profile/domain/profile";
import type { ProfileRepository } from "@/features/profile/domain/profile-repository";
import type { HttpClient } from "@/shared/lib/http";

/**
 * 업스트림 프로필 API를 사용하는 infrastructure 구현.
 *
 * Authorization 헤더는 주입된 authed HttpClient가 부착한다.
 *
 * 경로 prefix `/api`: 업스트림은 {API_BASE_URL}/api/... 아래에 라우트가 있다.
 * (동작 중인 bootstrap의 "/api/bootstrap/info"와 동일 규칙. Swagger의 /user/profile은
 *  base가 이미 /api를 포함한 상대경로다.)
 *
 * 응답 봉투: 이 백엔드는 모든 응답을 { success, code, message, data } 로 감싼다.
 * 실제 프로필은 `data` 안에 있으므로 한 겹 벗겨 반환한다. (bootstrap 응답과 동일 규칙)
 */
const PROFILE_ENDPOINT_PATH = "/api/user/profile";

type ProfileEnvelope = {
  success: boolean;
  code: string;
  message: string;
  data: UserProfile;
};

export class ExternalProfileRepository implements ProfileRepository {
  constructor(private readonly httpClient: HttpClient) {}

  async getMyProfile(): Promise<UserProfile> {
    const response = await this.httpClient.get<ProfileEnvelope>({
      path: PROFILE_ENDPOINT_PATH,
    });

    return response.data;
  }
}
