import type { Belt } from "@/features/community/domain/belt";
import type { Comment } from "@/features/community/domain/comment";
import type { PostDetail } from "@/features/community/domain/post";
import type { PostSummary } from "@/features/community/domain/post-summary";
import { isDevelopmentRuntime } from "@/config/env";

/**
 * (dev 전용) 띠 아바타 확인용 예시 띠·그랄 (#265) — `next dev`에서 홈 `/?belt=sample`,
 * 글 상세 `/community/{id}?belt=sample`.
 *
 * 서버가 글 작성자(author)에 띠·그랄을 아직 주지 않아 화면을 눈으로 확인할 방법이 없어 둔다.
 * 관장·사범 배지(#272)도 같은 이유로 여기서 함께 붙인다 — 검은띠 예시에만 붙인다.
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

function sampleBeltAt(index: number): Belt {
  return SAMPLE_BELTS[index % SAMPLE_BELTS.length];
}

/** 검은띠 예시만 관장·사범으로 둔다(#272). */
function isSampleCoach(belt: Belt | null): boolean {
  return belt?.rank === "black";
}

export function withSampleBelts(items: PostSummary[]): PostSummary[] {
  return items.map((post, index) => {
    const belt = sampleBeltAt(index);
    return {
      ...post,
      author: { ...post.author, belt, isCoach: isSampleCoach(belt) },
    };
  });
}

/**
 * 상세: 글 작성자는 첫 띠, 댓글·대댓글은 그려지는 순서대로 다음 띠부터 돌려 쓴다.
 * 띠 없는 회원 모습도 함께 보도록 네 번째 댓글마다 띠를 비운다.
 * 글 작성자는 배지 모습을 바로 보도록 관장·사범으로 둔다(#272).
 */
export function withSampleDetailBelts(
  post: PostDetail,
  comments: Comment[],
): { post: PostDetail; comments: Comment[] } {
  let order = 0;
  const mark = (items: Comment[]): Comment[] =>
    items.map((comment) => {
      order += 1;
      const belt = order % 4 === 0 ? null : sampleBeltAt(order);
      return {
        ...comment,
        author: { ...comment.author, belt, isCoach: isSampleCoach(belt) },
        replies: mark(comment.replies),
      };
    });

  return {
    post: {
      ...post,
      author: { ...post.author, belt: sampleBeltAt(0), isCoach: true },
    },
    comments: mark(comments),
  };
}
