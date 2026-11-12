import type { CompetitionFee } from "@/features/competition/domain/competition";
import { isDateKey } from "@/features/competition/domain/competition-registration";

/**
 * 참가비 단계 (#364).
 *
 * 기한이 있는 단계(얼리버드 등)는 기한이 지나면 passed — 화면은 흐리게 두되 지우지 않는다
 * (얼마를 놓쳤는지도 정보다). 금액 0은 무료다. 음수이거나 정수가 아니면 지어내지 않고 뺀다.
 */
export type CompetitionFeeItem = CompetitionFee & { passed: boolean };

export function feeItemsOn(
  fees: readonly CompetitionFee[] | undefined,
  today: string,
): CompetitionFeeItem[] {
  if (!fees) return [];
  return fees
    .filter((fee) => Number.isInteger(fee.amount) && fee.amount >= 0)
    .map((fee) => ({
      ...fee,
      until: fee.until && isDateKey(fee.until) ? fee.until : undefined,
      passed: Boolean(fee.until && isDateKey(fee.until) && fee.until < today),
    }));
}
