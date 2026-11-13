"use client";

import { useEffect, useRef, type RefObject } from "react";

import type { BeltRank } from "@/features/community/domain/belt";
import type { Competition } from "@/features/competition/domain/competition";
import type {
  DeadlineSoonItem,
  EventSoonItem,
} from "@/features/competition/domain/competition-interest-banner";
import { daysBetween } from "@/features/competition/domain/competition-registration";
import { setNativeCompetitionHeaderTint } from "@/shared/lib/native-bridge";
import { IconButton } from "@/shared/ui/icon-button";
import { CloseIcon } from "@/shared/ui/icons";

/**
 * 곧 마감 배너 (#396) — 접수 마감이 일주일 안으로 다가온 내 관심 대회 한 장. 대회 탭 배너 자리에 뜬다.
 * 곧 열려요 배너 — 대회 날이 일주일 안으로 다가온 내 관심 대회(접수 상태 무관). 같은 자리·같은 모양에 문구만 다르다.
 *
 * 작은 진한 카드: 왼쪽에 남은 날 네모(D-n, 당일은 '오늘'), 오른쪽에 작은 글(종류별 문구)과 굵은 대회 이름.
 * 카드를 누르면 상세가 열린다. ✕로 닫으면 이 기기에서 그 대회의 그 날짜 배너는 다시 뜨지 않는다(닫기는 호출부가 한다).
 * 결과 남기기 배너와 모서리·안쪽 여백·✕ 자리가 같다.
 */
export function DeadlineSoonBanner({
  kind = "deadline",
  competition,
  date,
  today,
  onSelect,
  onClose,
}: {
  /** deadline: 곧 마감(접수 마감일) · event: 곧 열려요(대회 날) */
  kind?: "deadline" | "event";
  competition: Competition;
  /** 남은 날을 셀 날 — 곧 마감이면 마감일, 곧 열려요면 대회 날. "YYYY-MM-DD" */
  date: string;
  /** 한국 날짜 "YYYY-MM-DD" — 남은 날을 센다. */
  today: string;
  onSelect: (competition: Competition) => void;
  onClose: () => void;
}) {
  const daysLeft = daysBetween(today, date);
  const copy = BANNER_COPY[kind];

  return (
    <section aria-label={copy.label} className="relative">
      <button
        type="button"
        onClick={() => onSelect(competition)}
        className="flex w-full items-center gap-3 rounded-20 bg-[var(--cool-gray-900)] py-3 pr-12 pl-4 text-left text-text-on-dark"
      >
        <span className="flex size-11 flex-none items-center justify-center rounded-10 bg-[var(--opacity-white-20)] text-[13px] leading-[18px] font-bold tabular-nums">
          {daysLeft <= 0 ? "오늘" : `D-${daysLeft}`}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-[12px] leading-[16px] text-[var(--opacity-white-60)]">
            {copy.lead}
          </span>
          <span className="truncate text-[16px] leading-[22px] font-bold">
            {competition.name}
          </span>
        </span>
      </button>
      {/* 오른쪽 위 — 보이는 ✕는 20, 누를 자리는 44. 카드 버튼 밖 형제라 누르면 상세가 열리지 않는다. */}
      <IconButton
        size="l"
        aria-label={`${competition.name} ${copy.close}`}
        onClick={onClose}
        className={`${BANNER_CLOSE_POSITION} text-[var(--opacity-white-60)] active:bg-[var(--opacity-white-20)]`}
      >
        <CloseIcon size={20} />
      </IconButton>
    </section>
  );
}

const BANNER_COPY = {
  deadline: {
    label: "곧 마감인 관심 대회",
    lead: "관심 대회 접수가 곧 끝나요",
    close: "마감 알림 닫기",
  },
  event: {
    label: "곧 열리는 관심 대회",
    lead: "관심 대회가 곧 열려요",
    close: "곧 열려요 알림 닫기",
  },
} as const;

/** 배너 ✕ 자리 — 곧 마감·결과 남기기 배너가 함께 쓴다(오른쪽 위, 44 누를 자리). */
export const BANNER_CLOSE_POSITION = "absolute top-0.5 right-1";

