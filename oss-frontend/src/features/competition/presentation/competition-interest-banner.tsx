"use client";

import type { BeltRank } from "@/features/community/domain/belt";
import type { InterestBannerItem } from "@/features/competition/domain/competition-interest-banner";
import { shortDateLabel } from "@/features/competition/presentation/competition-detail-format";
import {
  deadlineLabel,
  weekdayOf,
} from "@/features/competition/presentation/competition-month-section";
import { cn } from "@/shared/lib/cn";
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

/**
 * 관심 대회 배너 — 필터 줄 바로 아래, 내 관심 대회를 한 장씩 옆으로 넘겨 본다.
 *
 * 2026-11 시안 "Ⓓ 제목 앞 · 똑바로 서기": 첫 카드 왼쪽 위로 내 띠 캐릭터가 곧게 서서 머리를 내밀고,
 * 그 옆에 '관심 대회 N'. 캐릭터는 첫 카드와 같이 넘어가고, 아랫몸은 카드 뒤에서 잘라 카드 밖으로 드러나지 않는다.
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
          many && "snap-x snap-mandatory scroll-px-4 overscroll-x-contain",
        )}
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
            {index === 0 ? <BeltPeek rank={beltRank ?? "white"} /> : null}
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
 * 화면에 들어올 때 한 번만 쏙 올라온다(동작 줄이기 설정이면 가만히 있다).
 */
function BeltPeek({ rank }: { rank: BeltRank }) {
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
      <span className="absolute inset-0 motion-safe:animate-peek-rise">
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
      className="pointer-events-none absolute inset-x-0 top-0 h-[180px]"
      style={{
        background: `linear-gradient(180deg, color-mix(in srgb, ${color} 28%, var(--surface-container)) 0%, color-mix(in srgb, ${color} 10%, var(--surface-container)) 45%, var(--surface-container) 100%)`,
      }}
    />
  );
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
