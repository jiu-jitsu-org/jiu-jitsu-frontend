import {
  ANNOUNCEMENT_PAGE_SIZE,
  type AnnouncementDetail,
  type AnnouncementPage,
} from "@/features/announcements/domain/announcement";
import type { AnnouncementRepository } from "@/features/announcements/domain/announcement-repository";
import { toApiError, type HttpClient } from "@/shared/lib/http";
import { toKstIso } from "@/shared/lib/time";

/**
 * 공지 API(announcement-controller, backend#274) infrastructure 구현. 둘 다 비로그인.
 *
 * - GET /announcements?page&size   Spring Page, 게시 시각 최신순 고정(sort 무시)
 * - GET /announcements/{id}        없거나 게시 전(게시 시각 없음 · 미래) 404 C0015
 *
 * 예약 공지가 정해진 시각에 보이도록 요청마다 받는다(no-store).
 */
const ANNOUNCEMENTS_PATH = "/api/announcements";
const ANNOUNCEMENT_NOT_FOUND_CODE = "C0015";

type Envelope<T> = { success: boolean; code: string; message: string; data: T };

type AnnouncementListItemDto = {
  announcementId: number;
  title: string;
  publishedAt: string;
};

type AnnouncementDetailDto = AnnouncementListItemDto & { body: string };

type AnnouncementPageDto = {
  content: AnnouncementListItemDto[] | null;
  number: number;
  last: boolean;
};

export class ExternalAnnouncementRepository implements AnnouncementRepository {
  constructor(private readonly httpClient: HttpClient) {}

  async getAnnouncements(page: number): Promise<AnnouncementPage> {
    const response = await this.httpClient.get<Envelope<AnnouncementPageDto>>({
      path: ANNOUNCEMENTS_PATH,
      query: { page, size: ANNOUNCEMENT_PAGE_SIZE },
      cache: "no-store",
    });
    const data = response.data;
    return {
      announcements: (data.content ?? []).map((item) => ({
        id: item.announcementId,
        title: item.title,
        publishedAt: toKstIso(item.publishedAt),
      })),
      page: data.number,
      hasNext: !data.last,
    };
  }

  async getAnnouncement(id: number): Promise<AnnouncementDetail | null> {
    try {
      const response = await this.httpClient.get<
        Envelope<AnnouncementDetailDto>
      >({ path: `${ANNOUNCEMENTS_PATH}/${id}`, cache: "no-store" });
      const data = response.data;
      return {
        id: data.announcementId,
        title: data.title,
        body: data.body,
        publishedAt: toKstIso(data.publishedAt),
      };
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.code === ANNOUNCEMENT_NOT_FOUND_CODE) return null;
      throw apiError;
    }
  }
}
