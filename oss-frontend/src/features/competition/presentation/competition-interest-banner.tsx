"use client";

import { useEffect, useRef, type RefObject } from "react";

import type { BeltRank } from "@/features/community/domain/belt";
import type { DeadlineSoonItem } from "@/features/competition/domain/competition-interest-banner";
import { daysBetween } from "@/features/competition/domain/competition-registration";
import { setNativeCompetitionHeaderTint } from "@/shared/lib/native-bridge";
import { IconButton } from "@/shared/ui/icon-button";
import { CloseIcon } from "@/shared/ui/icons";

/**
 * 곧 마감 배너 (#396) — 접수 마감이 일주일 안으로 다가온 내 관심 대회 한 장. 대회 탭 배너 자리에 뜬다.
 *
 * 작은 진한 카드: 왼쪽에 남은 날 네모(D-n), 오른쪽에 작은 글 '관심 대회 접수가 곧 끝나요'와 굵은 대회 이름.
 * 카드를 누르면 상세가 열린다. ✕로 닫으면 이 기기에서 그 대회의 그 마감은 다시 뜨지 않는다(닫기는 호출부가 한다).
 * 결과 남기기 배너와 모서리·안쪽 여백·✕ 자리가 같다.
 */
export function DeadlineSoonBanner({
  item,
  today,
  onSelect,
  onClose,
}: {
  item: DeadlineSoonItem;
  /** 한국 날짜 "YYYY-MM-DD" — 남은 날을 센다. */
  today: string;
  onSelect: (item: DeadlineSoonItem) => void;
  onClose: () => void;
}) {
  const { competition } = item;
  const daysLeft = daysBetween(today, item.deadline);

  return (
    <section aria-label="곧 마감인 관심 대회" className="relative">
      <button
        type="button"
        onClick={() => onSelect(item)}
        className="flex w-full items-center gap-3 rounded-20 bg-[var(--cool-gray-900)] py-3 pr-12 pl-4 text-left text-text-on-dark"
      >
        <span className="flex size-11 flex-none items-center justify-center rounded-10 bg-[var(--opacity-white-20)] text-[13px] leading-[18px] font-bold tabular-nums">
          {daysLeft <= 0 ? "오늘" : `D-${daysLeft}`}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-[12px] leading-[16px] text-[var(--opacity-white-60)]">
            관심 대회 접수가 곧 끝나요
          </span>
          <span className="truncate text-[16px] leading-[22px] font-bold">
            {competition.name}
          </span>
        </span>
      </button>
      {/* 오른쪽 위 — 보이는 ✕는 20, 누를 자리는 44. 카드 버튼 밖 형제라 누르면 상세가 열리지 않는다. */}
      <IconButton
        size="l"
        aria-label={`${competition.name} 마감 알림 닫기`}
        onClick={onClose}
        className={`${BANNER_CLOSE_POSITION} text-[var(--opacity-white-60)] active:bg-[var(--opacity-white-20)]`}
      >
        <CloseIcon size={20} />
      </IconButton>
    </section>
  );
}

/** 배너 ✕ 자리 — 곧 마감·결과 남기기 배너가 함께 쓴다(오른쪽 위, 44 누를 자리). */
export const BANNER_CLOSE_POSITION = "absolute top-0.5 right-1";

const DISMISSED_KEY_PREFIX = "competition-deadline-banner-dismissed:";
const DISMISS_EVENT = "oss:competition-deadline-banner-dismissed";

/**
 * 닫은 기록의 이름 — 대회와 마감 날짜를 함께 쓴다. 얼리버드 마감 알림을 닫아도 같은 대회의 접수 마감이
 * 다가오면 다시 알려야 해서다(마감마다 따로 챙길 일이다).
 */
function dismissKey({ competition, deadline }: DeadlineSoonItem) {
  return `${competition.id}:${deadline}`;
}

/** 저장소를 못 쓰는 환경(사생활 보호 모드)에서도 지금 화면에서는 닫히게 기억해 둔다. */
const hiddenThisSession = new Set<string>();

/** 이 곧 마감 배너를 이 기기에서 닫았는지. 기록은 브라우저 저장소에만 있어 서버는 모른다. */
export function isDeadlineBannerDismissed(item: DeadlineSoonItem): boolean {
  const key = dismissKey(item);
  if (hiddenThisSession.has(key)) return true;
  try {
    return window.localStorage.getItem(DISMISSED_KEY_PREFIX + key) === "1";
  } catch {
    return false;
  }
}

