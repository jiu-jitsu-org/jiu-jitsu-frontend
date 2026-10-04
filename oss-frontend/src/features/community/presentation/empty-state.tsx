import { cn } from "@/shared/lib/cn";

/**
 * 빈 상태 공통 표현 — 제목 + (설명) + (버튼).
 *
 * 메인 피드(FeedEmptyState)와 내 커뮤니티 활동이 같은 모양을 쓴다. 세로 위치는 화면마다 달라
 * (피드는 뷰포트 35%, 활동 화면은 탭 아래 96) 호출부가 className으로 정한다.
 * 버튼 동작(onClick)을 넘기는 호출부는 클라이언트 컴포넌트여야 한다 — 이 컴포넌트는 상태가 없어
 * 서버 · 클라이언트 어디서든 그릴 수 있다.
 * 색상은 empty-state / button-neutral 토큰만 사용한다(하드코딩 색상 없음).
 */
export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 text-center", className)}>
      {/* 제목: Body M(16 Medium) */}
      <p className="text-body-m text-empty-state-default-title-text">{title}</p>
      {description ? (
        // 부제목: Body S(14 Medium), 제목과 간격 4
        <p className="mt-1 text-body-s text-empty-state-default-description-text">
          {description}
        </p>
      ) : null}
      {action ? (
        // 버튼: 재시도 버튼과 동일한 neutral 규격(38/rounded 10/px16), 부제목과 간격 13
        <button
          type="button"
          onClick={action.onClick}
          className="mt-[13px] h-[38px] rounded-[10px] bg-button-neutral-default-bg px-4 text-button-m text-button-neutral-default-text"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}
