"use client";

import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/features/auth/presentation/auth-provider";
import { type BeltRank, parseBelt } from "@/features/community/domain/belt";
import { bffFetch } from "@/shared/lib/http/bff-fetch";

const BELT_PATH = "/api/community/profile/belt";

/**
 * 대회 탭 머리 캐릭터·그라데이션의 내 띠 (#388).
 *
 * 서버 렌더는 띠를 1초만 기다리고, 로그인 기한이 지나 거절돼도 조용히 흰띠(null)로 그린다 — 앱을 켤 때 홈·대회·MY가
 * 한꺼번에 서버를 불러 1초를 넘기기 쉬워 갈색 띠 사용자에게도 흰띠 캐릭터가 나왔다.
 * 서버가 띠를 못 줬을 때만 화면에서 한 번 더 읽어 바로잡는다. bffFetch라 기한이 지났으면 앱에 갱신을 맡기고 다시 묻는다.
 * 다시 읽다 실패하면 그대로 둔다.
 */
export function useMyBeltRank(
  serverRank: BeltRank | null,
  signedIn: boolean,
): BeltRank | null {
  const [rank, setRank] = useState(serverRank);
  const [seenServerRank, setSeenServerRank] = useState(serverRank);

  // 새로고침으로 서버 값이 새로 오면 맞춘다(그리는 중에 — effect 대신). 서버가 이번엔 못 받아 null이면
  // 이미 바로잡은 띠를 흰띠로 되돌리지 않는다.
  if (seenServerRank !== serverRank) {
    setSeenServerRank(serverRank);
    if (serverRank !== null) setRank(serverRank);
  }
  // 로그아웃하면 지난 사람의 띠를 지운다 — 같은 화면에서 다른 사람이 로그인해도 남지 않게.
  if (!signedIn && rank !== null && serverRank === null) setRank(null);

  const needsClientRead = signedIn && serverRank === null;
  // 로그인 확인 중(힌트만 보고 읽음)에 실패했으면, 로그인이 확정될 때 한 번 더 읽는다.
  const { status: authStatus } = useAuth();
  // 한 번 제대로 읽었으면 로그인 확정 때 다시 묻지 않는다.
  const readDoneRef = useRef(false);
  useEffect(() => {
    if (!needsClientRead || readDoneRef.current) return;
    let cancelled = false;
    void (async () => {
      try {
        const response = await bffFetch(BELT_PATH);
        if (!response.ok) return;
        readDoneRef.current = true;
        const body = (await response.json()) as {
          data?: { belt?: unknown };
        } | null;
        const read = parseBelt(body?.data?.belt ?? null);
        // 띠를 아직 입력하지 않았으면 null — 흰띠 그대로.
        if (!cancelled && read) setRank(read.rank);
      } catch {
        // 장식이라 실패해도 그대로 둔다.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [needsClientRead, authStatus]);

  return signedIn ? rank : null;
}
