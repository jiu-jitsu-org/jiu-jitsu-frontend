import { BlockedMembersSkeleton } from "@/features/community/presentation/blocked-members/blocked-members-skeleton";

/** 차단한 회원 로딩 — 조회를 기다리는 동안 같은 틀(앱바 · 줄)의 스켈레톤을 보인다. */
export default function Loading() {
  return <BlockedMembersSkeleton />;
}