const DISMISSED_KEY_PREFIX = "competition-deadline-banner-dismissed:";
const DISMISS_EVENT = "oss:competition-deadline-banner-dismissed";

/**
 * 닫은 기록의 이름 — 대회와 마감 날짜를 함께 쓴다. 얼리버드 마감 알림을 닫아도 같은 대회의 접수 마감이
 * 다가오면 다시 알려야 해서다(마감마다 따로 챙길 일이다).
 * 곧 열려요는 대회 + 종류(event) + 대회 날짜 — 곧 마감을 닫은 기록과 섞이지 않는다.
 */
function dismissKey(item: DeadlineSoonItem | EventSoonItem) {
  return "eventDate" in item
    ? `${item.competition.id}:event:${item.eventDate}`
    : `${item.competition.id}:${item.deadline}`;
}

/** 저장소를 못 쓰는 환경(사생활 보호 모드)에서도 지금 화면에서는 닫히게 기억해 둔다. */
const hiddenThisSession = new Set<string>();

/** 이 곧 마감·곧 열려요 배너를 이 기기에서 닫았는지. 기록은 브라우저 저장소에만 있어 서버는 모른다. */
export function isDeadlineBannerDismissed(
  item: DeadlineSoonItem | EventSoonItem,
): boolean {
  const key = dismissKey(item);
  if (hiddenThisSession.has(key)) return true;
  try {
    return window.localStorage.getItem(DISMISSED_KEY_PREFIX + key) === "1";
  } catch {
    return false;
  }
}

export function dismissDeadlineBanner(item: DeadlineSoonItem | EventSoonItem) {
  const key = dismissKey(item);
  hiddenThisSession.add(key);
  try {
    window.localStorage.setItem(DISMISSED_KEY_PREFIX + key, "1");
  } catch {
    // 저장하지 못하면 다시 열었을 때 또 뜬다.
  }
  window.dispatchEvent(new Event(DISMISS_EVENT));
}

export function subscribeDeadlineBannerDismissed(onChange: () => void) {
  window.addEventListener(DISMISS_EVENT, onChange);
  return () => window.removeEventListener(DISMISS_EVENT, onChange);
}

/** 이 문서가 새로고침으로 열렸는지 — 앱의 당겨서 새로고침은 웹뷰를 다시 불러온다. */
export function isReloadedDocument(): boolean {
  try {
    const [entry] = performance.getEntriesByType("navigation");
    return (
      (entry as PerformanceNavigationTiming | undefined)?.type === "reload"
    );
  } catch {
    return false;
  }
}

/**
 * 위에서 내려오는 내 띠 색 그라데이션 — 화면 맨 위(필터 줄 뒤)에서 은은하게 시작해 배너 아래에서 바탕색으로 녹는다.
 * 배너가 있든 없든 늘 깐다. 배너 자리가 정해지면 0.5초에 걸쳐 옅게 들어오고(당겨서 새로고침이면 앱 머리에 이미 색이 깔려 있어
 * 바로 칠한다), `shown`이 꺼지면 0.5초에 걸쳐 옅어진다. 흰띠는 검은 바의 먹색, 검은띠는 끝 칸의 빨강으로 물들인다.
 *
 * 화면 맨 앞에 두고 z를 주지 않아, 뒤에 오는 필터 줄(sticky)·배너(relative)가 그 위에 그려진다.
 * 음수 z + isolate로 깔면 같은 화면의 시트(fixed z-50)가 main 안에 갇혀 토스트 등과 순서가 바뀌어 쓰지 않는다.
 *
 * 필터 줄은 아래로 지나가는 목록을 가려야 해서 불투명하게 칠한다. 그 바탕(barRef)을 지금 줄이 걸친 자리의
 * 그라데이션 구간으로 매번 다시 칠해, 앱 머리 → 필터 줄 → 배너 아래까지 끊김 없는 한 그라데이션으로 보이게 한다.
 * 앱 머리(‘대회’ 제목 줄·상태바)는 필터 줄 맨 윗자리 색으로 칠하도록 앱에 알린다(COMPETITION_HEADER_TINT).
 * 지원하지 않는 앱이면 보내지 않는다.
 *
 * `shown`이 null이면 배너 자리가 아직 정해지지 않은 것(서버 그림·첫 그림)이라 아무것도 하지 않는다 — 앱은
 * 당겨서 새로고침 때 색을 지우지 않고 웹의 새 알림을 기다리므로, 정해지기 전에 지우면 머리가 깜빡인다.
 * 색을 계산하지 못하면(color-mix를 모르는 옛 WebKit 등) 앱에 보내지 않는다 — 그때는 웹 그라데이션도 그려지지 않는다.
 */
