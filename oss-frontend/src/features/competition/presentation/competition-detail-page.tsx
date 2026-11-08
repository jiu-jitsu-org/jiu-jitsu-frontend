import type { CompetitionDetailPageData } from "@/features/competition/application/get-competition-detail-page-data";
import { DetailErrorState } from "@/features/community/presentation/detail-error-state";
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
 * 앱에서는 대회 탭이 풀스크린 서브뷰로 띄운다 — 앱바(뒤로 가기·공유)는 웹이 그린다(게시글 상세와 같은 기준).
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
  return (
    <SubviewScrollShell className="bg-surface-container">
      <CompetitionDetailHeader />
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
          competitionId={competition.id}
          name={competition.name}
          status={status}
          currentYear={currentYear}
          interested={data.interested}
          interestCount={data.interestCount}
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
        <CompetitionFeeSection fees={data.fees} currentYear={currentYear} />
        <CompetitionInfoBasis
          competitionId={competition.id}
          verifiedOn={competition.verifiedOn}
        />
        {data.stories ? <CompetitionStories stories={data.stories} /> : null}
      </div>
    </SubviewScrollShell>
  );
}
