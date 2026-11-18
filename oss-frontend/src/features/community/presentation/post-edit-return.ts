/**
 * 게시글 수정 → 원래 상세 복귀(#157)에 쓰는 식별자.
 *
 * "use client" 모듈과 분리한 이유: 수정 라우트(Server Component)도 이 값을 읽는다. 클라이언트 모듈의
 * export는 서버에서 문자열이 아니라 클라이언트 참조로 보여 비교가 항상 어긋난다.
 */

/**
 * 수정 화면을 연 곳. "post_detail"이면 성공 후 새 상세를 쌓지 않고 원래 상세로 돌아간다.
 * GA 들어온 길(`?from=`, #576)과 같은 값이다 — 사전의 화면 이름.
 *
 * WHY 쿼리로 넘기는가: 앱에서 수정 화면은 여는 쪽과 별도 웹뷰라 메모리 상태를 건너받을 수 없다.
 */
export const POST_EDIT_FROM_DETAIL = "post_detail";

/**
 * 바꾸기 전 값(#576 전). 배포 직후 옛 번들이 떠 있던 상세 웹뷰가 `?from=detail`로 수정을 열 수 있어
 * 한동안 같이 받는다 — 안 받으면 저장 뒤 상세가 두 겹 쌓인다.
 */
export const LEGACY_POST_EDIT_FROM_DETAIL = "detail";

/**
 * 상세에서 연 수정이 성공했다는 신호(pending toast action.type). 상세가 받아 내용을 다시 읽는다.
 * label이 없으므로 버튼은 그려지지 않는다.
 */
export const POST_EDITED_ACTION = "post-edited";
