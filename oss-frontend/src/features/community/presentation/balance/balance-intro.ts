import { isDevelopmentRuntime } from "@/config/env";

/**
 * 히어로 인트로 "선수 입장"(#305) — 홈에서 그날 게임을 처음 볼 때 한 번만 돈다.
 *
 * 본 게임 번호(contentId)를 이 쿠키에 남긴다. 서버가 그리기 전에 쿠키를 읽어 이미 본 게임이면 인트로 없이
 * 그린다 — 클라이언트에서 정하면 다 그린 화면이 사라졌다 다시 들어오는 깜빡임이 생긴다. 다음 게임이 열리면
 * 번호가 달라져 다시 돈다.
 */
export const BALANCE_INTRO_COOKIE = "balance_intro_seen";

export function shouldPlayBalanceIntro({
  contentId,
  seenContentId,
  forced,
}: {
  contentId: number;
  seenContentId: string | undefined;
  forced: boolean;
}): boolean {
  return forced || seenContentId !== String(contentId);
}

/** (dev 전용) `/?intro=1`이면 이미 본 게임이어도 인트로를 다시 돌린다. production에선 늘 false. */
export function readBalanceIntroForced(
  value: string | string[] | undefined,
): boolean {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "1" && isDevelopmentRuntime();
}
