import { getServerEnv } from "@/config/env";

/**
 * 대회 화면을 열지 — 서버 전용 플래그 COMPETITION_ENABLED(config/env.ts).
 *
 * 대회 API(backend#193)가 아직 없는 백엔드(운영)를 바라보는 배포에서는 꺼 둔다. 끄면 대회 탭·상세는 404,
 * 피드·글 상세의 대회 카드와 글쓰기 대회 고르기·알림함 대회 줄·유니버설 링크의 /competition/*가 빠지고,
 * 대회 Server Action은 부르지 않고 실패로 돌려준다. 환경 값을 못 읽으면 꺼진 것으로 본다.
 */
export function isCompetitionEnabled(): boolean {
  try {
    return getServerEnv().competitionEnabled;
  } catch {
    return false;
  }
}

/** 대회 화면이 꺼져 있으면 글에 실려 온 대회 카드를 뗀다 — 눌러도 열 대회 상세가 없다. */
export function withoutCompetitionWhenDisabled<
  T extends { competition?: unknown },
>(posts: T[]): T[] {
  if (isCompetitionEnabled()) return posts;
  return posts.map((post) => {
    if (post.competition === undefined) return post;
    const rest = { ...post };
    delete rest.competition;
    return rest;
  });
}
