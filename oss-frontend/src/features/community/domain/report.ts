/**
 * 신고 도메인 계약.
 *
 * 신고는 게시글(BOARD)·댓글(COMMENT) 공통 동작이라 post/comment 어느 쪽에도 종속시키지 않고
 * 별도 파일로 둔다. 동일 대상 중복 신고는 서버가 막는다(400 + `U0008`).
 */

/** 신고 대상 컨텐츠 구분(BOARD=게시글, COMMENT=댓글). */
export type ReportTargetType = "BOARD" | "COMMENT";

/** 신고 생성 입력(POST /reports). */
export type CreateReportInput = {
  reportType: ReportTargetType;
  targetId: number;
  reason: string;
  /** "기타" 사유로 입력한 상세 내용. 입력이 없으면 보내지 않는다(입력은 선택 사항). */
  detail?: string;
};

/**
 * 「기타」 상세 입력 최대 글자 수(UTF-16 단위 — 웹 maxlength·네이티브 시트와 같은 기준).
 *
 * 기획 정책이 아니라 임시 기준이다(신고 사유 2~3문장 수준). QA에서 바뀔 수 있어 여기 한곳에서만 관리한다 —
 * 웹 시트·네이티브 시트(payload)·BFF 검증이 모두 이 값을 따른다. 서버 저장 한도(255)보다 작아야 한다.
 */
export const REPORT_DETAIL_MAX_LENGTH = 200;

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
