/* eslint-disable @next/next/no-img-element -- 이 페이지는 그림 원본을 그대로 보여 주는 개발용 화면이다. */
import type { ReactNode } from "react";

import type { Belt, BeltRank } from "@/features/community/domain/belt";
import { BALANCE_CHARACTER_SRC } from "@/features/community/presentation/balance/balance-character-src";
import { BeltAvatar } from "@/features/community/presentation/belt-avatar";

import {
  BELT_EMOTION_FACES,
  BELT_EMOTION_POSES,
} from "./design-system-belt-emotion-data";

/**
 * /ds › 캐릭터 — 흩어져 있던 띠 캐릭터를 한곳에서 본다(#316).
 *
 * 그림은 public/images/characters의 축소본이다. 원본은 design-assets와 iOS 레포에 그대로 있다.
 * 새 캐릭터를 만들면 여기에 넣고, '아직 없는 것'에서 뺀다.
 */

const BELT_LABELS: Record<BeltRank, string> = {
  white: "흰띠",
  blue: "파란띠",
  purple: "보라띠",
  brown: "갈색띠",
  black: "검은띠",
};

const RANKS = Object.keys(BELT_LABELS) as BeltRank[];

const CAST: { rank: BeltRank; eyes: string }[] = [
  { rank: "white", eyes: "호기심" },
  { rank: "blue", eyes: "째려봄" },
  { rank: "purple", eyes: "큰 눈" },
  { rank: "brown", eyes: "속눈썹" },
  { rank: "black", eyes: "졸린 눈" },
];

const EYES = [
  { id: "curious", label: "호기심" },
  { id: "glare", label: "째려봄" },
  { id: "big", label: "큰 눈" },
  { id: "lash", label: "속눈썹" },
  { id: "sleepy", label: "졸린 눈" },
];

const POSES = [
  { id: "top", label: "탑 포지션" },
  { id: "guard", label: "가드" },
  { id: "escape", label: "이스케이프" },
  { id: "guard-pass", label: "가드패스" },
  { id: "arm-lock", label: "팔 관절기" },
  { id: "leg-lock", label: "하체 관절기" },
];

const BODY_COLORS = [
  ...RANKS.map((id) => ({ id, label: BELT_LABELS[id] })),
  { id: "red", label: "빨강 원본" },
] as const;

// 무게 검사가 폴더 경로를 찾아 쓰임을 확인하므로 색마다 경로를 그대로 적는다.
const BODY_SRC: Record<BeltRank | "red", (pose: string) => string> = {
  white: (pose) => `/images/characters/bodies/white/${pose}.webp`,
  blue: (pose) => `/images/characters/bodies/blue/${pose}.webp`,
  purple: (pose) => `/images/characters/bodies/purple/${pose}.webp`,
  brown: (pose) => `/images/characters/bodies/brown/${pose}.webp`,
  black: (pose) => `/images/characters/bodies/black/${pose}.webp`,
  red: (pose) => `/images/characters/bodies/red/${pose}.webp`,
};

const GLOVES = [
  { id: "fist", label: "주먹" },
  { id: "open-hand", label: "편 손" },
  { id: "grip", label: "잡기" },
  { id: "point", label: "가리키기" },
  { id: "thumbs-up", label: "엄지척" },
  { id: "shaka", label: "OSS · 샤카" },
];

const BALANCE_STATES = [
  { id: "default", label: "기본" },
  { id: "idle", label: "대기" },
  { id: "selected", label: "골랐을 때" },
  { id: "unselected", label: "안 골랐을 때" },
] as const;

const MEDALS = [
  { id: "gold", label: "금메달" },
  { id: "silver", label: "은메달" },
  { id: "bronze", label: "동메달" },
  { id: "participation", label: "참가" },
];

const MISSING = [
  "기본 프로필 선 아이콘 머지 — 아직 커밋 전이다(#307)",
  "자세 몸통의 얼굴 — 자세 그림에는 눈·입이 없어 이대로는 캐릭터로 쓸 수 없다",
  "테이크다운 · 스윕 · 조르기 자세 — 최종 몸통에 없다. 스윕은 제미나이가 세 번 모두 거절했다",
  "입 그림 — 로그인 캐릭터는 눈만 있고 입은 따로 없다",
  "띠 색 × 표정 조합 — 로그인 캐릭터는 색마다 눈이 하나로 고정이고, 감정 몸짓은 흰 띠만 있다",
  "웹 화면의 띠 색별 캐릭터 — 웹에서 쓰는 캐릭터는 밸런스 게임 A·B와 프로필 띠 링뿐이다",
];

