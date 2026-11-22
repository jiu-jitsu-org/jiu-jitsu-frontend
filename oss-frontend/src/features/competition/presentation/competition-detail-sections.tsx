import type { ReactNode } from "react";

import type { Competition } from "@/features/competition/domain/competition";
import type { CompetitionFeeItem } from "@/features/competition/domain/competition-fee";
import {
  dateRangeLabel,
  feeAmountLabel,
  feeNoteLines,
  longDateLabel,
  shortDateLabel,
} from "@/features/competition/presentation/competition-detail-format";
import { divisionLabels } from "@/features/competition/presentation/competition-month-section";
import { isDateKey } from "@/features/competition/domain/competition-registration";
import { cn } from "@/shared/lib/cn";
import { WonCoinIcon } from "@/shared/ui/icons";

/**
 * 상세 덩어리 하나 — 제목 + 회색 박스. 목록 줄과 같은 회색 박스(rounded-20)로 묶고, 덩어리 사이는 선 없이 간격으로 나눈다.
 * 글자 위계: 대회 이름 24 → 덩어리 제목 18 → 본문 15 → 보조 13. 덩어리 사이(32)를 제목과 박스 사이(12)보다 넓게 둬
 * 제목이 아래 박스에 붙어 읽히게 한다.
 * 제목 왼쪽 아이콘은 20px · 채운 모양 · 옅은 회색으로, 제목보다 눈에 덜 띄게 무엇에 관한 덩어리인지만 알린다.
 */
export function DetailSection({
  id,
  title,
  icon,
  count,
  children,
  className,
}: {
  id?: string;
  title?: string;
  icon?: ReactNode;
  /** 제목 옆 수(대회 이야기 수 등) — 옅은 글자로 붙인다. 없으면 두지 않는다. */
  count?: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("px-4 pt-8", className)}>
      {title ? (
        <h2 className="mb-3 flex items-center gap-1.5 px-1 text-[18px] leading-[26px] font-bold text-text-primary">
          {icon ? (
            <span aria-hidden className="inline-flex text-icon-tertiary">
              {icon}
            </span>
          ) : null}
          {title}
          {count !== undefined ? (
            <span className="text-text-tertiary tabular-nums">
              {count.toLocaleString("ko-KR")}
            </span>
          ) : null}
        </h2>
      ) : null}
      <div className="rounded-20 bg-surface-field px-4 py-3">{children}</div>
    </section>
  );
}

/**
 * 기본 정보 (#361) — 일시 · 장소 · 종목 · 대상 · 주최.
 * 포스터 이미지는 저작권 때문에 싣지 않고 필요한 정보만 글자로 둔다. 없는 정보는 줄을 넣지 않는다.
 * 대회 공지는 위 상태 버튼 대신 먼저 열리지 않게 아래 정보 기준 줄로 내렸다(#471).
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
      value: competition.endDate
        ? dateRangeLabel(
            competition.date,
            competition.endDate,
            currentYear,
            competition.startTime,
          )
        : `${longDateLabel(competition.date, currentYear)}${competition.startTime ? ` ${competition.startTime}~` : ""}`,
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

  if (rows.length === 0) return null;
  return (
    <DetailSection className="pt-5">
      <dl className="flex flex-col gap-2.5 py-1">
        {rows.map((row) => (
          <div key={row.label} className="flex gap-3">
            <dt className="w-9 flex-none text-[14px] leading-[21px] text-text-secondary">
              {row.label}
            </dt>
            <dd className="min-w-0 flex-1 text-[15px] leading-[21px] font-medium break-keep text-text-primary [overflow-wrap:anywhere]">
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
 * 얼리버드가 없으면 기본 참가비 한 줄만 나온다. 신청 · 결제 안내 줄은 두지 않는다 — 아래 바의 대회사 사이트 버튼과
 * 바로 아래 정보 기준 줄의 '대회 공지' 링크가 같은 말을 해서, 설명이 세 줄로 길어지기만 했다.
 */
export function CompetitionFeeSection({
  fees,
  feeNote,
  currentYear,
}: {
  fees: CompetitionFeeItem[];
  /** 참가비 기준 한 줄(서버). 없으면 성인 1종목 기준으로 적는다. */
  feeNote?: string;
  currentYear: number;
}) {
  if (fees.length === 0) return null;
  // 서버 글이 비었거나 "·"·마침표뿐이면 기본 문구로 채운다.
  const parsedNote = feeNote ? feeNoteLines(feeNote) : [];
  const noteLines =
    parsedNote.length > 0 ? parsedNote : ["성인 1종목 기준이에요"];
  return (
    <DetailSection title="참가비" icon={<WonCoinIcon size={20} />}>
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
        {noteLines.map((line, index) => (
          // "·" 조각마다 한 줄. 블록만으로는 읽어 주는 글이 이어 읽어, 줄 사이에 보이지 않는 쉼표를 둔다.
          <span key={index} className="block">
            {line}
            {index < noteLines.length - 1 ? (
              <span className="sr-only">, </span>
            ) : null}
          </span>
        ))}
      </p>
    </DetailSection>
  );
}
