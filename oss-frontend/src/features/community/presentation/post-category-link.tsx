"use client";

import { useRouter } from "next/navigation";

import { entryPath, track } from "@/shared/lib/analytics";
import {
  isNativeBridgeAvailable,
  openNativeSubview,
} from "@/shared/lib/native-bridge";

/**
 * 글 상세 메타 줄의 카테고리 이름 — 누르면 홈 목록을 그 카테고리 탭으로 연다.
 *
 * 상세 위에 새 화면으로 쌓는다(앱은 서브뷰, 웹은 주소 이동). 뒤로 가기 · 스와이프로 보던 글로 돌아온다.
 * 홈 목록의 글 카드에서는 카테고리 이름을 누르지 않는다 — 바로 위 탭 줄이 같은 일을 한다.
 */
export function PostCategoryLink({
  categoryId,
  categoryName,
}: {
  categoryId: number;
  categoryName: string;
}) {
  const router = useRouter();

  function open() {
    track("category_select", { category: categoryId, from: "post_detail" });
    const path = entryPath(`/?categoryId=${categoryId}`, "post_detail");
    if (isNativeBridgeAvailable()) {
      // 동일 origin 절대경로로 전달 → 새 웹뷰가 세션 쿠키 공유.
      openNativeSubview(`${window.location.origin}${path}`);
      return;
    }
    router.push(path);
  }

  return (
    // 누를 자리만 위아래 · 옆으로 넓히고(음수 마진) 글자 위치 · 줄 높이는 그대로 둔다. 누르는 동안만 옅은 면.
    <button
      type="button"
      onClick={open}
      aria-label={`${categoryName} 글 모아 보기`}
      className="-mx-1.5 -my-1 rounded-md px-1.5 py-1 text-feed-card-header-category-text motion-safe:transition-colors motion-safe:duration-120 active:bg-surface-container-pressed"
    >
      {categoryName}
    </button>
  );
}
