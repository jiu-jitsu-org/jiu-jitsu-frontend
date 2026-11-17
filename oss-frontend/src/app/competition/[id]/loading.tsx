import { Suspense } from "react";

import { CompetitionDetailSkeleton } from "@/features/competition/presentation/competition-detail-skeleton";
import { AppClientHint } from "@/shared/lib/app-client/app-client-hint";

/**
 * 대회 상세 로딩 — 상세를 받는 동안 같은 틀(앱바 · 요약)의 스켈레톤을 보인다(#452).
 *
 * 로딩 스켈레톤도 앱 · 브라우저를 가른다(#510) — 앱바 / '앱으로 보기' 배너. 힌트(User-Agent)를 이 안에서 기다리고,
 * 기다리는 동안은 지금처럼 앱 기준 스켈레톤이다. 따로 Suspense로 감싸 상위 스켈레톤(홈 피드 · 대회 목록)으로 번지지 않게 한다.
 */
export default function Loading() {
  return (
    <Suspense fallback={<CompetitionDetailSkeleton />}>
      <AppClientHint>
        <CompetitionDetailSkeleton />
      </AppClientHint>
    </Suspense>
  );
}
