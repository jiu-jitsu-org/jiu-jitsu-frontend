import {
  createGetCurrentBalanceGameUseCase,
  createGetParticipatedBalanceGamesUseCase,
} from "@/features/community/application/community-use-case-factory";
import type { BalanceGame } from "@/features/community/domain/balance-game";
import {
  pickYesterdayResult,
  YESTERDAY_LOOKUP_SIZE,
} from "@/features/community/domain/balance-yesterday-result";
import { readSessionToken, readTokenSubject } from "@/shared/lib/auth";
import { toApiError } from "@/shared/lib/http";
import { toKstDateKey } from "@/shared/lib/time";

const DAY_MS = 24 * 60 * 60 * 1000;

/** 메인 홈 밸런스 게임 영역의 초기 데이터. */
export type BalanceHomePageData = {
  /** 오늘의 게임(교체 버퍼엔 방금 끝난 판). 없거나 못 읽으면 null — 영역을 그리지 않는다. */
  game: BalanceGame | null;
  /** 오늘 판보다 먼저 보여 줄 어제 판 결과(#681). 없으면 null. */
  yesterday: BalanceYesterdayResult | null;
};

/** 어제 판 결과와, 보였을 때 '봤음' 쿠키에 남길 값(어제 날짜 + 계정). */
export type BalanceYesterdayResult = {
  game: BalanceGame;
  seenKey: string;
};

/** 쿠키에 그대로 실을 수 있는 계정 표시 — 토큰 sub가 그런 글자로만 되어 있지 않으면 짧은 해시로 바꾼다. */
const SAFE_SUBJECT = /^[A-Za-z0-9_-]{1,64}$/;

function viewerKeyOf(accessToken: string): string {
  const subject = readTokenSubject(accessToken) ?? "";
  if (SAFE_SUBJECT.test(subject)) return subject;
  let hash = 5381;
  for (const char of subject) hash = ((hash * 33) ^ char.charCodeAt(0)) >>> 0;
  return `h${hash.toString(36)}`;
}

/**
 * 메인 피드 Server Component용 밸런스 게임 쿼리.
 *
 * 다른 page data 쿼리(get-board-list-page-data 등)와 달리 성공/실패 result 타입을 두지 않는다. 밸런스 게임은
 * **실패해도 보여줄 화면이 없기 때문**이다: 정책상 조회 실패·네트워크 오류는 에러 UI 없이 영역을 감추고,
 * 피드는 정상 렌더한다. 호출부가 분기할 것이 "그린다/안 그린다" 뿐이라 null 하나로 충분하다.
 *
 * 세션 만료(A0003)도 여기서는 null로 흡수한다. 같은 화면의 피드 조회가 이미 session-expired를
 * 감지해 클라이언트 복구(SessionExpiredRecovery)로 넘기므로, 밸런스 게임이 복구를 중복해서
 * 요구할 이유가 없다. 복구 후 SSR이 다시 돌면 이 쿼리도 인증 상태로 함께 다시 실행된다.
 *
 * 어제 결과(#681)는 로그인했고 이 기기에서 **이 계정이** 어제 결과를 아직 보지 않았을 때만 찾는다 — '봤음' 쿠키에
 * 어제 날짜와 계정(토큰 sub)을 함께 남겨, 같은 기기에서 계정을 바꾸면 그 계정은 다시 본다. 내가 투표한 판 목록을
 * 오늘의 게임과 **나란히** 읽어 기다림을 늘리지 않는다. 목록을 못 읽으면 어제 결과 없이 오늘 판만 그린다.
 */
export async function getBalanceHomePageData({
  now,
  yesterdaySeen,
}: {
  /** 요청 시각(서버). 한국 날짜로 '어제'를 정한다. */
  now: number;
  /** 이 기기의 '봤음' 쿠키 값(본 날짜 + 계정). */
  yesterdaySeen: string | null;
}): Promise<BalanceHomePageData> {
  const accessToken = await readSessionToken();
  const yesterdayDate = toKstDateKey(now - DAY_MS);
  const seenKey = accessToken ? `${yesterdayDate}.${viewerKeyOf(accessToken)}` : null;
  const lookYesterday = seenKey !== null && yesterdaySeen !== seenKey;

  const [game, participated] = await Promise.all([
    loadCurrentGame(accessToken),
    accessToken && lookYesterday ? loadRecentParticipated(accessToken) : [],
  ]);

  const yesterday = pickYesterdayResult({
    today: game,
    participated,
    yesterdayDate,
  });

  return {
    game,
    yesterday: yesterday && seenKey ? { game: yesterday, seenKey } : null,
  };
}

async function loadCurrentGame(
  accessToken: string | null,
): Promise<BalanceGame | null> {
  try {
    return await createGetCurrentBalanceGameUseCase(accessToken).execute();
  } catch (error) {
    const apiError = toApiError(error);

    // 화면에는 아무것도 남지 않으므로(조용히 미노출) 원인은 서버 로그로만 남긴다.
    // 조용히 삼키면 카드가 안 보이는 이유를 추적할 수 없다.
    console.error(
      "[community:balance-game-page] 오늘의 밸런스 게임 조회 실패:",
      apiError.status,
      apiError.code,
      apiError.message,
    );

    return null;
  }
}

/** 최근에 투표한 판 몇 개(최신 판 먼저). 못 읽으면 빈 목록 — 어제 결과만 빠진다. */
async function loadRecentParticipated(
  accessToken: string,
): Promise<BalanceGame[]> {
  try {
    const list = await createGetParticipatedBalanceGamesUseCase(
      accessToken,
    ).execute({ page: 0, size: YESTERDAY_LOOKUP_SIZE });
    return list.items;
  } catch (error) {
    const apiError = toApiError(error);
    console.error(
      "[community:balance-game-page] 어제 밸런스 게임 결과 조회 실패:",
      apiError.status,
      apiError.code,
      apiError.message,
    );
    return [];
  }
}
