"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { scheduleAppStoreFallback } from "@/shared/lib/app-link";
import { cn } from "@/shared/lib/cn";
import { useOpenInAppHref } from "@/shared/lib/use-open-in-app-href";

/**
 * 외부 브라우저(비로그인)에서 로그인이 필요한 행위를 눌렀을 때 띄우는 "앱에서 계속하기" 안내.
 *
 * WHY 비활성(표시 전용)이 아니라 안내인가: 공유 링크로 들어온 사용자에게 좋아요·댓글·저장이
 * 회색으로 죽어 있으면 "고장난 것"으로 읽히고, 무엇을 해야 참여할 수 있는지도 알 수 없다.
 * 누르면 "앱에서 로그인하면 된다"를 알려주고 바로 앱으로 넘기는 편이 참여 전환에 낫다.
 *
 * WHY 전역 Provider인가: 호출 지점이 액션바·댓글 좋아요·답글·투표 등 여러 leaf에 흩어져 있고,
 * 인증 Provider의 로그인 유도(requireAuth)도 네이티브가 없을 때 이 안내로 떨어져야 한다.
 * 다이얼로그 하나를 루트에 두고 어디서든 `useOpenInAppPrompt()`로 연다.
 *
 * 앱 웹뷰에서는 쓸 일이 없다 — 그쪽은 네이티브 로그인 유도(AUTH_LOGIN_PROMPT)가 담당한다.
 */

type OpenInAppPromptOptions = {
  /** 무엇을 하려면 앱이 필요한지 — 완성된 문장으로 넘긴다(조사 처리를 피하기 위함). */
  message?: string;
};

type OpenInAppPromptContextValue = {
  prompt: (options?: OpenInAppPromptOptions) => void;
};

const OpenInAppPromptContext =
  createContext<OpenInAppPromptContextValue | null>(null);

const DEFAULT_MESSAGE =
  "로그인이 필요한 기능이에요. OSS 앱에서 로그인 후 이용할 수 있어요.";

/** 페이드 아웃이 끝난 뒤 언마운트(ConfirmDialog와 같은 전환 시간). */
const DIALOG_FADE_MS = 200;

export function useOpenInAppPrompt(): OpenInAppPromptContextValue {
  const context = useContext(OpenInAppPromptContext);
  if (!context) {
    throw new Error(
      "useOpenInAppPrompt must be used within <OpenInAppPromptProvider>.",
    );
  }
  return context;
}

export function OpenInAppPromptProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);

  const prompt = useCallback((options?: OpenInAppPromptOptions) => {
    setMessage(options?.message ?? DEFAULT_MESSAGE);
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  const value = useMemo(() => ({ prompt }), [prompt]);

  return (
    <OpenInAppPromptContext.Provider value={value}>
      {children}
      <OpenInAppDialog open={open} message={message} onClose={close} />
    </OpenInAppPromptContext.Provider>
  );
}

/**
 * "앱에서 계속하기" 다이얼로그.
 *
 * 규격·페이드는 community의 ConfirmDialog와 같다(알럿 폭 320 / radius 20 / 버튼 51).
 * 그것을 재사용하지 않는 이유: 확인 버튼이 `<button>`이 아니라 **`<a href>`여야** 한다 —
 * 앱 스킴은 사용자의 실제 링크 탭에만 반응한다(useOpenInAppHref 참고).
 */
function OpenInAppDialog({
  open,
  message,
  onClose,
}: {
  open: boolean;
  message: string;
  onClose: () => void;
}) {
  const openInAppHref = useOpenInAppHref();

  // 알파 페이드: open이 false가 돼도 페이드 아웃 동안 잠시 마운트 유지 후 언마운트.
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!open) {
      const raf = requestAnimationFrame(() => setVisible(false));
      const timer = setTimeout(() => setMounted(false), DIALOG_FADE_MS);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
      };
    }
    // 마운트 후 초기 opacity-0 프레임을 그린 뒤 다음 프레임에 1로 전환 → 페이드 인.
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      setMounted(true);
      raf2 = requestAnimationFrame(() => setVisible(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [open]);

  if (!mounted) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center px-[27.5px] transition-opacity duration-200",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      {/* 딤 배경(바깥 탭 시 닫기) */}
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 bg-dialog-dim-bg"
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-[320px] rounded-[20px] bg-dialog-container-bg px-5 pb-5 pt-5"
      >
        <h2 className="text-left text-title-2 text-dialog-title-text">
          앱에서 계속할 수 있어요
        </h2>
        <p className="mt-2 text-left text-body-m text-dialog-description-text">
          {message}
        </p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-[51px] flex-1 rounded-[15px] bg-button-neutral-default-bg text-button-m text-button-neutral-default-text"
          >
            닫기
          </button>
          {/* 앱 스킴 링크 — 탭 뒤 앱으로 넘어가지 않으면 App Store로 보낸다. 다이얼로그는 곧바로
              닫는다: 앱이 뜨면 이 페이지는 백그라운드라 의미가 없고, 돌아왔을 때 알럿이 남아
              있으면 같은 안내를 두 번 읽게 된다. */}
          <a
            href={openInAppHref}
            onClick={() => {
              scheduleAppStoreFallback();
              onClose();
            }}
            className="inline-flex h-[51px] flex-1 items-center justify-center rounded-[15px] bg-button-filled-default-bg text-button-m text-button-filled-default-text"
          >
            앱에서 계속하기
          </a>
        </div>
      </div>
    </div>
  );
}
