import { BellIcon } from "@/shared/ui/icons";

/**
 * 알림함 빈 화면 — 종 아이콘 + 안내 두 줄.
 *
 * 공용 EmptyState(제목 Body M)를 쓰지 않는 이유: 디자인이 아이콘을 얹고 제목도 한 단계 크다.
 * 세로 위치는 뷰포트 30% 지점(디자인 확인 — 유지).
 *
 * 아이콘 박스 배경 #E5F4FF는 디자인 지정값이다 — 대응 토큰이 없다(가장 가까운 Blue/50은 #E6F5FF).
 * 종 아이콘: 디자인 SVG(32)는 BellIcon(24)을 그대로 키운 모양 · 선 두께라 BellIcon을 32로 쓴다.
 */
export function InboxEmptyState() {
  return (
    <div className="flex flex-col items-center px-4 pt-[30vh] text-center">
      <span className="inline-flex size-16 items-center justify-center rounded-[20px] bg-[#E5F4FF] text-interactive-primary">
        <BellIcon size={32} />
      </span>
      <p className="mt-5 text-title-3 font-semibold text-text-primary">
        아직 받은 알림이 없어요
      </p>
      <p className="mt-2 text-body-s font-normal text-text-secondary">
        새로운 댓글이나 대댓글이 달리면
        <br />
        여기에서 알려드릴게요
      </p>
    </div>
  );
}
