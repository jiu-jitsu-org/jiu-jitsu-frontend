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
 *
 * FIXME(계약): "기타" 사유로 사용자가 입력한 상세 내용을 보낼 필드가 요청 스키마에 없다
 * (reportType/targetId/reason 3개뿐). 현재는 reason="OTHER"만 전송되고 입력 내용은 버려진다.
 * 백엔드에 상세 필드(detail 등)가 추가되면 여기에 함께 싣는다.
 */
export type CreateReportInput = {
  reportType: ReportTargetType;
  targetId: number;
  reason: string;
};

/**
 * 신고 사유 코드. 업스트림 `ReportCreateRequest.reason` Enum과 1:1로 맞춘다.
 * 값이 어긋나면 400이 아니라 집계가 조용히 틀어지므로 문자열을 임의로 늘리지 않는다.
 */
export type ReportReason =
  | "SPAM"
  | "ABUSE"
  | "ADULT"
  | "HARASSMENT"
  | "INCITEMENT"
  | "OTHER";

/** 신고 사유 선택 항목. value는 API로 보낼 코드, label은 사용자에게 보일 문구. */
export type ReportReasonOption = {
  value: ReportReason;
  label: string;
  /** 고르면 자유 입력 필드를 노출한다("기타"). */
  allowsCustomText?: boolean;
};

/**
 * 신고 사유 목록(게시글·댓글 공통). 순서는 시트 노출 순서와 같다.
 *
 * 웹이 소유한다 — 네이티브 시트에 payload로 넘기므로 사유가 늘어도 앱 배포가 필요 없다.
 */
export const REPORT_REASONS: ReportReasonOption[] = [
  { value: "ABUSE", label: "욕설 및 비방" },
  { value: "SPAM", label: "광고 및 홍보" },
  { value: "ADULT", label: "음란 또는 부적절한 콘텐츠" },
  { value: "INCITEMENT", label: "분쟁유도" },
  { value: "HARASSMENT", label: "혐오 및 괴롭힘" },
  { value: "OTHER", label: "기타", allowsCustomText: true },
];
