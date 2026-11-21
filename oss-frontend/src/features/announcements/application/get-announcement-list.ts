import type { AnnouncementPage } from "@/features/announcements/domain/announcement";
import type { AnnouncementRepository } from "@/features/announcements/domain/announcement-repository";

/** 공지 목록 한 페이지(#509). 로그인 없이 볼 수 있다. */
export class GetAnnouncementListUseCase {
  constructor(private readonly announcementRepository: AnnouncementRepository) {}

  execute(page: number): Promise<AnnouncementPage> {
    return this.announcementRepository.getAnnouncements(page);
  }
}
