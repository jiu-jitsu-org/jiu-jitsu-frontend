"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { useOpenInAppPrompt } from "@/shared/ui/open-in-app-prompt";
import { RelativeTime } from "@/shared/ui/relative-time";
import { SearchField } from "@/shared/ui/search-field";
import { ToastProvider, useToast, type ToastTone } from "@/shared/ui/toast";

/** motion.css의 공통 움직임 — 화면 전용(밸런스 캐릭터 등)은 빼고 여러 곳이 같이 쓰는 것만. */
const MOTIONS = [
  { cls: "motion-safe:animate-pop-in", name: "pop-in", spec: "400ms · spring-bouncy", use: "작은 표시가 톡 나타남" },
  { cls: "motion-safe:animate-dialog-in", name: "dialog-in", spec: "450ms · spring-bouncy", use: "대화상자 등장" },
  { cls: "motion-safe:animate-rise-in", name: "rise-in", spec: "280ms · smooth-out", use: "빈 화면이 아래에서 자리 잡음" },
  { cls: "motion-safe:animate-fade-in", name: "fade-in", spec: "200ms · ease-out", use: "오류 화면 등장" },
  { cls: "motion-safe:animate-overlay-in", name: "overlay-in", spec: "350ms · ease-out", use: "어두운 막이 깔림" },
] as const;

export function MotionDemo() {
  // 누를 때마다 key를 바꿔 요소를 새로 그려 애니메이션을 다시 튼다.
  const [turns, setTurns] = useState<Record<string, number>>({});

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {MOTIONS.map((motion) => (
        <button
          key={motion.name}
          type="button"
          onClick={() =>
            setTurns((prev) => ({
              ...prev,
              [motion.name]: (prev[motion.name] ?? 0) + 1,
            }))
          }
          className="flex flex-col items-start rounded-15 bg-surface-field-subtle p-3 text-left motion-safe:transition-colors motion-safe:duration-120 active:bg-surface-container-pressed"
        >
          <span className="flex h-16 w-full items-center justify-center">
            <span
              key={turns[motion.name] ?? 0}
              className={cn("size-10 rounded-10 bg-primary", motion.cls)}
            />
          </span>
          <span className="mt-2 font-mono text-label-m text-text-primary">
            animate-{motion.name}
          </span>
          <span className="text-label-m text-text-tertiary">{motion.spec}</span>
          <span className="text-label-m text-text-tertiary">{motion.use}</span>
        </button>
      ))}
    </div>
  );
}

const TOAST_SAMPLES = [
  { tone: "success", label: "완료", message: "게시글을 삭제했어요" },
  { tone: "info", label: "안내", message: "이 글의 알림을 받아요" },
  { tone: "warning", label: "주의", message: "사진은 최대 3장까지 첨부할 수 있어요" },
  { tone: "error", label: "실패", message: "게시글을 삭제하지 못했어요" },
] as const;

export function ToastDemo() {
  const toast = useToast();
  return (
    <div className="flex flex-wrap gap-2">
      {TOAST_SAMPLES.map((sample) => (
        <Button
          key={sample.tone}
          variant="neutral"
          size="m"
          onClick={() => toast.show(sample.message, { tone: sample.tone })}
        >
          {sample.label}
        </Button>
      ))}
      <Button
        variant="neutral"
        size="m"
        onClick={() =>
          toast.show("게시글을 숨겼어요", {
            tone: "success",
            action: { label: "되돌리기", onAction: () => {} },
          })
        }
      >
        되돌리기 버튼
      </Button>
    </div>
  );
}

export function EmptyStateDemo() {
  const toast = useToast();
  return (
    <EmptyState
      title="아직 글이 없어요"
      description="첫 글을 남겨 보세요"
      action={{ label: "다시 시도", onClick: () => toast.show("다시 불러왔어요", { tone: "success" }) }}
      className="py-6"
    />
  );
}

export function SearchFieldDemo() {
  const [value, setValue] = useState("");
  return (
    <div className="max-w-sm">
      <SearchField
        value={value}
        onValueChange={setValue}
        placeholder="대회 이름으로 찾기"
        aria-label="검색어"
      />
    </div>
  );
}

/* ───────── 문서용 실물 견본(2026-11 문서 개편) ───────── */

