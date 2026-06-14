"use client";

import Link from "next/link";

import {
  isNativeBridgeAvailable,
  openNativeSubview,
} from "@/shared/lib/native-bridge";
import { BackButton } from "@/shared/ui";

/**
 * 게시글 상세 쇼케이스 타입 선택 리스트 (개발용 중간 페이지).
 *
 * 각 항목은 게시글 상세 화면이므로 네이티브 웹뷰에선 OPEN_SUBVIEW(풀 웹뷰)로 열어 헤더/탭바를 덮는다.
 * 웹 단독에선 일반 Link 라우팅을 유지(브릿지 미연결 시 기본 동작).
 */

type VariantEntry = {
  href: string;
  title: string;
  description: string;
  ready: boolean;
};

const VARIANTS: VariantEntry[] = [
  {
    href: "/community-playground/detail/default",
    title: "게시글 상세 (디폴트 · 타인)",
    description: "현재 연결된 레이아웃 — 타인 게시글(헤더 ⋮: 신고/숨기기)",
    ready: true,
  },
  {
    href: "/community-playground/detail/default?owner=1",
    title: "게시글 상세 (자신)",
    description: "내 게시글 — 헤더 ⋮: 삭제하기/수정하기",
    ready: true,
  },
  {
    href: "/community-playground/detail/photo",
    title: "게시글 상세 (사진)",
    description: "사진 있는 목업 (imageList 1개 이상)",
    ready: true,
  },
  {
    href: "/community-playground/detail/comments",
    title: "게시글 상세 (댓글)",
    description: "댓글 여러 개 목업 (초안)",
    ready: true,
  },
  {
    href: "/community-playground/detail/api-test",
    title: "게시글 상세 (API 테스트)",
    description: "실제 데이터 경로(BFF/업스트림) — ?id=로 게시글 지정",
    ready: true,
  },
];

export function DetailPlaygroundListPage() {
  return (
    <main className="min-h-screen bg-white pb-12 text-zinc-900">
      <BackButton />
      <div className="mx-auto w-full max-w-3xl px-6">
        <header className="border-b border-zinc-200 pb-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
            Community Detail
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            게시글 상세 타입 선택
          </h1>
          <p className="mt-3 text-sm text-zinc-600">
            타입별 상세 화면을 확인합니다.
          </p>
        </header>

        <ul className="mt-8 divide-y divide-zinc-200 border-y border-zinc-200">
          {VARIANTS.map((entry) => (
            <li key={entry.href}>
              <Link
                href={entry.href}
                onClick={(event) => {
                  // 네이티브 웹뷰면 기본 라우팅을 막고 OPEN_SUBVIEW(풀 웹뷰)로 연다.
                  if (isNativeBridgeAvailable()) {
                    event.preventDefault();
                    openNativeSubview(`${window.location.origin}${entry.href}`);
                  }
                }}
                className="group flex items-center justify-between gap-4 py-5 transition-colors hover:bg-zinc-50"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-semibold text-zinc-900 group-hover:text-zinc-950">
                      {entry.title}
                    </p>
                    {entry.ready ? null : (
                      <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
                        연결 예정
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-zinc-600">
                    {entry.description}
                  </p>
                </div>
                <span
                  aria-hidden
                  className="shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-600"
                >
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
