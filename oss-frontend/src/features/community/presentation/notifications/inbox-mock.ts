import type { InboxNotification } from "@/features/community/domain/inbox-notification";

/**
 * 알림함 목(mock) 데이터 — API 연동 전 화면 확인용(#187). 연동하면 이 파일은 지운다.
 *
 * 시각은 요청 시점 기준으로 만들어 "5분 전 · 1일 전 · 9월 12일" 같은 표기를 모두 볼 수 있게 한다.
 */
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function createInboxMock(now: number): InboxNotification[] {
  const at = (ago: number) => new Date(now - ago).toISOString();

  return [
    {
      id: 1,
      type: "NEW_COMMENTS",
      title: "내 게시글에 새로운 댓글이 달렸어요.",
      body: "첫 주짓수 수업, 뭘 준비하면 좋을까요?",
      target: { kind: "post", postId: 101 },
      isRead: false,
      createdAt: at(5 * MINUTE),
    },
    {
      id: 2,
      type: "NEW_CHILD_COMMENTS",
      title: "내 댓글에 답글이 달렸어요.",
      body: "클로즈드 가드에서 자세 잡는 팁 공유해요",
      target: { kind: "post", postId: 102 },
      isRead: false,
      createdAt: at(42 * MINUTE),
    },
    {
      id: 3,
      type: "NEW_COMMENTS",
      title: "내 게시글에 새로운 댓글이 달렸어요.",
      body: "퇴근 후 운동 루틴, 다들 어떻게 하세요?",
      target: { kind: "post", postId: 103 },
      isRead: false,
      createdAt: at(3 * HOUR),
    },
    {
      id: 4,
      type: "NEW_CHILD_COMMENTS",
      title: "내 댓글에 답글이 달렸어요.",
      body: "이번 주 토요일 오픈매트 함께 가실 분",
      target: { kind: "post", postId: 104 },
      isRead: true,
      createdAt: at(1 * DAY),
    },
    {
      id: 5,
      type: "NEW_CHILD_COMMENTS",
      title: "내 댓글에 답글이 달렸어요.",
      // 밸런스 게임 알림 — BALANCE_DETAIL 이동 확인용.
      body: "평생 백 포지션만 vs 평생 마운트만",
      target: { kind: "balance", contentId: 201 },
      isRead: true,
      createdAt: at(5 * DAY),
    },
    {
      id: 6,
      type: "NEW_COMMENTS",
      title: "내 게시글에 새로운 댓글이 달렸어요.",
      // 본문이 비어 오는 경우 — 본문 줄이 빠진 모양 확인용. 7일이 지나 날짜로 표기된다.
      body: "",
      target: { kind: "post", postId: 106 },
      isRead: true,
      createdAt: at(12 * DAY),
    },
  ];
}
