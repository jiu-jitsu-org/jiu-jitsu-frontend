import { BellIcon } from "@/shared/ui/icons";

/**
 * 알림함 빈 화면 — 종 아이콘 + 안내 두 줄.
 *
 * 공용 EmptyState(제목 Body M)를 쓰지 않는 이유: 디자인이 아이콘을 얹고 제목도 한 단계 크다.
 * 세로 위치는 뷰포트 30% 지점(눈대중 — 상세 스펙 수령 후 맞춘다).
 */
export function InboxEmptyState() {
  return (
    <div className="flex flex-col items-center px-6 pt-[30vh] text-center">
      <span className="inline-flex size-16 items-center justify-center rounded-2xl bg-primary-faint text-primary">
        <BellIcon size={28} />
      </span>
      <p className="mt-4 text-title-3 font-semibold text-text-primary">
        아직 받은 알림이 없어요
      </p>
      <p className="mt-1 text-body-s text-text-secondary">
        새로운 댓글이나 대댓글이 달리면
        <br />
        여기에서 알려드릴게요
      </p>
    </div>
  );
}
