import { createGetMyBeltUseCase } from "@/features/community/application/community-use-case-factory";
import type { BeltRank } from "@/features/community/domain/belt";
import { readSessionToken } from "@/shared/lib/auth";

/** 띠는 장식이라 오래 기다리지 않는다. */
const BELT_WAIT_MS = 1000;

/**
 * 내 띠 색 — 대회 탭 관심 대회 머리의 캐릭터와 위 그라데이션을 내 띠로 그린다.
 * 비로그인·띠 미입력·읽기 실패는 null이다. 화면을 막지 않고 흰띠로 그린다.
 * 장식이라 기다리지 않는다 — 목록과 함께 읽되 1초 안에 못 받으면 흰띠로 그린다.
 */
export async function loadMyBeltRank(): Promise<BeltRank | null> {
  try {
    const accessToken = await readSessionToken();
    if (!accessToken) return null;
    const belt = await Promise.race([
      createGetMyBeltUseCase(accessToken).execute(),
      new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), BELT_WAIT_MS),
      ),
    ]);
    return belt?.rank ?? null;
  } catch {
    return null;
  }
}
