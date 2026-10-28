/**
 * 작성자 응답에 붙을 회원 역할 필드 (#272).
 *
 * 서버는 아직 글·댓글 작성자(author)에 이 값을 주지 않는다 — 회원 프로필(GET /api/user/profile)의
 * userRole과 같은 이름·값으로 붙을 것으로 보고 자리만 둔다(backend#163).
 * 값: "USER" | "OWNER"(관장·사범 인증 완료) | "ADMIN". 이름이 다르게 확정되면 여기만 고친다.
 */
export type AuthorRoleDto = {
  userRole?: string | null;
};

/** 관장·사범 인증 회원인지. 값이 없거나 모르는 값이면 false — 화면은 배지를 그리지 않는다. */
export function toIsCoach(dto: AuthorRoleDto | null | undefined): boolean {
  return dto?.userRole === "OWNER";
}
