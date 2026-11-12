import type { DeadlineSoonItem } from "@/features/competition/domain/competition-interest-banner";
import { daysBetween } from "@/features/competition/domain/competition-registration";
import type { ResultCardGroup } from "@/features/competition/domain/competition-result-prompt";

/**
 * 대회 탭 맨 위 배너 자리 — 필터 줄 바로 아래에 한 번에 한 장만 띄운다.
 *
 * 띄울 수 있는 배너를 한 줄로 세워 두고(대기열), 앱에서 당겨서 새로고침할 때마다 다음 장으로 넘긴다.
 * 종류: 결과 남기기(끝난 지 며칠 안 된 관심 대회, #403) · 곧 마감(접수 마감이 일주일 안인 관심 대회, #396).
 * 새 종류(광고·혜택 등)는 BannerSlotItem에 갈래를 하나 더하고 bannerSlotQueue에 자리를 정해 넣는다.
 */
export type BannerSlotItem =
  | {
      kind: "result";
      /** 대기열 안에서 이 배너를 가리키는 이름 — 넘김 위치를 기억할 때 쓴다. */
      key: string;
      group: ResultCardGroup;
    }
  | {
      kind: "deadline";
      key: string;
      deadline: DeadlineSoonItem;
    };

/**
 * 배너 대기열 — 처음 들어오면 앞에서부터 띄운다.
 *
 * 결과 남기기를 먼저 둔다: 끝난 직후 며칠만 물을 수 있어 놓치면 다시 묻기 어렵다.
 * 결과 남기기는 대회마다 한 장이다 — 같은 주말에 끝난 대회도 한 장에 줄줄이 묶지 않는다(배너는 한 가지만 말한다).
 * 곧 마감은 대회마다 한 장씩, 마감이 가까운 순(deadlineSoonInterested가 정한 순서 그대로).
 */
export function bannerSlotQueue(
  results: readonly ResultCardGroup[],
  deadlines: readonly DeadlineSoonItem[],
): BannerSlotItem[] {
  return [
    ...results.flatMap(splitGroup).map(
      (group): BannerSlotItem => ({
        kind: "result",
        // 대회 id로 부른다 — 묶음이 바뀌어도(관심을 끄거나 새로 받아 오면) 같은 대회는 같은 이름이다.
        key: `result:${group.competitions[0]?.id ?? group.key}`,
        group,
      }),
    ),
    ...deadlines.map(
      (deadline): BannerSlotItem => ({
        kind: "deadline",
        key: `deadline:${deadline.competition.id}:${deadline.deadline}`,
        deadline,
      }),
    ),
  ];
}

/**
 * 다음에 띄울 배너 이름 — `after` 다음 자리부터 돌며(끝에 닿으면 처음으로) 닫지 않은 첫 배너.
 *
 * `after`가 없거나 대기열에 없으면(처음 들어옴·그 배너가 빠짐) 맨 앞부터 찾는다.
 * 닫지 않은 배너가 `after` 하나뿐이면 그대로 `after`, 하나도 없으면 null.
 */
export function nextBannerSlotKey(
  keys: readonly string[],
  isOpen: (key: string) => boolean,
  after: string | null,
): string | null {
  const start = after === null ? -1 : keys.indexOf(after);
  for (let step = 1; step <= keys.length; step += 1) {
    const key = keys[(start + step) % keys.length];
    if (isOpen(key)) return key;
  }
  return null;
}

/** 같은 날·같은 주말 묶음을 대회 한 개짜리 묶음으로 나눈다 — '며칠 전'은 그 대회가 끝난 날로 다시 센다. */
function splitGroup(group: ResultCardGroup): ResultCardGroup[] {
  const last = group.competitions.at(-1);
  if (!last || group.competitions.length === 1) return [group];
  return group.competitions.map((competition) => ({
    key: `${group.key}:${competition.id}`,
    weekend: false,
    daysAgo: group.daysAgo + daysBetween(competition.date, last.date),
    competitions: [competition],
  }));
}
