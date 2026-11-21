"use client";

import { useRouter } from "next/navigation";

import { categoryParam } from "@/features/community/presentation/post-analytics";
import { entryPath, track } from "@/shared/lib/analytics";
import {
  isNativeBridgeAvailable,
  openNativeHomeFeed,
  openNativeSubview,
} from "@/shared/lib/native-bridge";

/**
 * 글 상세 메타 줄의 카테고리 이름 — 누르면 홈 목록을 그 카테고리 탭으로 연다.
 *
 * 앱은 `OPEN_HOME_FEED { categoryId }`로 상세를 닫고 홈 탭을 그 카테고리로 연다(#643 · jiu-jitsu-ios#480).
 * 이 메시지를 모르는 앱은 지금처럼 홈 목록을 서브뷰로 쌓고, 웹은 주소를 옮긴다(뒤로 가기로 보던 글로 돌아온다).
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
    track("category_select", {
      category: categoryParam({ id: categoryId, name: categoryName }),
      from: "post_detail",
    });
    if (isNativeBridgeAvailable()) {
      // 동일 origin 절대경로로 전달 → 새 웹뷰가 세션 쿠키 공유. 홈 탭 열기를 모르는 앱만 서브뷰로 쌓는다 —
      // view=subview면 홈이 앱 머리 없는 서브뷰에 맞춰 상태바 자리를 비우고 뒤로가기를 그린다(없으면 맨 위가 상태바 밑으로 잘린다).
      if (!openNativeHomeFeed({ categoryId })) {
        const subviewPath = entryPath(
          `/?categoryId=${categoryId}&view=subview`,
          "post_detail",
        );
        openNativeSubview(`${window.location.origin}${subviewPath}`);
      }
      return;
    }
    router.push(entryPath(`/?categoryId=${categoryId}`, "post_detail"));
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
