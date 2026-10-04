"use client";

import { useRouter } from "next/navigation";
import {
  useOptimistic,
  useTransition,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import {
  MY_ACTIVITY_TABS,
  type MyActivityTab,
} from "@/features/community/presentation/my-activity/my-activity-tab";
import { MY_ACTIVITY_PATH } from "@/features/community/presentation/use-open-my-activity";
import { cn } from "@/shared/lib/cn";

const PANEL_ID = "my-activity-panel";

function tabId(tab: MyActivityTab): string {
  return `my-activity-tab-${tab}`;
}

/**
 * 내 커뮤니티 활동 탭 바 + 탭 패널 (클라이언트).
 *
 * 탭은 URL(?tab=)이 정본이다 — 네이티브가 특정 탭으로 바로 열 수 있어야 하기 때문. 탭을 누르면
 * URL을 replace로 바꾸고(히스토리를 쌓지 않는다 — 뒤로가기가 탭을 되감으면 화면을 닫을 수 없다)
 * Server Component가 그 탭의 첫 페이지를 다시 읽어 children으로 내려준다. 다른 탭을 미리 읽어 두지
 * 않으므로 돌아올 때마다 최신 목록이다(저장을 해제한 글도 이때 빠진다).
 *
 * 서버 응답을 기다리는 동안 선택 표시는 즉시 옮기고(useOptimistic) 패널에는 로딩을 보여준다 —
 * 옛 탭 목록이 새 탭 이름 아래 남아 있으면 잘못된 목록으로 읽힌다.
 *
 * 스타일: 두 탭 등폭, 높이 44, 컨테이너 좌우 16, Body M. 선택 탭은 semibold + 탭 폭 전체 2px 밑줄,
 * 미선택은 medium. 탭 행 아래 구분선은 없다.
 */
export function MyActivityTabs({
  tab,
  children,
}: {
  tab: MyActivityTab;
  /** 선택된 탭의 패널 내용(서버가 그린 목록 · 빈 상태). */
  children: ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedTab, setSelectedTab] = useOptimistic(tab);

  function select(next: MyActivityTab) {
    if (next === selectedTab) return;

    startTransition(() => {
      setSelectedTab(next);
      // scroll: false — 탭은 상단에 있어 누를 수 있는 순간엔 이미 위쪽이다. 맨 위로 튀지 않게 둔다.
      router.replace(`${MY_ACTIVITY_PATH}?tab=${next}`, { scroll: false });
    });
  }

  /** 좌우 화살표로 탭 이동(WAI-ARIA tabs 패턴). 선택과 동시에 포커스도 옮긴다. */
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();

    const index = MY_ACTIVITY_TABS.findIndex(
      (item) => item.value === selectedTab,
    );
    const step = event.key === "ArrowRight" ? 1 : -1;
    const next =
      MY_ACTIVITY_TABS[
        (index + step + MY_ACTIVITY_TABS.length) % MY_ACTIVITY_TABS.length
      ].value;

    select(next);
    document.getElementById(tabId(next))?.focus();
  }

  return (
    <>
      <div role="tablist" aria-label="커뮤니티 활동" className="flex px-4">
        {MY_ACTIVITY_TABS.map((item) => {
          const selected = item.value === selectedTab;

          return (
            <button
              key={item.value}
              id={tabId(item.value)}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={PANEL_ID}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(item.value)}
              onKeyDown={handleKeyDown}
              className={cn(
                "relative h-11 flex-1 text-body-m",
                selected
                  ? "font-semibold text-tab-bar-selected-text"
                  : "font-medium text-tab-bar-unselected-text",
              )}
            >
              {item.label}
              {selected ? (
                // 밑줄: 탭 폭 전체, 2px, 끝 둥글게
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-tab-bar-selected-underline"
                />
              ) : null}
            </button>
          );
        })}
      </div>

      <div
        id={PANEL_ID}
        role="tabpanel"
        aria-labelledby={tabId(selectedTab)}
      >
        {pending ? <MyActivityPanelLoading /> : children}
      </div>
    </>
  );
}

/** 탭 전환 중(서버 응답 대기) 패널 로딩 — 메인 피드 로딩 스피너와 같은 모양. */
function MyActivityPanelLoading() {
  return (
    <div className="flex justify-center pt-24">
      <span
        className="size-6 animate-spin rounded-full border-2 border-feed-card-header-avatar-bg border-t-transparent"
        role="status"
        aria-label="불러오는 중"
      />
    </div>
  );
}
