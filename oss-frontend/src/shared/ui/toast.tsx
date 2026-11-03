"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import { cn } from "@/shared/lib/cn";

/**
 * 공통 토스트.
 *
 * `ToastProvider`를 앱 루트에 두고, 어디서든 `useToast().show("메시지", { tone })`으로 띄운다.
 * 하단(입력 바 위)에 좌우로 길게 잠깐 떴다 사라진다. 아래로 밀면 바로 닫힌다.
 *
 * 상태(tone)마다 왼쪽 아이콘만 바뀐다 — 모양·움직임은 같다.
 * - success 완료    요청이 끝났을 때 ("게시글을 삭제했어요")
 * - info    안내    상태가 바뀌었거나 알려줄 것이 있을 때 ("이 글의 알림을 받아요")
 * - warning 주의    한도에 닿았거나 지금은 할 수 없을 때 ("사진은 최대 3장까지…")
 * - error   실패    요청이 실패했을 때 ("게시글을 삭제하지 못했어요")
 *
 * 되돌릴 수 있는 동작(숨기기 등)은 action을 넘겨 오른쪽 글자 버튼을 함께 띄운다.
 */

export type ToastTone = "success" | "info" | "warning" | "error";

/** 토스트 우측 버튼. 누르면 토스트가 즉시 닫히고 onAction이 실행된다. */
export type ToastAction = {
  label: string;
  onAction: () => void;
};

export type ToastOptions = {
  /** 왼쪽 아이콘. 기본은 info. */
  tone?: ToastTone;
  action?: ToastAction;
};

