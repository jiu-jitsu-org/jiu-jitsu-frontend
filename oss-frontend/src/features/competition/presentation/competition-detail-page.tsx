import type { CompetitionDetailPageData } from "@/features/competition/application/get-competition-detail-page-data";
import { DetailErrorState } from "@/features/community/presentation/detail-error-state";
import { canReceiveDeadlineAlerts } from "@/features/competition/domain/competition-alert";
import { CompetitionAlertProvider } from "@/features/competition/presentation/competition-alert-provider";
import { CompetitionDetailInterestProvider } from "@/features/competition/presentation/competition-detail-interest";
import { CompetitionDetailHeader } from "@/features/competition/presentation/competition-detail-header";
import {
  CompetitionFeeSection,
  CompetitionInfoSection,
} from "@/features/competition/presentation/competition-detail-sections";
import { CompetitionScheduleSection } from "@/features/competition/presentation/competition-detail-schedule";
import { CompetitionDetailSummary } from "@/features/competition/presentation/competition-detail-summary";
import { CompetitionInfoBasis } from "@/features/competition/presentation/competition-info-basis";
import { CompetitionResultBanner } from "@/features/competition/presentation/competition-result-banner";
import { CompetitionStories } from "@/features/competition/presentation/competition-stories";
import { SubviewScrollShell } from "@/features/community/presentation/subview-scroll-shell";

/**
 * 대회 상세 (#361~#369).
 *
 * 위에서부터: (끝난 대회면 결과 남기기 배너) → 상태 · 이름 · 조회수 · 관심 → 기본 정보 → 일정 → 참가비 → 정보 기준 → 대회 이야기.
 * 앱에서는 대회 탭이 풀스크린 서브뷰로 띄운다 — 앱바(뒤로 가기·이 대회 알림·공유)는 웹이 그린다(게시글 상세와 같은 기준).
 * 이 대회 알림 종(#376)은 더 올 마감 알림이 있는 대회에만 둔다 — 접수가 끝났거나 끝난 대회는 받을 알림이 없다.
 * 앱은 서브뷰의 문서 스크롤을 0으로 묶으므로(#200) 문서 대신 SubviewScrollShell이 스크롤한다.
 */
export function CompetitionDetailPage({
  data,
}: {
  data: Exclude<CompetitionDetailPageData, { ok: false; reason: "not-found" }>;
}) {
  if (!data.ok) {
    return (
      <SubviewScrollShell className="bg-surface-container">
        <CompetitionDetailHeader />
        <DetailErrorState title="대회 정보를 불러오지 못했어요" />
      </SubviewScrollShell>
    );
  }

  const { competition, status, currentYear } = data;
  const target = {
    id: competition.id,
    name: competition.name,
    registration: competition.registration,
  };
  const alertable =
    status?.kind !== "ended" &&
    status?.kind !== "today" &&
    canReceiveDeadlineAlerts(competition.registration, data.today);

  return (
    <CompetitionAlertProvider settings={data.alertSettings} today={data.today}>
      <CompetitionDetailInterestProvider
        competitionId={competition.id}
        interested={data.interested}
        interestCount={data.interestCount}
      >
        <SubviewScrollShell className="bg-surface-container">
          <CompetitionDetailHeader
            alertTarget={alertable ? target : undefined}
            // 관심이 없던 대회는 관심을 새로 등록하면 알림이 켜진 채로 생긴다.
            noticeEnabled={
              data.interested ? (competition.noticeEnabled ?? false) : true
            }
          />
          <div className="pb-[calc(env(safe-area-inset-bottom)+40px)]">
            {data.promptResult && status?.kind === "ended" ? (
              <CompetitionResultBanner
                competitionId={competition.id}
                name={competition.name}
                year={Number(competition.date.slice(0, 4))}
                daysAgo={status.daysAgo}
              />
            ) : null}
            <CompetitionDetailSummary
              target={target}
              status={status}
              currentYear={currentYear}
              viewCount={data.viewCount}
            />
            <CompetitionInfoSection
              competition={competition}
              currentYear={currentYear}
            />
            <CompetitionScheduleSection
              items={data.schedule}
              currentYear={currentYear}
            />
            <CompetitionFeeSection
              fees={data.fees}
              feeNote={competition.feeNote}
              currentYear={currentYear}
            />
            <CompetitionInfoBasis
              competitionId={competition.id}
              verifiedOn={competition.verifiedOn}
            />
            {data.stories ? (
              <CompetitionStories
                competitionId={competition.id}
                stories={data.stories}
              />
            ) : null}
          </div>
        </SubviewScrollShell>
      </CompetitionDetailInterestProvider>
    </CompetitionAlertProvider>
  );
}
