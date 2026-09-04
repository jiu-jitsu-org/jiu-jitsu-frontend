"use client";

import { useEffect } from "react";

import {
  closeNativeSubview,
  isNativeBridgeAvailable,
} from "@/shared/lib/native-bridge";
import { enqueuePendingToast } from "@/shared/ui";

/**
 * 사유를 구분하지 않는 문구.
 *
 * "삭제된"이 아니라 "종료된"인 이유: 밸런스 게임은 서비스가 제공하는 콘텐츠라 삭제·신고·차단으로
 * 사라지지 않는다. 열 수 없는 판은 사실상 지나간 판이므로 종료가 실제 사유에 가깝다.
 */
const GONE_MESSAGE = "종료된 밸런스 게임이에요";

/**
 * 열 수 없는 밸런스 게임에 진입했을 때의 처리.
 *
 * 게시글 상세(PostDetailGone)와 같은 방식이다 — 404 화면을 그리지 않고 웹뷰를 닫은 뒤 돌아간
 * 화면에서 안내한다. 목록에서 탭했는데 빈 에러 화면이 뜨면 사용자는 자기가 뭘 잘못했는지 알 수 없다.
 *
 * 토스트를 여기서 띄우지 않는 이유도 같다: 이 화면은 곧 닫히므로 여기 띄운 토스트는 웹뷰와 함께
 * 사라진다. 문구만 남기고 돌아간 화면이 대신 띄운다(shared/ui/pending-toast).
 *
 * 웹 단독 진입은 닫을 곳이 없어 아래 안내 화면이 그대로 남는다(현재 앱 전용 서비스라 허용).
 */
export function BalanceDetailGone() {
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