type ToastContextValue = {
  show: (message: string, options?: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_VISIBLE_MS = 2000;
/**
 * 액션이 있는 토스트는 더 오래 띄운다.
 * 되돌리기는 문구를 읽고 누를 시간이 필요해 기본 2초로는 잡기 어렵다.
 */
const TOAST_WITH_ACTION_VISIBLE_MS = 5000;
/** 사라지는 시간 — 아래 duration-200과 맞춘다. */
const TOAST_LEAVE_MS = 200;
/** 이만큼 아래로 밀고 놓으면 닫는다(px). */
const SWIPE_DISMISS_PX = 36;

/**
 * enter: 막 붙은 첫 프레임(아래 16 · 0.96 · 투명) → shown: 떠 있음 → leaving: 내려가며 흐려짐.
 * 첫 프레임을 먼저 그려야 전환이 돈다.
 */
type Phase = "enter" | "shown" | "leaving";

type ToastState = {
  message: string;
  tone: ToastTone;
  action: ToastAction | null;
  /** 떠 있는 채로 다시 불린 횟수 — 글자 줄의 key라 바뀔 때마다 새 글자가 아래에서 올라온다. */
  turn: number;
};

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within <ToastProvider>.");
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [phase, setPhase] = useState<Phase>("enter");
  // 손가락으로 끄는 중인 세로 거리(px). null이면 끌지 않는 중.
  const [dragY, setDragY] = useState<number | null>(null);
  // 손가락이 닿아 있는지 — 끄는 동안은 전환을 꺼서 손끝을 바로 따라오게 한다.
  const [dragging, setDragging] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 지금 떠 있는지 — show가 "떠 있는 토스트를 다시 부르는지" 렌더와 상관없이 판단하려고 둔다.
  const openRef = useRef(false);
  const dragStart = useRef<number | null>(null);
  const hasActionRef = useRef(false);

  const clearTimers = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (unmountTimer.current) clearTimeout(unmountTimer.current);
  };

  const dismiss = useCallback(() => {
    clearTimers();
    setPhase("leaving");
    unmountTimer.current = setTimeout(() => {
      openRef.current = false;
      setToast(null);
      setDragY(null);
    }, TOAST_LEAVE_MS);
  }, []);

  const scheduleHide = useCallback(
    (hasAction: boolean) => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(
        dismiss,
        hasAction ? TOAST_WITH_ACTION_VISIBLE_MS : TOAST_VISIBLE_MS,
      );
    },
    [dismiss],
  );

  const show = useCallback(
    (message: string, options?: ToastOptions) => {
      clearTimers();
      const tone = options?.tone ?? "info";
      const action = options?.action ?? null;
      hasActionRef.current = action !== null;

      if (openRef.current) {
        // 떠 있는 토스트가 다시 불리면 상자는 그대로 두고 글자(아이콘 포함)만 새로 올라온다 —
        // 같은 자리에 같은 모양이면 새 소식인지, 같은 일이 한 번 더 일어났는지 알 수 없다.
        // 사라지는 중이었으면 다시 올린다.
        setToast((prev) => ({
          message,
          tone,
          action,
          turn: (prev?.turn ?? 0) + 1,
        }));
        setPhase("shown");
        setDragY(null);
      } else {
        openRef.current = true;
        setToast({ message, tone, action, turn: 0 });
        setPhase("enter");
      }
      scheduleHide(action !== null);
    },
    [scheduleHide],
  );

  // 첫 프레임(enter)을 그린 다음 프레임에 shown으로 바꿔 떠오르는 전환을 튼다.
  useEffect(() => {
    if (phase !== "enter" || toast === null) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setPhase("shown"));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [phase, toast]);

  useEffect(() => clearTimers, []);

  // ── 아래로 밀어 닫기 ──────────────────────────────────
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    dragStart.current = event.clientY;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    if (hideTimer.current) clearTimeout(hideTimer.current); // 끄는 동안은 저절로 닫히지 않는다.
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStart.current === null) return;
    const dy = event.clientY - dragStart.current;
    // 위로 끌면 무겁게(1/4만) 따라온다 — 위로는 닫히지 않는다는 걸 손끝으로 알린다.
    setDragY(dy > 0 ? dy : dy / 4);
  };
  const onPointerEnd = () => {
    if (dragStart.current === null) return;
    dragStart.current = null;
    setDragging(false);
    if ((dragY ?? 0) > SWIPE_DISMISS_PX) {
      dismiss();
      return;
    }
    setDragY(null); // 제자리로 스프링처럼 돌아온다(아래 전환).
    scheduleHide(hasActionRef.current);
  };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast !== null ? (
        // 하단 여백은 화면이 정한다(globals.css의 --toast-bottom-inset):
        // 기본 16, 댓글 입력 바가 있는 상세는 바 위(85). z는 최상단 —
        // 우하단 플로팅 버튼(FAB, z auto)과 시트·알럿(z-50)보다 위에 와야 한다.
        <div className="pointer-events-none fixed inset-x-4 bottom-[calc(var(--toast-bottom-inset)_+_env(safe-area-inset-bottom))] z-[60]">
          {/* 최소 높이 58(여러 줄이면 늘어남) · 모서리 20 · 짙은 바탕 + 옅은 그림자 · Body S.
              아이콘↔글자 12, 글자↔버튼 8. */}
          <div
            role={toast.tone === "error" ? "alert" : "status"}
            aria-live={toast.tone === "error" ? "assertive" : "polite"}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
            style={
              dragY !== null
                ? {
                    translate: `0 ${phase === "leaving" ? dragY + 24 : dragY}px`,
                    opacity:
                      phase === "leaving"
                        ? 0
                        : Math.max(0.3, 1 - Math.max(0, dragY) / 120),
                  }
                : undefined
            }
            className={cn(
              "pointer-events-auto flex min-h-[58px] w-full touch-none select-none items-center gap-3 rounded-20 bg-toast-strong-background py-2 pl-4 pr-3 text-body-s text-toast-default-text shadow-[0_10px_28px_rgb(13_13_13/0.22)]",
              // 나타날 때 16 아래·0.96에서 500ms 스프링으로 떠오르고, 사라질 때 200ms에 8 내려가며 흐려진다.
              // 동작 줄이기 설정이면 옅게 나타나고 사라지기만 한다.
              dragging
                ? "transition-none"
                : "transition-opacity motion-safe:transition-[opacity,translate,scale]",
              phase === "enter" &&
                "opacity-0 motion-safe:translate-y-4 motion-safe:scale-96",
              phase === "shown" &&
                "translate-y-0 scale-100 opacity-100 duration-500 ease-spring-gentle",
              phase === "leaving" &&
                "opacity-0 duration-200 ease-in motion-safe:translate-y-2",
            )}
          >
            <span
              key={toast.turn}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-3",
                toast.turn > 0 && "motion-safe:animate-toast-text-in",
              )}
            >
              <ToastIcon tone={toast.tone} />
              <span className="min-w-0 flex-1">{toast.message}</span>
            </span>
            {toast.action ? (
              // 면 없는 하늘색 글자 버튼 — 상자 하나에 색 면은 짙은 바탕 하나만 둔다.
              <button
                type="button"
                onClick={() => {
                  const { onAction } = toast.action!;
                  dismiss();
                  onAction();
                }}
                className="shrink-0 rounded-10 px-2 py-2 text-button-s text-toast-action-text motion-safe:transition-colors motion-safe:duration-120 active:bg-toast-action-pressed-bg"
              >
                {toast.action.label}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

/**
 * 상태 아이콘 20 — 색 면 위에 짙은 기호(실패만 흰 기호).
 * 짙은 토스트 바탕 위에서 보이도록 칠한 모양이라 공용 선 아이콘(icons/)과 따로 둔다.
 */
function ToastIcon({ tone }: { tone: ToastTone }) {
  const mark = "stroke-toast-icon-mark";
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      {tone === "warning" ? (
        <>
          <path
            d="M8.6 2.6a1.6 1.6 0 0 1 2.8 0l7.2 12.6a1.6 1.6 0 0 1-1.4 2.4H2.8a1.6 1.6 0 0 1-1.4-2.4z"
            className="fill-toast-icon-warning"
          />
          <path d="M10 7.2v4.4" className={mark} strokeWidth={1.8} strokeLinecap="round" />
          <circle cx={10} cy={14.3} r={1.1} className="fill-toast-icon-mark" />
        </>
      ) : (
        <circle
          cx={10}
          cy={10}
          r={9}
          className={cn(
            tone === "success" && "fill-toast-icon-success",
            tone === "info" && "fill-toast-icon-info",
            tone === "error" && "fill-toast-icon-error",
          )}
        />
      )}
      {tone === "success" ? (
        <path
          d="M6 10.3l2.6 2.5L14 7.6"
          className={mark}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
      {tone === "info" ? (
        <>
          <path d="M10 9v5" className={mark} strokeWidth={1.8} strokeLinecap="round" />
          <circle cx={10} cy={6.2} r={1.1} className="fill-toast-icon-mark" />
        </>
      ) : null}
      {tone === "error" ? (
        <path
          d="M7.2 7.2l5.6 5.6M12.8 7.2l-5.6 5.6"
          className="stroke-toast-default-text"
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      ) : null}
    </svg>
  );
}
