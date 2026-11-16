import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";
import * as Icons from "@/shared/ui/icons";

import { CharacterSection } from "../design-system-characters";
import { MotionDemo } from "../design-system-demos";
import {
  Code,
  DocPage,
  DocTable,
  H,
  Measure,
  P,
  Pair,
  Stage,
  Sub,
  USAGE_DATE,
} from "../doc-kit";

/* ───────────────────────── 글자 ───────────────────────── */

/** globals.css `@theme`의 타이포 스케일. */
const TYPE_SCALE = [
  { name: "display-1", cls: "text-display-1", use: "온보딩·성공/실패 핵심 문구" },
  { name: "title-1", cls: "text-title-1", use: "화면 제목" },
  { name: "title-2", cls: "text-title-2", use: "대화상자·시트 제목" },
  { name: "title-3", cls: "text-title-3", use: "앱바 제목·빈 화면 제목" },
  { name: "body-m", cls: "text-body-m", use: "본문·목록 이름" },
  { name: "body-s", cls: "text-body-s", use: "보조 본문·토스트" },
  { name: "label-m", cls: "text-label-m", use: "시간·개수 같은 작은 정보" },
  { name: "button-l", cls: "text-button-l", use: "큰 버튼" },
  { name: "button-m", cls: "text-button-m", use: "중간·큰 버튼" },
  { name: "button-s", cls: "text-button-s", use: "작은 버튼" },
] as const;

const SAMPLE_TEXT = "오늘도 매트 위에서 한 판";

export function TypographyDoc() {
  const D = "typography";
  return (
    <DocPage
      id={D}
      meta={[
        { label: "단계", value: TYPE_SCALE.length },
        { label: "굵기", value: "500 · 600" },
      ]}
    >
      <H doc={D} id="overview">개요</H>
      <P>
        크기·행간·굵기가 한 벌로 묶인 이름을 <Code>text-이름</Code>으로 쓴다. 굵기는 Medium 500과
        Semibold 600 두 가지뿐이다. 글꼴은 Pretendard(없으면 기기 기본 고딕).
      </P>
      <Stage>
        <p className="text-display-1 text-text-primary">{SAMPLE_TEXT}</p>
      </Stage>

      <H doc={D} id="scale">값 사다리</H>
      <P>아래 숫자는 화면에 그려진 글자에서 바로 읽은 값(크기 / 행간 · 굵기, px)이다.</P>
      <div className="mt-4 flex flex-col gap-1">
        {TYPE_SCALE.map((type) => (
          <div
            key={type.name}
            className="flex flex-col gap-2 rounded-15 px-3 py-3 odd:bg-surface-field-subtle"
          >
            <div className="flex items-baseline justify-between gap-4">
              <p className="font-mono text-label-m text-text-primary">text-{type.name}</p>
              <p className="text-label-m text-text-tertiary">{type.use}</p>
            </div>
            <Measure pick={["글자"]} align="start">
              <p className={cn(type.cls, "text-text-primary")}>{SAMPLE_TEXT}</p>
            </Measure>
          </div>
        ))}
      </div>

      <H doc={D} id="roles">어디에 쓰나</H>
      <DocTable
        cols="120px minmax(0,1fr)"
        head={["묶음", "자리"]}
        rows={[
          ["display", "한 화면에 하나 — 결과·온보딩의 큰 문구"],
          ["title", "화면 · 시트 · 앱바 제목. 숫자가 작을수록 크다"],
          ["body", "읽는 글. 본문은 m, 보조는 s"],
          ["label", "시간 · 개수 · 메타 정보"],
          ["button", "버튼·칩 안 글자 전용(행간이 버튼 높이에 맞춰져 있다)"],
        ]}
      />

      <H doc={D} id="guidelines">가이드라인</H>
      <Pair
        good={<p className="text-body-s text-text-secondary">사진은 최대 3장까지 첨부할 수 있어요</p>}
        goodNote={
          <>
            <Code>text-body-s</Code> 한 이름으로 크기·행간·굵기를 같이 정한다.
          </>
        }
        bad={
          <p className="text-[15px] leading-[20px] font-normal text-text-secondary">
            사진은 최대 3장까지 첨부할 수 있어요
          </p>
        }
        badNote="사다리에 없는 15px · Regular를 조합하면 화면마다 굵기가 어긋난다."
      />

      <H doc={D} id="spec">스펙</H>
      <DocTable
        cols="140px minmax(0,1fr)"
        head={["무엇", "어디"]}
        rows={[
          ["정의", <Code key="a">src/app/globals.css @theme</Code>],
          ["행간 'Auto'", "px로 고정 — 폴백 글꼴마다 normal이 달라서"],
          ["iOS 입력칸", "16px 아래면 입력할 때 화면이 확대된다(SearchField 참고)"],
        ]}
      />
    </DocPage>
  );
}

