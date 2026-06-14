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
import type { CreateReportInput } from "@/features/community/domain/report";

/**
 * 게시글 읽기 도메인 계약.
 *
 * application 레이어는 이 인터페이스에만 의존하고, 실제 엔드포인트/헤더/HTTP 세부는
 * infrastructure 구현이 안다. 토큰 부착은 클라이언트 구성 시점에 주입되므로
 * 이 메서드들은 토큰을 인자로 받지 않는다(viewer 상태는 토큰 유무에 따라 채워짐).
 */
export interface PostRepository {
  getPostDetail(postId: number): Promise<PostDetail>;
  getComments(
    postId: number,
    sort: CommentSort,
    cursor?: string,
  ): Promise<CommentList>;
}

/**
 * 게시글 쓰기 도메인 계약.
 *
 * 모든 쓰기는 인증이 필요하므로, 구현은 반드시 authed HttpClient로 구성된다.
 * 좋아요/저장은 서버가 현재 상태를 뒤집어 결과를 돌려주는 단일 엔드포인트 토글이다.
 */
export interface CommunityWriteRepository {
  createComment(postId: number, body: string): Promise<Comment>;
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
   * 결과를 알려주므로, 토글 후의 저장 여부(isSaved)를 반환한다.
   */
  toggleSave(postId: number): Promise<boolean>;
  /** ① ImageKit 업로드용 서명 발급(GET /image/auth). */
  getImageUploadAuth(): Promise<ImageUploadAuth>;
  /** ③ ImageKit 업로드 결과를 서버에 등록(POST /image) → TEMP 이미지. */
  registerImage(input: RegisterImageInput): Promise<RegisteredImage>;
  /** ④ 게시글 생성(POST /board). 등록된 imageId를 imageFileIdList로 연결. */
  createPost(input: CreatePostInput): Promise<CreatedPost>;
}
