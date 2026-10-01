"use client";

import { useRouter } from "next/navigation";

import { useOnLogin } from "@/features/auth/presentation/auth-provider";

/**
 * 비로그인 → 로그인 전환 시 서버 렌더를 다시 돌린다(#173).
 *
 * 로그인은 네이티브 모달에서 일어나고 웹뷰는 보던 화면에 그대로 남는다. 서버가 비로그인으로 그린
 * viewer 상태(좋아요 · 저장 · 소유자 · 알림 설정)를 다시 읽지 않으면 이미 좋아요한 글이 비활성으로,
 * 내 글 ⋮가 신고/숨기기로 남는다. 서버 렌더 화면(상세)에 한 줄로 얹는 용도다.
 */
export function RefreshOnLogin() {
  const router = useRouter();

  useOnLogin(() => router.refresh());

  return null;
}
