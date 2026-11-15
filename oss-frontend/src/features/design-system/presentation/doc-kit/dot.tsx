import {
  componentTokens,
  primitiveTokens,
  semanticTokens,
} from "@/app/styles/tokens/manifest";
import { cn } from "@/shared/lib/cn";

const ALL_TOKENS = [...primitiveTokens, ...semanticTokens, ...componentTokens];

/** 토큰 이름 → 최종 색값(hex). 생성된 manifest에서 읽는다. */
export function tokenHex(name: string): string | null {
  return ALL_TOKENS.find((token) => token.name === name)?.hex ?? null;
}

/**
 * 색 점 — 토큰 CSS 변수를 그대로 칠한다(값을 옮겨 적지 않는다).
 * 흰 계열도 보이게 테두리 대신 아주 옅은 안쪽 그림자를 깐다.
 * withName이면 옆에 토큰 이름과 hex를 붙인다.
 */
export function Dot({
  token,
  raw,
  withName = false,
  className,
}: {
  token: string;
  /** 토큰 변수 없이 값을 그대로 쓴 자리(임시 색). 있으면 이 값으로 칠하고 hex 자리에 적는다. */
  raw?: string;
  withName?: boolean;
  className?: string;
}) {
  const swatch = (
    <span
      aria-hidden
      className={cn(
        "mt-px inline-block size-4 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]",
        className,
      )}
      style={{ background: raw ?? `var(--${token})` }}
    />
  );
  if (!withName) return swatch;
  return (
    <span className="flex min-w-0 items-start gap-2">
      {swatch}
      <span className="min-w-0 flex-1">
        {/* 긴 부품 토큰 이름도 잘리거나 옆 칸과 겹치지 않게 줄을 바꾼다. */}
        <span className="block font-mono text-label-m break-all text-text-primary">
          {token}
        </span>
        <span className="block font-mono text-label-m text-text-tertiary">
          {raw ?? tokenHex(token) ?? "—"}
        </span>
      </span>
    </span>
  );
}
