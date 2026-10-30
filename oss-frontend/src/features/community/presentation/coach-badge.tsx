import { IconBase } from "@/shared/ui/icons/icon-base";

/**
 * 관장·사범 인증 배지 (#272) — 작성자 닉네임 바로 뒤에 붙인다.
 *
 * iOS MY 벨트 카드의 InstructorBadge 아이콘(badge-check-light)과 같은 모양: 물결 테두리 배지 안에 체크.
 * 문구 없이 배지만 둔다. 서버 인증 값(author.isOwner)이 관장과 사범을 나누지 않는다 —
 * 나중에 나뉘면 아이콘 모양으로 구분한다.
 *
 * 닉네임과 함께 작성자 프로필 탭 영역 안에 두므로 이름은 스크린리더가 "닉네임 관장·사범 인증"으로 읽는다.
 */
export function CoachBadge() {
  return (
    // 16x16 · 닉네임 줄(24) 가운데. 배지 외곽(2~22)이 칸을 채우도록 viewBox를 2만큼 당긴다.
    <IconBase
      size={16}
      viewBox="2 2 20 20"
      role="img"
      aria-hidden={false}
      aria-label="관장·사범 인증"
      className="shrink-0"
    >
      <path
        d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
        className="fill-surface-primary-subtle-strong"
      />
      <path
        d="m8.6 12.1 2.4 2.4 4.4-4.6"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-primary"
      />
    </IconBase>
  );
}
