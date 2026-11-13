import { CompetitionListSkeleton } from "@/features/competition/presentation/competition-list-skeleton";

/** 대회 탭 첫 화면 로딩 — 목록을 받는 동안 같은 틀(필터 줄 · 대회 줄)의 스켈레톤을 보인다(#452). */
export default function Loading() {
  return <CompetitionListSkeleton />;
}
