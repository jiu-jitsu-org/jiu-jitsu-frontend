"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

import { Avatar } from "@/features/community/presentation/avatar";
import { useOpenMyProfile } from "@/features/community/presentation/use-open-my-profile";

/** 펼친 프로필 행 높이 — 위 12 + 아바타 64 + 아래 20. */
const FULL_ROW = 96;
/** 접힌 프로필 행 높이 — 위아래 8 + 아바타 32. */
const COMPACT_ROW = 48;
/** 접히는 데 드는 스크롤 거리. 이만큼 내리면 다 접힌다. */
const COLLAPSE_DISTANCE = FULL_ROW - COMPACT_ROW;

/**
 * 내 커뮤니티 활동 상단 — 프로필 행 + 탭 바(children). 스크롤하면 프로필이 작아진 채 탭과 함께 붙는다.
 *
 * 흐름 높이는 늘 펼친 크기 그대로다 — 접힐 때 높이가 줄면 아래 목록이 끌려 올라가 화면이 튄다.
 * 대신 sticky top을 접히는 거리만큼 위로 빼서(앱바 아래로 숨김) 남는 아래쪽 48에 작은 프로필을 그린다.
 * 아바타 · 닉네임은 스크롤 진행도(--p, 0~1)에 맞춰 transform으로만 움직인다 — 손가락을 따라가는
 * 움직임이라 시간 기반 전환을 따로 두지 않는다.
 *
 * 스크롤 주체는 문서가 아니라 SubviewScrollShell(main)이다(#200).
 */
export function MyActivityHeader({
  profile,
  children,
}: {
  profile: { nickname: string; avatarUrl: string | null };
  /** 탭 바. */
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const openMyProfile = useOpenMyProfile();

  useEffect(() => {
    const header = ref.current;
    const scroller = header?.closest("main");
    if (!header || !scroller) return;

    let frame = 0;
    function update() {
      frame = 0;
      const progress = Math.min(
        1,
        Math.max(0, scroller!.scrollTop / COLLAPSE_DISTANCE),
      );
      header!.style.setProperty("--p", progress.toFixed(3));
    }
    function onScroll() {
      if (frame === 0) frame = requestAnimationFrame(update);
    }

    update();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={ref}
      // 앱바(z-30, 44 + safe-area) 바로 아래에서 접히는 거리만큼 위로 붙는다. 바탕은 화면과 같은 색.
      className="sticky z-20 bg-[var(--bw-white)]"
      style={
        {
          "--p": 0,
          top: `calc(env(safe-area-inset-top) + 2.75rem - ${COLLAPSE_DISTANCE}px)`,
        } as CSSProperties
      }
    >
      {/*
        프로필 행. 펼침: 아바타 64 · 닉네임 Title 2 · 간격 12, 세로 가운데 44.
        접힘: 아바타 32 · 닉네임 Title 3 크기 · 간격 8, 세로 가운데 72(남는 48의 가운데).
        아바타는 왼쪽 가운데 기준으로 절반이 되고, 닉네임은 그만큼 왼쪽 · 아래로 따라온다.
      */}
      <div className="relative px-4" style={{ height: FULL_ROW }}>
        {/* 아바타: 누르면 내 프로필(앱 MY 탭 또는 웹 폴백)으로 이동한다(#273).
            transform·origin은 부모(absolute div)가 담당하므로 버튼 자체는 flex 래퍼만 둔다.
            누르는 동안 배경 없이 불투명도만 낮춰 반응을 알린다(이미지 위에 면을 얹으면 아바타가 가려짐). */}
        <button
          type="button"
          onClick={openMyProfile}
          aria-label="내 프로필로 이동"
          className="absolute top-3 left-4 origin-left will-change-transform active:opacity-70"
          style={{
            transform:
              "translateY(calc(var(--p) * 28px)) scale(calc(1 - var(--p) * 0.5))",
          }}
        >
          <Avatar src={profile.avatarUrl} className="size-16" iconSize={40} />
        </button>
        <p
          className="absolute top-3 right-4 left-[92px] flex h-16 origin-left items-center will-change-transform"
          style={{
            transform:
              "translate(calc(var(--p) * -36px), calc(var(--p) * 28px)) scale(calc(1 - var(--p) * 0.1))",
          }}
        >
          <span className="min-w-0 truncate text-title-2 text-text-primary">
            {profile.nickname}
          </span>
        </p>
      </div>
      {children}
    </div>
  );
}
