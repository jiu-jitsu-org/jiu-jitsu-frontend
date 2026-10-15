import { MyActivitySkeleton } from "@/features/community/presentation/my-activity/my-activity-skeleton";

/** 내 커뮤니티 활동 로딩 — 조회를 기다리는 동안 같은 틀(앱바 · 프로필 · 탭 · 카드)의 스켈레톤을 보인다. */
export default function Loading() {
  return <MyActivitySkeleton />;
}
