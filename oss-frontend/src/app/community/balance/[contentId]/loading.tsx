import { DetailSkeleton } from "@/features/community/presentation/detail-skeleton";

/** 밸런스 게임 상세 로딩 — 조회를 기다리는 동안 상세와 같은 틀의 스켈레톤을 보인다. */
export default function Loading() {
  return <DetailSkeleton variant="balance" />;
}