export function dismissDeadlineBanner(item: DeadlineSoonItem) {
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

/**
 * 위에서 내려오는 내 띠 색 그라데이션 — 화면 맨 위(필터 줄 뒤)에서 은은하게 시작해 배너 아래에서 바탕색으로 녹는다.
 * 배너 자리에 배너가 떠 있을 때만 보이고, 배너와 함께 0.5초에 걸쳐 짙어지며, 배너를 닫아 자리가 접히면 0.5초에 걸쳐 옅어진다.
 * 흰띠는 회색, 검은띠는 끝 칸의 빨강으로 물들인다.
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
  const color = TINT_COLOR[rank];
  const layerRef = useRef<HTMLDivElement>(null);
  const requestUpdateRef = useRef<() => void>(() => {});
  const ready = shown !== null;
  const decidedOnceRef = useRef(false);

  // 배너가 들어올 때 함께 0.5초에 걸쳐 짙어지고, 자리가 접히면 0.5초에 걸쳐 옅어진다.
  // 처음 정해질 때 이미 보일 차례면(당겨서 새로고침 — 앞 배너의 색이 앱 머리에 깔려 있다) 움직이지 않고 바로 칠한다.
  // 아래 칠하기보다 먼저 둔다 — 처음 정해질 때 투명한 채로 칠해 앱 머리에 '색 없음'을 먼저 보내지 않게.
  useEffect(() => {
    const layer = layerRef.current;
    if (shown === null || !layer) return;
    const first = !decidedOnceRef.current;
    decidedOnceRef.current = true;
    const visible = layer.style.opacity === "1";
    for (const running of layer.getAnimations()) running.cancel();
    layer.style.opacity = shown ? "1" : "0";
    if (
      !first &&
      visible !== shown &&
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
      const strength = Number(getComputedStyle(layer).opacity) || 0;
      const layerTop = layer.getBoundingClientRect().top;
      const barRect = bar?.getBoundingClientRect();
      const from = barRect ? barRect.top - layerTop : window.scrollY;
      const top = tintAt(from) * strength;
      if (bar && barRect && top > 0) {
        bar.style.background = tintGradient(
          color,
          from,
          from + barRect.height,
          strength,
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
  }, [barRef, color, ready]);

  return (
    <div
      ref={layerRef}
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0"
      style={{
        height: TINT_HEIGHT,
        opacity: 0,
        background: tintGradient(color, 0, TINT_HEIGHT, 1),
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

/** 그라데이션 높이 — 배너 아래까지 내려가 거기서 천천히 사라지게 넉넉히 잡는다. */
const TINT_HEIGHT = 260;
/**
 * 그라데이션 곡선 — [높이 비율, 띠 색 %]. 위에서는 천천히, 아래로 갈수록 완만하게 잦아드는 ease-out 모양.
 * 바탕 그림·필터 줄 바탕·앱 머리 색이 모두 이 곡선(tintAt)을 따라 같은 자리에서 같은 색이 된다.
 */
const TINT_STOPS: readonly (readonly [number, number])[] = [
  [0, 16],
  [0.14, 14],
  [0.3, 11],
  [0.48, 7.5],
  [0.64, 4.2],
  [0.8, 1.8],
  [0.92, 0.5],
  [1, 0],
];

/** 맨 위에서 y(px)만큼 내려간 자리의 띠 색 비율(%) — TINT_STOPS 사이를 곧게 잇는다(CSS 그라데이션과 같다). */
function tintAt(y: number): number {
  const at = y / TINT_HEIGHT;
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
) {
  const span = Math.max(to - from, 1);
  const ys = [
    from,
    ...TINT_STOPS.map(([x]) => x * TINT_HEIGHT).filter(
      (y) => y > from && y < to,
    ),
    to,
  ];
  const stops = ys.map(
    (y) =>
      `${mixOf(color, tintAt(y) * strength)} ${(((y - from) / span) * 100).toFixed(2)}%`,
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

/** 그라데이션 색 — 프로필 머리의 띠 색 토큰을 쓴다. */
const TINT_COLOR: Record<BeltRank, string> = {
  white: "var(--cool-gray-400)",
  blue: "var(--my-profile-header-bg-blue)",
  purple: "var(--my-profile-header-bg-purple)",
  brown: "var(--my-profile-header-bg-brown)",
  black: "var(--red-500)",
};
