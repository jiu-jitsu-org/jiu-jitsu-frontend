import { DetailSkeleton } from "@/features/community/presentation/detail-skeleton";
import { WriteTimingSkeletonMark } from "@/features/community/presentation/write-timing";

/** 게시글 상세 로딩 — 조회를 기다리는 동안 상세와 같은 틀의 스켈레톤을 보인다. */
export default function Loading() {
  return (
    <>
      <DetailSkeleton variant="post" />
      {/* 글 등록 직후면 스켈레톤이 뜬 시점을 남긴다(#486 측정). */}
      <WriteTimingSkeletonMark />
    </>
  );
}
