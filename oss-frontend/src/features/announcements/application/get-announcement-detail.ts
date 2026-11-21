import type { AnnouncementDetail } from "@/features/announcements/domain/announcement";
import type { AnnouncementRepository } from "@/features/announcements/domain/announcement-repository";

/** 공지 하나(#509). 없거나 게시 전이면 null. */
export class GetAnnouncementDetailUseCase {
  constructor(private readonly announcementRepository: AnnouncementRepository) {}

  execute(id: number): Promise<AnnouncementDetail | null> {
    return this.announcementRepository.getAnnouncement(id);
  }
}
