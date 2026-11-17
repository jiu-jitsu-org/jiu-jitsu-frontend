import { refreshSessionViaBridge } from "@/shared/lib/native-bridge";

type ActionResult = { ok: true } | { ok: false; reason: string };

/** 만료 갈래를 로그인 안내 갈래로 바꾼 결과 — 화면은 지금처럼 unauthenticated만 다룬다. */
export type SettledResult<T> = T extends { ok: false; reason: infer R }
  ? Omit<T, "reason"> & { reason: Exclude<R, "expired"> | "unauthenticated" }
  : T;

/**
 * 대회 Server Action을 부르고, 접근 토큰이 만료돼 실패했으면(expired) 앱에 갱신을 맡긴 뒤 한 번만 다시 부른다(#524).
 *
 * 대회 화면의 요청은 모두 Server Action이라 커뮤니티의 bffFetch(만료 → 갱신 → 재시도)를 타지 않는다. 서버는
 * refreshToken이 없어 스스로 갱신할 수 없으므로 같은 일을 화면에서 한다. 갱신이 안 되거나(앱 밖 · 실제 로그아웃)
 * 다시 불러도 만료면 unauthenticated로 돌려 화면이 지금처럼 로그인 안내를 띄우게 한다.
 */
export async function retryAfterSessionRefresh<T extends ActionResult>(
  call: () => Promise<T>,
): Promise<SettledResult<T>> {
  const first = await call();
  if (first.ok || first.reason !== "expired") return first as SettledResult<T>;

  try {
    await refreshSessionViaBridge();
  } catch {
    return { ...first, reason: "unauthenticated" } as SettledResult<T>;
  }

  const second = await call();
  if (second.ok || second.reason !== "expired") {
    return second as SettledResult<T>;
  }
  return { ...second, reason: "unauthenticated" } as SettledResult<T>;
}
