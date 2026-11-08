import type { ReactNode } from "react";

import type { Competition } from "@/features/competition/domain/competition";
import type { CompetitionFeeItem } from "@/features/competition/domain/competition-fee";
import {
  feeAmountLabel,
  longDateLabel,
  shortDateLabel,
} from "@/features/competition/presentation/competition-detail-format";
import { divisionLabels } from "@/features/competition/presentation/competition-month-section";
import { isDateKey } from "@/features/competition/domain/competition-registration";
import { cn } from "@/shared/lib/cn";

/**
 * 상세 덩어리 하나 — 제목 + 회색 박스. 목록 줄과 같은 회색 박스(rounded-20)로 묶고, 덩어리 사이는 선 없이 간격으로 나눈다.
 */
export function DetailSection({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("px-4 pt-6", className)}>
      {title ? (
        <h2 className="mb-2 px-1 text-[16px] leading-[22px] font-bold text-text-primary">
          {title}
        </h2>
      ) : null}
      <div className="rounded-20 bg-surface-field px-4 py-3">{children}</div>
    </section>
  );
}

/**
 * 기본 정보 (#361) — 일시 · 장소 · 종목 · 대상 · 주최 · 대회 공지.
 * 포스터 이미지는 저작권 때문에 싣지 않고 필요한 정보만 글자로 둔다. 없는 정보는 줄을 넣지 않는다.
 * 대회 공지는 접수 상태와 상관없이 대회사가 올린 공지로 보낸다(새 창 — 앱에서는 외부 브라우저).
 */
export function CompetitionInfoSection({
  competition,
  currentYear,
}: {
  competition: Competition;
  currentYear: number;
}) {
  const place = [competition.place.trim(), competition.venue?.trim()]
    .filter(Boolean)
    .join(" · ");
  const divisions = divisionLabels(competition).join(" · ");
  const rows: { label: string; value: ReactNode }[] = [];
  if (isDateKey(competition.date)) {
    rows.push({
      label: "일시",
      value: `${longDateLabel(competition.date, currentYear)}${competition.startTime ? ` ${competition.startTime}~` : ""}`,
    });
  }
  if (place) rows.push({ label: "장소", value: place });
  if (divisions) rows.push({ label: "종목", value: divisions });
  if (competition.audience?.trim()) {
    rows.push({ label: "대상", value: competition.audience.trim() });
  }
  if (competition.host?.trim()) {
    rows.push({ label: "주최", value: competition.host.trim() });
  }
  // 대회사 공지 주소는 http(s)만 링크로 연다 — 다른 형식의 값이 들어와도 눌리는 링크가 되지 않게.
  if (competition.noticeUrl && /^https?:\/\//i.test(competition.noticeUrl)) {
    rows.push({
      label: "공지",
      value: (
        <a
          href={competition.noticeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-primary underline-offset-2 active:underline"
        >
          대회 공지 보기 ↗
        </a>
      ),
    });
  }

  if (rows.length === 0) return null;
  return (
    <DetailSection className="pt-5">
      <dl className="flex flex-col gap-2.5 py-1">
        {rows.map((row) => (
          <div key={row.label} className="flex gap-3">
            <dt className="w-9 flex-none text-[14px] leading-[21px] text-text-secondary">
              {row.label}
            </dt>
            <dd className="min-w-0 flex-1 text-[15px] leading-[21px] break-keep text-text-primary [overflow-wrap:anywhere]">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </DetailSection>
  );
}

/**
 * 참가비 (#364) — 단계별 금액. 기한이 지난 단계는 흐리게 두고 읽어 주는 글에 "기한 지남"을 붙인다.
 * 얼리버드가 없으면 기본 참가비 한 줄만 나온다. 신청과 결제는 대회 공지에서 한다.
 */
export function CompetitionFeeSection({
  fees,
  currentYear,
}: {
  fees: CompetitionFeeItem[];
  currentYear: number;
}) {
  if (fees.length === 0) return null;
  return (
    <DetailSection title="참가비">
      <ul className="flex flex-col">
        {fees.map((fee, index) => (
          <li
            // 단계 이름·금액이 같은 줄이 있어도 겹치지 않게 순서를 섞는다(단계 순서는 바뀌지 않는다).
            key={`${index}-${fee.label}`}
            className={cn(
              "flex min-h-10 items-center gap-3 text-[15px] leading-[21px]",
              fee.passed ? "text-text-disabled" : "text-text-primary",
            )}
          >
            <span className="min-w-0 flex-1">
              {fee.label}
              {fee.until ? (
                <span
                  className={cn(
                    "ml-1 text-[14px] tabular-nums",
                    !fee.passed && "text-text-secondary",
                  )}
                >
                  (~{shortDateLabel(fee.until, currentYear)})
                </span>
              ) : null}
              {fee.passed ? <span className="sr-only">, 기한 지남</span> : null}
            </span>
            <span className="flex-none font-semibold tabular-nums">
              {feeAmountLabel(fee.amount)}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-1 pb-1 text-[13px] leading-[18px] text-text-tertiary">
        성인 1종목 기준이에요. 신청과 결제는 대회 공지에서 해요
      </p>
    </DetailSection>
  );
}
