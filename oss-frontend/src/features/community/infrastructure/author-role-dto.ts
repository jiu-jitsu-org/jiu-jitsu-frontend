/**
 * 작성자 응답의 관장·사범 인증 여부 (#272).
 *
 * 서버는 글·댓글 작성자(author)에 isOwner(boolean)를 준다 — OWNER 역할이면 true, ADMIN은 false
 * (backend#172). 다른 회원 공개 프로필(GET /community/profile/{userId})도 같은 이름이다.
 * 차단으로 가려진 댓글은 author 필드가 전부 null로 온다.
 */
export type AuthorRoleDto = {
  isOwner?: boolean | null;
};

/** 관장·사범 인증 회원인지. 값이 없으면 false — 화면은 배지를 그리지 않는다. */
export function toIsCoach(dto: AuthorRoleDto | null | undefined): boolean {
  return dto?.isOwner === true;
}
