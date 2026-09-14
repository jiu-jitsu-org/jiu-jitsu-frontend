import { loadPostDetail } from "@/features/community/application/get-post-detail-page-data";
import { readSessionToken } from "@/shared/lib/auth";

/** 공유 미리보기 카드(og:*)에 실을 게시글 요약. */
export type PostShareMetadata = {
  title: string;
  /** 본문 원문 — 길이 정리는 표현(site-metadata)이 맡는다. */
  body: string;
  /**
   * 대표 이미지 — 사용자가 올린 첫 번째 이미지(절대 URL). 없으면 null.
   *
   * 작성자 아바타는 후보에 넣지 않는다 — 글 내용과 무관한 얼굴이 썸네일로 잡히는 것이 어색하다.
   * 이미지가 없는 글은 호출부가 서비스 기본 카드로 폴백한다.
   */
  imageUrl: string | null;
};

/**
 * generateMetadata용 게시글 요약 조회.
 *
 * 페이지 본문(getPostDetailPageData)과 같은 캐시 조회(loadPostDetail)를 타므로 한 요청에서
 * 업스트림 호출이 한 번만 나간다. 실패는 사유를 가리지 않고 null — 미리보기는 부가 정보라
 * 어떤 에러(404·만료·네트워크)든 기본 메타데이터로 조용히 내려가면 되고, 진짜 에러 처리는
 * 페이지 렌더가 같은 조회 결과로 이어서 한다.
 */
export async function getPostShareMetadata(
  postId: number,
): Promise<PostShareMetadata | null> {
  const accessToken = await readSessionToken();

  try {
    const post = await loadPostDetail(postId, accessToken);

    return {
      title: post.title,
      body: post.body,
      imageUrl: post.images[0]?.imageUrl ?? null,
    };
  } catch {
    return null;
  }
}
