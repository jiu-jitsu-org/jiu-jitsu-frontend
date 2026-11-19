import { PostSearchSkeleton } from "@/features/community/presentation/search/post-search-skeleton";

/** 글 검색 로딩 — 같은 자리의 검색칸만 먼저 그린다(#591). */
export default function Loading() {
  return <PostSearchSkeleton />;
}
