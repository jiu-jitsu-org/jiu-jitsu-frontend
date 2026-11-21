import type {
  AnnouncementDetail,
  AnnouncementPage,
} from "@/features/announcements/domain/announcement";

export interface AnnouncementRepository {
  getAnnouncements(page: number): Promise<AnnouncementPage>;
  /** 없거나 아직 게시 전이면 null */
  getAnnouncement(id: number): Promise<AnnouncementDetail | null>;
}
