import { readSessionToken } from "@/shared/lib/auth/session-cookie";

/**
 * 서버측 세션 가드.
 *
 * 글쓰기·댓글·좋아요 같은 보호된 행위의 Server Action/Route 진입부에서 호출한다.
 * 클라이언트 게이트(requireAuth)는 UX용이고, 이 서버측 재검증이 실제 보안 경계다.
 */
export class SessionRequiredError extends Error {
  constructor() {
    super("Authentication required.");
    this.name = "SessionRequiredError";
  }
}

/** 세션 토큰을 보장한다. 없으면 SessionRequiredError를 throw. */
export async function requireSessionToken(): Promise<string> {
  const token = await readSessionToken();

  if (!token) {
    throw new SessionRequiredError();
  }

  return token;
}
