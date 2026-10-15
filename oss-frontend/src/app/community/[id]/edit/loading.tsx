import { Spinner } from "@/shared/ui/spinner";

/**
 * 게시글 수정 로딩 — 조회를 기다리는 동안 가운데 스피너만 보인다.
 *
 * 이 파일이 없으면 상위 [id]/loading.tsx(상세 스켈레톤)가 수정 화면까지 감싸, 수정을 여는 동안
 * 엉뚱하게 상세 틀이 비친다. 세션 복구 중 표시(page.tsx)도 같은 모양이라 이 컴포넌트를 함께 쓴다.
 */
export default function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Spinner />
    </div>
  );
}
