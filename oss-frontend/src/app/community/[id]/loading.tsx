import { Suspense } from "react";

import { DetailSkeleton } from "@/features/community/presentation/detail-skeleton";
import { WriteTimingSkeletonMark } from "@/features/community/presentation/write-timing";
import { AppClientHint } from "@/shared/lib/app-client/app-client-hint";

/**
 * 게시글 상세 로딩 — 조회를 기다리는 동안 상세와 같은 틀의 스켈레톤을 보인다.
 *
 * 로딩 스켈레톤도 앱 · 브라우저를 가른다(#510) — 앱바 / '앱으로 보기' 배너. 힌트(User-Agent)를 이 안에서 기다리고,
 * 기다리는 동안은 지금처럼 앱 기준 스켈레톤이다. 따로 Suspense로 감싸 상위 스켈레톤(홈 피드 · 대회 목록)으로 번지지 않게 한다.
 */
export default function Loading() {
  return (
    <>
      <Suspense fallback={<DetailSkeleton variant="post" />}>
        <AppClientHint>
          <DetailSkeleton variant="post" />
        </AppClientHint>
      </Suspense>
      {/* 글 등록 직후면 스켈레톤이 뜬 시점을 남긴다(#486 측정). */}
      <WriteTimingSkeletonMark />
    </>
  );
}
