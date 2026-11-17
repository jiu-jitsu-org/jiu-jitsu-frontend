import type { DeadlineAlertClock } from "@/features/competition/domain/competition-alert";
import { toKstDateKey, toKstHour } from "@/shared/lib/time";

/** 서버 시각(ms) → 마감 알림을 가르는 한국 날짜 · 시(#548). 서버 렌더와 화면이 같이 쓴다. */
export function deadlineAlertClockAt(epochMs: number): DeadlineAlertClock {
  return { today: toKstDateKey(epochMs), hour: toKstHour(epochMs) };
}
