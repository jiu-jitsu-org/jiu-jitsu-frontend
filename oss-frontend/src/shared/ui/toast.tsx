"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cn } from "@/shared/lib/cn";

/**
 * 공통 토스트.
 *
 * `ToastProvider`를 앱 루트에 두고, 어디서든 `useToast().show("메시지")`로 띄운다.
 * 하단(입력 바 위)에 좌우로 길게(스낵바) 잠깐 떴다 사라지며, 알파(opacity) 페이드 인/아웃 한다.
 *
 * 되돌릴 수 있는 동작(숨기기 등)은 두 번째 인자로 액션을 넘겨 우측 버튼을 함께 띄운다.
 */

/** 토스트 우측 버튼. 누르면 토스트가 즉시 닫히고 onAction이 실행된다. */
export type ToastAction = {
  label: string;
  onAction: () => void;
};

type ToastContextValue = {
  show: (message: string, action?: ToastAction) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_VISIBLE_MS = 2000;
/**
 * 액션이 있는 토스트는 더 오래 띄운다.
 * 되돌리기는 문구를 읽고 누를 시간이 필요해 기본 2초로는 잡기 어렵다.
 */
const TOAST_WITH_ACTION_VISIBLE_MS = 5000;
const TOAST_FADE_MS = 200;

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within <ToastProvider>.");
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [action, setAction] = useState<ToastAction | null>(null);
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setVisible(false); // 페이드 아웃
    unmountTimer.current = setTimeout(() => {
      setMessage(null);
      setAction(null);
    }, TOAST_FADE_MS);
  }, []);

  const show = useCallback((next: string, nextAction?: ToastAction) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (unmountTimer.current) clearTimeout(unmountTimer.current);

    setMessage(next);
    setAction(nextAction ?? null);
    hideTimer.current = setTimeout(
      () => {
        setVisible(false); // 페이드 아웃
        unmountTimer.current = setTimeout(() => {
          setMessage(null);
          setAction(null);
        }, TOAST_FADE_MS);
      },
      nextAction ? TOAST_WITH_ACTION_VISIBLE_MS : TOAST_VISIBLE_MS,
    );
  }, []);

  // 메시지가 마운트되면 다음 프레임에 알파 0→1로 페이드 인(초기 opacity-0 프레임을 먼저 그린 뒤 전환).
  useEffect(() => {
    if (message === null) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setVisible(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [message]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {message !== null ? (
        // 하단 댓글 입력 바(69 + safe-area) 위로 16 공백을 두고 노출
        <div className="pointer-events-none fixed inset-x-6 bottom-[calc(85px_+_env(safe-area-inset-bottom))] z-50">
          {/* 최소 높이 56(멀티라인 가변), 좌우 16/상하 8, toast/default 토큰, Body S(14/21). 알파 페이드. */}
          <div
            role="status"
            aria-live="polite"
            className={cn(
              "flex min-h-[56px] w-full items-center gap-3 rounded-2xl bg-toast-default-background px-4 py-2 text-sm leading-[21px] text-toast-default-text transition-opacity duration-200",
              visible ? "opacity-100" : "opacity-0",
            )}
          >
            <span className="flex-1">{message}</span>
            {action ? (
              // 래퍼가 pointer-events-none이라 버튼에서만 다시 켠다(토스트 뒤 화면 조작을 막지 않기 위함).
              <button
                type="button"
                onClick={() => {
                  dismiss();
                  action.onAction();
                }}
                className="pointer-events-auto shrink-0 rounded-lg bg-toast-button-bg px-3 py-1.5 text-sm font-semibold text-toast-button-text"
              >
                {action.label}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}
