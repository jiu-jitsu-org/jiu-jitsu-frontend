"use client";

import { useMemo, useState, type MouseEvent } from "react";

import type { Belt, BeltRank } from "@/features/community/domain/belt";
import { Avatar } from "@/features/community/presentation/avatar";
import { BeltAvatar } from "@/features/community/presentation/belt-avatar";
import { CoachBadge } from "@/features/community/presentation/coach-badge";
import { FeedCard } from "@/features/community/presentation/feed/feed-card";
import type { CompetitionListItem } from "@/features/competition/application/get-competition-list-page-data";
import type { Competition } from "@/features/competition/domain/competition";
import { CompetitionRow } from "@/features/competition/presentation/competition-month-section";
import type { CompetitionInterest } from "@/features/competition/presentation/use-competition-interest";

import {
  Code,
  DocPage,
  DocTable,
  Dot,
  H,
  P,
  Pair,
  Stage,
  Sub,
  USAGE_DATE,
} from "../doc-kit";

/** 견본은 눌러도 다른 화면으로 가지 않는다 — 가짜 대회·글이라 상세가 없다. */
function stopDetailLinks(event: MouseEvent<HTMLElement>) {
  const target = event.target as HTMLElement;
  if (target.closest("[data-detail-link]")) {
    event.preventDefault();
    event.stopPropagation();
  }
}

/* ───────────────────────── 띠 아바타 ───────────────────────── */

const RANK_LABEL: Record<BeltRank, string> = {
  white: "흰띠",
  blue: "파란띠",
  purple: "보라띠",
  brown: "갈색띠",
  black: "검은띠",
};

