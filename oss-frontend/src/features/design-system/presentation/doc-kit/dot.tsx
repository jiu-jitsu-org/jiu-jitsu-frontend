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
 * withName이면 옆에 토큰 이름 · hex를 한 줄로 붙인다.
 * hexOnly면 hex만 보이고 이름은 손을 올리면 보인다 — 칸이 좁은 표(variant × 상태)에서
 * 긴 이름이 줄을 깨지 않게. AI용 복사에는 이름까지 들어가게 안 보이는 글로 함께 둔다.
 */
export function Dot({
  token,
  raw,
  withName = false,
  hexOnly = false,
  className,
}: {
  token: string;
  /** 토큰 변수 없이 값을 그대로 쓴 자리(임시 색). 있으면 이 값으로 칠하고 hex 자리에 적는다. */
  raw?: string;
  withName?: boolean;
  hexOnly?: boolean;
  className?: string;
}) {
  const swatch = (
    <span
      aria-hidden
      className={cn(
        "inline-block size-4 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]",
        className,
      )}
      style={{ background: raw ?? `var(--${token})` }}
    />
  );
  const hex = raw ?? tokenHex(token) ?? "—";
  if (hexOnly) {
    return (
      <span className="relative flex min-w-0 items-center gap-2" title={token}>
        {swatch}
        <span className="font-mono text-label-m text-text-secondary tabular-nums">{hex}</span>
        <span className="sr-only">{token}</span>
      </span>
    );
  }
  if (!withName) return swatch;
  return (
    <span className="flex min-w-0 items-center gap-2" title={`${token} · ${hex}`}>
      {swatch}
      <span className="min-w-0 truncate font-mono text-label-m text-text-primary">{token}</span>
      <span className="shrink-0 font-mono text-label-m text-text-tertiary">{hex}</span>
    </span>
  );
}
