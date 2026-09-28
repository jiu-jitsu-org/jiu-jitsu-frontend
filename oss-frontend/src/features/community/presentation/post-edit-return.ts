/**
 * 게시글 수정 → 원래 상세 복귀(#157)에 쓰는 식별자.
 *
 * "use client" 모듈과 분리한 이유: 수정 라우트(Server Component)도 이 값을 읽는다. 클라이언트 모듈의
 * export는 서버에서 문자열이 아니라 클라이언트 참조로 보여 비교가 항상 어긋난다.
 */

/**
 * 수정 화면을 연 곳. "detail"이면 성공 후 새 상세를 쌓지 않고 원래 상세로 돌아간다.
 *
 * WHY 쿼리로 넘기는가: 앱에서 수정 화면은 여는 쪽과 별도 웹뷰라 메모리 상태를 건너받을 수 없다.
 */
export const POST_EDIT_FROM_DETAIL = "detail";

/**
 * 상세에서 연 수정이 성공했다는 신호(pending toast action.type). 상세가 받아 내용을 다시 읽는다.
 * label이 없으므로 버튼은 그려지지 않는다.
 */
export const POST_EDITED_ACTION = "post-edited";
