import { weekdayOf } from "@/features/competition/presentation/competition-month-section";

/** "11월 22일(일)" — 해가 다르면 "2027년 1월 16일(토)". currentYear가 null이면 늘 연도를 붙인다. */
export function longDateLabel(
  date: string,
  currentYear: number | null,
): string {
  const [year, month, day] = date.split("-").map(Number);
  const prefix = year === currentYear ? "" : `${year}년 `;
  return `${prefix}${month}월 ${day}일(${weekdayOf(date).label})`;
}

/** "11.8" — 해가 다르면 "2027.1.9". 일정·참가비 기한처럼 좁은 칸에 쓴다. */
export function shortDateLabel(date: string, currentYear: number): string {
  const [year, month, day] = date.split("-").map(Number);
  return year === currentYear ? `${month}.${day}` : `${year}.${month}.${day}`;
}

/** "2026.11.4" — 확인일은 해가 지나도 헷갈리지 않게 늘 연도를 붙인다. */
export function fullDateLabel(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return `${year}.${month}.${day}`;
}

/** 0 → "무료"(#420), 60000 → "6만 원", 65000 → "6만 5천 원", 그 밖에는 "65,500원". */
export function feeAmountLabel(amount: number): string {
  if (amount === 0) return "무료";
  const man = Math.floor(amount / 10000);
  const rest = amount % 10000;
  if (man > 0 && rest === 0) return `${man}만 원`;
  if (man > 0 && rest % 1000 === 0) return `${man}만 ${rest / 1000}천 원`;
  return `${amount.toLocaleString("ko-KR")}원`;
}

/**
 * 참가비 기준 글(서버) → 보여 줄 줄들. "·"로 이어진 조각을 한 줄씩 나눠, 길어지면 어디서든 끊기지 않고
 * 뜻 단위로 줄이 바뀌게 한다. 글 속 1만 원 이상 금액("40,000원")은 참가비 줄과 같은 모양("4만 원")으로 맞춘다 —
 * "10,000~20,000원" 같은 범위는 한쪽만 바뀌어 섞여 보이지 않게 그대로 둔다. 조각 끝 마침표는 뗀다.
 * 남는 조각이 없으면 빈 배열(부르는 쪽이 기본 문구로 채운다).
 */
export function feeNoteLines(note: string): string[] {
  return note
    .split(/\s*·\s*/)
    .map((part) =>
      part
        .trim()
        .replace(/[.。]$/, "")
        .replace(
          /(?<![~\d,])(\d{1,3}(?:,\d{3})+|\d+)\s*원(?!\s*~)/g,
          (match, digits: string) => {
            const amount = Number(digits.replaceAll(",", ""));
            return amount >= 10000 ? feeAmountLabel(amount) : match;
          },
        ),
    )
    .filter((part) => part.length > 0);
}
