import { getServerEnv } from "@/config/env";
import { HttpClient } from "@/shared/lib/http/http-client";

/**
 * Factory for server-side HTTP clients.
 *
 * Every BFF feature can reuse this instead of reconstructing env-aware clients
 * on its own. If auth headers, tracing, or logging are needed later, this is
 * one of the first places to extend.
 */
export function createServerHttpClient(): HttpClient {
  const env = getServerEnv();

  return new HttpClient({
    baseUrl: env.apiBaseUrl,
    timeoutMs: env.apiTimeoutMs,
  });
}

/**
 * 인증이 필요한 업스트림 호출용 클라이언트.
 *
 * 세션 쿠키에서 꺼낸 accessToken을 `Authorization: Bearer`로 부착한다.
 * 보호된 BFF 요청(예: GET /user/profile)에서 재사용한다.
 */
export function createAuthedServerHttpClient(accessToken: string): HttpClient {
  const env = getServerEnv();

  return new HttpClient({
    baseUrl: env.apiBaseUrl,
    timeoutMs: env.apiTimeoutMs,
    defaultHeaders: { Authorization: `Bearer ${accessToken}` },
  });
}
