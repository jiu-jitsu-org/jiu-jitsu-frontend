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
 * 좋아요/북마크는 멱등한 토글이라 결과 본문 없이 void를 반환한다.
 */
export interface CommunityWriteRepository {
  createComment(postId: number, body: string): Promise<Comment>;
  likePost(postId: number): Promise<void>;
  unlikePost(postId: number): Promise<void>;
  bookmarkPost(postId: number): Promise<void>;
  unbookmarkPost(postId: number): Promise<void>;
  /** ① ImageKit 업로드용 서명 발급(GET /image/auth). */
  getImageUploadAuth(): Promise<ImageUploadAuth>;
  /** ③ ImageKit 업로드 결과를 서버에 등록(POST /image) → TEMP 이미지. */
  registerImage(input: RegisterImageInput): Promise<RegisteredImage>;
  /** ④ 게시글 생성(POST /board). 등록된 imageId를 imageFileIdList로 연결. */
  createPost(input: CreatePostInput): Promise<CreatedPost>;
}
