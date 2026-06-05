"use client";

import { useState } from "react";

import { useAuth } from "@/features/auth/presentation/auth-provider";
import type { UserProfile } from "@/features/profile/domain/profile";
import { InboundMessageType } from "@/shared/lib/native-bridge/messages";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
} from "@/shared/types/api";

/**
 * 인증/세션 테스트 하니스 (개발용).
 *
 * 실기기 없이도 브릿지·세션 흐름을 눈으로 확인하기 위한 화면이다.
 * - 현재 로그인 상태/프로필 표시
 * - [로그인 요청]: 비로그인 시 보호된 행위를 보관하고 네이티브 로그인 유도 → 성공 후 행위 복귀
 * - 네이티브 시뮬레이터: 네이티브 없이 인바운드 메시지를 주입해 운영 경로를 그대로 검증
 * - 브릿지 이벤트 로그
 *
 * 커뮤니티 화면 작업 시작 시 이 하니스는 제거하거나 별도 경로로 분리한다.
 */

/** 시뮬레이터가 주입할 더미 토큰. 실제 토큰 형식과 무관한 테스트용 값. */
const DUMMY_ACCESS_TOKEN = "dummy-access-token";

/** 인증 API 테스트(GET /api/user/profile) 결과 상태. */
type ProfileTest =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "success"; nickname: string; snsProvider: string; email: string }
  | { state: "error"; statusCode: number; message: string };

