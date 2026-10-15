"use client";

import { useState } from "react";

/**
 * 자리마다 굴러 올라가는 숫자 — 남은 시간 배지용.
 *
 * 바뀐 자리만 옛 숫자가 위로 빠지고(260ms) 새 숫자가 아래에서 출렁이며 올라온다(500ms 스프링).
 * 마운트 때는 움직이지 않는다. 자릿수가 바뀌면(10→9) 오른쪽 끝을 기준으로 자리를 맞춘다.
 */
export function RollingNumber({
  value,
  className,
}: {
  value: string | number;
  className?: string;
}) {
  const digits = String(value).split("");

  return (
    <span className={className}>
      {digits.map((digit, index) => (
        <RollingDigit
          key={digits.length - index}
          digit={digit}
        />
      ))}
    </span>
  );
}

function RollingDigit({ digit }: { digit: string }) {
  const [current, setCurrent] = useState(digit);
  const [previous, setPrevious] = useState<string | null>(null);
  // 바뀔 때마다 1씩 — 두 숫자의 key로 써서 같은 숫자 쌍이 다시 와도 모션을 처음부터 재생한다.
  const [turn, setTurn] = useState(0);
  if (current !== digit) {
    setPrevious(current);
    setCurrent(digit);
    setTurn((n) => n + 1);
  }

  return (
    // 보이지 않는 숫자가 칸의 폭·높이를 잡고, 실제 숫자들은 그 위에 겹쳐 칸 밖은 잘린다.
    // align-top: overflow-hidden인 inline-block은 기준선이 아래 끝으로 내려가 숫자가 글자보다 떠 보인다.
    <span className="relative inline-block overflow-hidden align-top">
      <span className="invisible">{current}</span>
      {previous !== null ? (
        <span
          key={`out-${turn}`}
          aria-hidden
          className="absolute inset-0 motion-safe:animate-digit-roll-out motion-reduce:hidden"
        >
          {previous}
        </span>
      ) : null}
      <span
        key={`in-${turn}`}
        className={
          turn > 0
            ? "absolute inset-0 motion-safe:animate-digit-roll-in"
            : "absolute inset-0"
        }
      >
        {current}
      </span>
    </span>
  );
}