/* ───────────────────────── 모서리 ───────────────────────── */

const RADII = [
  { cls: "rounded-10", use: "작은·중간 버튼, 틴트 아이콘 버튼, 검색칸" },
  { cls: "rounded-15", use: "큰 버튼, 입력칸, 표 줄" },
  { cls: "rounded-20", use: "대화상자, 시트, 피드 카드, 토스트" },
  { cls: "rounded-full", use: "아이콘 버튼, 프로필, 칩" },
] as const;

export function RadiusDoc() {
  const D = "radius";
  return (
    <DocPage id={D} meta={[{ label: "단계", value: RADII.length }]}>
      <H doc={D} id="overview">개요</H>
      <P>
        모서리는 10 · 15 · 20 세 단계와 완전히 둥근 것 하나. 숫자가 이름이다(
        <Code>rounded-15</Code> = 15px).
      </P>

      <H doc={D} id="scale">값 사다리</H>
      <P>아래 숫자는 그려진 상자에서 읽은 값이다.</P>
      <Stage className="gap-8">
        {RADII.map((radius) => (
          <Measure key={radius.cls} pick={["모서리"]} label={radius.cls}>
            <div className={cn("size-24 bg-surface-primary-subtle", radius.cls)} />
          </Measure>
        ))}
      </Stage>

      <H doc={D} id="roles">어디에 쓰나</H>
      <DocTable
        cols="140px minmax(0,1fr)"
        head={["클래스", "자리"]}
        rows={RADII.map((radius) => [
          <span key="c" className="font-mono text-label-m">
            {radius.cls}
          </span>,
          radius.use,
        ])}
      />

      <H doc={D} id="guidelines">가이드라인</H>
      <Pair
        good={<div className="h-20 w-40 rounded-20 bg-surface-primary-subtle" />}
        goodNote="큰 덩어리일수록 큰 모서리 — 카드·시트는 20."
        bad={<div className="h-20 w-40 rounded-[12px] bg-surface-primary-subtle" />}
        badNote="사다리 밖 12px은 옆 부품과 둥근 정도가 미묘하게 어긋난다."
      />
    </DocPage>
  );
}

/* ───────────────────────── 모션 ───────────────────────── */

