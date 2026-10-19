import type {
  InboxNotification,
  InboxNotificationTarget,
  InboxNotificationType,
} from "@/features/community/domain/inbox-notification";
import type { InboxNotificationRepository } from "@/features/community/domain/inbox-notification-repository";
import type { HttpClient } from "@/shared/lib/http";
import { toKstIso } from "@/shared/lib/time";

/**
 * 업스트림 알림함 API(notice-controller) infrastructure 구현 (#187).
 *
 * Swagger 확정 계약:
 * - GET /notice      → NoticeListResponse[] (최신순, 페이지네이션 없음)
 * - PUT /notice/{id} → true (개별 읽음)
 * - PUT /notice      → true (모두 읽음)
 *
 * 응답은 서버 공통 래퍼(ApiResponseWrapperAdvice)로 봉투에 싸여 온다. Swagger 예시는 봉투를 뺀 모양이다.
 * createdAt은 LocalDateTime(타임존 없는 KST)이라 toKstIso로 정규화한다.
 */
const NOTICE_ENDPOINT_PATH = "/api/notice";

type Envelope<T> = {
  success: boolean;
  code: string;
  message: string;
  data: T;
};

type NoticeListItemDto = {
  id: number;
  title: string | null;
  body: string | null;
  pushType: string | null;
  actionType: string | null;
  data: string | null;
  isRead: boolean | null;
  createdAt: string;
};

const KNOWN_TYPES: readonly InboxNotificationType[] = [
  "NEW_COMMENTS",
  "NEW_CHILD_COMMENTS",
  "CONTENTS_LIKE",
  "COMMENTS_LIKE",
];

export class ExternalInboxNotificationRepository implements InboxNotificationRepository {
  constructor(private readonly httpClient: HttpClient) {}

  async getList(): Promise<InboxNotification[]> {
    const response = await this.httpClient.get<
      Envelope<NoticeListItemDto[] | null>
    >({ path: NOTICE_ENDPOINT_PATH });

    return (response.data ?? []).map(toInboxNotification);
  }

  async markRead(id: number): Promise<void> {
    await this.httpClient.put<Envelope<boolean>>({
      path: `${NOTICE_ENDPOINT_PATH}/${id}`,
    });
  }

  async markAllRead(): Promise<void> {
    await this.httpClient.put<Envelope<boolean>>({
      path: NOTICE_ENDPOINT_PATH,
    });
  }
}

function toInboxNotification(dto: NoticeListItemDto): InboxNotification {
  return {
    id: dto.id,
    type: toType(dto.pushType),
    title: dto.title ?? "",
    body: dto.body ?? "",
    target: toTarget(dto.actionType, dto.data),
    isRead: dto.isRead ?? false,
    createdAt: toKstIso(dto.createdAt),
  };
}

function toType(pushType: string | null): InboxNotificationType | null {
  return KNOWN_TYPES.find((type) => type === pushType) ?? null;
}

/** actionType + data(contentId 문자열) → 이동 대상. 해석할 수 없으면 null(읽음 처리만 하고 이동하지 않는다). */
function toTarget(
  actionType: string | null,
  data: string | null,
): InboxNotificationTarget | null {
  const contentId = Number(data);
  if (!Number.isInteger(contentId) || contentId <= 0) return null;

  if (actionType === "BOARD_DETAIL") return { kind: "post", postId: contentId };
  if (actionType === "BALANCE_DETAIL") return { kind: "balance", contentId };
  return null;
}
