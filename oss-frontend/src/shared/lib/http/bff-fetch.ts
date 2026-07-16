import { refreshSessionViaBridge } from "@/shared/lib/native-bridge";

/**
 * 브라우저 → BFF(/api/*) 호출 공통 래퍼.
 *
 * WHY: 세션 쿠키의 accessToken이 만료되면 백엔드가 A0003을 반환하는데, refreshToken은
 * 네이티브 Keychain에만 있어 웹은 스스로 갱신할 수 없다. 만료를 감지하면 네이티브에 갱신을
 * 위임(single-flight)하고, 새 세션이 서면 "실패한 그 호출만" 1회 재시도한다. 갱신 실패(세션
 * 만료)면 원래 만료 응답을 그대로 반환해 호출부가 처리한다.
 *
 * `fetch`와 동일 시그니처(입력 URL + init)라, 클라이언트 BFF 호출은 `fetch` → `bffFetch`
 * 치환만 하면 되고 이후 `response.ok`/status 처리는 그대로 둔다. (서버사이드 업스트림 호출은
 * `HttpClient`가 담당하며 이 래퍼와 무관하다.)
 */

/** 백엔드 만료 토큰(A0003) 응답 여부. 커뮤니티 BFF는 업스트림 error.body를 details로 실어 내려준다. */
async function isExpiredTokenResponse(response: Response): Promise<boolean> {
  if (response.status !== 403) return false;
  try {
    const body = (await response.clone().json()) as {
      details?: { code?: string };
    } | null;
    return body?.details?.code === "A0003";
  } catch {
    return false;
  }
}

export async function bffFetch(
  input: string,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(input, init);
  if (!(await isExpiredTokenResponse(response))) return response;

  try {
    await refreshSessionViaBridge();
  } catch {
    return response;
  }
  return fetch(input, init);
}
