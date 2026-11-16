/* eslint-disable @next/next/no-img-element -- 이 페이지는 그림 원본을 그대로 보여 주는 개발용 화면이다. */
import type { ReactNode } from "react";

import {
  componentTokens,
  primitiveTokens,
  semanticTokens,
} from "@/app/styles/tokens/manifest";
import { Avatar } from "@/features/community/presentation/avatar";
import { BeltAvatar } from "@/features/community/presentation/belt-avatar";
import { BackButton } from "@/shared/ui/back-button";
import { Button } from "@/shared/ui/button";
import { Chip } from "@/shared/ui/chip";
import { Divider } from "@/shared/ui/divider";
import { IconButton } from "@/shared/ui/icon-button";
import { BellIcon, HeartIcon, ShareIcon } from "@/shared/ui/icons";
import { Skeleton } from "@/shared/ui/skeleton";

import { SearchFieldSample } from "../design-system-demos";
import { Code, DocPage, H, USAGE_DATE } from "../doc-kit";
import { DOC_GROUP_LABEL, DOC_LIST, type DocGroup } from "../doc-kit/doc-registry";

const D = "overview";

/** 흰 카드 안의 회색 줄 — 글이 들어갈 자리를 줄여 그린다. */
function Bar({ className }: { className: string }) {
  return <span className={`block h-2 rounded-full bg-surface-secondary ${className}`} />;
}

/** 작은 흰 카드 — 회색 판 위에서 화면 한 조각처럼 보이게. */
function MiniCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`w-4/5 max-w-40 rounded-15 bg-surface-container p-3 ${className}`}>{children}</div>
  );
}

/**
 * 문서마다 썸네일 — 그 문서가 다루는 것을 작게 보여 준다.
 * 부품은 앱의 실제 부품을, 기초·패턴은 토큰으로 줄여 그린다.
 */
const THUMB: Record<string, ReactNode> = {
  color: (
    <div className="flex">
      {["primary", "text-primary", "surface-secondary", "error"].map((token, index) => (
        <span
          key={token}
          className={`size-10 rounded-full ring-4 ring-surface-field-subtle ${index > 0 ? "-ml-2" : ""}`}
          style={{ background: `var(--${token})` }}
        />
      ))}
    </div>
  ),
  typography: (
    <div className="flex items-baseline gap-2">
      <span className="text-display-1 text-text-primary">가</span>
      <span className="text-title-2 text-text-secondary">가</span>
      <span className="text-body-s text-text-tertiary">가</span>
    </div>
  ),
  radius: (
    <div className="flex items-center gap-2">
      <span className="size-10 rounded-10 bg-primary" />
      <span className="size-10 rounded-20 bg-primary" />
      <span className="size-10 rounded-full bg-primary" />
    </div>
  ),
  motion: (
    <div className="flex items-center gap-1.5">
      <span className="size-3 rounded-full bg-primary opacity-15" />
      <span className="size-4 rounded-full bg-primary opacity-35" />
      <span className="size-5 rounded-full bg-primary opacity-60" />
      <span className="size-7 rounded-full bg-primary" />
    </div>
  ),
  icon: (
    <div className="flex items-center gap-4 text-icon-primary">
      <BellIcon size={24} />
      <HeartIcon size={24} />
      <ShareIcon size={24} />
    </div>
  ),
  layer: (
    <div className="relative h-16 w-24">
      <span className="absolute top-0 left-0 h-10 w-16 rounded-10 bg-surface-secondary" />
      <span className="absolute top-3 left-4 h-10 w-16 rounded-10 bg-primary/30" />
      <span className="absolute top-6 left-8 h-10 w-16 rounded-10 bg-surface-container shadow-[0_4px_12px_rgb(13_13_13/0.12)]" />
    </div>
  ),
  character: (
    <img src="/images/characters/cast/blue.webp" alt="" className="h-24 w-auto" />
  ),

  button: <Button size="s">확인</Button>,
  "icon-button": (
    <IconButton variant="tint" aria-label="알림">
      <BellIcon />
    </IconButton>
  ),
  chip: (
    <div className="flex gap-1.5">
      <Chip selected tone="primary">
        노기
      </Chip>
      <Chip selected={false}>지역</Chip>
    </div>
  ),
  "search-field": <SearchFieldSample placeholder="대회 찾기" className="w-4/5 max-w-44" />,
  toast: (
    <div className="flex h-11 items-center gap-2 rounded-20 bg-toast-strong-background px-4 text-label-m text-toast-default-text">
      <span className="size-4 rounded-full bg-toast-icon-success" />
      저장했어요
    </div>
  ),
  "empty-state": (
    <div className="flex flex-col items-center gap-1">
      <span className="text-body-s text-text-primary">아직 글이 없어요</span>
      <span className="text-label-m text-text-tertiary">첫 글을 남겨 보세요</span>
    </div>
  ),
  skeleton: (
    <MiniCard className="flex items-center gap-2">
      <Skeleton className="size-8 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-1.5">
        <Skeleton className="h-2.5 w-full" />
        <Skeleton className="h-2.5 w-2/3" />
      </div>
    </MiniCard>
  ),
  // 실제 Spinner는 계속 돌아서(무한 반복) 지도에는 멈춘 고리를 같은 색으로 그린다.
  spinner: (
    <span className="flex size-14 items-center justify-center rounded-full bg-surface-container">
      <span className="size-7 rounded-full border-[3px] border-feed-card-header-avatar-bg border-t-transparent" />
    </span>
  ),
  divider: (
    <div className="w-4/5 max-w-40 overflow-hidden rounded-15 bg-surface-container">
      <div className="flex flex-col gap-1.5 p-3">
        <Bar className="w-full" />
        <Bar className="w-1/2" />
      </div>
      <Divider />
      <div className="flex flex-col gap-1.5 p-3">
        <Bar className="w-3/4" />
      </div>
    </div>
  ),
  "back-button": <BackButton className="static" />,
  "open-in-app-prompt": (
    <div className="flex w-4/5 max-w-40 translate-y-6 flex-col items-center gap-2 rounded-t-20 bg-surface-container px-3 pt-3 pb-6">
      <span className="text-label-m text-text-primary">앱에서 이어 보기</span>
      <Button size="s" className="w-full">
        앱 열기
      </Button>
    </div>
  ),
  "relative-time": <span className="text-title-2 text-text-secondary">3분 전</span>,

  "belt-avatar": (
    <BeltAvatar belt={{ rank: "blue", grau: 2 }} size="large">
      <Avatar className="size-full" iconSize={32} />
    </BeltAvatar>
  ),
  "competition-row": (
    <MiniCard className="flex items-center gap-2.5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-10 bg-surface-primary-subtle text-title-3 text-primary">
        12
      </span>
      <div className="flex flex-1 flex-col gap-1.5">
        <Bar className="w-full" />
        <Bar className="w-1/2" />
      </div>
      <HeartIcon size={18} className="shrink-0 text-text-error" />
    </MiniCard>
  ),
  "feed-card": (
    <MiniCard className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <Avatar className="size-6" iconSize={14} />
        <Bar className="w-12" />
      </div>
      <Bar className="w-full" />
      <Bar className="w-4/5" />
    </MiniCard>
  ),
};