export function MotionDoc() {
  const D = "motion";
  return (
    <DocPage
      id={D}
      meta={[
        { label: "이징", value: 4 },
        { label: "움직임 이름", value: 58 },
      ]}
    >
      <H doc={D} id="overview">개요</H>
      <P>
        누르면 눌림 색이 120ms로 깔린다. 그 밖의 움직임은 한 동작으로, 기본 500ms. 모든 움직임은{" "}
        <Code>motion-safe:</Code>로 감싸 &lsquo;동작 줄이기&rsquo; 설정을 존중한다.
      </P>

      <H doc={D} id="scale">공통 움직임</H>
      <P>여러 화면이 같이 쓰는 것만 모았다. 눌러서 다시 재생한다.</P>
      <div className="mt-4">
        <MotionDemo />
      </div>

      <H doc={D} id="easing">이징</H>
      <DocTable
        cols="200px minmax(0,1fr)"
        head={["이름", "느낌 · 쓰는 곳"]}
        rows={[
          ["ease-spring-wobbly", "가장 많이 출렁임 — 눌렸다 돌아오는 버튼·칩"],
          ["ease-spring-bouncy", "톡 튀며 멈춤 — 대화상자·작은 표시 등장"],
          ["ease-spring-gentle", "살짝 넘쳤다 자리 잡음 — 토스트"],
          ["ease-smooth-out", "cubic-bezier(0.2, 0.8, 0.2, 1) — 빈 화면·메뉴가 미끄러져 들어옴"],
        ]}
      />
      <P>
        스프링은 감쇠 진동을 샘플링한 <Code>linear()</Code> 값이다. 새 강도가 필요하면 감쇠비만 바꿔
        같은 식으로 뽑는다(<Code>src/app/styles/motion.css</Code> 머리 주석).
      </P>

      <H doc={D} id="press">눌림</H>
      <P>
        눌림 클래스는 <Code>press-styles.ts</Code>에 모았다. 크기·모서리는 호출부가 정한다({USAGE_DATE}{" "}
        쓰는 곳).
      </P>
      <DocTable
        cols="200px minmax(0,1fr) 72px"
        head={["이름", "모양", "쓰는 곳"]}
        rows={[
          ["SURFACE_PRESS", "줄·카드 바탕이 옅게 물듦(120ms)", "8"],
          ["PRESS_BOUNCE", "0.96으로 눌렸다 스프링으로 돌아옴 — Button l·Chip", "1"],
          ["FILLED_BUTTON_PRESS", "주 색 버튼 눌림 색", "1"],
          ["NEUTRAL_BUTTON_PRESS", "회색 버튼 눌림 색", "1"],
          ["ICON_BUTTON_PRESS", "아이콘 뒤 둥근 옅은 면", "0"],
        ]}
      />
      <Stage>
        <button
          type="button"
          className="h-14 w-64 rounded-20 bg-surface-container px-4 text-left text-body-m text-text-primary motion-safe:transition-colors motion-safe:duration-120 active:bg-surface-container-pressed"
        >
          눌러 보기 · SURFACE_PRESS
        </button>
      </Stage>

      <H doc={D} id="guidelines">가이드라인</H>
      <DocTable
        cols="minmax(0,1fr) minmax(0,1fr)"
        head={["좋은 예", "피할 것"]}
        rows={[
          ["한 동작 — 나타남이면 나타남만", "튀어나오며 돌고 색까지 바뀌는 겹친 움직임"],
          ["transform · opacity로 움직임", "width · height · filter를 매 프레임 바꿈(웹 무게 규칙)"],
          ["무한 반복은 안 보일 때 멈춤", "화면 밖에서도 계속 도는 불꽃·물결"],
        ]}
      />
    </DocPage>
  );
}

/* ───────────────────────── 아이콘 ───────────────────────── */

const UNUSED_ICONS = new Set(["MoreIcon", "TagIcon"]);

export function IconDoc() {
  const D = "icon";
  const iconEntries = Object.entries(Icons).filter(
    ([name, value]) => name.endsWith("Icon") && typeof value === "function",
  ) as [string, (props: Icons.IconProps) => ReactNode][];

  return (
    <DocPage
      id={D}
      meta={[
        { label: "아이콘", value: iconEntries.length },
        { label: "쓰는 아이콘", value: `${iconEntries.length - UNUSED_ICONS.size} (${USAGE_DATE})` },
      ]}
    >
      <H doc={D} id="overview">개요</H>
      <P>
        24 칸 기준 선 아이콘. 색은 글자색을 따른다(<Code>currentColor</Code>) — 부모의{" "}
        <Code>text-*</Code>로 칠하고 <Code>size</Code>로 크기만 바꾼다.
      </P>
      <Stage className="gap-6 text-icon-primary">
        <Icons.HeartIcon size={16} />
        <Icons.HeartIcon size={20} />
        <Icons.HeartIcon size={24} />
        <span className="text-primary">
          <Icons.HeartIcon size={24} />
        </span>
      </Stage>

      <H doc={D} id="all">전체</H>
      <P>흐린 칸은 {USAGE_DATE} 앱 화면에서 쓰지 않는 아이콘이다.</P>
      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {iconEntries.map(([name, Icon]) => (
          <div
            key={name}
            className={cn(
              "flex flex-col items-center gap-2 rounded-15 bg-surface-field-subtle px-2 py-4",
              UNUSED_ICONS.has(name) ? "text-icon-disabled" : "text-icon-primary",
            )}
          >
            <Icon size={24} />
            <span className="w-full truncate text-center text-label-m text-text-tertiary">
              {name.replace(/Icon$/, "")}
            </span>
          </div>
        ))}
      </div>

      <H doc={D} id="roles">어디에 쓰나</H>
      <DocTable
        cols="140px minmax(0,1fr)"
        head={["색", "자리"]}
        rows={[
          ["icon-primary", "앱바·입력 바처럼 누르는 아이콘"],
          ["icon-secondary", "검색칸 돋보기처럼 곁들이는 아이콘"],
          ["icon-tertiary · disabled", "지우기(×)처럼 한 발 물러선 것"],
        ]}
      />

      <H doc={D} id="guidelines">가이드라인</H>
      <Pair
        good={
          <span className="text-primary">
            <Icons.HeartIcon size={24} />
          </span>
        }
        goodNote="부모 글자색으로 칠한다 — 켜짐은 text-primary."
        bad={<Icons.HeartIcon size={30} />}
        badNote="24 칸 밖 크기(30)는 선 굵기가 다른 아이콘과 어긋난다."
      />
      <Sub>토스트 아이콘은 따로</Sub>
      <P>
        토스트의 상태 아이콘(완료·안내·주의·실패)은 짙은 바탕 위에 칠한 모양이라 공용 선 아이콘과 따로
        <Code>toast.tsx</Code> 안에 있다.
      </P>
    </DocPage>
  );
}

