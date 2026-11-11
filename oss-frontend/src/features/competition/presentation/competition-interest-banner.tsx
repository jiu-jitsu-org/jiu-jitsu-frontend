"use client";

import { useEffect, useSyncExternalStore } from "react";

import type { BeltRank } from "@/features/community/domain/belt";
import type { InterestBannerItem } from "@/features/competition/domain/competition-interest-banner";
import { shortDateLabel } from "@/features/competition/presentation/competition-detail-format";
import {
  RegistrationChip,
  weekdayOf,
} from "@/features/competition/presentation/competition-month-section";
import { cn } from "@/shared/lib/cn";
import { setNativeCompetitionHeaderTint } from "@/shared/lib/native-bridge";
import { IconButton } from "@/shared/ui/icon-button";
import { CloseIcon } from "@/shared/ui/icons";
import { PRESS_BOUNCE } from "@/shared/ui/press-styles";

/** 카드 위 그래픽 자리 높이 — 필터 줄의 아래 여백(12)과 합쳐 칩 줄 아래 80px. */
const HEAD_SPACE = 68;
/** 카드 높이·모서리. 캐릭터 몸은 카드 아래 끝에서 모서리만큼 위에서 잘라 둥근 모서리 틈으로 비치지 않게 한다. */
const CARD_HEIGHT = 78;
const CARD_RADIUS = 20;
/** 띠(검은 단) 가운데 자리 — 카드 왼쪽에서 15, 카드 위에서 26. 머리는 카드 위로 약 58px 드러난다. */
const BAND_X = 15;
const BAND_ABOVE_CARD = 26;

/**
 * 곧 마감 배너 (#396) — 필터 줄 바로 아래, 접수 마감이 일주일 안으로 다가온 내 관심 대회 한 장.
 *
 * 전에는 관심 대회 전부를 옆으로 넘겨 봤는데, 그건 하트 필터와 같은 목록이라 배너가 할 말이 없었다.
 * 이제는 '지금 챙겨야 하는' 대회만, 가장 급한 한 장만 띄운다. 제목 '관심 대회 · 곧 마감'이 왜 떴는지 말한다.
 * 모양(2026-11 시안 "Ⓓ 제목 앞 · 똑바로 서기")은 그대로: 카드 왼쪽 위로 내 띠 캐릭터가 곧게 서서 머리를 내밀고,
 * 아랫몸은 카드 뒤에서 잘라 카드 밖으로 드러나지 않는다.
 * 카드: 진한 면에 이름과 닫기(✕), 아래 줄에 날짜(요일)와 목록 줄과 같은 접수 칩. 카드를 누르면 상세가 열린다.
 * ✕로 닫으면 이 기기에서 그 대회는 다시 뜨지 않고 다음으로 급한 대회가 뜬다. 띄울 대회가 없으면 아무것도 그리지 않는다.
 */
export function CompetitionInterestBanner({
  item,
  currentYear,
  beltRank,
  onSelect,
}: {
  /** 띄울 한 장 — useDeadlineBannerItem이 닫은 대회를 걸러 고른다. 없으면 그리지 않는다. */
  item: InterestBannerItem | null;
  currentYear: number;
  /** 내 띠. 없으면 흰띠로 그린다. */
  beltRank: BeltRank | null;
  onSelect: (item: InterestBannerItem) => void;
}) {
  if (!item) return null;
  const { competition, registration } = item;

  return (
    <section aria-label="곧 마감인 관심 대회" className="relative mb-3 px-4">
      {/* 제목 — 캐릭터 오른쪽(카드 왼쪽 + 38), 카드 위 22px. */}
      <h2
        className="pointer-events-none absolute left-[54px] z-[2] text-[17px] leading-[22px] font-bold text-text-primary"
        style={{ top: HEAD_SPACE - 22 - 22 }}
      >
        관심 대회
        <span className="text-primary-text-subtle"> · 곧 마감</span>
      </h2>
      <div className="relative" style={{ paddingTop: HEAD_SPACE }}>
        {/* 닫고 다음 대회가 뜨면 key가 바뀌어 새 캐릭터가 다시 튀어 오른다. */}
        <BeltPeek key={competition.id} rank={beltRank ?? "white"} />
        <div className="relative z-[1]">
          <button
            type="button"
            onClick={() => onSelect(item)}
            className={cn(
              "flex w-full flex-col justify-between rounded-20 bg-[var(--cool-gray-900)] py-[14px] pr-12 pl-4 text-left text-text-on-dark",
              PRESS_BOUNCE,
            )}
            style={{ height: CARD_HEIGHT }}
          >
            <span className="truncate text-[16px] leading-[22px] font-bold">
              {competition.name}
            </span>
            <span className="flex items-center gap-2">
              <span className="flex-none text-[12px] leading-[16px] text-[var(--opacity-white-60)] tabular-nums">
                {shortDateLabel(competition.date, currentYear)} (
                {weekdayOf(competition.date).label})
              </span>
              {registration ? (
                // 목록 줄과 같은 접수 칩 — 배너에 뜬 대회는 늘 관심 대회라 남은 날을 붙인다.
                <RegistrationChip
                  status={registration}
                  dday
                  currentYear={currentYear}
                  size="s"
                  surface="dark"
                />
              ) : null}
            </span>
          </button>
          {/* 이름 줄 오른쪽 — 보이는 ✕는 20, 누를 자리는 44. 카드 버튼 밖 형제라 누르면 상세가 열리지 않는다. */}
          <IconButton
            size="l"
            aria-label={`${competition.name} 마감 알림 닫기`}
            onClick={() => dismissDeadlineBanner(competition.id)}
            className="absolute top-[3px] right-1 text-[var(--opacity-white-60)] active:bg-[var(--opacity-white-20)]"
          >
            <CloseIcon size={20} />
          </IconButton>
        </div>
      </div>
    </section>
  );
}

