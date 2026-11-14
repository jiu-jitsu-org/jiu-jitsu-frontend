import type { BlockedMember } from "@/features/community/domain/blocked-member";
import type {
  Comment,
  CommentList,
  ReplyPage,
} from "@/features/community/domain/comment";
import type {
  ImageUploadAuth,
  RegisterImageInput,
  RegisteredImage,
} from "@/features/community/domain/image";
import type {
  CommentSort,
  CreatePostInput,
  PostCategory,
  UpdatePostInput,
  CreatedPost,
  PostDetail,
} from "@/features/community/domain/post";
import type {
  BoardListQuery,
  MyPostListQuery,
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
  /** 게시글 카테고리 목록(GET /board/category). 작성/수정 화면의 칩 목록. 비로그인도 조회 가능. */
  getCategories(): Promise<PostCategory[]>;
  /** 게시글 목록 조회(GET /board). 카테고리·검색어·페이지 조건은 query로 전달. */
  getPostList(query: BoardListQuery): Promise<PostList>;
  /**
   * 내 커뮤니티 활동 목록(GET /board/write · GET /board/save). 로그인 전용이라
   * authed 클라이언트로 구성된 구현에서만 호출한다. 항목 모양은 getPostList와 같다.
   */
  getMyPostList(query: MyPostListQuery): Promise<PostList>;
  getPostDetail(postId: number): Promise<PostDetail>;
  /**
   * 최상위 댓글 목록 한 페이지(GET /community/comments, backend#161). page는 0부터.
   * 밸런스 게임도 같은 API라 postId 자리에 contentId를 넘긴다.
   */
  getComments(
    postId: number,
    sort: CommentSort,
    page: number,
  ): Promise<CommentList>;
  /**
   * 부모 댓글의 대댓글 추가 조회(GET /community/comments/{id}/replies).
   *
   * 게시글 상세의 childrenList는 상위 3개로 잘려 오고(backend#111), 그 다음부터를 이 API가
   * 10개씩 내려준다. 서버가 미리보기 3개를 빼고 주므로 호출부는 page를 0,1,2…로 올리기만 하면 된다.
   *
   * sort는 댓글 목록과 반드시 같은 값을 넘긴다 — 정렬이 어긋나면 이미 본 대댓글이 다시 오거나 빠진다.
   */
  getReplies(
    parentCommentId: number,
    sort: CommentSort,
    page: number,
  ): Promise<ReplyPage>;
}

/**
 * 댓글 좋아요 토글 결과. 게시글 좋아요(ToggleLikeResult)와 같은 이유로 카운트를 함께 받는다.
 */
export type ToggleCommentLikeResult = {
  liked: boolean;
  likeCount?: number;
};

/**
 * 좋아요 토글 결과.
 *
 * likeCount는 토글 직후 서버가 계산한 좋아요 수다. 그 사이 다른 사용자의 좋아요가
 * 반영되므로 로컬 ±1 계산보다 정확하다. 구버전 응답 호환을 위해 optional로 두고,
 * 없으면 상위에서 기존 로컬 계산으로 폴백한다.
 */
export type ToggleLikeResult = {
  liked: boolean;
  likeCount?: number;
};

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
   * mentionCommentId는 대댓글의 답글 버튼을 누른 그 대댓글 id — 그 작성자에게 답글 알림이 간다(#473).
   */
  createComment(
    postId: number,
    body: string,
    parentId?: number,
    mentionCommentId?: number,
  ): Promise<Comment>;
  /** 댓글 삭제(본인 댓글). 결과 본문이 없어 void. */
  deleteComment(commentId: number): Promise<void>;
  /**
   * 삭제한 댓글 복구(본인 댓글, PUT /community/comments/{id}/restore). 결과 본문이 없어 void.
   * 삭제 후 짧은 시간 안에만 가능하고(만료 시 업스트림 400 C0008), 이미 복구된 댓글을 다시
   * 요청해도 성공한다(되돌리기 더블탭 방어). 만료·권한 실패는 HttpError로 상위에 전달한다.
   */
  restoreComment(commentId: number): Promise<void>;
  /** 게시글 삭제(본인 게시글, DELETE /board/{id}). 결과 본문이 없어 void. */
  deletePost(postId: number): Promise<void>;
  /** 게시글/댓글 신고(POST /reports). 동일 대상 중복 신고는 서버가 막는다. 결과 본문이 없어 void. */
  report(input: CreateReportInput): Promise<void>;
  /** 댓글 좋아요 토글(등록/취소). 토글 후의 좋아요 상태(isLiked)와 좋아요 수(likeCount)를 반환. */
  toggleCommentLike(commentId: number): Promise<ToggleCommentLikeResult>;
  /**
   * 게시글 좋아요 토글(PUT /board/like/{id}). 서버가 현재 상태를 뒤집고
   * 결과를 알려주므로, 토글 후의 좋아요 여부(isLiked)와 좋아요 수(likeCount)를 반환한다.
   */
  toggleLike(postId: number): Promise<ToggleLikeResult>;
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
  /** 게시글 수정(PUT /board/{id}). 본인 글 권한은 업스트림이 검사한다. 응답(BoardResponse)은 쓰지 않는다. */
  updatePost(postId: number, input: UpdatePostInput): Promise<void>;
  /**
   * 유저 차단/차단해제 토글(POST /user/block/{id}). 차단은 댓글 1건이 아니라 그 회원 전체가
   * 대상이라 인자는 commentId가 아닌 작성자 userId다. 토글 후의 차단 여부(true=차단)를 반환한다.
   */
  toggleBlock(userId: number): Promise<boolean>;
  /**
   * 차단 해제 전용(DELETE /user/block/{id}). 이미 풀려 있어도 성공한다 — 어느 기기에서 눌러도 결과가 같다.
   */
  unblock(userId: number): Promise<void>;
  /**
   * 내가 차단한 회원 목록(GET /user/block). 차단한 시각 최신순, 탈퇴 회원 제외.
   * 읽기인데 쓰기 repository에 있는 이유: 차단 · 해제와 같은 업스트림 컨트롤러이고 서로의 짝이다.
   */
  getBlockedMembers(): Promise<BlockedMember[]>;
}
