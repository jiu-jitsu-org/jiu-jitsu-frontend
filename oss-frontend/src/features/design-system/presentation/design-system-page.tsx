import type { ReactNode } from "react";

import {
  componentTokens,
  primitiveTokens,
  semanticTokens,
  type TokenEntry,
} from "@/app/styles/tokens/manifest";
import { cn } from "@/shared/lib/cn";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Divider } from "@/shared/ui/divider";
import { IconButton } from "@/shared/ui/icon-button";
import * as Icons from "@/shared/ui/icons";
import { Skeleton } from "@/shared/ui/skeleton";
import { Spinner } from "@/shared/ui/spinner";

import { CharacterSection } from "./design-system-characters";
import {
  EmptyStateDemo,
  MotionDemo,
  SearchFieldDemo,
  ToastDemo,
} from "./design-system-demos";

/**
 * /ds — 디자인 시스템 한눈에 보기.
 *
 * 색은 scripts/build-tokens.mjs가 만든 토큰 목록(manifest.ts)을 그대로 읽어 그리므로
 * Figma 변수를 다시 내보내고 `npm run tokens`만 돌리면 이 페이지도 따라 바뀐다.
 * 글자·모서리·모션은 globals.css · motion.css의 값을 옮겨 적었다 — 거기를 바꾸면 여기도 고친다.
 */

const SECTIONS = [
  { id: "color", label: "색" },
  { id: "type", label: "글자" },
  { id: "radius", label: "모서리" },
  { id: "motion", label: "모션" },
  { id: "icon", label: "아이콘" },
  { id: "component", label: "부품" },
  { id: "character", label: "캐릭터" },
] as const;

/** globals.css `@theme`의 타이포 스케일. */
const TYPE_SCALE = [
  { name: "display-1", cls: "text-display-1", spec: "30 / 40 · Semibold", use: "온보딩·성공/실패 핵심 문구" },
  { name: "title-1", cls: "text-title-1", spec: "22 / 32 · Semibold", use: "화면 제목" },
  { name: "title-2", cls: "text-title-2", spec: "20 / 28 · Semibold", use: "대화상자·시트 제목" },
  { name: "title-3", cls: "text-title-3", spec: "18 / 28 · Semibold", use: "앱바 제목·빈 화면 제목" },
  { name: "body-m", cls: "text-body-m", spec: "16 / 24 · Medium", use: "본문·목록 이름" },
  { name: "body-s", cls: "text-body-s", spec: "14 / 21 · Medium", use: "보조 본문·토스트" },
  { name: "label-m", cls: "text-label-m", spec: "12 / 16 · Medium", use: "시간·개수 같은 작은 정보" },
  { name: "button-l", cls: "text-button-l", spec: "18 / 28 · Semibold", use: "큰 버튼" },
  { name: "button-m", cls: "text-button-m", spec: "16 / 24 · Semibold", use: "중간·큰 버튼" },
  { name: "button-s", cls: "text-button-s", spec: "12 / 14 · Semibold", use: "작은 버튼" },
] as const;

const RADII = [
  { cls: "rounded-10", px: "10", use: "작은·중간 버튼, 틴트 아이콘 버튼" },
  { cls: "rounded-15", px: "15", use: "큰 버튼, 입력칸, 토스트" },
  { cls: "rounded-20", px: "20", use: "대화상자, 시트, 피드 카드" },
  { cls: "rounded-full", px: "∞", use: "아이콘 버튼, 프로필" },
] as const;

const SAMPLE_TEXT = "오늘도 매트 위에서 한 판";

/** 이름 끝의 단계(50·500p·true-white…)를 떼어 색 계열로 묶는다. */
function primitiveFamily(name: string): string {
  return name.replace(/-(true-)?[a-z0-9]+$/, "");
}

/** 첫 마디(text·surface·button…)로 묶는다. 한 개뿐인 묶음은 "기타"로 모은다. */
function groupByPrefix(tokens: TokenEntry[]): [string, TokenEntry[]][] {
  const groups = new Map<string, TokenEntry[]>();
  for (const token of tokens) {
    const key = token.name.split("-")[0];
    groups.set(key, [...(groups.get(key) ?? []), token]);
  }
  const etc: TokenEntry[] = [];
  const result: [string, TokenEntry[]][] = [];
  for (const [key, list] of groups) {
    if (list.length === 1) etc.push(...list);
    else result.push([key, list]);
  }
  if (etc.length > 0) result.push(["기타", etc]);
  return result;
}

