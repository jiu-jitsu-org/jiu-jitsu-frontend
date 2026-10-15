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
import { NEUTRAL_BUTTON_PRESS } from "@/shared/ui/press-styles";

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
  // 지금 떠 있는 문구 — show가 "이미 떠 있는 토스트를 다시 부르는지" 판단하려고 렌더와 별개로 들고 있는다.
  const messageRef = useRef<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  // 떠 있는 토스트가 다시 불려 톡 다시 튀는 중(animate-toast-repop 스위치).
  const [repopping, setRepopping] = useState(false);

  const unmount = useCallback(() => {
    messageRef.current = null;
    setMessage(null);
    setAction(null);
    setRepopping(false);
  }, []);

  const dismiss = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setVisible(false); // 페이드 아웃
    unmountTimer.current = setTimeout(unmount, TOAST_FADE_MS);
  }, [unmount]);

  const show = useCallback(
    (next: string, nextAction?: ToastAction) => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (unmountTimer.current) clearTimeout(unmountTimer.current);

      // 떠 있는 토스트가 다시 불리면(같은 문구든 다른 문구든) 박스가 톡 다시 튄다 — 같은 자리에
      // 그대로 있으면 새 소식인지, 같은 일이 한 번 더 일어났는지 알 수 없다.
      // 올라오는 전환(translate·opacity)과는 다른 속성(transform: scale)이라 서로 건드리지 않는다.
      // 이미 튀는 중이면 클래스를 다시 붙여도 재생되지 않으므로 돌고 있는 애니메이션을 처음으로 되감는다.
      if (messageRef.current !== null) {
        const running = boxRef.current
          ?.getAnimations()
          .find(
            (animation) =>
              animation instanceof CSSAnimation &&
              animation.animationName === "toast-repop",
          );
        if (running) {
          running.currentTime = 0;
          running.play();
        } else {
          setRepopping(true);
        }
        // 사라지는 중(페이드 아웃)에 불렸으면 다시 올린다 — 같은 문구면 아래 페이드 인 효과가
        // 다시 돌지 않아(message 그대로) 투명한 채 남는다.
        setVisible(true);
      }
      messageRef.current = next;

      setMessage(next);
      setAction(nextAction ?? null);
      hideTimer.current = setTimeout(
        () => {
          setVisible(false); // 페이드 아웃
          unmountTimer.current = setTimeout(unmount, TOAST_FADE_MS);
        },
        nextAction ? TOAST_WITH_ACTION_VISIBLE_MS : TOAST_VISIBLE_MS,
      );
    },
    [unmount],
  );

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
        // 하단 여백은 화면이 정한다(globals.css의 --toast-bottom-inset):
        // 기본 16, 댓글 입력 바가 있는 상세는 바 위(85). z는 최상단 —
        // 우하단 플로팅 버튼(FAB, z auto)과 시트·알럿(z-50)보다 위에 와야 한다.
        <div className="pointer-events-none fixed inset-x-6 bottom-[calc(var(--toast-bottom-inset)_+_env(safe-area-inset-bottom))] z-[60]">
          {/* 최소 높이 58(멀티라인 가변), 라운드 15, 좌우 16/상하 8, toast/default 토큰, Body S(Medium 14/21). 아래에서 올라온다. */}
          {/* 본문↔버튼 간격 16. 버튼 우측 여백 16은 컨테이너 px-4가 담당한다. */}
          <div
            ref={boxRef}
            role="status"
            aria-live="polite"
            onAnimationEnd={(event) => {
              if (event.animationName === "toast-repop") setRepopping(false);
            }}
            className={cn(
              "flex min-h-[58px] w-full items-center gap-4 rounded-[15px] bg-toast-default-background px-4 py-2 text-body-s text-toast-default-text",
              // 나타날 때 아래에서 500ms 감속하며 올라오고, 사라질 때 200ms에 내려가며 흐려진다.
              "transition-opacity motion-safe:transition-[opacity,translate]",
              visible
                ? "translate-y-0 opacity-100 duration-500 ease-smooth-out"
                : "translate-y-full opacity-0 duration-200 ease-in",
              repopping && "motion-safe:animate-toast-repop",
            )}
          >
            <span className="flex-1">{message}</span>
            {action ? (
              // 래퍼가 pointer-events-none이라 버튼에서만 다시 켠다(토스트 뒤 화면 조작을 막지 않기 위함).
              // 토스트 전용 --toast-button-* 대신 공용 button/neutral 토큰을 쓴다 — 다른 화면의
              // neutral 버튼(재시도·글쓰기 등)과 같은 계열로 묶어 라운드·색이 따로 놀지 않게 한다.
              <button
                type="button"
                onClick={() => {
                  dismiss();
                  action.onAction();
                }}
                // 눌림도 neutral 버튼 짝(button/neutral/pressed)을 따른다 — 버튼이 제 바탕을 가져 어두운 토스트 위에서도 보인다.
                className={cn(
                  "text-button-s pointer-events-auto inline-flex min-h-[30px] shrink-0 items-center justify-center rounded-[10px] bg-button-neutral-default-bg px-4 py-2 text-button-neutral-default-text",
                  NEUTRAL_BUTTON_PRESS,
                )}
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
