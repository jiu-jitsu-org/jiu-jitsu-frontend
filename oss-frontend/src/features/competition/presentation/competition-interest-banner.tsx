"use client";

import { useEffect, useRef, useState } from "react";

import type { BeltRank } from "@/features/community/domain/belt";
import type { InterestBannerItem } from "@/features/competition/domain/competition-interest-banner";
import { shortDateLabel } from "@/features/competition/presentation/competition-detail-format";
import {
  deadlineLabel,
  weekdayOf,
} from "@/features/competition/presentation/competition-month-section";
import { cn } from "@/shared/lib/cn";
import { setNativeCompetitionHeaderTint } from "@/shared/lib/native-bridge";
import { HeartIcon } from "@/shared/ui/icons";
import { PRESS_BOUNCE } from "@/shared/ui/press-styles";

/** 카드 위 그래픽 자리 높이 — 필터 줄의 아래 여백(12)과 합쳐 칩 줄 아래 80px. */
const HEAD_SPACE = 68;
/** 카드 높이·모서리. 캐릭터 몸은 카드 아래 끝에서 모서리만큼 위에서 잘라 둥근 모서리 틈으로 비치지 않게 한다. */
const CARD_HEIGHT = 78;
const CARD_RADIUS = 20;
/** 띠(검은 단) 가운데 자리 — 첫 카드 왼쪽에서 15, 카드 위에서 26. 머리는 카드 위로 약 58px 드러난다. */
const BAND_X = 15;
const BAND_ABOVE_CARD = 26;
/** 숨은 캐릭터가 내려가 있는 거리 — 머리끝(카드 위 약 58px)이 카드 뒤로 다 들어가는 값. */
const PEEK_HIDE = 64;

/**
 * 관심 대회 배너 — 필터 줄 바로 아래, 내 관심 대회를 한 장씩 옆으로 넘겨 본다.
 *
 * 2026-11 시안 "Ⓓ 제목 앞 · 똑바로 서기": 지금 보는 카드 왼쪽 위로 내 띠 캐릭터가 곧게 서서 머리를 내밀고,
 * 그 옆에 '관심 대회 N'. 캐릭터는 카드마다 있어 카드와 같이 넘어가고, 다음 장으로 넘기면 앞 장의 캐릭터는
 * 카드 뒤로 쏙 들어가고 새 장의 캐릭터가 아래에서 튀어 오른다. 아랫몸은 카드 뒤에서 잘라 카드 밖으로 드러나지 않는다.
 * 어느 장이든 같은 자리(왼쪽 끝)에 멈추도록 마지막 장 뒤에 빈자리를 둔다 — 안 그러면 마지막 장이 오른쪽 끝에 붙어
 * 캐릭터가 제목 위로 겹친다.
 * 카드: 진한 면에 이름·하트, 아래 줄에 날짜(요일)·장소와 접수 소식 알약. 대회 날짜가 가까운 순이다.
 * 여러 장이면 다음 장이 오른쪽에 비쳐 넘길 수 있다는 걸 알린다(카드 폭 = 줄 폭 - 48, 간격 10).
 * 관심 대회가 없으면(비로그인 포함) 아무것도 그리지 않는다.
 */
