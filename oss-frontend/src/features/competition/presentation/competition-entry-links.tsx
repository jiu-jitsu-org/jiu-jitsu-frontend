import {
  type CompetitionEntryLink,
  type CompetitionEntryLinkKind,
} from "@/features/competition/domain/competition-entry-link";
import { cn } from "@/shared/lib/cn";
import { buttonVariants } from "@/shared/ui/button";

const ENTRY_LINK_LABELS: Record<CompetitionEntryLinkKind, string> = {
  register: "신청하기",
  participants: "참가자 현황 보기",
  bracket: "대진표 · 시간표 보기",
  liveMat: "실시간 매트 보기",
  result: "결과 보기",
};

/** 상태 링크로 바닥 바에 놓을 버튼들. 첫째가 주 버튼이다. */
function entryButtonsOf(links: CompetitionEntryLink[]) {
  return links.map((link) => ({
    key: link.kind,
    url: link.url,
    label: ENTRY_LINK_LABELS[link.kind],
    primary: link === links[0],
  }));
}

/** 바닥 바를 그리는지 — 그리면 본문 아래 여백을 바가 대신한다. */
export function hasEntryBar(links: CompetitionEntryLink[]) {
  return entryButtonsOf(links).length > 0;
}

/**
 * 상태 버튼 (#469 · #470) — 화면 아래에 붙은 바. 지금 단계에 맞는 접수 사이트 페이지로 바로 보낸다.
 *
 * 하나면 꽉 찬 주 버튼 + 버튼 위에 어느 사이트인지 한 줄, 둘이면(당일) 가로 반반 — 왼쪽 보조 · 오른쪽 주.
 * 상태 링크가 없으면 바를 그리지 않는다.
 * 링크는 새 창으로 연다 — 앱에서는 앱 위 브라우저로 뜬다(jiu-jitsu-ios#316).
 *
 * 앱바가 SubviewScrollShell 안에서 sticky로 위에 붙듯 바는 sticky로 아래에 붙는다 — 본문 끝까지 내리면 본문 바로
 * 뒤에 놓여 마지막 내용을 가리지 않고, 높이(사이트 글 유무)를 재지 않아도 된다. 셸이 세로 flex라 내용이
 * 짧으면 mt-auto로 화면 바닥에 내려간다.
 * 바닥은 댓글 입력줄처럼 홈 인디케이터 자리까지 바탕색으로 칠하고, 위 경계는 선 대신 바탕색 그라데이션으로 흐린다.
 * 토스트는 toast-inset-bottom-bar(-note)로 바 위에 띄운다(globals.css).
 */
export function CompetitionEntryBar({
  links,
}: {
  links: CompetitionEntryLink[];
}) {
  const buttons = entryButtonsOf(links);
  if (buttons.length === 0) return null;

  const only = links.length === 1 ? links[0] : undefined;
  const caption = only?.siteName
    ? `${only.siteName}에서 ${only.kind === "register" ? "신청 · 결제" : "보기"}`
    : null;
  const note = caption;

  return (
    <div
      className={cn(
        "sticky bottom-0 z-20 mt-auto bg-surface-container px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+12px)]",
        note ? "toast-inset-bottom-bar-note" : "toast-inset-bottom-bar",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-full h-6 bg-linear-to-t from-surface-container to-surface-container/0"
      />
      {note ? (
        <p className="mb-2 text-center text-[13px] leading-[18px] text-text-tertiary">
          {note}
        </p>
      ) : null}
      {/* 둘이면 주 버튼이 엄지에 가까운 오른쪽에 오게 순서를 뒤집는다. */}
      <div className="flex flex-row-reverse gap-2">
        {buttons.map((button) => (
          <a
            key={button.key}
            href={button.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({
                variant: button.primary ? "filled" : "neutral",
                size: "l",
              }),
              "min-w-0 flex-1 px-2",
            )}
          >
            {button.label}
          </a>
        ))}
      </div>
    </div>
  );
}
