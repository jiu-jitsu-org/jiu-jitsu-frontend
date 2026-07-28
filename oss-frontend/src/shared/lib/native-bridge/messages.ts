/**
 * 네이티브 ↔ 웹뷰 브릿지 메시지 계약 (웹 측 정본).
 *
 * WHY 단일 출처:
 * - iOS/Android/웹이 동일한 message `type`/payload 스키마를 공유해야 한다.
 *   네이티브는 이 문자열들을 Swift `enum` / Kotlin `sealed class`로 1:1 매핑한다.
 * - 브릿지는 "단일 라우터" 방식이다. 행위마다 핸들러를 만들지 않고 하나의 브릿지에
 *   `type`으로 분기한다. (확장·테스트가 쉽고 플랫폼별 멘탈 모델이 동일)
 * - `type`을 UPPER_SNAKE_CASE 문자열로 두는 이유: 세 언어 모두에서 enum rawValue로
 *   그대로 쓸 수 있고 로그에서 grep 하기 쉽다. (전역 고정 상수 → SCREAMING_SNAKE_CASE)
 */

/** 웹 → 네이티브 (window.(webkit.messageHandlers.)AppBridge) */
export const OutboundMessageType = {
  WEBVIEW_READY: "WEBVIEW_READY",
  // 로그인 유도 2종 (iOS가 단일 AUTH_LOGIN_REQUEST를 분리)
  //  - PROMPT: 네이티브가 "로그인이 필요해요" 안내 알럿 → 사용자가 동의해야 모달 (소프트 유도)
  //  - MODAL : 네이티브가 로그인 모달을 즉시 표시 (다이렉트)
  AUTH_LOGIN_PROMPT: "AUTH_LOGIN_PROMPT",
  AUTH_LOGIN_MODAL: "AUTH_LOGIN_MODAL",
  AUTH_LOGOUT_REQUEST: "AUTH_LOGOUT_REQUEST",
  // 토큰 만료 복구: refreshToken은 네이티브만 보유하므로 웹은 스스로 갱신할 수 없다.
  // 만료(백엔드 A0003) 감지 시 네이티브에 갱신을 요청 → 네이티브가 AUTH_LOGIN_SUCCESS(새 토큰)
  // 또는 AUTH_SESSION_EXPIRED로 응답한다.
  AUTH_TOKEN_REFRESH_REQUEST: "AUTH_TOKEN_REFRESH_REQUEST",
  // 네비게이션: 풀 웹뷰 서브뷰 푸시/팝 (게시글 상세 등). 범용이라 대상은 payload.url로 전달.
  OPEN_SUBVIEW: "OPEN_SUBVIEW",
  CLOSE_SUBVIEW: "CLOSE_SUBVIEW",
  // 뒤로가기 가드 토글. 기본은 네이티브가 back을 직접 처리(닫기)하지만, 이 화면이 가드(작성 중 확인 등)를
  // 가졌다고 enabled:true로 통지하면 네이티브는 직접 닫지 않고 BACK_PRESSED를 보낸다. 해제 시 enabled:false.
  BACK_GUARD: "BACK_GUARD",
  // 확인 알럿·선택 바텀시트 표시 요청. 웹뷰는 자기 프레임 밖(GNB·하단 탭바)을 그릴 수 없어
  // 풀스크린 딤이 필요한 표면은 네이티브가 소유한다. 문구·항목은 웹이 payload로 넘겨
  // 문안 변경이 앱 배포에 묶이지 않게 한다(네이티브는 셸만 소유).
  // 두 메시지는 결과 회신이 필요한 유일한 케이스라 requestId로 요청↔응답을 짝짓는다.
  SHOW_CONFIRM_DIALOG: "SHOW_CONFIRM_DIALOG",
  SHOW_SELECT_SHEET: "SHOW_SELECT_SHEET",
} as const;
export type OutboundMessageType =
  (typeof OutboundMessageType)[keyof typeof OutboundMessageType];

/** 네이티브 → 웹 (window.WebBridge.receive) */
export const InboundMessageType = {
  AUTH_LOGIN_SUCCESS: "AUTH_LOGIN_SUCCESS",
  AUTH_LOGIN_CANCELLED: "AUTH_LOGIN_CANCELLED",
  AUTH_SESSION_EXPIRED: "AUTH_SESSION_EXPIRED",
  AUTH_LOGOUT: "AUTH_LOGOUT",
  // 네이티브 뒤로가기. 가드를 등록한(BACK_GUARD enabled:true) 화면에만 보낸다. 웹이 이탈 가드를
  // 처리한 뒤 닫을 때만 스스로 CLOSE_SUBVIEW를 호출한다(가드 없는 화면은 네이티브가 직접 닫음).
  BACK_PRESSED: "BACK_PRESSED",
  // SHOW_CONFIRM_DIALOG / SHOW_SELECT_SHEET의 결과. requestId로 어느 요청의 답인지 식별한다.
  CONFIRM_DIALOG_RESULT: "CONFIRM_DIALOG_RESULT",
  SELECT_SHEET_RESULT: "SELECT_SHEET_RESULT",
} as const;
export type InboundMessageType =
  (typeof InboundMessageType)[keyof typeof InboundMessageType];