/* ───────────────────────── 층 ───────────────────────── */

const LAYERS = [
  { cls: "z-[60]", count: "1", use: "토스트 — 무엇보다 위" },
  { cls: "z-50", count: "12", use: "시트 · 대화상자 · 사진 보기 · 앱 안내" },
  { cls: "z-30", count: "7", use: "붙어 있는 앱바 · 머리줄" },
  { cls: "z-20", count: "4", use: "화면 안에서 떠 있는 것" },
  { cls: "z-10", count: "2", use: "카드 위에 얹는 표시" },
  { cls: "z-1 · z-2 · z-[1]", count: "6", use: "같은 덩어리 안 겹침 순서" },
] as const;

export function LayerDoc() {
  const D = "layer";
  return (
    <DocPage id={D} meta={[{ label: "쓰는 단계", value: LAYERS.length }]}>
      <H doc={D} id="overview">개요</H>
      <P>
        층 토큰은 따로 없다 — Tailwind <Code>z-*</Code> 숫자를 쓴다. 아래는 {USAGE_DATE} 코드에서
        센 단계와 쓰는 곳이다. 새 겹침을 만들면 이 사다리 안에서 고른다.
      </P>

      <H doc={D} id="scale">값 사다리</H>
      <Stage align="start" className="gap-2">
        {LAYERS.map((layer, index) => (
          <div
            key={layer.cls}
            className="flex items-center gap-4 rounded-15 bg-surface-container px-4 py-3"
            style={{ marginLeft: `${index * 16}px` }}
          >
            <span className="w-32 shrink-0 font-mono text-label-m text-text-primary">
              {layer.cls}
            </span>
            <span className="min-w-0 flex-1 text-body-s text-text-secondary">{layer.use}</span>
            <span className="text-label-m text-text-tertiary">{layer.count}곳</span>
          </div>
        ))}
      </Stage>

      <H doc={D} id="guidelines">가이드라인</H>
      <DocTable
        cols="minmax(0,1fr) minmax(0,1fr)"
        head={["좋은 예", "피할 것"]}
        rows={[
          ["시트·대화상자는 z-50", "z-[999]처럼 큰 수로 덮어 이기기"],
          ["토스트는 시트 위(z-[60]) — 시트 안 동작 결과도 보이게", "토스트를 시트 아래에 두기"],
        ]}
      />
    </DocPage>
  );
}

/* ───────────────────────── 캐릭터 ───────────────────────── */

export function CharacterDoc() {
  const D = "character";
  return (
    <DocPage id={D}>
      <H doc={D} id="overview">개요</H>
      <P>
        흩어져 있던 띠 캐릭터를 한곳에서 본다(#316). 그림은 <Code>public/images/characters</Code>의
        축소본이고, 원본은 design-assets와 iOS 레포에 있다.
      </P>
      <H doc={D} id="all">전체</H>
      <div className="mt-4">
        <CharacterSection />
      </div>
    </DocPage>
  );
}
