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
  /** 본문. 차단·삭제처럼 서버가 마스킹하는 경우 null로 온다. */
  body: string | null;
  /** 좋아요 수. */
  likes: number;
  /** 내가 좋아요 했는지. */
  isLiked: boolean;
  /** 내 댓글 여부(삭제 노출 판단). */
  isAuthor: boolean;
  /**
   * 작성자. 차단한 회원의 댓글은 서버가 전 필드를 null로 마스킹해 내려준다(backend#105).
   * placeholder만 그리므로 값은 쓰이지 않지만, 타입은 실제 응답을 따라 nullable로 둔다.
   */
  author: {
    id: number | null;
    nickname: string | null;
    /** 프로필 이미지(없으면 null). */
    profileImage: { id: number; imageUrl: string } | null;
  } | null;
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
  /**
   * 삭제/신고 여부. 둘 다 placeholder 노출 판단에 쓴다(신고 #48 · 삭제 #61).
   * deletedYn은 isDeleted와 같은 값의 중복 필드다 — 응답에 따라 한쪽만 오므로 둘 다 본다.
   */
  isDeleted?: boolean;
  isReported?: boolean;
  deletedYn?: boolean;
  /**
   * 차단한 작성자의 댓글인지(backend#105 · #53). 신고와 마찬가지로 차단한 계정 화면에서만 true다.
   * 서버가 제거하지 않고 본문·작성자를 마스킹한 채 내려주므로, 프론트는 자리를 남겨 스레드를 유지한다.
   */
  isBlocked?: boolean;
  /**
   * 답글 총 개수. childrenList는 상위 N개만 내려오는 잘린 목록이라 여기서 세면 안 된다(#62).
   * 삭제·차단된 자식도 포함한 전체 수가 정책상 맞는 값이라 프론트에서 걸러내지 않는다(backend#117 검증).
   */
  childCount?: number;
  /**
   * 내가 이 댓글에 답글을 단 적 있는지(답글 아이콘 fill 판단).
   * 잘린 childrenList로는 알 수 없어 서버 계산이 필요하다.
   * FIXME(의미 미확정): 실측값이 항상 childCount > 0과 일치해 "답글 존재 여부"일 가능성이 있다.
   *   그렇다면 남의 댓글에도 아이콘이 채워진다 — 다른 계정 댓글로 확인 후 정리 필요.
   */
  isReplied?: boolean;
};

/**
 * 댓글 DTO → 도메인 Comment 매핑.
 *
 * isPostAuthor: 응답에 직접 필드가 없어 여기선 false로 두고, 게시글 작성자 id를 아는
 *   get-post-detail-page-data에서 댓글 author id와 비교해 최종 확정한다(작성자 배지).
 *
 * replyCount·replied는 반드시 서버값이어야 한다 — 정책상 childrenList는 상위 N개만 내려오는
 *   잘린 목록이라(나머지는 별도 "더보기" 화면), 개수도 "내가 답글을 달았는지"도 여기서 셀 수 없다.
 *   두 값 모두 응답에 있다(childCount·isReplied) — 아래 폴백은 필드 누락 시의 안전망일 뿐이다.
 */
export function toComment(dto: CommentDto): Comment {
  const children = dto.childrenList ?? [];

  return {
    id: dto.id,
    postId: dto.contentId,
    // 차단 댓글은 작성자가 통째로 마스킹돼 온다 — placeholder로 갈리므로 화면에 쓰이지 않는
    // 값이지만, 타입 계약(비-nullable)을 지키려 빈 값으로 정규화한다.
    author: {
      userId: dto.author?.id ?? 0,
      nickname: dto.author?.nickname ?? "",
      avatarUrl: dto.author?.profileImage?.imageUrl ?? null,
    },
    body: dto.body ?? "",
    createdAt: dto.createdAt,
    timeAgo: dto.timeAgo,
    isOwner: dto.isAuthor,
    isPostAuthor: false,
    likeCount: dto.likes,
    liked: dto.isLiked,
    // 서버값 우선. 없으면 내려온 자식 수로 폴백하되, 잘린 목록이라 실제 개수보다 작을 수 있다.
    replyCount: dto.childCount ?? children.length,
    replied: dto.isReplied ?? false,
    // 같은 값의 중복 필드라 한쪽만 와도 삭제로 본다. 둘 다 없으면 삭제가 아닌 것으로 둔다.
    isDeleted: dto.isDeleted ?? dto.deletedYn ?? false,
    // 서버가 신고자 본인에게만 true로 내려준다. 필드가 없으면 가리지 않는다(원문 노출이 안전한 기본값).
    isReported: dto.isReported ?? false,
    // 차단도 계정별로 갈린다. 필드가 없으면 가리지 않는다(원문 노출이 안전한 기본값).
    isBlocked: dto.isBlocked ?? false,
    replies: children.map(toComment),
  };
}
