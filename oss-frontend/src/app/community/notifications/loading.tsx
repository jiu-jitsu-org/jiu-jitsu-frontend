import { InboxSkeleton } from "@/features/community/presentation/notifications/inbox-skeleton";

/** 알림함 로딩 — 조회를 기다리는 동안 같은 틀(앱바 · 새 알림 줄 · 알림 줄)의 스켈레톤을 보인다(#452). */
export default function Loading() {
  return <InboxSkeleton />;
}