/** 로그인 유도(PROMPT/MODAL 공통) payload. 사유(분석/문구용, 선택). */
export type AuthLoginPayload = {
  reason?: string;
};

/** `BACK_GUARD` payload — 현재 화면의 뒤로가기 가드 활성 여부. */
export type BackGuardPayload = {
  enabled: boolean;
};

/**
 * `OPEN_SUBVIEW` payload — 네이티브가 풀스크린 웹뷰로 열 대상.
 * url은 동일 origin 절대경로여야 한다(httpOnly 세션 쿠키 공유 → 로그인 상태 유지).
 * title은 네이티브가 웹 헤더 렌더 전 표시할 임시 제목(선택). presentation은 표시 방식 힌트(기본 push).
 */
export type OpenSubviewPayload = {
  url: string;
  title?: string;
  presentation?: "push" | "modal";
};

/**
 * `SHOW_CONFIRM_DIALOG` payload — 네이티브가 그릴 확인 알럿.
 *
 * 문구·라벨은 전부 웹이 채운다(네이티브는 셸만 소유). destructive면 확인 버튼을 위험색으로 그린다.
 */
export type ConfirmDialogPayload = {
  /** 웹이 발급하는 요청 식별자 — 결과 회신을 이 값으로 매칭한다. */
  requestId: string;
  title: string;
  message?: string;
  confirmText: string;
  /** 미지정 시 네이티브가 "취소"를 쓴다. */
  cancelText?: string;
  destructive?: boolean;
  /** 딤 바깥 탭으로 닫을 수 있는지. 미지정 시 true. */
  dismissOnOutsideTap?: boolean;
};

/** 알럿 종료 사유. dismiss = 바깥 탭·뒤로가기 등 명시적 취소가 아닌 닫힘. */
export type ConfirmDialogResult = "confirm" | "cancel" | "dismiss";

/** `CONFIRM_DIALOG_RESULT` payload. */
export type ConfirmDialogResultPayload = {
  requestId: string;
  result: ConfirmDialogResult;
};

/** 선택 시트의 단일 항목. value는 API로 보낼 코드, label은 사용자에게 보일 문구. */
export type SelectSheetOption = {
  value: string;
  label: string;
  /** 이 항목을 고르면 자유 입력 필드를 함께 노출한다(신고 사유의 "기타" 등). */
  allowsCustomText?: boolean;
};

/**
 * `SHOW_SELECT_SHEET` payload — 네이티브가 그릴 선택 바텀시트(신고 사유 등).
 *
 * 신고 전용으로 두지 않는 이유: 항목을 웹이 넘기면 사유가 늘어도 앱을 건드리지 않는다.
 */
export type SelectSheetPayload = {
  requestId: string;
  title: string;
  /** 제목 아래 보조 설명(선택). */
  message?: string;
  options: SelectSheetOption[];
  /** 자유 입력 필드의 placeholder(선택) — 문구를 웹이 소유하기 위해 payload로 넘긴다. */
  customTextPlaceholder?: string;
  submitText: string;
};

/** 시트 종료 사유. dismiss = 제출 없이 닫힘. */
export type SelectSheetResult = "submit" | "dismiss";

/**
 * `SELECT_SHEET_RESULT` payload. submit일 때만 value/customText가 채워진다.
 *
 * value는 항상 선택된 항목의 코드다(자유 입력 항목이어도 그 항목의 value를 그대로 보낸다).
 * customText는 `allowsCustomText` 항목을 골라 입력했을 때만 함께 채운다.
 */
export type SelectSheetResultPayload = {
  requestId: string;
  result: SelectSheetResult;
  value?: string;
  customText?: string;
};

/** `AUTH_LOGIN_SUCCESS` payload. refreshToken은 네이티브가 보관하고 웹엔 accessToken만 전달. */
export type AuthLoginSuccessPayload = {
  accessToken: string;
};

/** 모든 브릿지 메시지의 공통 봉투(Envelope). */
export type BridgeMessage<P = unknown> = {
  type: string;
  payload?: P;
};

/**
 * 네이티브 → 웹 인바운드 메시지의 판별 유니온.
 * 핸들러에서 `switch (message.type)`으로 안전하게 좁혀 쓰기 위함.
 */
export type InboundMessage =
  | { type: typeof InboundMessageType.AUTH_LOGIN_SUCCESS; payload: AuthLoginSuccessPayload }
  | { type: typeof InboundMessageType.AUTH_LOGIN_CANCELLED }
  | { type: typeof InboundMessageType.AUTH_SESSION_EXPIRED }
  | { type: typeof InboundMessageType.AUTH_LOGOUT }
  | { type: typeof InboundMessageType.BACK_PRESSED }
  | {
      type: typeof InboundMessageType.CONFIRM_DIALOG_RESULT;
      payload: ConfirmDialogResultPayload;
    }
  | {
      type: typeof InboundMessageType.SELECT_SHEET_RESULT;
      payload: SelectSheetResultPayload;
    };
