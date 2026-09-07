import type { Comment, CommentList } from "@/features/community/domain/comment";
import type {
  ImageUploadAuth,
  RegisterImageInput,
  RegisteredImage,
} from "@/features/community/domain/image";
import type {
  CommentSort,
  CreatePostInput,
  CreatedPost,
  PostDetail,
} from "@/features/community/domain/post";
import type {
  BoardListQuery,
  PostList,
} from "@/features/community/domain/post-summary";
import type { CreateReportInput } from "@/features/community/domain/report";

/**
 * 게시글 읽기 도메인 계약.
 *
 * application 레이어는 이 인터페이스에만 의존하고, 실제 엔드포인트/헤더/HTTP 세부는
 * infrastructure 구현이 안다. 토큰 부착은 클라이언트 구성 시점에 주입되므로
 * 이 메서드들은 토큰을 인자로 받지 않는다(viewer 상태는 토큰 유무에 따라 채워짐).
 */
export interface PostRepository {
  /** 게시글 목록 조회(GET /board). 카테고리·검색어·페이지 조건은 query로 전달. */
  getPostList(query: BoardListQuery): Promise<PostList>;
  getPostDetail(postId: number): Promise<PostDetail>;
  getComments(
    postId: number,
    sort: CommentSort,
    cursor?: string,
  ): Promise<CommentList>;
}

/**
 * 저장(북마크) 토글 결과.
 *
 * saveCount는 토글 직후 서버가 계산한 저장 수다. 그 사이 다른 사용자의 저장이
 * 반영되므로 로컬 ±1 계산보다 정확하다. 구버전 응답 호환을 위해 optional로 두고,
 * 없으면 상위에서 기존 로컬 계산으로 폴백한다.
 */
export type ToggleSaveResult = {
  saved: boolean;
  saveCount?: number;
};

/**
 * 게시글 쓰기 도메인 계약.
 *
 * 모든 쓰기는 인증이 필요하므로, 구현은 반드시 authed HttpClient로 구성된다.
 * 좋아요/저장은 서버가 현재 상태를 뒤집어 결과를 돌려주는 단일 엔드포인트 토글이다.
 */
export interface CommunityWriteRepository {
  /**
   * 댓글/대댓글 작성.
   * parentId를 주면 그 댓글의 답글로 달린다. 생략하면 최상위 댓글(업스트림 규약상 parentId=0).
   */
  createComment(
    postId: number,
    body: string,
    parentId?: number,
  ): Promise<Comment>;
  /** 댓글 삭제(본인 댓글). 결과 본문이 없어 void. */
  deleteComment(commentId: number): Promise<void>;
  /** 게시글 삭제(본인 게시글, DELETE /board/{id}). 결과 본문이 없어 void. */
  deletePost(postId: number): Promise<void>;
  /** 게시글/댓글 신고(POST /reports). 동일 대상 중복 신고는 서버가 막는다. 결과 본문이 없어 void. */
  report(input: CreateReportInput): Promise<void>;
  /** 댓글 좋아요 토글(등록/취소). 토글 후의 좋아요 상태(isLiked)를 반환. */
  toggleCommentLike(commentId: number): Promise<boolean>;
  /**
   * 게시글 좋아요 토글(PUT /board/like/{id}). 서버가 현재 상태를 뒤집고
   * 결과를 알려주므로, 토글 후의 좋아요 여부(isLiked)를 반환한다.
   */
  toggleLike(postId: number): Promise<boolean>;
  /**
   * 게시글 저장/취소 토글(PUT /board/save/{id}). 서버가 현재 상태를 뒤집고
   * 결과를 알려주므로, 토글 후의 저장 여부(isSaved)와 저장 수(saveCount)를 반환한다.
   */
  toggleSave(postId: number): Promise<ToggleSaveResult>;
  /**
   * 게시글 숨김/숨김해제 토글(PUT /board/hide/{id}). 서버가 현재 상태를 뒤집고
   * 결과를 알려주므로, 토글 후의 숨김 여부(true=숨김)를 반환한다.
   */
  toggleHide(postId: number): Promise<boolean>;
  /**
   * 게시글 알림 수신 토글(PUT /notice/setting/board/{boardId}). 서버가 현재 설정을 뒤집고
   * 결과를 알려주므로, 토글 후의 수신 여부(true=알림 받음)를 반환한다.
   */
  toggleNotice(contentId: number): Promise<boolean>;
  /**
   * 알림 수신 여부 조회(GET /notice/setting/board/{contentId}).
   *
   * 읽기인데 쓰기 repository에 있는 이유: 토글(toggleNotice)과 같은 업스트림 컨트롤러이고
   * 서로의 짝이다. 알림 계약을 두 repository로 쪼개면 한쪽만 보고는 전체를 알 수 없다.
   *
   * 게시글 상세는 이걸 부르지 않는다 — 상세 응답에 noticeEnabled가 함께 오기 때문이다.
   * 밸런스 게임 응답에는 그 필드가 없어 별도로 읽어야 한다.
   */
  getNoticeEnabled(contentId: number): Promise<boolean>;
  /** ① ImageKit 업로드용 서명 발급(GET /image/auth). */
  getImageUploadAuth(): Promise<ImageUploadAuth>;
  /** ③ ImageKit 업로드 결과를 서버에 등록(POST /image) → TEMP 이미지. */
  registerImage(input: RegisterImageInput): Promise<RegisteredImage>;
  /** ④ 게시글 생성(POST /board). 등록된 imageId를 imageFileIdList로 연결. */
  createPost(input: CreatePostInput): Promise<CreatedPost>;
  /**
   * 유저 차단/차단해제 토글(POST /user/block/{id}). 차단은 댓글 1건이 아니라 그 회원 전체가
   * 대상이라 인자는 commentId가 아닌 작성자 userId다. 토글 후의 차단 여부(true=차단)를 반환한다.
   */
  toggleBlock(userId: number): Promise<boolean>;
}
