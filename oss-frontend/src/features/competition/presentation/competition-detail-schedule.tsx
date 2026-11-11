import type { CompetitionScheduleItem } from "@/features/competition/domain/competition-schedule";
import { longDateLabel } from "@/features/competition/presentation/competition-detail-format";
import { DetailSection } from "@/features/competition/presentation/competition-detail-sections";
import { ScheduleCurrentDot } from "@/features/competition/presentation/competition-schedule-current-dot";
import { cn } from "@/shared/lib/cn";
import { CalendarIcon } from "@/shared/ui/icons";

type Step = CompetitionScheduleItem & {
  phase: "done" | "current" | "upcoming";
  dday: string;
};

function stepsOf(items: CompetitionScheduleItem[]): Step[] {
  const currentIndex = items.findIndex((item) => item.state !== "done");
  return items.map((item, index) => ({
    ...item,
    phase:
      item.state === "done"
        ? "done"
        : index === currentIndex
          ? "current"
          : "upcoming",
    dday: item.state === "today" ? "오늘" : `D-${item.daysLeft}`,
  }));
}

/** 읽어 주는 글 — 점·색으로만 보이는 상태를 말로 붙인다. */
function stateText(step: Step) {
  if (step.phase === "done") return ", 지남";
  if (step.phase === "current") return `, 다음 일정 ${step.dday}`;
  return `, ${step.dday}`;
}

/**
 * 전체 일정 (#363) — 접수 시작 · 얼리버드 마감 · 접수 마감 · 대회일.
 *
 * 왼쪽 점을 선으로 이어 순서를 보이고, 이름은 왼쪽 · 날짜는 오른쪽에 둔다.
 * 지나온 구간은 파란 실선 + 꽉 찬 점, 남은 구간은 점선 + 빈 원이라 "어디까지 왔는지"가 선 하나로 읽힌다.
 * 바로 다음 일정(지금 단계)만 후광이 퍼지는 점 · 굵은 이름 · D-day 꼬리표 · 파란 날짜로 띄워 지금 챙길 날을 먼저 보이게 한다.
 * 모두 지났으면(끝난 대회) 선 전체가 실선이고 강조할 줄이 없다.
 */
export function CompetitionScheduleSection({
  items,
  currentYear,
}: {
  items: CompetitionScheduleItem[];
  currentYear: number;
}) {
  if (items.length === 0) return null;
  const steps = stepsOf(items);
  const currentIndex = steps.findIndex((step) => step.phase === "current");

  return (
    <DetailSection title="일정" icon={<CalendarIcon size={20} filled />}>
      <ol className="flex flex-col py-1">
        {steps.map((step, index) => {
          const current = step.phase === "current";
          const done = step.phase === "done";
          return (
            <li
              key={step.key}
              className="relative flex min-h-12 items-center gap-3"
            >
              {/* 선은 줄마다 위 반 · 아래 반으로 나눠 그린다 — 이름이 두 줄로 접혀 줄 높이가 달라도 점끼리 이어진다. */}
              {index > 0 ? (
                <Rail
                  position="top"
                  passed={isPassedSegment(index - 1, currentIndex)}
                />
              ) : null}
              {index < steps.length - 1 ? (
                <Rail
                  position="bottom"
                  passed={isPassedSegment(index, currentIndex)}
                />
              ) : null}
              <span
                aria-hidden
                className="relative z-[1] flex w-5 flex-none items-center justify-center"
              >
                {current ? (
                  <ScheduleCurrentDot />
                ) : done ? (
                  <span className="size-2 rounded-full bg-primary" />
                ) : (
                  <span className="size-2.5 rounded-full border-2 border-icon-disabled bg-surface-field" />
                )}
              </span>
              <span
                className={cn(
                  "min-w-0 flex-1 text-[15px] leading-[21px] break-keep",
                  done ? "text-text-disabled" : "text-text-primary",
                  current && "font-bold",
                )}
              >
                {step.label}
                <span className="sr-only">{stateText(step)}</span>
                {current ? (
                  <span
                    aria-hidden
                    className="ml-1.5 inline-flex h-5 translate-y-[-1px] items-center rounded-full bg-primary/15 px-1.5 align-middle text-[12px] font-bold text-primary tabular-nums"
                  >
                    {step.dday}
                  </span>
                ) : null}
              </span>
              <time
                dateTime={step.date}
                className={cn(
                  "flex-none text-[15px] leading-[21px] tabular-nums",
                  done && "text-text-disabled",
                  current && "font-bold text-primary",
                  step.phase === "upcoming" && "text-text-secondary",
                )}
              >
                {longDateLabel(step.date, currentYear)}
              </time>
            </li>
          );
        })}
      </ol>
    </DetailSection>
  );
}

/** from번째 줄에서 다음 줄로 가는 구간이 이미 지나온 구간인지. 모두 지났으면(currentIndex -1) 전부 지나온 구간이다. */
function isPassedSegment(from: number, currentIndex: number) {
  return currentIndex === -1 || from < currentIndex;
}

/** 점 사이 선의 반쪽 — 지나온 구간은 파란 실선, 남은 구간은 점선. */
function Rail({
  position,
  passed,
}: {
  position: "top" | "bottom";
  passed: boolean;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute left-[9px]",
        position === "top" ? "top-0 h-1/2" : "top-1/2 bottom-0",
        passed
          ? "w-0.5 bg-primary"
          : "border-l-2 border-dotted border-border-default",
      )}
    />
  );
}
