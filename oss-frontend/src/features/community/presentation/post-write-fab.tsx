"use client";

import { useOpenPostWrite } from "@/features/community/presentation/use-open-post-write";
import { EditIcon } from "@/shared/ui/icons";

/**
 * 게시글 작성 진입 FAB (우측 하단 고정, 여백 12px).
 *
 * 네이티브 웹뷰에선 OPEN_SUBVIEW로 작성 화면을 풀스크린 서브뷰로 띄우고(useOpenPostWrite),
 * 웹 단독에선 라우터 이동한다. 작성 화면 닫기는 CLOSE_SUBVIEW로 pop된다.
 * 브릿지 분기를 위해 클라이언트 컴포넌트로 둔다(서버 페이지에 끼워 넣는 작은 island).
 */
export function PostWriteFab() {
  const openWrite = useOpenPostWrite();

  return (
    <button
      type="button"
      onClick={openWrite}
      aria-label="게시글 작성"
      className="fixed bottom-3 right-3 flex h-12 w-12 items-center justify-center rounded-full bg-button-filled-default-bg text-button-filled-default-text"
    >
      <EditIcon size={20} />
    </button>
  );
}
