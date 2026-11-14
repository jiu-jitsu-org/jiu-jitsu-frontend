import {
  isWebUrl,
  type CompetitionEntryLink,
  type CompetitionEntryLinkKind,
} from "@/features/competition/domain/competition-entry-link";
import type { CompetitionDetailStatus } from "@/features/competition/domain/competition-schedule";
import type { CompetitionAlertTarget } from "@/features/competition/presentation/competition-alert-sheet";
import { longDateLabel } from "@/features/competition/presentation/competition-detail-format";
import { CompetitionDetailInterestButton } from "@/features/competition/presentation/competition-detail-summary";
import { cn } from "@/shared/lib/cn";
import { Button, buttonVariants } from "@/shared/ui/button";

const ENTRY_LINK_LABELS: Record<CompetitionEntryLinkKind, string> = {
  register: "신청하기",
  participants: "참가자 현황 보기",
  bracket: "대진표 · 시간표 보기",
  liveMat: "실시간 매트 보기",
  result: "결과 보기",
};

type EntryButton =
  | { key: string; url: string; label: string; primary: boolean }
  /** 아직 갈 곳이 없는 단계(접수 전)를 알리는 누를 수 없는 버튼. */
  | { key: string; url?: undefined; label: string; primary: false };

/**
 * 바닥 바에 놓을 버튼들. 첫째가 주 버튼이다.
 * 상태 링크가 있으면 그것 → 접수 전이면 접수 시작일(또는 미정)을 적은 누를 수 없는 버튼 → 대회 공지로 가는 보조 버튼.
 * 접수 전 단계엔 상태 링크가 없다 — 공지는 정보 기준 줄의 '대회 공지' 링크로도 갈 수 있어 이 자리는 언제 열리는지 알리는 데 쓴다.
 */
function entryButtonsOf({
  links,
  noticeUrl,
  status,
  currentYear,
}: EntryBarSource): EntryButton[] {
  if (links.length > 0) {
    return links.map((link) => ({
      key: link.kind,
      url: link.url,
      label: ENTRY_LINK_LABELS[link.kind],
      primary: link === links[0],
    }));
  }
  if (status?.kind === "upcoming") {
    return [
      {
        key: "opens",
        label: `${longDateLabel(status.opensOn, currentYear)} 접수 시작`,
        primary: false,
      },
    ];
  }
  if (status?.kind === "unannounced") {
    return [{ key: "opens", label: "접수 일정 미정", primary: false }];
  }
  return isWebUrl(noticeUrl)
    ? [
        {
          key: "notice",
          url: noticeUrl,
          label: "대회사 사이트에서 확인하기",
          primary: false,
        },
      ]
    : [];
}

type EntryBarSource = {
  links: CompetitionEntryLink[];
  noticeUrl?: string;
  status: CompetitionDetailStatus | null;
  currentYear: number;
};

/** 바닥 바를 그리는지 — 그리면 본문 아래 여백을 바가 대신한다. */
export function hasEntryBar(source: EntryBarSource) {
  return entryButtonsOf(source).length > 0;
}

/**
 * 상태 버튼 (#469 · #470) — 화면 아래에 붙은 바. 지금 단계에 맞는 접수 사이트 페이지로 바로 보낸다.
 *
 * 하나면 꽉 찬 주 버튼 + 버튼 위에 어느 사이트인지 한 줄, 둘이면(당일) 가로 반반 — 왼쪽 보조 · 오른쪽 주.
 * 관심 등록(interestTarget)을 받으면 맨 왼쪽에 하트만 든 정사각 버튼을 두고, 나머지 폭을 버튼들이 나눈다.
 * 접수 예정 · 접수 일정 미정이면 같은 자리에 접수 시작일(또는 미정)을 적은 누를 수 없는 버튼을 둔다 — 하트가
 * 접수 중과 같은 자리에 있게(같은 동작은 같은 자리). 그 밖에 상태 링크가 없으면 대회 공지로 가는 보조 버튼을 두고,
 * 공지 주소도 없으면 바를 그리지 않는다.
 * 대한체육회 대회는 접수 전 · 접수 중에 도장을 통해 신청한다고 버튼 위에 알린다.
 * 링크는 새 창으로 연다 — 앱에서는 앱 위 브라우저로 뜬다(jiu-jitsu-ios#316).
 *
 * 앱바가 SubviewScrollShell 안에서 sticky로 위에 붙듯 바는 sticky로 아래에 붙는다 — 본문 끝까지 내리면 본문 바로
 * 뒤에 놓여 마지막 내용을 가리지 않고, 높이(사이트 글 · 안내 글 유무)를 재지 않아도 된다. 셸이 세로 flex라 내용이
 * 짧으면 mt-auto로 화면 바닥에 내려간다.
 * 바닥은 댓글 입력줄처럼 홈 인디케이터 자리까지 바탕색으로 칠하고, 위 경계는 선 대신 바탕색 그라데이션으로 흐린다.
 * 토스트는 toast-inset-bottom-bar(-note)로 바 위에 띄운다(globals.css).
 */
export function CompetitionEntryBar({
  clubEntryOnly,
  interestTarget,
  ...source
}: EntryBarSource & {
  clubEntryOnly: boolean;
  /** 관심 등록 대상 — 있으면 바 왼쪽에 하트 버튼을 둔다(끝난 대회는 없다). */
  interestTarget?: CompetitionAlertTarget;
}) {
  const { links } = source;
  const buttons = entryButtonsOf(source);
  if (buttons.length === 0) return null;

  const only = links.length === 1 ? links[0] : undefined;
  const caption = only?.siteName
    ? `${only.siteName}에서 ${only.kind === "register" ? "신청 · 결제" : "보기"}`
    : null;
  const note = clubEntryOnly
    ? "도장(감독 · 코치)을 통해 신청하는 대회예요"
    : caption;

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
        <p
          className={cn(
            "mb-2 text-center text-[13px] leading-[18px]",
            clubEntryOnly ? "text-text-secondary" : "text-text-tertiary",
          )}
        >
          {note}
        </p>
      ) : null}
      {/* 둘이면 주 버튼이 엄지에 가까운 오른쪽에 온다 — 읽는 순서도 화면 순서(하트 · 보조 · 주)와 같게 배열을 뒤집어 그린다. */}
      <div className="flex gap-2">
        {interestTarget ? (
          <CompetitionDetailInterestButton
            target={interestTarget}
            shape="icon"
          />
        ) : null}
        <div className="flex min-w-0 flex-1 gap-2">
          {[...buttons].reverse().map((button) =>
            button.url === undefined ? (
              <Button
                key={button.key}
                variant="neutral"
                size="l"
                disabled
                className="min-w-0 flex-1 px-2 tabular-nums"
              >
                {button.label}
              </Button>
            ) : (
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
                <span className="sr-only">(새 창)</span>
              </a>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