export function CompetitionTopTint({
  rank,
  shown,
  barRef,
}: {
  rank: BeltRank;
  shown: boolean | null;
  /** 필터 줄 바탕 — 그 자리의 그라데이션 구간으로 칠한다. */
  barRef: RefObject<HTMLElement | null>;
}) {
  const { color, depth, height } = TINT[rank];
  const layerRef = useRef<HTMLDivElement>(null);
  const requestUpdateRef = useRef<() => void>(() => {});
  const ready = shown !== null;
  const decidedOnceRef = useRef(false);

  // 처음 정해질 때 0.5초에 걸쳐 짙어지고, 꺼지면 0.5초에 걸쳐 옅어진다.
  // 당겨서 새로고침이면(앞 그림의 색이 앱 머리에 깔려 있다) 움직이지 않고 바로 칠한다 — 머리와 어긋나 깜빡이지 않게.
  // 아래 칠하기보다 먼저 둔다 — 처음 정해질 때 투명한 채로 칠해 앱 머리에 '색 없음'을 먼저 보내지 않게.
  useEffect(() => {
    const layer = layerRef.current;
    if (shown === null || !layer) return;
    const first = !decidedOnceRef.current;
    decidedOnceRef.current = true;
    const visible = layer.style.opacity === "1";
    // 같은 값으로 다시 불리면(개발 모드의 효과 두 번 실행 등) 들어오던 페이드를 끊지 않는다.
    if (!first && visible === shown) {
      requestUpdateRef.current();
      return;
    }
    for (const running of layer.getAnimations()) running.cancel();
    layer.style.opacity = shown ? "1" : "0";
    const fade = first ? shown && !isReloadedDocument() : true;
    if (
      fade &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      layer.animate(
        [{ opacity: visible ? 1 : 0 }, { opacity: shown ? 1 : 0 }],
        { duration: 500, easing: smoothOutEasing() },
      );
    }
    requestUpdateRef.current();
  }, [shown]);

  useEffect(() => {
    const layer = layerRef.current;
    const bar = barRef.current;
    if (!ready || !layer) return;
    const probe = document.createElement("span");
    probe.style.display = "none";
    document.body.appendChild(probe);
    const html = document.documentElement;
    const hexOf = (percent: number) => {
      probe.style.backgroundColor = mixOf(color, percent);
      return toHex(getComputedStyle(probe).backgroundColor);
    };

    let sent: string | null | undefined;
    let frame = 0;
    const send = (hex: string | null) => {
      if (hex === sent) return;
      sent = hex;
      setNativeCompetitionHeaderTint(hex);
    };
    const update = () => {
      frame = 0;
      // 옅어지는 중이면 지금 불투명도만큼 색을 줄인다 — 앱 머리·필터 줄이 그라데이션과 같은 박자로 옅어진다.
      const strength = (Number(getComputedStyle(layer).opacity) || 0) * depth;
      const layerTop = layer.getBoundingClientRect().top;
      const barRect = bar?.getBoundingClientRect();
      const from = barRect ? barRect.top - layerTop : window.scrollY;
      const top = tintAt(from, height) * strength;
      if (bar && barRect && top > 0) {
        bar.style.background = tintGradient(
          color,
          from,
          from + barRect.height,
          strength,
          height,
        );
      } else {
        bar?.style.removeProperty("background");
      }
      if (top >= GLASS_CHIP_MIN) html.dataset[TINT_FLAG] = "";
      else delete html.dataset[TINT_FLAG];
      send(top > 0.05 ? hexOf(top) : null);
      // 옅어지는 동안은 매 프레임 다시 칠한다.
      if (layer.getAnimations().length > 0) requestUpdate();
    };
    const requestUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    requestUpdateRef.current = requestUpdate;
    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      requestUpdateRef.current = () => {};
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      cancelAnimationFrame(frame);
      probe.remove();
      bar?.style.removeProperty("background");
      delete html.dataset[TINT_FLAG];
      setNativeCompetitionHeaderTint(null);
    };
  }, [barRef, color, depth, height, ready]);

  return (
    <div
      ref={layerRef}
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0"
      style={{
        height,
        opacity: 0,
        background: tintGradient(color, 0, height, depth, height),
      }}
    />
  );
}