export function CharacterSection() {
  return (
    <div className="flex flex-col">
      <Group title="로그인 출연진" note="앱 로그인·인사 화면 · 몸통 5색 + 눈">
        <Grid className="grid-cols-3 sm:grid-cols-5">
          {CAST.map(({ rank, eyes }) => (
            <Tile
              key={rank}
              src={`/images/characters/cast/${rank}.webp`}
              label={BELT_LABELS[rank]}
              caption={eyes}
              imageClassName="h-40"
            />
          ))}
        </Grid>
      </Group>

      <Group title="눈" note="앱 로그인 화면 · 검은 단 위에 얹음">
        <Grid className="grid-cols-3 sm:grid-cols-5">
          {EYES.map(({ id, label }) => (
            <Tile
              key={id}
              src={`/images/characters/eyes/${id}.webp`}
              label={label}
              imageClassName="h-12"
            />
          ))}
        </Grid>
      </Group>

      <Group
        title="감정 몸짓"
        note="흰 띠 · 25자세 · 휘는 방향과 앞뒤 거리로 감정 · 기본 표정을 얹음(iOS BeltCharacter와 같은 자리)"
      >
        <Grid className="grid-cols-3 sm:grid-cols-5">
          {BELT_EMOTION_POSES.map((pose) => {
            const face = BELT_EMOTION_FACES.find(({ id }) => id === pose.face);
            return (
              <figure
                key={pose.id}
                className="flex flex-col items-center gap-2 rounded-12 bg-surface-field-subtle p-3"
              >
                <div className="flex h-40 w-full items-end justify-center">
                  {/* 높이가 아니라 폭으로 크기를 정해야 좁은 칸에서도 그림과 상자 비율이 같아 표정이 띠에 붙는다 */}
                  <div
                    className="relative"
                    style={{
                      aspectRatio: pose.aspect,
                      width: `min(100%, ${160 * pose.aspect}px)`,
                    }}
                  >
                    <img
                      src={`/images/characters/emotion/poses/${pose.id}.webp`}
                      alt={pose.label}
                      loading="lazy"
                      className="size-full object-contain"
                    />
                    {face ? (
                      <img
                        src={`/images/characters/emotion/faces/${face.id}.webp`}
                        alt=""
                        loading="lazy"
                        className="pointer-events-none absolute max-w-none"
                        style={{
                          left: `${pose.x * 100}%`,
                          top: `${pose.y * 100}%`,
                          width: `${pose.width * 110}%`,
                          transform: `translate(-50%, -50%) rotate(${pose.angle}deg) scaleX(${pose.lean})`,
                        }}
                      />
                    ) : null}
                  </div>
                </div>
                <figcaption className="text-center text-label-m text-text-secondary">
                  {pose.label}
                  {face ? (
                    <span className="text-text-tertiary"> · {face.label}</span>
                  ) : null}
                </figcaption>
              </figure>
            );
          })}
        </Grid>
      </Group>

      <Group
        title="표정"
        note="눈·눈꺼풀·눈썹 · 26개 · 깜빡임 등 짧은 움직임 포함 · 검은 띠 위에 얹음"
      >
        <Grid className="grid-cols-3 sm:grid-cols-6">
          {BELT_EMOTION_FACES.map(({ id, label }) => (
            <figure
              key={id}
              className="flex flex-col items-center gap-2 rounded-12 bg-surface-field-subtle p-3"
            >
              <div className="flex h-16 w-full items-center justify-center rounded-10 bg-toast-strong-background p-2">
                <img
                  src={`/images/characters/emotion/faces/${id}.webp`}
                  alt={label}
                  loading="lazy"
                  className="max-h-full w-full object-contain"
                />
              </div>
              <figcaption className="text-center text-label-m text-text-secondary">
                {label}
              </figcaption>
            </figure>
          ))}
        </Grid>
      </Group>

      <Group
        title="메달 캐릭터"
        note="앱 대회 기록 완료 화면용(iOS #220) · 5색 × 금·은·동·참가 · 눈은 로그인 캐릭터와 같음"
      >
        <Grid className="grid-cols-3 sm:grid-cols-5">
          {MEDALS.flatMap((medal) =>
            RANKS.map((rank) => (
              <Tile
                key={`${rank}-${medal.id}`}
                src={`/images/characters/medal/${rank}-${medal.id}.webp`}
                label={BELT_LABELS[rank]}
                caption={medal.label}
                imageClassName="h-56"
              />
            )),
          )}
        </Grid>
      </Group>

      <Group
        title="자세 몸통"
        note="원본 보관 · 6색 × 6자세 · 회색 상대와 함께 · 얼굴 없음"
      >
        <div className="overflow-x-auto">
          <div className="grid min-w-[720px] grid-cols-[64px_repeat(6,1fr)] items-center gap-2">
            <span />
            {POSES.map(({ id, label }) => (
              <span
                key={id}
                className="text-center text-label-m text-text-tertiary"
              >
                {label}
              </span>
            ))}
            {BODY_COLORS.flatMap(({ id: color, label }) => [
              <span key={color} className="text-label-m text-text-tertiary">
                {label}
              </span>,
              ...POSES.map(({ id: pose, label: poseLabel }) => (
                <div
                  key={`${color}-${pose}`}
                  className="flex items-center justify-center rounded-12 bg-surface-field-subtle p-2"
                >
                  <img
                    src={BODY_SRC[color](pose)}
                    alt={`${label} ${poseLabel}`}
                    loading="lazy"
                    className="h-24 w-full object-contain"
                  />
                </div>
              )),
            ])}
          </div>
        </div>
      </Group>

      <Group title="장갑" note="원본 보관 · 6종">
        <Grid className="grid-cols-3 sm:grid-cols-6">
          {GLOVES.map(({ id, label }) => (
            <Tile
              key={id}
              src={`/images/characters/gloves/${id}.webp`}
              label={label}
              imageClassName="h-16"
            />
          ))}
        </Grid>
      </Group>

      <Group title="밸런스 게임 캐릭터" note="홈 밸런스 게임 · A·B × 4상태">
        <Grid className="grid-cols-2 sm:grid-cols-4">
          {(["A", "B"] as const).flatMap((option) =>
            BALANCE_STATES.map(({ id, label }) => (
              <Tile
                key={`${option}-${id}`}
                src={BALANCE_CHARACTER_SRC[option][id]}
                label={`${option} · ${label}`}
                imageClassName="h-24"
              />
            )),
          )}
        </Grid>
      </Group>

      <Group title="프로필 띠 링" note="피드·글 상세·댓글 · 5색 + 그랄 0~4">
        <div className="flex flex-wrap items-center gap-4">
          {RANKS.flatMap((rank) =>
            ([0, 4] as const).map((grau) => (
              <RingSample
                key={`${rank}-${grau}`}
                belt={{ rank, grau }}
                label={`${BELT_LABELS[rank]} ${grau}`}
              />
            )),
          )}
          <RingSample belt={null} label="띠 없음" />
        </div>
      </Group>

      <Group
        title="기본 프로필 선 아이콘"
        note="사진 없는 프로필 · 작업 중(#307)"
      >
        <div className="flex items-end gap-4">
          {[64, 24, 16].map((size) => (
            <div key={size} className="flex flex-col items-center gap-2">
              <div
                className="overflow-hidden rounded-full bg-surface-field-subtle"
                style={{ width: size, height: size }}
              >
                <img
                  src={"/images/characters/default-avatar.svg"}
                  alt={`기본 프로필 아이콘 ${size}`}
                  className="size-full"
                />
              </div>
              <span className="font-mono text-label-m text-text-tertiary">
                {size}
              </span>
            </div>
          ))}
        </div>
      </Group>

      <Group title="실사 띠" note="원본 보관 · 5색">
        <div className="flex flex-col gap-3">
          {RANKS.map((rank) => (
            <div key={rank} className="flex items-center gap-3">
              <span className="w-12 shrink-0 text-label-m text-text-tertiary">
                {BELT_LABELS[rank]}
              </span>
              <img
                src={`/images/characters/belts/${rank}.webp`}
                alt={`실사 ${BELT_LABELS[rank]}`}
                loading="lazy"
                className="h-6 min-w-0 object-contain object-left"
              />
            </div>
          ))}
        </div>
      </Group>

      <Group title="아직 없는 것" note="앞으로 만들거나 정할 것">
        <ul className="flex flex-col gap-2 rounded-16 bg-surface-field-subtle p-4">
          {MISSING.map((item) => (
            <li key={item} className="text-body-s text-text-secondary">
              {item}
            </li>
          ))}
        </ul>
      </Group>
    </div>
  );
}