function groupBy<T>(items: T[], keyOf: (item: T) => string): [string, T[]][] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups];
}

export function DesignSystemPage() {
  const iconEntries = Object.entries(Icons).filter(
    ([name, value]) =>
      name.endsWith("Icon") && typeof value === "function",
  ) as [string, (props: Icons.IconProps) => ReactNode][];

  return (
    <div className="min-h-dvh bg-background-default pb-24">
      {/* 머리 + 바로가기 — 스크롤해도 위에 붙어 있다. */}
      <header className="sticky top-0 z-30 bg-surface-container/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 pb-3 pt-5">
          <h1 className="text-title-1 text-text-primary">디자인 시스템</h1>
          <nav className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
            {SECTIONS.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={buttonVariants({ variant: "tint", size: "s" })}
              >
                {section.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-4 px-4 pt-4">
        <Section id="color" title="색">
          <SubTitle>기본 팔레트</SubTitle>
          <p className="mt-1 text-body-s text-text-tertiary">
            화면 코드에서 직접 쓰지 않는다. 아래 의미·부품 토큰이 이 색을 가리킨다.
          </p>
          <div className="mt-4 flex flex-col gap-5">
            {groupBy(primitiveTokens, (t) => primitiveFamily(t.name)).map(
              ([family, list]) => (
                <div key={family}>
                  <p className="text-label-m text-text-secondary">{family}</p>
                  <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-12">
                    {list.map((token) => (
                      <PrimitiveSwatch key={token.name} token={token} />
                    ))}
                  </div>
                </div>
              ),
            )}
          </div>

          <SubTitle className="mt-10">의미 토큰</SubTitle>
          <p className="mt-1 text-body-s text-text-tertiary">
            클래스는 <Code>bg-이름</Code> · <Code>text-이름</Code> ·{" "}
            <Code>border-이름</Code>. 새 화면은 이 토큰부터 쓴다.
          </p>
          <div className="mt-4 grid gap-x-6 gap-y-6 md:grid-cols-2">
            {groupByPrefix(semanticTokens).map(([group, list]) => (
              <TokenGroup key={group} title={group} tokens={list} />
            ))}
          </div>

          <SubTitle className="mt-10">부품 토큰</SubTitle>
          <p className="mt-1 text-body-s text-text-tertiary">
            Figma 부품별 색. 눌러서 펼친다 — {componentTokens.length}개.
          </p>
          <div className="mt-3 flex flex-col gap-1">
            {groupByPrefix(componentTokens).map(([group, list]) => (
              <details
                key={group}
                className="group rounded-15 open:bg-surface-field-subtle"
              >
                <summary className="flex h-11 cursor-pointer list-none items-center justify-between rounded-15 px-3 text-body-m text-text-primary active:bg-surface-container-pressed [&::-webkit-details-marker]:hidden">
                  <span>{group}</span>
                  <span className="flex items-center gap-2 text-label-m text-text-tertiary">
                    {list.length}
                    <Icons.ChevronDownIcon
                      size={20}
                      className="transition-transform duration-200 group-open:rotate-180"
                    />
                  </span>
                </summary>
                <div className="px-3 pb-3">
                  <TokenList tokens={list} />
                </div>
              </details>
            ))}
          </div>
        </Section>

        <Section id="type" title="글자">
          <p className="text-body-s text-text-tertiary">
            크기·행간·굵기가 한 벌로 묶인 이름을 <Code>text-이름</Code>으로 쓴다.
            굵기는 Medium 500과 Semibold 600 두 가지뿐이다.
          </p>
          <div className="mt-4 flex flex-col gap-1">
            {TYPE_SCALE.map((type) => (
              <div
                key={type.name}
                className="flex flex-col gap-1 rounded-15 px-3 py-3 odd:bg-surface-field-subtle sm:flex-row sm:items-baseline sm:gap-6"
              >
                <div className="w-40 shrink-0">
                  <p className="font-mono text-label-m text-text-primary">
                    text-{type.name}
                  </p>
                  <p className="text-label-m text-text-tertiary">{type.spec}</p>
                </div>
                <p
                  className={cn(
                    type.cls,
                    "min-w-0 flex-1 truncate text-text-primary",
                  )}
                >
                  {SAMPLE_TEXT}
                </p>
                <p className="text-label-m text-text-tertiary sm:w-44 sm:text-right">
                  {type.use}
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="radius" title="모서리">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {RADII.map((radius) => (
              <div key={radius.cls}>
                <div
                  className={cn(
                    "aspect-[4/3] bg-surface-primary-subtle",
                    radius.cls,
                  )}
                />
                <p className="mt-2 font-mono text-label-m text-text-primary">
                  {radius.cls}
                </p>
                <p className="text-label-m text-text-tertiary">
                  {radius.px}px · {radius.use}
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="motion" title="모션">
          <p className="text-body-s text-text-tertiary">
            누르면 눌림 색이 120ms로 깔린다. 그 밖의 움직임은 한 동작으로, 기본 500ms.
            눌러서 다시 재생한다.
          </p>
          <div className="mt-4">
            <MotionDemo />
          </div>
        </Section>

        <Section id="icon" title="아이콘">
          <p className="text-body-s text-text-tertiary">
            24 칸 기준, 색은 글자색을 따른다(<Code>size</Code>로 크기만 바꾼다).
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-8">
            {iconEntries.map(([name, Icon]) => (
              <div
                key={name}
                className="flex flex-col items-center gap-2 rounded-15 bg-surface-field-subtle px-2 py-4 text-icon-primary"
              >
                <Icon size={24} />
                <span className="w-full truncate text-center text-label-m text-text-tertiary">
                  {name.replace(/Icon$/, "")}
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Section id="component" title="부품">
          <p className="text-body-s text-text-tertiary">
            <Code>@/shared/ui</Code>에서 가져다 쓴다. 눌러서 눌림 모양을 확인한다.
          </p>

          <Demo title="Button" note="크기 s 32 · m 38 · l 51">
            <div className="flex flex-col gap-4">
              {(["filled", "neutral", "tint", "text"] as const).map(
                (variant) => (
                  <div key={variant} className="flex flex-wrap items-center gap-2">
                    <Label>{variant}</Label>
                    <Button variant={variant} size="s">
                      작은 버튼
                    </Button>
                    <Button variant={variant} size="m">
                      다시 시도
                    </Button>
                    <Button variant={variant} size="m" disabled>
                      비활성
                    </Button>
                  </div>
                ),
              )}
              <div className="flex max-w-sm flex-col gap-2 sm:ml-24">
                <div className="flex gap-2">
                  <Button variant="neutral" size="l" className="flex-1">
                    취소
                  </Button>
                  <Button variant="filled" size="l" className="flex-1">
                    확인
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="neutral" size="l" className="flex-1">
                    취소
                  </Button>
                  <Button variant="destructive" size="l" className="flex-1">
                    삭제
                  </Button>
                </div>
                <Button variant="cta" size="l" className="mt-2 w-full">
                  저장
                </Button>
                <Button variant="cta" size="l" className="w-full" disabled>
                  저장
                </Button>
                <Button variant="cta-ghost" size="l" className="w-full">
                  나중에
                </Button>
              </div>
            </div>
          </Demo>

          <Demo title="IconButton" note="크기 s 36 · m 40 · l 44">
            <div className="flex flex-wrap items-center gap-3">
              <Label>ghost</Label>
              <IconButton aria-label="뒤로 가기">
                <Icons.BackArrowIcon />
              </IconButton>
              <IconButton aria-label="알림">
                <Icons.BellIcon />
              </IconButton>
              <IconButton aria-label="더보기">
                <Icons.MoreVerticalIcon />
              </IconButton>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Label>tint</Label>
              <IconButton variant="tint" size="s" aria-label="뒤로 가기">
                <Icons.BackArrowIcon />
              </IconButton>
              <IconButton variant="tint" size="m" aria-label="뒤로 가기">
                <Icons.BackArrowIcon />
              </IconButton>
              <IconButton variant="tint" size="l" aria-label="닫기">
                <Icons.CloseIcon />
              </IconButton>
            </div>
          </Demo>

          <Demo
            title="SearchField"
            note="높이 40 · 회색 면 · 입력 중 파랑 테두리 · 글자 16(iOS 확대 막음) · 글자 있으면 지우기"
          >
            <SearchFieldDemo />
          </Demo>

          <Demo title="EmptyState" note="제목 + 설명 + 버튼(선택)">
            <EmptyStateDemo />
          </Demo>

          <Demo title="Skeleton · Spinner" note="불러오는 중">
            <div className="flex items-center gap-3 motion-safe:animate-pulse">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <Spinner />
              <Spinner className="size-8" />
            </div>
          </Demo>

          <Demo title="Divider" note="큰 덩어리 사이 4px 띠">
            <p className="text-body-s text-text-secondary">본문</p>
            <Divider className="-mx-4 my-4 sm:-mx-6" />
            <p className="text-body-s text-text-secondary">댓글</p>
          </Demo>

          <Demo title="Toast" note="useToast().show(문구, { tone, action }) · 아래로 밀면 닫힘">
            <ToastDemo />
          </Demo>
        </Section>

        <Section id="character" title="캐릭터">
          <CharacterSection />
        </Section>
      </main>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      // 붙어 있는 머리(약 120px)에 제목이 가리지 않게 앵커 위치를 내린다.
      className="scroll-mt-32 rounded-20 bg-surface-container px-4 py-6 sm:px-6"
    >
      <h2 className="mb-4 text-title-2 text-text-primary">{title}</h2>
      {children}
    </section>
  );
}

function SubTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h3 className={cn("text-title-3 text-text-primary", className)}>
      {children}
    </h3>
  );
}

function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-md bg-surface-field-subtle px-1 font-mono text-label-m text-text-secondary-strong">
      {children}
    </code>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <span className="w-20 shrink-0 font-mono text-label-m text-text-tertiary">
      {children}
    </span>
  );
}

function Demo({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: ReactNode;
}) {
  return (
    // 바탕을 깔지 않는다 — 부품이 실제 화면과 같은 흰 바탕 위에 놓여야 뼈대·회색 버튼이 제대로 보인다.
    <div className="mt-8">
      <div className="mb-4 flex items-baseline gap-2">
        <p className="text-body-m text-text-primary">{title}</p>
        <p className="text-label-m text-text-tertiary">{note}</p>
      </div>
      {children}
    </div>
  );
}

function PrimitiveSwatch({ token }: { token: TokenEntry }) {
  return (
    <div className="min-w-0">
      <div
        // 흰색 계열도 칸이 보이게 아주 옅은 안쪽 그림자를 깐다(테두리 대신).
        className="aspect-square rounded-15 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]"
        style={{ background: `var(--${token.name})` }}
      />
      <p className="mt-1 truncate text-label-m text-text-primary">
        {token.name.replace(`${primitiveFamily(token.name)}-`, "")}
      </p>
      <p className="truncate font-mono text-label-m text-text-tertiary">
        {token.hex}
      </p>
    </div>
  );
}

function TokenGroup({
  title,
  tokens,
}: {
  title: string;
  tokens: TokenEntry[];
}) {
  return (
    <div>
      <p className="text-label-m text-text-secondary">{title}</p>
      <div className="mt-2">
        <TokenList tokens={tokens} />
      </div>
    </div>
  );
}

function TokenList({ tokens }: { tokens: TokenEntry[] }) {
  return (
    <ul className="flex flex-col">
      {tokens.map((token) => (
        <li key={token.name} className="flex items-center gap-3 py-1.5">
          <span
            className="size-8 shrink-0 rounded-10 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]"
            style={{ background: `var(--${token.name})` }}
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-mono text-label-m text-text-primary">
              {token.name}
            </span>
            <span className="block truncate font-mono text-label-m text-text-tertiary">
              {token.alias ? `→ ${token.alias} · ` : ""}
              {token.hex}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
