import { toKstDateKey } from "@/shared/lib/time";

/**
 * 공지사항 (#509, 서버 backend#274). 알림(community/notifications)과 다른 것 — 모두에게 같은 글.
 *
 * 날짜(`publishedAt`)는 infrastructure가 KST 오프셋을 붙인 ISO로 넘긴다(`toKstIso`).
 */
export type AnnouncementSummary = {
  id: number;
  title: string;
  publishedAt: string;
};

export type AnnouncementDetail = AnnouncementSummary & {
  /** 평문. 줄바꿈 그대로, 주소는 화면이 링크로 만든다 */
  body: string;
};

export type AnnouncementPage = {
  announcements: AnnouncementSummary[];
  /** 0부터 */
  page: number;
  hasNext: boolean;
};

/** 한 번에 받는 공지 수 — 서버 기본값과 같다 */
export const ANNOUNCEMENT_PAGE_SIZE = 20;

/** 주소의 공지 id. 숫자가 아니면 null(→ 404) */
export function parseAnnouncementId(value: string): number | null {
  if (!/^\d{1,15}$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** 주소의 `?page=`. 없거나 숫자가 아니면 첫 페이지 */
export function parseAnnouncementPage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^\d{1,6}$/.test(raw)) return 0;
  return Number(raw);
}

/** 게시 날짜 "2026.11.20" (한국 날짜) */
export function formatAnnouncementDate(publishedAt: string): string {
  const epochMs = Date.parse(publishedAt);
  if (Number.isNaN(epochMs)) return "";
  return toKstDateKey(epochMs).replaceAll("-", ".");
}
