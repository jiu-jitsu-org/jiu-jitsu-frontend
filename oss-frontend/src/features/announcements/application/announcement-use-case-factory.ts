import { GetAnnouncementDetailUseCase } from "@/features/announcements/application/get-announcement-detail";
import { GetAnnouncementListUseCase } from "@/features/announcements/application/get-announcement-list";
import { ExternalAnnouncementRepository } from "@/features/announcements/infrastructure/external-announcement-repository";
import { createServerHttpClient } from "@/shared/lib/http/create-server-http-client";

/** 공지 feature 의존성 조립 — 공지는 누구에게나 같아 토큰 없이 읽는다(backend#274). */
function createRepository(): ExternalAnnouncementRepository {
  return new ExternalAnnouncementRepository(createServerHttpClient());
}

export function createGetAnnouncementListUseCase(): GetAnnouncementListUseCase {
  return new GetAnnouncementListUseCase(createRepository());
}

export function createGetAnnouncementDetailUseCase(): GetAnnouncementDetailUseCase {
  return new GetAnnouncementDetailUseCase(createRepository());
}