function Group({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-8 first:mt-0">
      <div className="mb-4 flex flex-wrap items-baseline gap-x-2">
        <p className="text-body-m text-text-primary">{title}</p>
        <p className="text-label-m text-text-tertiary">{note}</p>
      </div>
      {children}
    </div>
  );
}

function Grid({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  return <div className={`grid gap-2 ${className}`}>{children}</div>;
}

function Tile({
  src,
  label,
  caption,
  imageClassName,
}: {
  src: string;
  label: string;
  caption?: string;
  imageClassName: string;
}) {
  return (
    <figure className="flex flex-col items-center gap-2 rounded-12 bg-surface-field-subtle p-3">
      <img
        src={src}
        alt={label}
        loading="lazy"
        className={`w-full object-contain ${imageClassName}`}
      />
      <figcaption className="text-center text-label-m text-text-secondary">
        {label}
        {caption ? (
          <span className="text-text-tertiary"> · {caption}</span>
        ) : null}
      </figcaption>
    </figure>
  );
}

function RingSample({ belt, label }: { belt: Belt | null; label: string }) {
  return (
    <div className="flex w-14 flex-col items-center gap-1">
      <BeltAvatar belt={belt}>
        <div className="size-full rounded-full bg-surface-field-subtle" />
      </BeltAvatar>
      <span className="text-center text-label-m text-text-tertiary">
        {label}
      </span>
    </div>
  );
}
