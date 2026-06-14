/**
 * 신고 도메인 계약.
 *
 * 신고는 게시글(BOARD)·댓글(COMMENT) 공통 동작이라 post/comment 어느 쪽에도 종속시키지 않고
 * 별도 파일로 둔다. 동일 대상 중복 신고는 서버가 막는다(409 가정).
 */

/** 신고 대상 컨텐츠 구분(BOARD=게시글, COMMENT=댓글). */
export type ReportTargetType = "BOARD" | "COMMENT";

/**
 * 신고 생성 입력(POST /reports).
 * reason은 사유 코드(예: "SPAM"). 현재 사유 선택 UI가 없어 presentation이 고정값을 채운다.
 */
export type CreateReportInput = {
  reportType: ReportTargetType;
  targetId: number;
  reason: string;
};
