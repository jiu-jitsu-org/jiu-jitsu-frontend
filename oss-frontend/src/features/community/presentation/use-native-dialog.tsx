"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";

import { ConfirmDialog } from "@/features/community/presentation/confirm-dialog";
import { SelectSheet } from "@/features/community/presentation/select-sheet";
import {
  isNativeBridgeAvailable,
  requestNativeConfirm,
  requestNativeSelectSheet,
  type SelectSheetOption,
} from "@/shared/lib/native-bridge";

/**
 * 확인 알럿 / 선택 시트를 "네이티브 우선, 없으면 웹" 으로 띄우는 훅.
 *
 * WHY: 앱에서는 GNB·하단 탭바까지 덮는 딤이 필요해 네이티브가 표면을 소유해야 한다(웹뷰는 자기 프레임
 * 밖을 못 그림). 반면 무엇을 물어볼지·확인 후 무엇을 호출할지는 웹 정책이라 호출부에 그대로 남긴다.
 * 브라우저 단독 실행(개발/데모)에는 네이티브가 없으므로 웹 UI로 폴백해 플로우가 끊기지 않게 한다.
 *
 * 호출부는 `await confirm(...)` 처럼 결과를 기다려 쓰고, 폴백 UI(`dialog`)를 트리에 렌더하기만 하면 된다.
 */

/** 페이드 아웃이 끝난 뒤 요청을 비운다(ConfirmDialog/SelectSheet의 전환 시간과 동일). */
const FADE_OUT_MS = 200;

type ConfirmOptions = {
  title: string;
  message?: string;
  confirmText: string;
  cancelText?: string;
  destructive?: boolean;
};

type SelectSheetOptions = {
  title: string;
  message?: string;
  options: SelectSheetOption[];
  customTextPlaceholder?: string;
  submitText: string;
};

/** 시트 결과 — 제출이면 선택값(직접 입력 시 그 문구)이 담긴다. */
export type SelectSheetOutcome =
  | { submitted: false }
  | { submitted: true; value: string; customText?: string };

type ConfirmState = { options: ConfirmOptions; open: boolean } | null;
type SheetState = { options: SelectSheetOptions; open: boolean } | null;

export function useNativeDialog() {
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [sheetState, setSheetState] = useState<SheetState>(null);
  // 웹 폴백은 사용자의 버튼 탭에서 결과가 나오므로, 대기 중인 resolve를 들고 있다가 깨운다.
  const confirmResolver = useRef<((confirmed: boolean) => void) | null>(null);
  const sheetResolver = useRef<((outcome: SelectSheetOutcome) => void) | null>(
    null,
  );

  const confirm = useCallback(
    async (options: ConfirmOptions): Promise<boolean> => {
      if (isNativeBridgeAvailable()) {
        try {
          const result = await requestNativeConfirm(options);
          return result === "confirm";
        } catch {
          // 브릿지가 있다고 봤지만 전송에 실패한 경우 — 아래 웹 폴백으로 이어간다.
        }
      }

      return new Promise<boolean>((resolve) => {
        confirmResolver.current = resolve;
        setConfirmState({ options, open: true });
      });
    },
    [],
  );

  const selectSheet = useCallback(
    async (options: SelectSheetOptions): Promise<SelectSheetOutcome> => {
      if (isNativeBridgeAvailable()) {
        try {
          const outcome = await requestNativeSelectSheet(options);
          if (!outcome.submitted) return { submitted: false };
          return {
            submitted: true,
            value: outcome.value ?? "",
            customText: outcome.customText,
          };
        } catch {
          // 웹 폴백으로 이어간다.
        }
      }

      return new Promise<SelectSheetOutcome>((resolve) => {
        sheetResolver.current = resolve;
        setSheetState({ options, open: true });
      });
    },
    [],
  );

  /** 폴백 알럿을 닫으며 대기 중 호출부를 깨운다(페이드 아웃 후 언마운트). */
  const settleConfirm = useCallback((confirmed: boolean) => {
    const resolve = confirmResolver.current;
    confirmResolver.current = null;
    setConfirmState((prev) => (prev ? { ...prev, open: false } : null));
    setTimeout(() => setConfirmState(null), FADE_OUT_MS);
    resolve?.(confirmed);
  }, []);

  const settleSheet = useCallback((outcome: SelectSheetOutcome) => {
    const resolve = sheetResolver.current;
    sheetResolver.current = null;
    setSheetState((prev) => (prev ? { ...prev, open: false } : null));
    setTimeout(() => setSheetState(null), FADE_OUT_MS);
    resolve?.(outcome);
  }, []);

  // 네이티브가 그리는 경우 state가 채워지지 않으므로 렌더할 것도 없다(null).
  const dialog: ReactNode = (
    <>
      {confirmState ? (
        <ConfirmDialog
          open={confirmState.open}
          title={confirmState.options.title}
          message={confirmState.options.message}
          confirmText={confirmState.options.confirmText}
          cancelText={confirmState.options.cancelText}
          destructive={confirmState.options.destructive}
          onCancel={() => settleConfirm(false)}
          onConfirm={() => settleConfirm(true)}
        />
      ) : null}

      {sheetState ? (
        <SelectSheet
          open={sheetState.open}
          title={sheetState.options.title}
          message={sheetState.options.message}
          options={sheetState.options.options}
          customTextPlaceholder={sheetState.options.customTextPlaceholder}
          submitText={sheetState.options.submitText}
          onDismiss={() => settleSheet({ submitted: false })}
          onSubmit={(selected) =>
            settleSheet({
              submitted: true,
              value: selected.value,
              customText: selected.customText,
            })
          }
        />
      ) : null}
    </>
  );

  return { confirm, selectSheet, dialog };
}
