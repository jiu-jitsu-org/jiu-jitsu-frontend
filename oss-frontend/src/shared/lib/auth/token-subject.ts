/**
 * 액세스 토큰(JWT)의 사용자(`sub`)를 읽는다. 읽지 못하면 null.
 *
 * 서명을 검증하지 않는다 — 세션 BFF가 "직전과 다른 계정인지" 비교하는 데만 쓴다(#511).
 * 토큰 유효성 · 권한은 지금처럼 업스트림(BE)이 매 요청 검증한다.
 */
export function readTokenSubject(token: string): string | null {
  const payload = token.split(".")[1];
  if (!payload) return null;

  try {
    const claims: unknown = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
    const sub =
      typeof claims === "object" && claims !== null
        ? (claims as { sub?: unknown }).sub
        : undefined;

    return typeof sub === "string" && sub !== "" ? sub : null;
  } catch {
    return null;
  }
}
