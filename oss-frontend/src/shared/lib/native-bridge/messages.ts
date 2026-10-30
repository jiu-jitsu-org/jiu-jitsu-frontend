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
  // 로그인 유도: 네이티브가 "로그인이 필요해요" 안내 알럿 → 사용자가 동의해야 로그인 모달 (소프트 유도).
  // 모달을 바로 여는 AUTH_LOGIN_MODAL과 웹 주도 로그아웃 AUTH_LOGOUT_REQUEST는 쓰는 화면이 없어 뺐다(#224).
  // 로그아웃은 앱 설정이 소유하고, 웹은 AUTH_LOGOUT을 받아 세션만 정리한다.
  AUTH_LOGIN_PROMPT: "AUTH_LOGIN_PROMPT",
  // 토큰 만료 복구: refreshToken은 네이티브만 보유하므로 웹은 스스로 갱신할 수 없다.
  // 만료(백엔드 A0003) 감지 시 네이티브에 갱신을 요청 → 네이티브가 AUTH_LOGIN_SUCCESS(새 토큰)
  // 또는 AUTH_SESSION_EXPIRED로 응답한다.
  AUTH_TOKEN_REFRESH_REQUEST: "AUTH_TOKEN_REFRESH_REQUEST",
  // 네비게이션: 풀 웹뷰 서브뷰 푸시/팝 (게시글 상세 등). 범용이라 대상은 payload.url로 전달.
  OPEN_SUBVIEW: "OPEN_SUBVIEW",
  CLOSE_SUBVIEW: "CLOSE_SUBVIEW",
  // 이탈 가드 토글(#263). 기본은 네이티브가 스와이프 백으로 서브뷰를 바로 닫지만, 이 화면이 지금 닫히면 안 된다고
  // enabled:true로 알리면 네이티브는 스와이프를 시작하지 않고 BACK_PRESSED를 보낸다. 풀리면 enabled:false.
  // 글쓰기·수정은 쓰던 내용이 있거나 화면 안 시트·편집 화면이 열려 있는 동안만 true다.
  SET_LEAVE_GUARD: "SET_LEAVE_GUARD",
  // 확인 알럿·선택 바텀시트 표시 요청. 웹뷰는 자기 프레임 밖(GNB·하단 탭바)을 그릴 수 없어
  // 풀스크린 딤이 필요한 표면은 네이티브가 소유한다. 문구·항목은 웹이 payload로 넘겨
  // 문안 변경이 앱 배포에 묶이지 않게 한다(네이티브는 셸만 소유).
  // 두 메시지는 결과 회신이 필요한 유일한 케이스라 requestId로 요청↔응답을 짝짓는다.
  SHOW_CONFIRM_DIALOG: "SHOW_CONFIRM_DIALOG",
  SHOW_SELECT_SHEET: "SHOW_SELECT_SHEET",
  // 시스템 공유 시트 표시 요청. 위 둘과 달리 결과 회신이 없어 requestId를 두지 않는다 —
  // 어디로 공유했든, 시트를 닫았든 웹이 이어붙일 후처리가 없기 때문(공유 수·공유 기록 미보유 정책).
  // 상시 전송이 아니다: navigator.share는 엔진이 OS 시트를 직접 띄우므로 그게 있으면 웹이 자체 처리하고,
  // 이 메시지는 Web Share API가 없는 웹뷰(Android WebView 등)에서만 나간다.
  SHOW_SHARE_SHEET: "SHOW_SHARE_SHEET",
  // 작성자 프로필 열기 요청(#271). 커뮤니티 글·댓글의 작성자 사진·닉네임을 누르면 보낸다.
  // 남이면 네이티브의 다른 회원 프로필 화면(jiu-jitsu-ios#116), 나(isMe)면 앱 MY 탭을 연다 —
  // 내 이름은 남에게 보이는 모습이 아니라 고칠 수 있는 내 프로필로 가야 하기 때문이다.
  // 브릿지가 없는 일반 브라우저에서는 보내지 않는다(남은 동작 없음, 나는 /community/me).
  OPEN_USER_PROFILE: "OPEN_USER_PROFILE",
  // 앨범 사진 선택 요청(#264). 웹뷰의 file input은 iOS 시스템 메뉴(보관함/사진 찍기/파일 선택)를 건너뛸 수
  // 없어 네이티브가 사진 선택 화면을 직접 연다. 결과(PHOTOS_PICKED)를 받아야 해서 requestId로 짝짓는다.
  // 구버전 앱은 이 메시지를 모르므로 지원 목록(AppBridgeCapabilities)에 있을 때만 보낸다 — 없으면 file input.
  PICK_PHOTOS: "PICK_PHOTOS",
} as const;
export type OutboundMessageType =
  (typeof OutboundMessageType)[keyof typeof OutboundMessageType];

