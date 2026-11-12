import type { CompetitionAlertSettings } from "@/features/competition/domain/competition-alert";
import type { CompetitionAlertRepository } from "@/features/competition/domain/competition-alert-repository";
import type { Envelope } from "@/features/competition/infrastructure/competition-dto";
import type { HttpClient } from "@/shared/lib/http";

/**
 * 관심 대회 알림 설정 API(notice-controller, backend#189 · 로그인).
 *
 * - GET /notice/setting → competitionEnabled · competitionNoticeAsked(다른 칸은 여기서 쓰지 않는다)
 * - PUT /notice/setting/competition { enabled } — 첫 관심 등록 시트의 답. false여도 asked만 true가 되고
 *   이미 켜 둔 설정을 끄지 않는다.
 * POST /notice/setting은 쓰지 않는다 — 보내지 않은 칸을 null로 덮는다.
 */
const NOTICE_SETTING_PATH = "/api/notice/setting";

type NoticeSettingDto = {
  competitionEnabled: boolean | null;
  competitionNoticeAsked: boolean | null;
};

export class ExternalCompetitionAlertRepository
  implements CompetitionAlertRepository
{
  constructor(private readonly httpClient: HttpClient) {}

  async getSettings(): Promise<CompetitionAlertSettings> {
    const response = await this.httpClient.get<Envelope<NoticeSettingDto>>({
      path: NOTICE_SETTING_PATH,
      cache: "no-store",
    });
    return {
      enabled: response.data.competitionEnabled ?? false,
      asked: response.data.competitionNoticeAsked ?? false,
    };
  }

  async answerPrompt(enabled: boolean): Promise<void> {
    await this.httpClient.put<Envelope<unknown>>({
      path: `${NOTICE_SETTING_PATH}/competition`,
      body: { enabled },
    });
  }
}