/**
 * 토스트 판 — 진짜 ToastProvider를 판 안에 하나 더 두고 그 안에서 띄운다.
 * 판에 transform을 걸면 토스트의 `fixed`가 화면 대신 이 판을 기준으로 잡혀, 문서 안에 제자리로 놓인다.
 * 판이 화면에 들어올 때 한 번 뜨고, 판을 누르면 다시 뜬다(토스트는 2초 · 버튼이 있으면 5초 뒤 사라진다).
 */
export function ToastStage({
  message,
  tone,
  actionLabel,
  marks,
  className,
}: {
  message: string;
  tone: ToastTone;
  actionLabel?: string;
  /** 판 위에 얹는 해부도 번호. */
  marks?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative h-36 w-full overflow-hidden rounded-20 bg-surface-field-subtle [transform:translateZ(0)]",
        className,
      )}
    >
      <ToastProvider>
        <ToastAutoShow message={message} tone={tone} actionLabel={actionLabel} />
      </ToastProvider>
      {marks}
    </div>
  );
}

function ToastAutoShow({
  message,
  tone,
  actionLabel,
}: {
  message: string;
  tone: ToastTone;
  actionLabel?: string;
}) {
  const toast = useToast();
  const ref = useRef<HTMLButtonElement>(null);

  const fire = useCallback(() => {
    toast.show(message, {
      tone,
      action: actionLabel ? { label: actionLabel, onAction: () => {} } : undefined,
    });
  }, [toast, message, tone, actionLabel]);

  // 띄우면 토스트 상태가 바뀌어 fire도 새로 만들어진다 — 관찰은 한 번만 걸고 최신 fire를 ref로 부른다.
  const fireRef = useRef(fire);
  useEffect(() => {
    fireRef.current = fire;
  }, [fire]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // 문서가 열려 판이 보이게 될 때 띄운다 — 숨은 문서에서 미리 떠 버리면 볼 때는 이미 사라져 있다.
    let visible = false;
    const observer = new IntersectionObserver((entries) => {
      const now = entries.some((entry) => entry.isIntersecting);
      if (now && !visible) fireRef.current();
      visible = now;
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <button
      ref={ref}
      type="button"
      onClick={fire}
      className="absolute inset-0 flex items-start justify-center pt-4 text-label-m text-text-tertiary"
    >
      눌러서 다시 띄우기
    </button>
  );
}

/** 검색칸 상태 견본 — 빈 칸 · 글자 있음은 실제로 입력 가능한 칸이다. */
export function SearchFieldSample({
  initial = "",
  placeholder = "대회 이름으로 찾기",
  className,
}: {
  initial?: string;
  placeholder?: string;
  className?: string;
}) {
  const [value, setValue] = useState(initial);
  return (
    <SearchField
      value={value}
      onValueChange={setValue}
      placeholder={placeholder}
      aria-label="검색어"
      className={className}
    />
  );
}

/** '앱에서 보기' 안내 — 루트의 진짜 OpenInAppPromptProvider로 띄운다. */
export function OpenInAppPromptDemo() {
  const { prompt } = useOpenInAppPrompt();
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="neutral" onClick={() => prompt()}>
        기본 문구로 띄우기
      </Button>
      <Button
        variant="neutral"
        onClick={() => prompt({ message: "댓글은 OSS 앱에서 로그인 후 남길 수 있어요." })}
      >
        문구 바꿔 띄우기
      </Button>
    </div>
  );
}

/** 상대 시간 견본 — 지금 시각에서 뺀 ISO를 그린다(서버 시계가 없으면 기기 시계). */
export function RelativeTimeSamples() {
  // 서버와 브라우저의 '지금'이 달라 그린 뒤에 정한다(같은 값으로 그려야 화면이 어긋나지 않는다).
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
  }, []);
  const samples = [
    { label: "40초 전", ms: 40_000 },
    { label: "3분 전", ms: 3 * 60_000 },
    { label: "5시간 전", ms: 5 * 3_600_000 },
    { label: "3일 전", ms: 3 * 86_400_000 },
    { label: "40일 전", ms: 40 * 86_400_000 },
  ];
  return (
    <ul className="flex flex-col gap-2">
      {samples.map((sample) => (
        <li key={sample.label} className="flex items-center gap-4">
          <span className="w-24 text-label-m text-text-tertiary">{sample.label}에 쓴 글</span>
          {now === null ? null : (
            <RelativeTime
              iso={new Date(now - sample.ms).toISOString()}
              className="text-label-m text-text-secondary"
            />
          )}
        </li>
      ))}
    </ul>
  );
}