export function BeltAvatarDoc() {
  const D = "belt-avatar";
  const ranks = Object.keys(RANK_LABEL) as BeltRank[];
  return (
    <DocPage
      id={D}
      meta={[
        { label: "쓰는 곳", value: `4곳 (${USAGE_DATE})` },
        { label: "띠", value: 5 },
        { label: "그랄", value: "0~4" },
        { label: "크기", value: 2 },
      ]}
    >
      <H doc={D} id="overview">개요</H>
      <P>
        프로필 사진 둘레에 띠 색을 두르고, 띠 끝 검은 칸에 그랄(줄) 수를 새긴다(#265). 글 작성자 줄 ·
        댓글 · 피드 카드 · 띠 고르기 시트가 같은 부품(<Code>BeltAvatar</Code>)을 쓴다. 띠를 안 정한
        회원은 회색 점선.
      </P>
      <Stage className="gap-6">
        {ranks.map((rank, index) => (
          <div key={rank} className="flex flex-col items-center gap-2">
            <BeltAvatar belt={{ rank, grau: (index % 5) as Belt["grau"] }} size="large">
              <Avatar className="size-full" iconSize={32} />
            </BeltAvatar>
            <span className="text-label-m text-text-tertiary">
              {RANK_LABEL[rank]} · {index % 5}그랄
            </span>
          </div>
        ))}
      </Stage>

      <H doc={D} id="variants">변형</H>
      <Sub>그랄 0~4 (파란띠)</Sub>
      <Stage className="gap-6">
        {([0, 1, 2, 3, 4] as const).map((grau) => (
          <div key={grau} className="flex flex-col items-center gap-2">
            <BeltAvatar belt={{ rank: "blue", grau }} size="large">
              <Avatar className="size-full" iconSize={32} />
            </BeltAvatar>
            <span className="text-label-m text-text-tertiary">{grau}그랄</span>
          </div>
        ))}
        <div className="flex flex-col items-center gap-2">
          <BeltAvatar belt={null} size="large">
            <Avatar className="size-full" iconSize={32} />
          </BeltAvatar>
          <span className="text-label-m text-text-tertiary">띠 없음</span>
        </div>
      </Stage>

      <H doc={D} id="sizes">크기</H>
      <DocTable
        cols="100px 120px minmax(0,1fr)"
        head={["크기", "견본", "자리"]}
        rows={[
          [
            "card · 32",
            <BeltAvatar key="c" belt={{ rank: "purple", grau: 2 }}>
              <Avatar className="size-full" iconSize={16} />
            </BeltAvatar>,
            "피드 카드 · 글 상세 · 댓글 작성자 줄(사진 24 + 틈 1 + 띠 3)",
          ],
          [
            "large · 80",
            <BeltAvatar key="l" belt={{ rank: "purple", grau: 2 }} size="large">
              <Avatar className="size-full" iconSize={32} />
            </BeltAvatar>,
            "띠 고르기 시트 미리보기(사진 64 + 틈 3 + 띠 5)",
          ],
        ]}
      />

      <H doc={D} id="guidelines">가이드라인</H>
      <Pair
        good={
          <div className="flex items-center gap-2">
            <BeltAvatar belt={{ rank: "black", grau: 1 }}>
              <Avatar className="size-full" iconSize={16} />
            </BeltAvatar>
            <span className="text-body-s text-text-primary">관장님</span>
            <CoachBadge />
          </div>
        }
        goodNote="띠는 둘레로만 — 이름 옆에는 사범 인증 배지 하나만 붙인다."
        bad={
          <div className="flex items-center gap-2">
            <BeltAvatar belt={{ rank: "black", grau: 1 }}>
              <Avatar className="size-full" iconSize={16} />
            </BeltAvatar>
            <span className="text-body-s text-text-primary">관장님</span>
            <span className="text-label-m text-text-tertiary">검은띠 1그랄</span>
          </div>
        }
        badNote="둘레가 이미 띠를 말한다 — 글로 또 쓰면 같은 말을 두 번 한다."
      />

      <H doc={D} id="spec">스펙</H>
      <DocTable
        cols="120px minmax(0,1fr)"
        head={["띠", "색"]}
        rows={ranks.map((rank) => [
          RANK_LABEL[rank],
          <Dot key={rank} token={`my-profile-header-bg-${rank}`} withName />,
        ])}
      />
      <P>
        띠 색은 MY 프로필 머리 색 토큰을 같이 쓴다. 띠 없음 점선은 <Code>cool-gray-200</Code>.
      </P>
    </DocPage>
  );
}

/* ───────────────────────── 대회 줄 ───────────────────────── */

const BASE: Omit<Competition, "id" | "name" | "date" | "status" | "popular" | "interestCount"> = {
  place: "서울 송파",
  region: undefined,
  divisions: ["gi", "nogi"],
  earlyBirdOpen: false,
  viewCount: 0,
  interested: false,
};

/** 견본 대회 — 이름·날짜는 지어낸 것이다. 실제 대회와 상관없다. */
const SAMPLE_ITEMS: CompetitionListItem[] = [
  {
    competition: { ...BASE, id: -1, name: "견본 오픈 주짓수 대회", date: "2026-12-05", status: "open", popular: true, interestCount: 42, earlyBirdOpen: true },
    registration: { kind: "open", deadline: "early-bird", daysLeft: 3 },
  },
  {
    competition: { ...BASE, id: -2, name: "견본 노기 챔피언십", date: "2026-12-13", status: "upcoming", popular: false, interestCount: 8, divisions: ["nogi"], place: "부산 해운대" },
    registration: { kind: "upcoming", opensOn: "2026-11-20" },
  },
  {
    competition: { ...BASE, id: -3, name: "견본 키즈 주짓수 페스티벌", date: "2026-12-20", status: "closed", popular: false, interestCount: 3, audience: "키즈", place: "대전 유성" },
    registration: { kind: "closed" },
  },
];

/** 견본 관심 — 이 페이지 안에서만 켜고 끈다(서버에 보내지 않는다). */
function useSampleInterest(): CompetitionInterest {
  const [ids, setIds] = useState<ReadonlySet<number>>(() => new Set([-1]));
  return useMemo(
    () =>
      ({
        interestedIds: ids,
        isInterested: (id: number) => ids.has(id),
        countOf: (id: number) => {
          const base = SAMPLE_ITEMS.find((item) => item.competition.id === id)?.competition.interestCount ?? 0;
          return base + (ids.has(id) ? 1 : 0);
        },
        toggle: (target: { id: number }) =>
          setIds((prev) => {
            const next = new Set(prev);
            if (next.has(target.id)) next.delete(target.id);
            else next.add(target.id);
            return next;
          }),
        register: async () => true,
        sync: () => {},
      }) as unknown as CompetitionInterest,
    [ids],
  );
}

export function CompetitionRowDoc() {
  const D = "competition-row";
  const interest = useSampleInterest();
  return (
    <DocPage
      id={D}
      meta={[
        { label: "쓰는 곳", value: `대회 목록 · 대회 달력 (${USAGE_DATE})` },
        { label: "접수 상태", value: 3 },
      ]}
    >
      <H doc={D} id="overview">개요</H>
      <P>
        대회 목록 한 줄 — 왼쪽 날짜·요일, 오른쪽 회색 상자에 이름(+HOT) · 관심 하트 → 장소 · 부문 · 대상 →
        접수 칩. 상자 어디를 눌러도 대회 상세가 열리고 하트만 따로 눌린다. 아래 대회는 지어낸 견본이다 —
        하트는 눌러 볼 수 있고 상세로는 가지 않는다.
      </P>
      <Stage device>
        <ul className="flex flex-col gap-3 px-4" onClickCapture={stopDetailLinks}>
          {SAMPLE_ITEMS.map((item, index) => (
            <CompetitionRow
              key={item.competition.id}
              item={item}
              currentYear={2026}
              interest={interest}
              timeline={index < SAMPLE_ITEMS.length - 1}
            />
          ))}
        </ul>
      </Stage>

      <H doc={D} id="anatomy">무엇으로 이뤄졌나</H>
      <DocTable
        cols="160px minmax(0,1fr)"
        head={["조각", "규칙"]}
        rows={[
          ["날짜 · 요일", "바탕 없이 글자만. 일요일 빨강, 토요일 파랑"],
          ["이름 + HOT", "관심 많은 대회면 이름 바로 뒤 불꽃과 HOT 글자가 번갈아 나온다(면 없이)"],
          ["관심 하트", "이름 줄 오른쪽 위 — 이름에 붙은 '내 대회' 표시로 읽히게"],
          ["장소 · 부문 · 대상", "회색 한 줄"],
          ["접수 칩", "흰 면 + 글자색으로 상태를 나눈다(접수 중 파랑 · 예정 · 마감 흐림)"],
          ["남은 날(D-day)", "관심 등록한 대회만 접수 칩 안에 작게"],
        ]}
      />

      <H doc={D} id="guidelines">가이드라인</H>
      <DocTable
        cols="minmax(0,1fr) minmax(0,1fr)"
        head={["좋은 예", "피할 것"]}
        rows={[
          ["상자 안 색 면은 접수 칩 하나 — HOT은 글자로", "HOT에도 빨간 면을 깔아 색 면이 둘"],
          ["D-day는 관심 대회에만", "모든 대회에 큰 숫자 — 이름 자리를 빼앗는다"],
          ["누를 수 없는 상태 칩은 테두리 없이 면만", "필터 칩(Chip)과 같은 테두리 — 눌러야 할 것처럼 보인다"],
        ]}
      />

      <H doc={D} id="spec">스펙</H>
      <DocTable
        cols="160px minmax(0,1fr)"
        head={["자리", "토큰"]}
        rows={[
          ["상자", <Dot key="a" token="surface-field" withName />],
          ["누르는 동안", <Dot key="b" token="surface-container-pressed" withName />],
          ["타임라인 줄", <Dot key="c" token="surface-secondary" withName />],
          ["HOT", <Dot key="d" token="text-error" withName />],
        ]}
      />
      <P>
        부품 위치: <Code>features/competition/presentation/competition-month-section.tsx</Code>의{" "}
        <Code>CompetitionRow</Code> · <Code>RegistrationChip</Code> · <Code>StatusChip</Code>. 화면 전용이라
        공용 부품(shared/ui)이 아니다.
      </P>
    </DocPage>
  );
}

/* ───────────────────────── 피드 카드 ───────────────────────── */

export function FeedCardDoc() {
  const D = "feed-card";
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  return (
    <DocPage
      id={D}
      meta={[
        { label: "쓰는 곳", value: `커뮤니티 피드 (${USAGE_DATE})` },
        { label: "조각", value: 4 },
      ]}
    >
      <H doc={D} id="overview">개요</H>
      <P>
        커뮤니티 글 한 장 — 머리(띠 아바타 · 닉네임 · ⋮) · 본문(제목 · 카테고리 · 시간 · 두 줄 미리보기) ·
        사진 · 반응(댓글 · 좋아요 · 저장). 아래 글은 지어낸 견본이다 — 좋아요·저장은 눌러 볼 수 있다.
      </P>
      <Stage device>
        <div onClickCapture={stopDetailLinks}>
          <FeedCard
            author={{ name: "오스매트", belt: { rank: "blue", grau: 2 }, isCoach: false }}
            createdAt="2026-11-15T21:30:00+09:00"
            categoryName="기술 질문"
            title="하프가드에서 언더훅 잡은 뒤 스윕이 자꾸 막혀요"
            body="언더훅까지는 잘 들어가는데 상대가 크로스페이스로 눌러 오면 그대로 납작해집니다. 머리 위치를 어디에 둬야 할까요?"
            counts={{ comments: 12, likes: liked ? 25 : 24, bookmarks: bookmarked ? 6 : 5 }}
            liked={liked}
            bookmarked={bookmarked}
            onToggleLike={() => setLiked((value) => !value)}
            onToggleBookmark={() => setBookmarked((value) => !value)}
            onPressMore={() => {}}
          />
        </div>
      </Stage>

      <H doc={D} id="anatomy">무엇으로 이뤄졌나</H>
      <DocTable
        cols="140px minmax(0,1fr)"
        head={["조각", "부품"]}
        rows={[
          ["머리", "FeedCardHeader — 띠 아바타(card) · 닉네임 · 사범 배지 · ⋮"],
          ["본문", "FeedCardBody — 제목 · 카테고리 · 상대 시간(RelativeTime) · 미리보기"],
          ["사진", "FeedCardImages — 1장이면 그대로, 여러 장이면 대표 1장 + '+N'"],
          ["반응", "FeedCardReactions — 댓글 · 좋아요 · 저장(누르면 톡 튀는 반응 움직임)"],
        ]}
      />
      <P>
        조각을 함께 내보내 두어, 투표·공지 같은 카드 변형은 조각을 다시 엮어 만든다. 글이 고른 대회는{" "}
        <Code>attachment</Code> 자리에 대회 카드로 붙는다(#379).
      </P>

      <H doc={D} id="guidelines">가이드라인</H>
      <DocTable
        cols="minmax(0,1fr) minmax(0,1fr)"
        head={["좋은 예", "피할 것"]}
        rows={[
          ["카드 어디를 눌러도 상세 — 반응·⋮만 따로", "제목만 눌리는 카드"],
          ["내 글만 모인 목록은 hideAuthor로 머리를 뺀다", "같은 이름이 카드마다 반복"],
          ["카드 사이는 간격과 옅은 면으로", "카드마다 테두리를 두름"],
        ]}
      />

      <H doc={D} id="spec">스펙</H>
      <P>
        색은 <Code>feed-card-*</Code> · <Code>reaction-bar-*</Code> 부품 토큰만 쓴다(색 문서 3단 · 부품의
        feed · reaction 묶음).
      </P>
    </DocPage>
  );
}