/** --ease-smooth-out 값 — 스크립트 애니메이션도 CSS 모션 토큰과 같은 곡선을 쓴다. */
export function smoothOutEasing() {
  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue("--ease-smooth-out")
      .trim() || "cubic-bezier(0.2, 0.8, 0.2, 1)"
  );
}

/**
 * 그라데이션 높이 — 배너가 없어도 첫 카드 줄을 지나 세 번째 카드 언저리까지 이어져, 칩 줄 아래에서
 * 띠처럼 끊겨 보이지 않게 넉넉히 잡는다.
 */
const TINT_HEIGHT = 420;
/**
 * 흰띠(먹색) 그라데이션 높이 — 먹색은 색이 없어 옅어지는 구간이 회색 카드(cool-gray-25)와 같은 밝기가 되면
 * 카드 테두리가 바탕에 묻힌다. 필터 줄 뒤에서 다 옅어지게 짧게 잡아 카드는 늘 맨 바탕 위에 둔다.
 * 다른 띠는 색이 있어 회색 카드와 섞이지 않아 TINT_HEIGHT 그대로다.
 */
const WHITE_BELT_TINT_HEIGHT = 150;
/**
 * 그라데이션 곡선 — [높이 비율, 띠 색 %]. smoothstep(3t²−2t³)을 12칸으로 나눈 값이라 맨 위와 맨 끝이 둘 다
 * 평평하다 — 끝에서 꺾이는 자리가 없어 어디서 사라졌는지 눈에 걸리지 않는다.
 * 바탕 그림·필터 줄 바탕·앱 머리 색이 모두 이 곡선(tintAt)을 따라 같은 자리에서 같은 색이 된다.
 */
const TINT_STOPS: readonly (readonly [number, number])[] = [
  [0, 16],
  [0.083, 15.69],
  [0.167, 14.81],
  [0.25, 13.5],
  [0.333, 11.85],
  [0.417, 9.98],
  [0.5, 8],
  [0.583, 6.02],
  [0.667, 4.15],
  [0.75, 2.5],
  [0.833, 1.19],
  [0.917, 0.31],
  [1, 0],
];

/** 맨 위에서 y(px)만큼 내려간 자리의 띠 색 비율(%) — 높이 height 안에서 TINT_STOPS 사이를 곧게 잇는다(CSS 그라데이션과 같다). */
function tintAt(y: number, height: number): number {
  const at = y / height;
  if (at <= 0) return TINT_STOPS[0][1];
  for (let index = 1; index < TINT_STOPS.length; index += 1) {
    const [x1, p1] = TINT_STOPS[index];
    if (at <= x1) {
      const [x0, p0] = TINT_STOPS[index - 1];
      return p0 + ((p1 - p0) * (at - x0)) / (x1 - x0);
    }
  }
  return 0;
}

function mixOf(color: string, percent: number) {
  return `color-mix(in srgb, ${color} ${percent.toFixed(2)}%, var(--surface-container))`;
}

/**
 * 맨 위에서 from~to(px) 구간의 그라데이션 — 구간 양끝과 그 사이 곡선 꺾임마다 멈춤을 둬 곡선과 똑같다.
 * strength(0~1)만큼 색을 줄인다(옅어지는 중).
 */
