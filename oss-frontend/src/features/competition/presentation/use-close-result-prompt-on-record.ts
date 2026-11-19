"use client";

import { useEffect } from "react";

import { markResultRecorded } from "@/features/competition/presentation/competition-result-dismissed";
import { bffFetch } from "@/shared/lib/http/bff-fetch";
import {
  InboundMessageType,
  registerWebBridge,
} from "@/shared/lib/native-bridge";

const RECORDED_PATH = "/api/community/profile/competitions";

/**
 * 결과 남기기 배너(상세) · 카드(대회 탭)가 떠 있는 동안, 앱에서 기록을 남기면 바로 닫는다 (#545 · jiu-jitsu-ios#397).
 *
 * - COMPETITION_RECORD_SAVED: 그 대회를 바로 닫고, 내 기록을 다시 읽어 다른 대회도 맞춘다.
 * - PROFILE_UPDATED(앱 MY에서 저장): 대회 기록을 더했을 수 있어 내 기록을 다시 읽는다.
 * 다시 읽다 실패하면 그대로 둔다 — 다음에 화면을 열 때 서버가 거른다. 이 메시지를 모르는 앱도 그때 맞춰진다.
 */
export function useCloseResultPromptOnRecord() {
  useEffect(() => {
    let reading = false;
    const recheck = async () => {
      if (reading) return;
      reading = true;
      try {
        const response = await bffFetch(RECORDED_PATH);
        if (!response.ok) return;
        const body = (await response.json()) as {
          data?: { competitionIds?: unknown };
        } | null;
        const ids = body?.data?.competitionIds;
        if (Array.isArray(ids)) {
          markResultRecorded(ids.filter((id) => Number.isInteger(id)));
        }
      } catch {
        // 덧붙는 확인이라 실패해도 그대로 둔다.
      } finally {
        reading = false;
      }
    };

    return registerWebBridge((message) => {
      if (message.type === InboundMessageType.COMPETITION_RECORD_SAVED) {
        const id = Number(message.payload?.competitionId);
        if (Number.isInteger(id) && id > 0) markResultRecorded([id]);
        void recheck();
      } else if (message.type === InboundMessageType.PROFILE_UPDATED) {
        void recheck();
      }
    });
  }, []);
}
