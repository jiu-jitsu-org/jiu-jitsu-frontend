"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import {
  OutboundMessageType,
  postToNative,
  refreshSessionViaBridge,
} from "@/shared/lib/native-bridge";

/**
 * 만료 세션 복구 경계(서버 → 클라이언트 위임).
 *
 * SSR이 인증 조회 중 만료 토큰(A0003)을 만나면 서버는 스스로 토큰을 갱신할 수 없다(refreshToken은
 * 네이티브에만 있음). 익명으로 격하하면 네이티브(로그인)와 세션이 어긋나므로, 서버는 목록/상세
 * 대신 "session-expired"만 알리고, 갱신 가능한 이 클라이언트 컴포넌트에 복구를 위임한다.
 *
 * 복구: 네이티브에 갱신 요청(refreshSessionViaBridge) → 성공 시 새 토큰이 세션 쿠키에 심어지므로
 * router.refresh()로 SSR을 재실행하면 인증 상태로 화면이 다시 그려진다.
 *
 * 루프 방지: 재실행 후에도 또 만료로 돌아오는 비정상 상황을 막기 위해, 같은 경로에서 최근
 * 30초 내 복구를 이미 시도했다면 바로 실패 처리한다(정상 복구는 성공 후 언마운트되어 재진입 없음).
 * **성공해도 기록을 지우지 않는다** — 지우면 "갱신은 되는데 SSR은 계속 만료"인 루프를 못 막는다.
 */
const RECOVERY_COOLDOWN_MS = 30_000;

function cooldownKey(): string {
  return `session-recovery:${window.location.pathname}`;
}

export function SessionExpiredRecovery({
  loading,
}: {
  /** 복구(갱신) 진행 중 표시. SSR에서도 렌더되므로 서버 렌더 가능한 마크업이어야 한다. */
  loading: ReactNode;
}) {
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const startedRef = useRef(false);
  const cancelledRef = useRef(false);

  /**
   * @param manual 사용자가 재시도를 누른 경우. 쿨다운을 건너뛴다 —
   *   쿨다운은 **자동** 재실행 루프를 막으려는 것이고, 사람이 누른 건 루프가 아니다.
   *   이게 없으면 30초 안에는 실패 화면에서 빠져나갈 수단이 아예 없다.
   */
  const recover = useCallback(
    async (manual: boolean) => {
      const key = cooldownKey();

      if (!manual) {
        const last = Number(sessionStorage.getItem(key) ?? 0);
        if (last && Date.now() - last < RECOVERY_COOLDOWN_MS) {
          throw new Error("session recovery cooldown");
        }
      }

      sessionStorage.setItem(key, String(Date.now()));
      await refreshSessionViaBridge();
    },
    [],
  );

  const run = useCallback(
    (manual: boolean) => {
      setFailed(false);

      recover(manual)
        .then(() => {
          // 갱신 성공 → 새 쿠키로 SSR 재실행. 인증 상태면 이 컴포넌트는 더 이상 렌더되지 않는다.
          if (!cancelledRef.current) router.refresh();
        })
        .catch(() => {
          if (!cancelledRef.current) setFailed(true);
        });
    },
    [recover, router],
  );

  useEffect(() => {
    // effect 재실행(StrictMode 등)에도 자동 복구는 마운트당 한 번만 시작한다.
    if (startedRef.current) return;
    startedRef.current = true;

    cancelledRef.current = false;
    run(false);

    return () => {
      cancelledRef.current = true;
    };
  }, [run]);

  if (!failed) return <>{loading}</>;

  return <SessionExpiredFallback onRetry={() => run(true)} />;
}

/**
 * 갱신 실패 화면.
 *
 * 화면별로 다른 문구를 받지 않고 여기서 한 벌로 그린다. 이전에는 호출부가 fallback을 넘겼는데
 * 셋 중 둘이 문구만 있는 막다른 길이었고, 나머지 하나(FeedErrorState)의 재시도는 router.refresh라
 * SSR이 다시 만료를 돌려줄 뿐이라 실질적으로 동작하지 않았다. 빠져나갈 수단은 두 가지뿐이다 —
 * 갱신을 다시 시도하거나, 네이티브 로그인으로 넘어가거나.
 */
function SessionExpiredFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-[13px] px-4 text-center">
      <p className="text-body-m text-text-primary">
        로그인이 만료됐어요
      </p>
      <p className="text-body-s text-text-tertiary">
        다시 시도하거나 로그인해 주세요
      </p>

      <div className="mt-1 flex items-center gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="h-[38px] rounded-[10px] bg-button-neutral-default-bg px-4 text-button-m text-button-neutral-default-text"
        >
          재시도
        </button>
        <button
          type="button"
          onClick={() =>
            postToNative({ type: OutboundMessageType.AUTH_LOGIN_PROMPT })
          }
          className="h-[38px] rounded-[10px] bg-button-filled-default-bg px-4 text-button-m text-button-filled-default-text"
        >
          로그인
        </button>
      </div>
    </div>
  );
}
