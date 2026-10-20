import {
  createGetMyPostListUseCase,
  createGetParticipatedBalanceGamesUseCase,
} from "@/features/community/application/community-use-case-factory";
import type { BalanceGameList } from "@/features/community/domain/balance-game";
import {
  FEED_PAGE_SIZE,
  type MyPostListKind,
  type PostList,
} from "@/features/community/domain/post-summary";
import { createGetMyProfileUseCase } from "@/features/profile/application/profile-use-case-factory";
import { readSessionToken } from "@/shared/lib/auth";
import { ApiErrorCode, toApiError } from "@/shared/lib/http";

/** 화면 상단 프로필 행에 필요한 값만 추린다(이메일 등은 화면에 넘기지 않는다). */
export type MyActivityProfile = {
  nickname: string;
  avatarUrl: string | null;
};

/** list는 탭마다 모양이 다르다 — 쓴 글 · 저장은 PostList, 밸런스 게임은 BalanceGameList. */
export type MyActivityPageData<L = PostList> = {
  profile: MyActivityProfile;
  list: L;
};

export type MyActivityPageDataResult<L = PostList> =
  | { ok: true; data: MyActivityPageData<L> }
  // 비로그인 — 로그인 전용 API를 부르지 않고 안내만 그린다.
  | { ok: false; reason: "guest" }
  // 만료 토큰 — 서버는 갱신 불가하니 클라이언트가 네이티브 갱신 후 SSR을 재실행한다.
  | { ok: false; reason: "session-expired" }
  | { ok: false; reason: "error"; status: number; code: string; error: string };

/**
 * 내 커뮤니티 활동(/community/me) Server Component용 페이지 쿼리.
 *
 * 상단 프로필(GET /user/profile)과 선택된 탭의 첫 페이지(GET /board/write · /board/save)를
 * **병렬로** 읽는다. 순차로 부르면 프로필 조회만큼 첫 페인트가 늦어진다.
 * 탭 전환은 URL(search param)을 바꿔 이 쿼리를 다시 실행하므로 다른 탭 목록은 미리 읽지 않는다.
 *
 * 둘 다 로그인 전용이라 토큰이 없으면 호출 자체를 하지 않는다(401 확정 왕복 방지).
 * 만료 토큰(A0003) 처리는 메인 피드(get-board-list-page-data)와 같다.
 */
export async function getMyActivityPageData(
  kind: MyPostListKind,
): Promise<MyActivityPageDataResult> {
  return loadMyActivityPageData((accessToken) =>
    createGetMyPostListUseCase(accessToken).execute({
      kind,
      page: 0,
      size: FEED_PAGE_SIZE,
    }),
  );
}

/**
 * '밸런스 게임' 탭 — 프로필 + 내가 참여한 게임 첫 페이지.
 *
 * 분기(guest · 만료 · 에러)는 다른 탭과 같다.
 */
export async function getMyBalanceGamesPageData(): Promise<
  MyActivityPageDataResult<BalanceGameList>
> {
  return loadMyActivityPageData((accessToken) =>
    createGetParticipatedBalanceGamesUseCase(accessToken).execute({
      page: 0,
      size: FEED_PAGE_SIZE,
    }),
  );
}

/** 탭 공통 조회 — 프로필과 탭 목록을 병렬로 읽고 실패를 화면 분기로 바꾼다. */
async function loadMyActivityPageData<L>(
  loadList: (accessToken: string) => Promise<L>,
): Promise<MyActivityPageDataResult<L>> {
  const accessToken = await readSessionToken();
  if (!accessToken) return { ok: false, reason: "guest" };

  try {
    const [profile, list] = await Promise.all([
      createGetMyProfileUseCase(accessToken).execute(),
      loadList(accessToken),
    ]);

    return {
      ok: true,
      data: {
        profile: {
          nickname: profile.nickname,
          avatarUrl: profile.profileImage?.imageUrl ?? null,
        },
        list,
      },
    };
  } catch (error) {
    const apiError = toApiError(error);

    if (apiError.code === ApiErrorCode.EXPIRED_TOKEN) {
      return { ok: false, reason: "session-expired" };
    }

    // 에러 화면으로 떨어진 실제 원인을 서버 로그에 남긴다(조용히 삼키면 디버깅이 불가능하다).
    console.error(
      "[community:my-activity-page] 초기 조회 실패:",
      apiError.status,
      apiError.code,
      apiError.message,
    );

    return {
      ok: false,
      reason: "error",
      status: apiError.status,
      code: apiError.code,
      error: apiError.message,
    };
  }
}