export function AuthPlaygroundPage() {
  const {
    status,
    events,
    nativeAvailable,
    requireAuth,
    refresh,
    logout,
    simulateInbound,
  } = useAuth();

  const [lastActionAt, setLastActionAt] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState(DUMMY_ACCESS_TOKEN);
  const [profileTest, setProfileTest] = useState<ProfileTest>({ state: "idle" });

  // 보호된 GET /api/user/profile 호출. 성공/실패를 화면에 표시한다.
  const callProfileApi = async () => {
    setProfileTest({ state: "loading" });
    try {
      const res = await fetch("/api/user/profile");
      const body = (await res.json()) as
        | ApiSuccessResponse<UserProfile>
        | ApiErrorResponse;

      if (res.ok && body.success) {
        const { nickname, snsProvider, email } = body.data;
        setProfileTest({ state: "success", nickname, snsProvider, email });
      } else {
        const error = body as ApiErrorResponse;
        setProfileTest({
          state: "error",
          statusCode: error.statusCode ?? res.status,
          message: error.message ?? "요청에 실패했습니다.",
        });
      }
    } catch {
      setProfileTest({
        state: "error",
        statusCode: 0,
        message: "네트워크 오류가 발생했습니다.",
      });
    }
  };

  // direct=false → AUTH_LOGIN_PROMPT(안내 알럿), true → AUTH_LOGIN_MODAL(모달 즉시)
  const runProtectedAction = (direct: boolean) => {
    requireAuth(
      () => {
        // 로그인 상태에서 즉시, 비로그인이면 로그인 성공 후 이 콜백이 실행된다.
        setLastActionAt(new Date().toLocaleTimeString());
      },
      { reason: "harness-demo", direct },
    );
  };

  const injectLoginSuccess = () => {
    simulateInbound({
      type: InboundMessageType.AUTH_LOGIN_SUCCESS,
      payload: {
        // 더미 토큰으로는 백엔드가 401을 준다. 실제 성공을 보려면 유효 토큰을 입력한다.
        accessToken: tokenInput.trim() || DUMMY_ACCESS_TOKEN,
        expiresAt: Date.now() + 1000 * 60 * 60,
      },
    });
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-12 text-zinc-950">
      <header>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
          Auth / Session Playground
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          인증·브릿지 테스트 하니스
        </h1>
        <p className="mt-2 text-sm leading-7 text-zinc-600">
          네이티브 브릿지 연결: {nativeAvailable ? "있음 (실기기/웹뷰)" : "없음 (브라우저 단독 — 시뮬레이터 사용)"}
        </p>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">현재 세션 상태</h2>
        <dl className="mt-4 grid grid-cols-[7rem_1fr] gap-y-2 text-sm">
          <dt className="text-zinc-500">상태</dt>
          <dd>
            <StatusBadge status={status} />
          </dd>
          <dt className="text-zinc-500">보호된 행위</dt>
          <dd>{lastActionAt ? `실행됨 @ ${lastActionAt}` : "미실행"}</dd>
        </dl>

        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={() => runProtectedAction(false)} className={primaryButton}>
            로그인 프롬프트 (안내 알럿)
          </button>
          <button type="button" onClick={() => runProtectedAction(true)} className={primaryButton}>
            로그인 모달 (다이렉트)
          </button>
          <button type="button" onClick={() => void refresh()} className={secondaryButton}>
            상태 새로고침
          </button>
          <button type="button" onClick={() => void logout()} className={secondaryButton}>
            로그아웃
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">인증 API 테스트</h2>
        <p className="mt-1 text-sm leading-6 text-zinc-600">
          보호된 <code>GET /api/user/profile</code>를 호출합니다. 로그인 상태면 프로필을,
          비로그인·토큰 무효면 인증 실패를 표시합니다.
        </p>
        <div className="mt-4">
          <button type="button" onClick={() => void callProfileApi()} className={primaryButton}>
            프로필 조회 호출
          </button>
        </div>
        <div className="mt-4">
          <ProfileTestResult result={profileTest} />
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-6">
        <h2 className="text-lg font-semibold">네이티브 시뮬레이터</h2>
        <p className="mt-1 text-sm leading-6 text-zinc-600">
          네이티브가 <code>window.WebBridge.receive</code>로 보낼 인바운드 메시지를 직접 주입합니다.
          (프로필 조회 성공을 보려면 아래에 <strong>유효한 accessToken</strong>을 입력하세요)
        </p>
        <label className="mt-4 block text-sm">
          <span className="text-zinc-500">accessToken</span>
          <input
            type="text"
            value={tokenInput}
            onChange={(event) => setTokenInput(event.target.value)}
            placeholder={DUMMY_ACCESS_TOKEN}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-xs text-zinc-800 outline-none focus:border-zinc-500"
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={injectLoginSuccess} className={secondaryButton}>
            AUTH_LOGIN_SUCCESS 주입
          </button>
          <button
            type="button"
            onClick={() => simulateInbound({ type: InboundMessageType.AUTH_LOGIN_CANCELLED })}
            className={secondaryButton}
          >
            AUTH_LOGIN_CANCELLED
          </button>
          <button
            type="button"
            onClick={() => simulateInbound({ type: InboundMessageType.AUTH_SESSION_EXPIRED })}
            className={secondaryButton}
          >
            AUTH_SESSION_EXPIRED
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">브릿지 이벤트 로그</h2>
        {events.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">아직 이벤트가 없습니다.</p>
        ) : (
          <ul className="mt-3 space-y-1 font-mono text-xs">
            {events.map((event) => (
              <li
                key={event.id}
                className="flex flex-wrap items-baseline gap-2 break-all"
              >
                <span className={event.direction === "out" ? "text-blue-600" : "text-emerald-600"}>
                  {event.direction === "out" ? "→ 네이티브" : "← 네이티브"}
                </span>
                <span className="text-zinc-400">{event.at}</span>
                <span className="font-semibold">{event.type}</span>
                {event.payload ? (
                  // payload(공백 없는 긴 JSON)는 전체 폭의 다음 줄로 내려 줄바꿈 → 가로 오버플로 방지
                  <span className="w-full text-zinc-500">
                    {JSON.stringify(event.payload)}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function ProfileTestResult({ result }: { result: ProfileTest }) {
  if (result.state === "idle") {
    return <p className="text-sm text-zinc-500">아직 호출하지 않았습니다.</p>;
  }

  if (result.state === "loading") {
    return <p className="text-sm text-zinc-500">호출 중…</p>;
  }

  if (result.state === "success") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
        <p className="font-semibold text-emerald-700">호출 성공 (200)</p>
        <dl className="mt-2 grid grid-cols-[6rem_1fr] gap-y-1">
          <dt className="text-zinc-500">닉네임</dt>
          <dd className="font-medium">{result.nickname}</dd>
          <dt className="text-zinc-500">snsProvider</dt>
          <dd className="font-medium">{result.snsProvider}</dd>
          <dt className="text-zinc-500">email</dt>
          <dd className="font-medium break-all">{result.email}</dd>
        </dl>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm">
      <p className="font-semibold text-red-700">
        호출 실패 ({result.statusCode || "ERR"})
      </p>
      <p className="mt-1 text-red-700">{result.message}</p>
      {result.statusCode === 401 ? (
        <p className="mt-2 text-xs text-red-600">
          → 로그인 후 다시 시도하세요. (시뮬레이터에서 유효 토큰으로 AUTH_LOGIN_SUCCESS 주입)
        </p>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }: { status: "loading" | "authenticated" | "anonymous" }) {
  const label =
    status === "authenticated" ? "로그인됨" : status === "anonymous" ? "비로그인" : "확인 중…";
  const tone =
    status === "authenticated"
      ? "bg-emerald-100 text-emerald-700"
      : status === "anonymous"
        ? "bg-zinc-200 text-zinc-700"
        : "bg-amber-100 text-amber-700";

  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>
      {label}
    </span>
  );
}

const primaryButton =
  "rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700";
const secondaryButton =
  "rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100";
