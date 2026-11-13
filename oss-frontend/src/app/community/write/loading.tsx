import { WriteSkeleton } from "@/features/community/presentation/write-skeleton";

/** 글쓰기 로딩 — 카테고리·대회 목록을 받는 동안 같은 틀(앱바 · 칩 줄 · 제목)의 스켈레톤을 보인다(#452). */
export default function Loading() {
  return <WriteSkeleton mode="write" />;
}
