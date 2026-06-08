import { DEFAULT_COMMENT_SORT } from "@/features/community/domain/post";
import { PostDetailView } from "@/features/community/presentation/post-detail-view";

import {
  MOCK_COMMENTS_EMPTY,
  MOCK_IMAGES,
  MOCK_POST_BASE,
} from "../detail-playground-data";

/**
 * 게시글 상세 (사진) 쇼케이스 — 베이스 mock에 imageList만 추가.
 *
 * 별도 레이아웃 없이, images가 1개 이상이면 PostDetailView가 본문 아래 이미지 영역을 표시한다
 * (메인 카드와 동일 비율, 여러 장이면 대표 1장 + +N은 임시 숨김).
 */
export function PostDetailPhotoPlaygroundPage() {
  return (
    <PostDetailView
      post={{ ...MOCK_POST_BASE, images: MOCK_IMAGES }}
      comments={MOCK_COMMENTS_EMPTY}
      sort={DEFAULT_COMMENT_SORT}
    />
  );
}
