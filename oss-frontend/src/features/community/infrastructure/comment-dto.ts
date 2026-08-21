import type { Comment } from "@/features/community/domain/comment";

/**
 * 업스트림 댓글 응답 DTO(봉투 data 안의 형태).
 *
 * 출처: Swagger "댓글 상세" 200 응답 + POST /community/comments 생성 응답.
 * 단건 조회/생성 모두 이 단일 형태를 반환한다(목록은 이 객체의 배열로 가정 — 목록 엔드포인트 확정 후 검증).
 *
 * childrenList: 대댓글 목록. Swagger 예시는 재귀 타입이 ["string"]으로 렌더되지만 실제로는
 *               같은 댓글 객체 배열이다. 없으면 null/누락될 수 있어 매핑 시 빈 배열로 정규화.
 */
export type CommentDto = {
  id: number;
  /** 게시글 id(도메인의 postId). */
  contentId: number;
  /** 부모 댓글 id. 최상위 댓글은 null 또는 0(백엔드가 둘 다 사용). */
  parentId: number | null;
  body: string;
  /** 좋아요 수. */
  likes: number;
  /** 내가 좋아요 했는지. */
  isLiked: boolean;
  /** 내 댓글 여부(삭제 노출 판단). */
  isAuthor: boolean;
  author: {
    id: number;
    nickname: string;
    /** 프로필 이미지(없으면 null). */
    profileImage: { id: number; imageUrl: string } | null;
  };
  /** 작성 시각(ISO 8601). */
  createdAt: string;
  /**
   * 서버가 계산한 상대 시각(예: "8일 전"). 게시글(board)에는 있고 댓글에는 아직 없다.
   * 추가되면 별도 코드 변경 없이 화면에 노출되도록 미리 매핑해 둔다.
   */
  timeAgo?: string;
  /** 수정 시각(ISO 8601). */
  updatedAt?: string | null;
  /** 대댓글 목록(같은 DTO 형태). */
  childrenList?: CommentDto[] | null;
};

/**
 * 댓글 DTO → 도메인 Comment 매핑.
 *
 * isPostAuthor: 응답에 직접 필드가 없어 여기선 false로 두고, 게시글 작성자 id를 아는
 *   get-post-detail-page-data에서 댓글 author id와 비교해 최종 확정한다(작성자 배지).
 *
 * FIXME(스펙 공백): replied("내가 이 댓글에 답글을 단 적 있는지")는 대응 필드가 없어 false 고정.
 *   백엔드에 필드 추가되면 여기서 매핑.
 */
export function toComment(dto: CommentDto): Comment {
  const children = dto.childrenList ?? [];

  return {
    id: dto.id,
    postId: dto.contentId,
    author: {
      userId: dto.author.id,
      nickname: dto.author.nickname,
      avatarUrl: dto.author.profileImage?.imageUrl ?? null,
    },
    body: dto.body,
    createdAt: dto.createdAt,
    timeAgo: dto.timeAgo,
    isOwner: dto.isAuthor,
    isPostAuthor: false,
    likeCount: dto.likes,
    liked: dto.isLiked,
    replyCount: children.length,
    replied: false,
    replies: children.map(toComment),
  };
}
