import { CompetitionDetailSkeleton } from "@/features/competition/presentation/competition-detail-skeleton";

/** 대회 상세 로딩 — 상세를 받는 동안 같은 틀(앱바 · 요약)의 스켈레톤을 보인다(#452). */
export default function Loading() {
  return <CompetitionDetailSkeleton />;
}
