import { RollingNumber } from "@/features/community/presentation/balance/rolling-number";

/**
 * 한 줄 문구 안의 숫자만 자리마다 굴러 올라가게 그린다 — "20시간 15분 46초 남음".
 *
 * 리스트 카드·고정 바는 남은 시간을 한 문자열로 받는다(formatRemaining). 문구를 조각으로 나누지
 * 않고 숫자 덩어리만 RollingNumber로 바꿔 끼우므로 글꼴·자간은 그대로 한 줄로 읽힌다.
 */
export function RollingText({ text }: { text: string }) {
  return text.split(/(\d+)/).map((part, index) =>
    /^\d+$/.test(part) ? (
      <RollingNumber key={index} value={part} className="tabular-nums" />
    ) : (
      part
    ),
  );
}