export function CompetitionInterestBanner({
  items,
  currentYear,
  beltRank,
  onSelect,
}: {
  items: readonly InterestBannerItem[];
  currentYear: number;
  /** 내 띠. 없으면 흰띠로 그린다. */
  beltRank: BeltRank | null;
  onSelect: (item: InterestBannerItem) => void;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const current = useCurrentCard(listRef, items.length);

  if (items.length === 0) return null;
  const many = items.length > 1;

  return (
    <section aria-label="관심 대회" className="relative mb-3">
      {/* 제목은 넘김 밖에 고정 — 캐릭터 오른쪽(첫 카드 왼쪽 + 38), 카드 위 22px. */}
      <h2
        className="pointer-events-none absolute left-[54px] z-[2] text-[17px] leading-[22px] font-bold text-text-primary"
        style={{ top: HEAD_SPACE - 22 - 22 }}
      >
        관심 대회
        <span className="ml-1.5 text-primary-text-subtle tabular-nums">
          {items.length}
        </span>
      </h2>
      <ul
        className={cn(
          "flex gap-2.5 overflow-x-auto px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          many &&
            "snap-x snap-mandatory scroll-px-4 overscroll-x-contain after:w-[38px] after:flex-none after:content-['']",
        )}
        ref={listRef}
        // 그래픽 자리까지 넘김 안에 넣는다 — 넘김 영역은 위아래도 잘라 내서, 밖으로 빼면 머리가 잘린다.
        style={{ paddingTop: HEAD_SPACE }}
      >
        {items.map((item, index) => (
          <li
            key={item.competition.id}
            className={cn(
              "relative flex-none snap-start",
              many ? "w-[calc(100%-48px)]" : "w-full",
            )}
          >
            <BeltPeek rank={beltRank ?? "white"} up={index === current} />
            <InterestCard
              item={item}
              currentYear={currentYear}
              onSelect={onSelect}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * 지금 왼쪽 끝에 멈춰 있는(또는 가장 가까운) 카드 번호. 처음 그릴 땐 -1이라 캐릭터가 다 숨어 있다가,
 * 화면에 붙은 다음 프레임에 0이 되어 첫 장 캐릭터가 한 번 올라온다.
 * 넘기는 도중 카드의 절반을 넘으면 바로 바뀐다 — 손을 떼기 전에 새 캐릭터가 마중 나온다.
 * 카드 수가 바뀌면 다시 붙는다 — 관심이 0개라 넘김이 없다가 목록 하트로 첫 관심을 켜면 그때 넘김이 생긴다.
 * 끝에서 고무줄처럼 더 당겨도 첫·마지막 장 밖으로 나가지 않게 묶고, 화면 폭이 바뀌면 다시 잰다.
 */
function useCurrentCard(
  listRef: React.RefObject<HTMLUListElement | null>,
  count: number,
) {
  const [current, setCurrent] = useState(-1);
  useEffect(() => {
    const list = listRef.current;
    if (!list || count === 0) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const first = list.firstElementChild as HTMLElement | null;
      if (!first) return;
      const step =
        first.offsetWidth + parseFloat(getComputedStyle(list).columnGap || "0");
      const index = step > 0 ? Math.round(list.scrollLeft / step) : 0;
      setCurrent(Math.min(count - 1, Math.max(0, index)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    frame = requestAnimationFrame(measure);
    list.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      list.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [listRef, count]);
  return current;
}

function InterestCard({
  item,
  currentYear,
  onSelect,
}: {
  item: InterestBannerItem;
  currentYear: number;
  onSelect: (item: InterestBannerItem) => void;
}) {
  const { competition, registration } = item;
  const news = registrationNews(registration, currentYear);

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={cn(
        "relative z-[1] flex w-full flex-col justify-between rounded-20 bg-[var(--cool-gray-900)] px-4 py-[14px] text-left text-text-on-dark",
        PRESS_BOUNCE,
      )}
      style={{ height: CARD_HEIGHT }}
    >
      <span className="flex items-center gap-3">
        <span className="min-w-0 flex-1 truncate text-[16px] leading-[22px] font-bold">
          {competition.name}
        </span>
        {/* 이 줄은 늘 내 관심 대회라 채운 하트다. 해제는 목록 줄이나 상세에서 한다. */}
        <HeartIcon
          size={18}
          filled
          className="flex-none text-reaction-bar-active-like-icon"
        />
      </span>
      <span className="flex items-center gap-3">
        <span className="min-w-0 flex-1 truncate text-[12px] leading-[16px] text-[var(--opacity-white-60)] tabular-nums">
          {shortDateLabel(competition.date, currentYear)} (
          {weekdayOf(competition.date).label}) · {competition.place}
        </span>
        {news ? (
          <span
            className={cn(
              "flex-none rounded-full px-2.5 py-1 text-[12px] leading-[16px] font-bold tabular-nums",
              news.urgent
                ? "bg-[color-mix(in_srgb,var(--error)_12%,var(--bw-white))] text-text-error"
                : "bg-[var(--opacity-white-20)] text-[var(--opacity-white-80)]",
            )}
          >
            {news.text}
          </span>
        ) : null}
      </span>
    </button>
  );
}

/**
 * 내 띠 캐릭터 — 곧게 서서 첫 카드 왼쪽 위로 머리만 내민다. 눈은 앱 로그인 화면과 같은 띠별 짝이다.
 *
 * 그림은 public/images/characters/stand — 앱 로그인 화면의 눈 없는 몸통·눈을 표시 크기의 3배로 줄인 것.
 * 흰·파란띠 몸통 원본은 휘어 있어서 곧은 보라 몸통의 색만 바꿔 만들었다.
 * 상자는 그래픽 자리 맨 위부터 카드 아래 끝 - 모서리까지다. 그 아래 몸은 잘려 카드 밖으로 나오지 않는다.
 * up이면 아래에서 띠용 튀어 올라 서 있고(500ms), 아니면 카드 뒤로 재빨리 숨는다(200ms).
 * 오르는 건 스프링 곡선 대신 키프레임으로 넘침을 8px로 묶는다 — 머리 위 여유가 10px라 스프링(25% 넘침)이면 머리끝이 잘린다.
 * 동작 줄이기 설정이면 움직이지 않고 바로 나타나고 사라진다.
 */
function BeltPeek({ rank, up }: { rank: BeltRank; up: boolean }) {
  const body = PEEK_BODY[rank];
  const eyes = PEEK_EYES[rank];
  const bandY = HEAD_SPACE - BAND_ABOVE_CARD;

  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-0 overflow-hidden"
      style={{
        top: -HEAD_SPACE,
        height: HEAD_SPACE + CARD_HEIGHT - CARD_RADIUS,
      }}
    >
      <span
        className={cn(
          "absolute inset-0",
          up
            ? "motion-safe:animate-peek-rise"
            : "motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-in",
        )}
        style={{ transform: `translateY(${up ? 0 : PEEK_HIDE}px)` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- 크기를 고정한 작은 장식 그림 */}
        <img
          src={body.src}
          alt=""
          width={body.width}
          height={body.height}
          className="absolute max-w-none"
          style={{ left: BAND_X - body.bandX, top: bandY - body.bandY }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element -- 크기를 고정한 작은 장식 그림 */}
        <img
          src={eyes.src}
          alt=""
          width={eyes.width}
          height={eyes.height}
          className="absolute max-w-none"
          style={{
            left: BAND_X - eyes.width / 2,
            top: bandY - eyes.height / 2,
            width: eyes.width,
            height: eyes.height,
          }}
        />
      </span>
    </span>
  );
}

/**
 * 몸통 표시 치수(px) — 앱 그림을 0.2배로 그린 크기. bandX·bandY는 몸통 왼쪽 위에서 띠 가운데까지.
 * 무게 검사가 경로를 찾아 쓰임을 확인하므로 경로를 띠마다 그대로 적는다.
 */
const PEEK_BODY: Record<
  BeltRank,
  { src: string; width: number; height: number; bandX: number; bandY: number }
> = {
  white: {
    src: "/images/characters/stand/body-white.webp",
    width: 30,
    height: 131,
    bandX: 12.6,
    bandY: 31.9,
  },
  blue: {
    src: "/images/characters/stand/body-blue.webp",
    width: 30,
    height: 131,
    bandX: 12.6,
    bandY: 31.9,
  },
  purple: {
    src: "/images/characters/stand/body-purple.webp",
    width: 30,
    height: 131,
    bandX: 12.6,
    bandY: 31.9,
  },
  brown: {
    src: "/images/characters/stand/body-brown.webp",
    width: 30,
    height: 131,
    bandX: 12.7,
    bandY: 32.3,
  },
  black: {
    src: "/images/characters/stand/body-black.webp",
    width: 30,
    height: 130,
    bandX: 14.9,
    bandY: 30.9,
  },
};

/**
 * 눈 표시 치수(px) — 앱 로그인 화면(BeltCrowd)과 같은 띠별 짝·비율. 째려봄·졸린 눈은 앱처럼 세로로 늘린다.
 */
const PEEK_EYES: Record<
  BeltRank,
  { src: string; width: number; height: number }
> = {
  white: {
    src: "/images/characters/stand/eyes-curious.webp",
    width: 19,
    height: 14,
  },
  blue: {
    src: "/images/characters/stand/eyes-glare.webp",
    width: 31,
    height: 16,
  },
  purple: {
    src: "/images/characters/stand/eyes-big.webp",
    width: 28,
    height: 14,
  },
  brown: {
    src: "/images/characters/stand/eyes-lash.webp",
    width: 24,
    height: 17,
  },
  black: {
    src: "/images/characters/stand/eyes-sleepy.webp",
    width: 29,
    height: 10,
  },
};

/**
 * 위에서 내려오는 내 띠 색 그라데이션 — 화면 맨 위(필터 줄 뒤)에서 은은하게 시작해 관심 대회 카드 위쪽에서
 * 바탕색으로 녹는다. 관심 대회 배너가 있을 때만 깐다. 흰띠는 회색, 검은띠는 끝 칸의 빨강으로 물들인다.
 * 화면 맨 앞에 두고 z를 주지 않아, 뒤에 오는 필터 줄(sticky)·배너(relative)가 그 위에 그려진다.
 * 음수 z + isolate로 깔면 같은 화면의 시트(fixed z-50)가 main 안에 갇혀 토스트 등과 순서가 바뀌어 쓰지 않는다.
 * 필터 줄이 반투명 바탕(60%)을 덮어 맨 위가 묽어지므로, 시안(16%)보다 진하게 시작한다.
 */
export function InterestBannerTint({ rank }: { rank: BeltRank }) {
  const color = TINT_COLOR[rank];
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0"
      style={{
        height: TINT_HEIGHT,
        background: `linear-gradient(180deg, color-mix(in srgb, ${color} 28%, var(--surface-container)) 0%, color-mix(in srgb, ${color} 10%, var(--surface-container)) 45%, var(--surface-container) 100%)`,
      }}
    />
  );
}

/** 그라데이션 높이와 멈춤 자리 — 아래 배경 그림과 앱 머리 색 계산이 같이 쓴다. */
const TINT_HEIGHT = 180;

/**
 * 앱 머리(‘대회’ 제목 줄·상태바)를 웹 맨 윗색과 같게 칠한다 — 앱 머리와 웹 사이 이음매를 없앤다.
 *
 * 맨 위에 보이는 색 = 필터 줄의 반투명 바탕(60%) 너머로 비치는 그라데이션(40%)이라, 띠 색 비율도 그 40%만 친다.
 * 스크롤로 그라데이션이 올라가면 맨 윗자리의 색도 옅어지니, 1% 단위로 바뀔 때만 다시 보낸다(끝까지 많아야 12번).
 * 다 옅어지면, 그리고 화면을 떠나면 null로 앱 기본색으로 돌린다. 지원하지 않는 앱이면 아무것도 보내지 않는다.
 * 배너가 없을 때(rank null)도 붙자마자 null을 한 번 보낸다 — 앱은 당겨서 새로고침 때 색을 지우지 않고 웹의 새 알림을 기다린다.
 * 색을 계산하지 못하면(color-mix를 모르는 옛 WebKit 등) 보내지 않는다 — 그때는 웹 그라데이션도 그려지지 않는다.
 */
export function useCompetitionHeaderTint(rank: BeltRank | null) {
  const color = rank ? TINT_COLOR[rank] : null;
  useEffect(() => {
    if (!color) {
      setNativeCompetitionHeaderTint(null);
      return;
    }
    const probe = document.createElement("span");
    probe.style.display = "none";
    document.body.appendChild(probe);
    const hexOf = (percent: number) => {
      probe.style.backgroundColor = `color-mix(in srgb, ${color} ${percent}%, var(--surface-container))`;
      return toHex(getComputedStyle(probe).backgroundColor);
    };

    let sent: number | undefined;
    let frame = 0;
    const update = () => {
      frame = 0;
      const percent = Math.round(tintAt(window.scrollY) * 0.4);
      if (percent === sent) return;
      sent = percent;
      if (percent === 0) {
        setNativeCompetitionHeaderTint(null);
        return;
      }
      const hex = hexOf(percent);
      if (hex) setNativeCompetitionHeaderTint(hex);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
      probe.remove();
      setNativeCompetitionHeaderTint(null);
    };
  }, [color]);
}

/** 그라데이션의 띠 색 비율(%) — 맨 위에서 y만큼 내려간 자리. 아래 linear-gradient의 멈춤(28→10→0)과 같다. */
function tintAt(y: number) {
  const mid = TINT_HEIGHT * 0.45;
  if (y <= 0) return 28;
  if (y < mid) return 28 - (18 * y) / mid;
  if (y < TINT_HEIGHT) return 10 - (10 * (y - mid)) / (TINT_HEIGHT - mid);
  return 0;
}

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

/** 카드 아래 접수 소식 — 목록 줄의 접수 칩과 같은 말을 쓴다. 마감이 가까우면 빨간 알약. */
function registrationNews(
  registration: InterestBannerItem["registration"],
  currentYear: number,
): { text: string; urgent: boolean } | null {
  if (!registration) return null;
  switch (registration.kind) {
    case "closed":
      return { text: "접수 마감", urgent: false };
    case "upcoming":
      return {
        text: `접수 예정 · ${deadlineLabel(registration, currentYear).text}`,
        urgent: false,
      };
    case "open": {
      const deadline = deadlineLabel(registration, currentYear);
      return deadline.urgent
        ? deadline
        : { text: `접수 중 · ${deadline.text}`, urgent: false };
    }
  }
}
