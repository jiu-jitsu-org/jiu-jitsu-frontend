/**
 * 작성자 응답의 관장·사범 인증 여부 (#272) · 운영자 여부 (#595).
 *
 * 서버는 글·댓글 작성자(author)에 isOwner(boolean)를 준다 — OWNER 역할이면 true, ADMIN은 false
 * (backend#172). 다른 회원 공개 프로필(GET /community/profile/{userId})도 같은 이름이다.
 * isOperator는 계정 구분이 OPERATOR(OSS 공식 · 운영자 계정)면 true다 — 권한(ADMIN)과 무관하다(backend#268).
 * 차단으로 가려진 댓글은 author 필드가 전부 null로 오고, 탈퇴 · 가려진 작성자의 isOperator는 null이다.
 */
export type AuthorRoleDto = {
  isOwner?: boolean | null;
  isOperator?: boolean | null;
};

/** 관장·사범 인증 회원인지. 값이 없으면 false — 화면은 배지를 그리지 않는다. */
export function toIsCoach(dto: AuthorRoleDto | null | undefined): boolean {
  return dto?.isOwner === true;
}

/** 운영자 계정인지(#595). 값이 없으면 false — 화면은 '운영자' 배지를 그리지 않는다. */
export function toIsOperator(dto: AuthorRoleDto | null | undefined): boolean {
  return dto?.isOperator === true;
}
