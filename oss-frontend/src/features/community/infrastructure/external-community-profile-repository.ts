import type { Belt } from "@/features/community/domain/belt";
import type { CommunityProfileRepository } from "@/features/community/domain/community-profile-repository";
import {
  type AuthorBeltDto,
  toBelt,
  toBeltDto,
} from "@/features/community/infrastructure/belt-dto";
import type { HttpClient } from "@/shared/lib/http";

/**
 * 업스트림 커뮤니티 프로필 API infrastructure 구현 (#275).
 *
 * - GET  /community/profile → 내 프로필(없으면 닉네임·사진만, 나머지 null)
 * - POST /community/profile → 항목 묶음(profileRequestType) 단위 생성/수정
 *
 * 띠는 BELT_WEIGHT 묶음에 성별·체급·체급 숨기기와 함께 들어 있고, 서버는 그 묶음을 통째로 덮어쓴다
 * (CommunityProfile.upsertBeltWeight). 띠만 보내면 앱 MY에서 입력한 성별·체급이 지워지므로, 저장 직전에
 * 현재 값을 읽어 그대로 함께 보낸다.
 *
 * FIXME: 읽기와 쓰기가 두 번의 호출이라, 그 사이에 앱 MY에서 성별·체급을 저장하면 읽어 둔 옛 값으로
 * 덮인다. 웹에서는 막을 수 없다 — 서버에 띠만 고치는 묶음(예: BELT)이 생기면 읽기를 빼고 그걸 쓴다.
 */
const COMMUNITY_PROFILE_PATH = "/api/community/profile";

type Envelope<T> = {
  success: boolean;
  code: string;
  message: string;
  data: T;
};

type CommunityProfileDto = AuthorBeltDto & {
  gender?: string | null;
  weightKg?: number | null;
  isWeightHidden?: boolean | null;
};

export class ExternalCommunityProfileRepository implements CommunityProfileRepository {
  constructor(private readonly httpClient: HttpClient) {}

  async getMyBelt(): Promise<Belt | null> {
    return toBelt(await this.getProfile());
  }

  async saveMyBelt(belt: Belt): Promise<void> {
    const current = await this.getProfile();

    await this.httpClient.post<Envelope<CommunityProfileDto>>({
      path: COMMUNITY_PROFILE_PATH,
      body: {
        profileRequestType: "BELT_WEIGHT",
        ...toBeltDto(belt),
        gender: current?.gender ?? null,
        weightKg: current?.weightKg ?? null,
        isWeightHidden: current?.isWeightHidden ?? null,
      },
    });
  }

  private async getProfile(): Promise<CommunityProfileDto | null> {
    const response = await this.httpClient.get<
      Envelope<CommunityProfileDto | null>
    >({ path: COMMUNITY_PROFILE_PATH });

    return response.data;
  }
}