/** 네이티브 → 웹 (window.WebBridge.receive) */
export const InboundMessageType = {
  AUTH_LOGIN_SUCCESS: "AUTH_LOGIN_SUCCESS",
  AUTH_LOGIN_CANCELLED: "AUTH_LOGIN_CANCELLED",
  AUTH_SESSION_EXPIRED: "AUTH_SESSION_EXPIRED",
  AUTH_LOGOUT: "AUTH_LOGOUT",
  // 네이티브 뒤로가기(스와이프 백). 가드를 켠(SET_LEAVE_GUARD enabled:true) 화면에만 보낸다. 웹이 한 단계
  // 위로 처리하고(시트 닫기·이탈 확인 등) 실제로 닫을 때만 스스로 CLOSE_SUBVIEW를 보낸다.
  BACK_PRESSED: "BACK_PRESSED",
  // SHOW_CONFIRM_DIALOG / SHOW_SELECT_SHEET의 결과. requestId로 어느 요청의 답인지 식별한다.
  CONFIRM_DIALOG_RESULT: "CONFIRM_DIALOG_RESULT",
  SELECT_SHEET_RESULT: "SELECT_SHEET_RESULT",
  // PICK_PHOTOS의 결과. 취소하면 files가 빈 배열이다.
  PHOTOS_PICKED: "PHOTOS_PICKED",
} as const;
export type InboundMessageType =
  (typeof InboundMessageType)[keyof typeof InboundMessageType];

/** `AUTH_LOGIN_PROMPT` payload. 사유(분석/문구용, 선택). */
export type AuthLoginPayload = {
  reason?: string;
};

/** `SET_LEAVE_GUARD` payload — 지금 화면을 스와이프 백으로 바로 닫으면 안 되는지. */
export type LeaveGuardPayload = {
  enabled: boolean;
};

/**
 * `OPEN_SUBVIEW` payload — 네이티브가 풀스크린 웹뷰로 열 대상.
 * url은 동일 origin 절대경로여야 한다(httpOnly 세션 쿠키 공유 → 로그인 상태 유지).
 * 표시는 항상 push다. 제목은 웹 앱바가 그리므로 임시 제목도 넘기지 않는다.
 */
export type OpenSubviewPayload = {
  url: string;
};

/**
 * 확인 알럿 제목을 "말줄임 가능한 부분 + 항상 온전히 보여야 하는 접미사"로 나눈 것.
 *
 * WHY: "{닉네임}님 차단"처럼 가변 문자열이 섞인 제목은 1줄 고정 정책상 닉네임만 tail 말줄임하고
 * "님 차단"은 항상 보여야 한다. 말줄임 폭은 렌더링 시점에만 정해지므로 웹이 잘라 보낼 수 없고,
 * 완성 문자열 하나로는 알럿을 그리는 쪽이 닉네임 경계를 알 수 없어 경계를 계약으로 넘긴다.
 */
export type ConfirmDialogTitleParts = {
  /** 폭이 모자라면 tail 말줄임되는 부분(닉네임 등). */
  truncatable: string;
  /** 절대 잘리지 않는 접미사("님 차단" 등). */
  suffix: string;
};