const DISMISSED_KEY_PREFIX = "competition-deadline-banner-dismissed:";
const DISMISS_EVENT = "oss:competition-deadline-banner-dismissed";

/**
 * 곧 마감 배너에 띄울 한 장 — 후보(마감이 가까운 순) 중 이 기기에서 닫지 않은 첫 대회. 없으면 null.
 *
 * 닫은 기록은 브라우저 저장소에만 있어 서버는 모른다. 서버 그림에는 첫 후보를 넣어 두고, 닫아 둔 기기에서만 걷어 낸다
 * (결과 남기기 배너와 같은 방식) — 늦게 나타나면 아래 목록이 배너 높이만큼 밀려 내려간다.
 * 스냅샷은 대회 id 문자열이라 값이 같으면 다시 그리지 않는다.
 */
export function useDeadlineBannerItem(
  candidates: readonly InterestBannerItem[],
): InterestBannerItem | null {
  const id = useSyncExternalStore(
    subscribeDismissed,
    () =>
      candidates.find(({ competition }) => !readDismissed(competition.id))
        ?.competition.id ?? null,
    () => candidates[0]?.competition.id ?? null,
  );
  return candidates.find(({ competition }) => competition.id === id) ?? null;
}

/** 저장소를 못 쓰는 환경(사생활 보호 모드)에서도 지금 화면에서는 닫히게 기억해 둔다. */
const hiddenThisSession = new Set<string>();

function readDismissed(competitionId: string): boolean {
  if (hiddenThisSession.has(competitionId)) return true;
  try {
    return (
      window.localStorage.getItem(DISMISSED_KEY_PREFIX + competitionId) === "1"
    );
  } catch {
    return false;
  }
}

function dismissDeadlineBanner(competitionId: string) {
  hiddenThisSession.add(competitionId);
  try {
    window.localStorage.setItem(DISMISSED_KEY_PREFIX + competitionId, "1");
  } catch {
    // 저장하지 못하면 다시 열었을 때 또 뜬다.
  }
  window.dispatchEvent(new Event(DISMISS_EVENT));
}

function subscribeDismissed(onChange: () => void) {
  window.addEventListener(DISMISS_EVENT, onChange);
  return () => window.removeEventListener(DISMISS_EVENT, onChange);
}

/**
 * 내 띠 캐릭터 — 곧게 서서 카드 왼쪽 위로 머리만 내민다. 눈은 앱 로그인 화면과 같은 띠별 짝이다.
 *
 * 그림은 public/images/characters/stand — 앱 로그인 화면의 눈 없는 몸통·눈을 표시 크기의 3배로 줄인 것.
 * 흰·파란띠 몸통 원본은 휘어 있어서 곧은 보라 몸통의 색만 바꿔 만들었다.
 * 상자는 그래픽 자리 맨 위부터 카드 아래 끝 - 모서리까지다. 그 아래 몸은 잘려 카드 밖으로 나오지 않는다.
 * 나타날 때 아래에서 띠용 튀어 오른다(500ms). 오르는 건 스프링 곡선 대신 키프레임으로 넘침을 8px로 묶는다 —
 * 머리 위 여유가 10px라 스프링(25% 넘침)이면 머리끝이 잘린다. 동작 줄이기 설정이면 움직이지 않고 바로 나타난다.
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
        top: 0,
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
