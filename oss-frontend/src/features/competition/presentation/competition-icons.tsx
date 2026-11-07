import { useId } from "react";

import { IconBase, type IconProps } from "@/shared/ui/icons";

/** 접수 단계 — 접수 전 · 접수 중 · 접수 마감. */
export type RegistrationStage = "before" | "open" | "closed";

/**
 * 접수 상태 아이콘 (2026-11 시안 — 상태 배지처럼 '색 원 + 흰 기호').
 *
 * 접수 전은 아직 열리지 않았다는 뜻의 점선 원, 접수 중은 꽉 찬 원에 시계(마감까지 시간이 흐르는 중 — 옆 D-n과 짝),
 * 마감은 꽉 찬 원에 ×(닫힘). 기호는 원을 도려내 칩 바탕이 비치게 해 흰 글자색을 따로 정하지 않는다.
 * 16 칸에서도 뭉개지지 않게 기호 선은 2.4로 굵게 둔다. 색은 부모 글자색을 따른다.
 */
export function RegistrationIcon({
  stage,
  ...props
}: IconProps & { stage: RegistrationStage }) {
  const maskId = useId();
  if (stage === "before") {
    return (
      <IconBase {...props}>
        <circle
          cx="12"
          cy="12"
          r="8.25"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray="3.6 3.6"
        />
      </IconBase>
    );
  }
  return (
    <IconBase {...props}>
      <mask id={maskId}>
        <rect width="24" height="24" fill="white" />
        <path
          d={stage === "open" ? "M12 7.2V12l3.2 2" : "M9 9l6 6m0-6l-6 6"}
          stroke="black"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </mask>
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="currentColor"
        mask={`url(#${maskId})`}
      />
    </IconBase>
  );
}

/**
 * 브랜드 불꽃 — '관심 많은 대회(HOT)' 표시(2026-11 시안 ② 속불 불꽃).
 *
 * 앱 아이콘의 통통한 'OSS' 글자처럼 끝을 다 둥글린 빨강 몸통 안에 노랑 속불을 둔다.
 * 색은 아이콘이 직접 정한다(바깥 error 빨강 · 속불 icon/flame-core 노랑) — 어디에 놓여도 같은 불꽃이다.
 */
export function FlameIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        className="fill-error"
        d="M12 22a7.5 7.5 0 0 1-7.5-7.5c0-2.4 1-4.3 2.3-5.6a.9.9 0 0 1 1.5.4c.3 1.1.8 1.9 1.6 2.4-.1-3.4.6-6.1 2-8.5a.9.9 0 0 1 1.6 0c1.2 2.1 2.7 3.6 4 5 1.5 1.7 2.5 3.8 2.5 6.3A7.5 7.5 0 0 1 12 22Z"
      />
      <path
        className="fill-icon-flame-core"
        d="M12.1 20.6a3.7 3.7 0 0 1-3.7-3.7c0-1.85 1.25-3.1 2.5-4.45.5-.6.9-1.25 1.15-2 1.25 1.5 3.75 3.6 3.75 6.45a3.7 3.7 0 0 1-3.7 3.7Z"
      />
    </IconBase>
  );
}
