import { IconBase, type IconProps } from "@/shared/ui/icons";

/** 접수 단계 — 기본(탭·제목용 클립보드) · 접수 전 · 접수 중 · 접수 완료(내가 신청함) · 접수 종료. */
export type RegistrationStage = "base" | "before" | "open" | "done" | "closed";

/**
 * 접수 아이콘 — 클립보드 한 장, 가운데 표시만 단계에 따라 바뀐다(2026-11 시안 ① 점 계열).
 *
 * 접수 전은 점 하나만 진하고 둘은 옅게(●○○), 접수 중은 점 셋(●●●) — 차오르는 흐름으로 이어진다.
 * 끝난 건 체크(완료)·가로줄(종료). 체크 클립보드는 '끝남'으로 읽혀서 접수 중에는 쓰지 않는다.
 * 앱 아이콘 규격(24 칸 · 선 2 · 둥근 끝)이고 색은 부모 글자색을 따른다.
 */
export function RegistrationIcon({
  stage,
  ...props
}: IconProps & { stage: RegistrationStage }) {
  return (
    <IconBase
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <rect x="9" y="2.5" width="6" height="3.5" rx="1" />
      {stage === "base" ? <path d="M9 11h6M9 15h4" /> : null}
      {stage === "before" ? (
        <>
          <path d="M8.75 13.5h.01" strokeWidth={2.6} />
          <path
            d="M12 13.5h.01M15.25 13.5h.01"
            strokeWidth={2.6}
            strokeOpacity={0.3}
          />
        </>
      ) : null}
      {stage === "open" ? (
        <path d="M8.75 13.5h.01M12 13.5h.01M15.25 13.5h.01" strokeWidth={2.6} />
      ) : null}
      {stage === "done" ? <path d="M9 13.5l2 2 4-4" /> : null}
      {stage === "closed" ? <path d="M9 13.5h6" /> : null}
    </IconBase>
  );
}

/**
 * 브랜드 불꽃 — '관심 많은 대회' 표시(2026-11 시안 ② 속불 불꽃).
 *
 * 앱 아이콘의 통통한 'OSS' 글자처럼 끝을 다 둥글린 몸통에 속불을 뚫어 둔다. 속불은 색을 칠하지 않고
 * 구멍(evenodd)이라 놓인 바탕색이 비친다 — 흰 칩 위에서 흰 속불이 되고, 색을 따로 박지 않는다.
 */
export function FlameIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M12 22a7.5 7.5 0 0 1-7.5-7.5c0-2.4 1-4.3 2.3-5.6a.9.9 0 0 1 1.5.4c.3 1.1.8 1.9 1.6 2.4-.1-3.4.6-6.1 2-8.5a.9.9 0 0 1 1.6 0c1.2 2.1 2.7 3.6 4 5 1.5 1.7 2.5 3.8 2.5 6.3A7.5 7.5 0 0 1 12 22Zm.2-2a3 3 0 0 1-3-3c0-1.5 1-2.5 2-3.6.4-.5.7-1 .9-1.6 1 1.2 3.1 2.9 3.1 5.2a3 3 0 0 1-3 3Z"
      />
    </IconBase>
  );
}
