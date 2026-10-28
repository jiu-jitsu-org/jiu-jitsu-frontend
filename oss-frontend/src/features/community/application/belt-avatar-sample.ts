import type { Belt } from "@/features/community/domain/belt";
import type { PostSummary } from "@/features/community/domain/post-summary";
import { isDevelopmentRuntime } from "@/config/env";

/**
 * (dev 전용) 띠 아바타 확인용 예시 띠·그랄 (#265) — `next dev`에서 홈 `/?belt=sample`.
 *
 * 서버가 글 작성자(author)에 띠·그랄을 아직 주지 않아 화면을 눈으로 확인할 방법이 없어 둔다.
 * production 빌드에선 readBeltAvatarSample이 늘 false라 쓰이지 않는다.
 * 서버가 값을 주기 시작하면 이 파일과 belt 분기를 지운다.
 */
export function readBeltAvatarSample(
  value: string | string[] | undefined,
): boolean {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "sample" && isDevelopmentRuntime();
}

/** 카드 순서대로 돌려 쓴다 — 이슈 시안과 같은 순서(흰2 · 파랑1 · 보라3 · 갈색0 · 검정4). */
const SAMPLE_BELTS: Belt[] = [
  { rank: "white", grau: 2 },
  { rank: "blue", grau: 1 },
  { rank: "purple", grau: 3 },
  { rank: "brown", grau: 0 },
  { rank: "black", grau: 4 },
];

export function withSampleBelts(items: PostSummary[]): PostSummary[] {
  return items.map((post, index) => ({
    ...post,
    author: {
      ...post.author,
      belt: SAMPLE_BELTS[index % SAMPLE_BELTS.length],
    },
  }));
}
