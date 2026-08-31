"use client";

import { useEffect } from "react";

import {
  closeNativeSubview,
  isNativeBridgeAvailable,
} from "@/shared/lib/native-bridge";
import { enqueuePendingToast } from "@/shared/ui";

/** 사유를 구분하지 않는 문구 — 404는 삭제 · 신고 · 차단 · 숨김이 모두 수렴한다. */
const GONE_MESSAGE = "삭제된 게시물이에요";

/**
 * 열 수 없는 게시글에 진입했을 때의 처리 (#41).
 *
 * WHY 404 화면을 그리지 않는가: 목록에서 카드를 탭했는데 빈 에러 화면이 뜨면 사용자는 자기가
 * 뭘 잘못했는지 알 수 없다. 삭제 · 숨기기와 마찬가지로 화면을 닫고 목록에서 안내하는 편이 일관된다.
 *
 * 토스트를 여기서 띄우지 않는 이유: 이 화면은 곧 닫히므로 여기 띄운 토스트는 웹뷰와 함께 사라진다.
 * 문구만 남기고 목록이 대신 띄운다(shared/ui/pending-toast).
 *
 * 목록에서 카드가 사라지는 것은 여기서 관여하지 않는다 — 복귀 시 단건 재조회가 404를 받아
 * 걷어낸다(#73). 이 화면은 "닫고 안내"까지만 책임진다.
 *
 * 웹 단독 진입은 닫을 곳이 없어 아래 안내 화면이 그대로 남는다(현재 앱 전용 서비스라 허용).
 */
export function PostDetailGone() {
  useEffect(() => {
    if (!isNativeBridgeAvailable()) return;

    enqueuePendingToast(GONE_MESSAGE);
    closeNativeSubview();
  }, []);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-2 px-6 text-center">
      <p className="text-body-m text-text-primary">{GONE_MESSAGE}</p>
    </div>
  );
}
