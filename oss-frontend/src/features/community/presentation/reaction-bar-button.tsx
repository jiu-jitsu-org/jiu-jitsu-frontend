"use client";

import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

/**
 * 액션바 단일 버튼.
 *
 * 높이 28(h-7), radius 10, 좌우 패딩 8(px-2), 아이콘↔텍스트 4(gap-1).
 * 텍스트 Body S(14/21).
 *
 * 표시 우선순위: count가 1 이상이면 숫자 → 아니면 label(hideLabel이면 아이콘만).
 * 상태 우선순위: Pressed(:active) > Active > Default. Tailwind가 variant 유틸리티를 base 뒤에
 * 배치하므로 pressed 클래스가 Active 색을 덮어쓴다.
 */
export function ReactionBarButton({
  icon,
  label,
  a11yLabel,
  count,
  hideLabel = false,
  active = false,
  pressable = false,
  readOnly = false,
  activeIconColorClass,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  /** 스크린리더용 라벨. 없으면 label을 쓴다(숫자만 보이는 버튼의 의미를 잃지 않게). */
  a11yLabel?: string;
  count?: number;
  /** 카운트가 없을 때 텍스트 없이 아이콘만 둘지 — 북마크·공유가 여기 해당. */
  hideLabel?: boolean;
  active?: boolean;
  /** 토글 버튼인지 — aria-pressed를 붙일지 결정한다(댓글쓰기·공유는 토글이 아니다). */
  pressable?: boolean;
  /**
   * 누를 수 없는 표시 전용인지 — 외부 브라우저(비로그인)에서 로그인 기반 액션에 쓴다(#72).
   * 카운트는 콘텐츠의 일부라 남기고, 탭 대상만 없앤다.
   */
  readOnly?: boolean;
  activeIconColorClass?: string;
  onClick?: () => void;
}) {
  const showCount = typeof count === "number" && count > 0;
  const text = showCount ? String(count) : hideLabel ? null : label;

  // 표시 전용: 탭 대상을 없애되 카운트는 남긴다. 아이콘+숫자를 하나의 의미 단위로 읽히게
  // role="img" + aria-label로 묶는다(span의 aria-label은 role 없이는 무시될 수 있다).
  //
  // 배경은 Default를 그대로 쓴다 — reaction-bar/detail에 disabled 배경 토큰이 없다.
  // 아이콘·텍스트만 detail/disabled로 내린다(상세 바는 detail 패밀리를 쓴다는 이 파일의 규칙).
  if (readOnly) {
    return (
      <span
        role="img"
        aria-label={a11yLabel ?? label}
        className={cn(
          "inline-flex h-7 items-center rounded-[10px] bg-reaction-bar-detail-default-bg px-2",
          text !== null && "gap-1",
        )}
      >
        <span className="text-reaction-bar-detail-disabled-icon">{icon}</span>
        {text !== null ? (
          <span className="text-body-s text-reaction-bar-detail-disabled-count-text">
            {text}
          </span>
        ) : null}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={a11yLabel ?? label}
      aria-pressed={pressable ? active : undefined}
      className={cn(
        // group: :active는 눌린 요소와 조상에만 매칭돼 자식 span이 안 걸린다 → group-active로 전달.
        "group inline-flex h-7 items-center rounded-[10px] px-2",
        // Active는 배경을 Default 그대로 두고, 눌린 동안에만 pressed 배경으로 바뀐다.
        "bg-reaction-bar-detail-default-bg active:bg-reaction-bar-detail-pressed-bg",
        text !== null && "gap-1",
      )}
    >
      <span
        className={cn(
          "text-reaction-bar-detail-default-icon group-active:text-reaction-bar-detail-pressed-icon",
          active && activeIconColorClass,
        )}
      >
        {icon}
      </span>
      {text !== null ? (
        <span
          className={cn(
            "text-body-s",
            "text-reaction-bar-detail-default-count-text group-active:text-reaction-bar-detail-pressed-count-text",
            active && "text-reaction-bar-detail-active-count-text",
          )}
        >
          {text}
        </span>
      ) : null}
    </button>
  );
}