function tintGradient(
  color: string,
  from: number,
  to: number,
  strength: number,
  height: number,
) {
  const span = Math.max(to - from, 1);
  const ys = [
    from,
    ...TINT_STOPS.map(([x]) => x * height).filter(
      (y) => y > from && y < to,
    ),
    to,
  ];
  const stops = ys.map(
    (y) =>
      `${mixOf(color, tintAt(y, height) * strength)} ${(((y - from) / span) * 100).toFixed(2)}%`,
  );
  return `linear-gradient(180deg, ${stops.join(", ")})`;
}

/**
 * 필터 줄 맨 윗자리 띠 색이 충분히 진한 동안 html에 붙는 표시(data-competition-tint) — 필터 칩이 이걸 보고
 * 회색 테두리 대신 반투명 흰 면으로 바뀐다(파란 바탕 위 연회색 선을 피해).
 * 띠 색이 GLASS_CHIP_MIN(%) 아래로 옅어지면 떼어 원래 테두리 칩으로 돌린다 — 거의 흰 바탕 위에서는
 * 반투명 흰 면이 묻혀 칩 모양이 사라진다.
 */
const TINT_FLAG = "competitionTint";
const GLASS_CHIP_MIN = 4;

/** 계산된 색 문자열(rgb(…)·color(srgb …)) → "#RRGGBB". 읽지 못하거나 투명(대입이 무시됨)이면 null. */
function toHex(value: string): string | null {
  const num = String.raw`(-?[\d.]+(?:e-?\d+)?)`;
  const srgb = value.match(
    new RegExp(String.raw`color\(srgb\s+${num}\s+${num}\s+${num}`, "i"),
  );
  const rgb = value.match(
    new RegExp(String.raw`rgba?\(\s*${num}[,\s]+${num}[,\s]+${num}`, "i"),
  );
  const alpha = value.match(/(?:rgba\([^)]*,|\/)\s*([\d.]+%?)\s*\)$/);
  if (alpha && parseFloat(alpha[1]) === 0) return null;
  const channels = srgb
    ? srgb.slice(1, 4).map((v) => Number(v) * 255)
    : rgb
      ? rgb.slice(1, 4).map(Number)
      : null;
  if (!channels) return null;
  return `#${channels
    .map((v) =>
      Math.round(Math.min(255, Math.max(0, v)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")
    .toUpperCase()}`;
}

/**
 * 그라데이션 색 — 띠 몸 색으로 칠하되, 몸 색이 너무 밝거나(흰띠) 어두우면(검은띠) 그 띠의 바 색으로 칠한다.
 * 흰띠는 검은 바(먹색), 검은띠는 빨간 바. 앱 MY 머리 색도 같은 규칙이다.
 * 검은띠 빨강은 경고용 Red-500이 아니라 띠 그림의 빨간 바 색(red-belt-bar) — 넓게 깔려도 눈이 편하다.
 * depth: TINT_STOPS 곡선에 곱하는 진하기 — 먹색은 색이 없어 같은 비율이면 옅은 회색 막으로만 보여 조금 짙게
 * 깔되, 다섯 띠를 나란히 놓았을 때 혼자 무겁지 않을 만큼만.
 * height: 그라데이션이 다 옅어지는 높이(px) — 흰띠만 짧다(WHITE_BELT_TINT_HEIGHT).
 */
const TINT: Record<
  BeltRank,
  { color: string; depth: number; height: number }
> = {
  white: {
    color: "var(--my-profile-header-bg-black)",
    depth: 1.3,
    height: WHITE_BELT_TINT_HEIGHT,
  },
  blue: {
    color: "var(--my-profile-header-bg-blue)",
    depth: 1,
    height: TINT_HEIGHT,
  },
  purple: {
    color: "var(--my-profile-header-bg-purple)",
    depth: 1,
    height: TINT_HEIGHT,
  },
  brown: {
    color: "var(--my-profile-header-bg-brown)",
    depth: 1,
    height: TINT_HEIGHT,
  },
  black: {
    color: "var(--red-belt-bar)",
    depth: 1,
    height: TINT_HEIGHT,
  },
};
