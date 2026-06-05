import { GetMyProfileUseCase } from "@/features/profile/application/get-my-profile";
import { ExternalProfileRepository } from "@/features/profile/infrastructure/external-profile-repository";
import { createAuthedServerHttpClient } from "@/shared/lib/http/create-server-http-client";

/**
 * use case 조립부. accessToken을 부착한 authed 클라이언트로 repo→usecase를 와이어링한다.
 * (bootstrap-use-case-factory 패턴 + 인증 헤더 주입)
 */
export function createGetMyProfileUseCase(
  accessToken: string,
): GetMyProfileUseCase {
  const httpClient = createAuthedServerHttpClient(accessToken);
  const profileRepository = new ExternalProfileRepository(httpClient);

  return new GetMyProfileUseCase(profileRepository);
}