/** 썸네일 한 칸 — 칸 전체가 그 문서로 가는 링크다(견본은 눌리지 않게 inert). */
function Tile({ id, title }: { id: string; title: string }) {
  return (
    <div className="group relative">
      <div
        inert
        aria-hidden
        className="flex h-32 items-center justify-center overflow-hidden rounded-20 bg-surface-field-subtle motion-safe:transition-colors motion-safe:duration-120 group-active:bg-surface-container-pressed"
      >
        {THUMB[id]}
      </div>
      <a
        href={`#${id}`}
        className="mt-2 block px-1 text-body-s text-text-primary after:absolute after:inset-0 after:rounded-20"
      >
        {title}
      </a>
    </div>
  );
}

export function OverviewDoc() {
  const groups: DocGroup[] = ["foundation", "component", "pattern"];
  return (
    <DocPage
      id={D}
      meta={[
        { label: "문서", value: DOC_LIST.length - 1 },
        { label: "색 토큰", value: primitiveTokens.length + semanticTokens.length + componentTokens.length },
        { label: "사용 수", value: USAGE_DATE },
      ]}
    >
      {groups.map((group) => {
        const docs = DOC_LIST.filter((doc) => doc.group === group);
        return (
          <section key={group}>
            <H doc={D} id={group}>
              {DOC_GROUP_LABEL[group]}
            </H>
            <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3">
              {docs.map((doc) => (
                <Tile key={doc.id} id={doc.id} title={doc.title} />
              ))}
            </div>
          </section>
        );
      })}

      <H doc={D} id="rules">이 페이지의 약속</H>
      <ul className="mt-3 flex flex-col gap-2 text-body-s text-text-secondary">
        <li>
          · 문서마다 주소가 있다 — <Code>/ds#문서</Code>(예: <Code>/ds#button</Code>)라 링크로 바로 보낼 수
          있다.
        </li>
        <li>· 견본은 앱의 실제 부품을 그대로 가져다 그린다.</li>
        <li>· 값은 지어내지 않는다 — 크기는 그려진 부품에서 재고, 색은 토큰 변수를 그대로 칠한다.</li>
        <li>· 사용 수는 코드에서 센 스냅샷이다({USAGE_DATE}). 디자인 시스템 페이지 자신은 빼고 셌다.</li>
        <li>· 라이트 전용이다(다크 토큰 없음).</li>
        <li>
          · 로컬 · 개발 서버에서만 열린다(<Code>is-design-system-page-enabled.ts</Code>) — 운영 사용자에게는 404.
        </li>
      </ul>
    </DocPage>
  );
}