/**
 * `SHOW_CONFIRM_DIALOG` payload — 네이티브가 그릴 확인 알럿.
 *
 * 문구·라벨은 전부 웹이 채운다(네이티브는 셸만 소유). destructive면 확인 버튼을 위험색으로 그린다.
 */
export type ConfirmDialogPayload = {
  /** 웹이 발급하는 요청 식별자 — 결과 회신을 이 값으로 매칭한다. */
  requestId: string;
  /** 완성 제목. titleParts가 있어도 항상 채운다 — titleParts를 모르는 구버전 앱은 이 값으로 그린다. */
  title: string;
  /** 있으면 title 대신 이 조합으로 그린다(truncatable만 말줄임, suffix는 온전히). */
  titleParts?: ConfirmDialogTitleParts;
  message?: string;
  confirmText: string;
  /** 미지정 시 네이티브가 "취소"를 쓴다. */
  cancelText?: string;
  destructive?: boolean;
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
  /**
   * 자유 입력 최대 글자 수(선택, UTF-16 단위). 숫자를 웹이 소유해 앱 배포 없이 바꾼다.
   * 값이 없으면 네이티브 기본값(200)을 쓴다.
   */
  customTextMaxLength?: number;
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

/**
 * `SHOW_SHARE_SHEET` payload — 네이티브가 띄울 시스템 공유 시트.
 *
 * url은 공유 대상(게시글 상세)의 절대 URL이다. 환경별 origin을 그대로 실어 보내 dev는 dev,
 * 운영은 운영 링크가 공유된다. 정렬 등 쿼리 파라미터는 보류 — 파라미터 없는 형태로 보낸다.
 */
export type ShareSheetPayload = {
  url: string;
};

/** `PICK_PHOTOS` payload — 네이티브가 열 사진 선택 화면. */
export type PickPhotosPayload = {
  requestId: string;
  /** 고를 수 있는 최대 장수(남은 첨부 자리). 네이티브는 이만큼만 고르게 한다(PHPicker selectionLimit). */
  limit: number;
};

/**
 * 네이티브가 고른 사진 1장.
 *
 * 네이티브가 HEIC를 JPEG로 바꾸고 긴 변을 2400px 이내로 줄여 보낸다 — 원본을 그대로 실으면 장당 수 MB의
 * base64가 evaluateJavaScript를 지나야 해서 느리다. 2400은 크롭으로 확대해도 업로드 기준(긴 변 1600)을
 * 지키는 여유이고, 최종 압축은 웹이 지금처럼 한다(compressImage).
 */
export type PickedPhoto = {
  /** 파일 이름(확장자 포함). 로그·업로드 파일명에 쓴다. */
  name: string;
  /** 예: "image/jpeg" */
  mimeType: string;
  /** 바이트의 base64 문자열(`data:` 접두사 없이). */
  data: string;
};

/** `PHOTOS_PICKED` payload. 고른 순서대로이며, 취소하면 files가 빈 배열이다. */
export type PhotosPickedPayload = {
  requestId: string;
  files: PickedPhoto[];
  /**
   * 골랐지만 변환에 실패해 files에서 빠진 장수. 없으면 0으로 본다(이 값을 모르는 구버전 앱).
   * 전부 실패하면 files는 비고 이 값만 남는다 — 취소(files 빈 배열, failedCount 0)와 구분하기 위함.
   */
  failedCount?: number;
};

/** `AUTH_LOGIN_SUCCESS` payload. refreshToken은 네이티브가 보관하고 웹엔 accessToken만 전달. */
export type AuthLoginSuccessPayload = {
  accessToken: string;
};

/** 모든 브릿지 메시지의 공통 봉투(Envelope). */
/** `OPEN_USER_PROFILE` payload — 프로필을 열 회원. */
export type OpenUserProfilePayload = {
  /** 글·댓글 응답의 author.id. */
  userId: number;
  /** 내 글·댓글이면 true — 네이티브는 userId 대신 MY 탭을 연다. */
  isMe: boolean;
};

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
    }
  | {
      type: typeof InboundMessageType.PHOTOS_PICKED;
      payload: PhotosPickedPayload;
    };
