import type { CompetitionListPageData } from "@/features/competition/application/get-competition-list-page-data";
import { FeedErrorState } from "@/features/community/presentation/feed-error-state";
import { CompetitionAlertProvider } from "@/features/competition/presentation/competition-alert-provider";
import { CompetitionListView } from "@/features/competition/presentation/competition-list-view";
import { EmptyState } from "@/shared/ui/empty-state";

/**
 * 대회 탭 첫 화면 — 위 필터 줄 (#334) + 월별 묶음 대회 목록 (#332·#333).
 *
 * 앱 하단 탭이 웹뷰로 띄우는 화면이다. 위 헤더와 아래 탭 바는 앱 쪽에 있어 웹은 안전 영역 여백을
 * 따로 두지 않는다(홈 피드와 같은 기준). 실패·예정 대회 없음은 여기서 서버로 그리고, 대회가 있으면
 * 거르기를 하는 CompetitionListView(클라이언트)에 넘긴다 — 걸러 낼 대회가 없으면 필터 줄도 두지 않는다.
 */
export function CompetitionListPage({
  data,
}: {
  data: CompetitionListPageData;
}) {
  return (
    // 홈 피드처럼 맨 위에서 당기면 앱의 당겨서 새로고침이 걸리게 바운스를 연다(feed-bounce-scroll, globals.css).
    <main className="feed-bounce-scroll relative min-h-screen bg-surface-container">
      {renderBody(data)}
    </main>
  );
}

function renderBody(data: CompetitionListPageData) {
  // 불러오기 실패는 홈 피드와 같은 화면(안내 + 재시도)을 쓴다 — 탭마다 실패 모양이 다르지 않게.
  if (!data.ok) return <FeedErrorState />;
  if (data.list.items.length === 0) {
    return (
      <EmptyState
        title="예정된 대회가 없어요"
        description="새 대회가 올라오면 여기에 보여 드릴게요"
        className="pt-[35vh]"
      />
    );
  }
  return (
    // 처음 관심 등록하면 마감 알림을 받을지 묻는 시트(#375)를 이 아래 어디서든 띄운다.
    <CompetitionAlertProvider settings={data.alertSettings} today={data.today}>
      <CompetitionListView
        list={data.list}
        currentYear={data.currentYear}
        today={data.today}
        interestedUpcoming={data.interestedUpcoming}
        myBeltRank={data.myBeltRank}
        endedInterested={data.endedInterested}
      />
    </CompetitionAlertProvider>
  );
}
