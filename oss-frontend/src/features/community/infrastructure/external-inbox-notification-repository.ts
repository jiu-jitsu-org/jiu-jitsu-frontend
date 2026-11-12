import type {
  InboxGoneKind,
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
 * - GET /notice      → NoticeListResponse[] (최신순, 페이지네이션 없음). 관심 대회 마감 알림(#422)도 함께 온다.
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
  /** 대상 삭제 상태. null = 정상. 게시글이 지워지면 그 아래 댓글 · 대댓글 알림도 BOARD다. */
  deletedStatus: string | null;
};

const KNOWN_TYPES: readonly InboxNotificationType[] = [
  "NEW_COMMENTS",
  "NEW_CHILD_COMMENTS",
  "CONTENTS_LIKE",
  "COMMENTS_LIKE",
  "COMPETITION_EARLY_BIRD_DEADLINE",
  "COMPETITION_REGISTRATION_DEADLINE",
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
    gone: toGone(dto.deletedStatus),
    isRead: dto.isRead ?? false,
    createdAt: toKstIso(dto.createdAt),
  };
}

function toType(pushType: string | null): InboxNotificationType | null {
  return KNOWN_TYPES.find((type) => type === pushType) ?? null;
}

/** deletedStatus → 삭제 종류. 모르는 값은 정상(null)으로 둔다 — 상세로 보내면 상세가 다시 거른다. */
function toGone(deletedStatus: string | null): InboxGoneKind | null {
  if (deletedStatus === "BOARD") return "post";
  if (deletedStatus === "COMMENT") return "comment";
  if (deletedStatus === "REPLY") return "reply";
  if (deletedStatus === "COMPETITION") return "competition";
  return null;
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
  if (actionType === "COMPETITION_DETAIL") {
    return { kind: "competition", competitionId: contentId };
  }
  return null;
}
