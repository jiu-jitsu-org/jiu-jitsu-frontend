import { WriteSkeleton } from "@/features/community/presentation/write-skeleton";

/**
 * 게시글 수정 로딩 — 조회를 기다리는 동안 글쓰기 틀의 스켈레톤을 보인다(#452).
 *
 * 이 파일이 없으면 상위 [id]/loading.tsx(상세 스켈레톤)가 수정 화면까지 감싸, 수정을 여는 동안
 * 엉뚱하게 상세 틀이 비친다. 세션 복구 중 표시(page.tsx)도 같은 스켈레톤을 뒤로가기와 함께 쓴다.
 */
export default function Loading() {
  return <WriteSkeleton mode="edit" />;
}
