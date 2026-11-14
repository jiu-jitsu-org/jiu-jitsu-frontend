import type { ReplyTarget } from "@/features/community/presentation/comment-reply-context";

/**
 * 댓글 태그(`@닉네임`) 도우미 (#451).
 *
 * 태그는 본문 글에 그대로 남겨 누구에게 하는 말인지 보이게 한다. 태그된 사람에게 가는 알림은 따로 —
 * 대댓글의 답글 버튼으로 쓰면 누른 대댓글 id를 `mentionCommentId`로 함께 보내고, 서버가 그 대댓글
 * 작성자에게 답글 알림을 보낸다(#473, backend#219). 서버는 본문의 태그 글자를 읽지 않는다.
 */

/**
 * 닉네임에 쓸 수 있는 글자 — BE 닉네임 규칙(`^[가-힣a-zA-Z0-9]{2,12}$`, UserService#validateNickname)과 같다.
 * 태그를 이 글자로만 끊어야 "@B, 고마워"의 쉼표처럼 뒤에 붙은 문장부호가 태그에 섞이지 않는다.
 */
const NICKNAME_CHARS = "[가-힣a-zA-Z0-9]+";

/** 입력창 맨 앞에 미리 넣는 태그. 뒤 공백까지 넣어 바로 이어 쓸 수 있게 한다. */
export function mentionPrefix(nickname: string): string {
  return `@${nickname} `;
}

function prefixOf(target: ReplyTarget | null): string | null {
  return target?.mentionCommentId ? mentionPrefix(target.nickname) : null;
}

/**
 * 서버에 보낼 `mentionCommentId` — 글 맨 앞에 대상의 `@닉네임` 태그가 남아 있을 때만 돌려준다(#473).
 * 사용자가 태그를 지웠으면 본문은 다른 사람에게 하는 말인데 알림만 태그된 사람에게 가므로 보내지 않는다
 * (서버는 태그 없는 답글로 보고 최상위 댓글 작성자에게 알린다).
 * 태그 바로 뒤는 닉네임 글자가 아니어야 한다(글 끝·공백·"@B, 고마워"의 쉼표 등) — 본문 태그 강조(splitMentions)와
 * 같은 경계다. "@B님"처럼 닉네임 글자가 이어지면 다른 닉네임으로 읽힌다.
 */
export function mentionCommentIdOf(
  value: string,
  target: ReplyTarget | null,
): number | undefined {
  if (!target?.mentionCommentId) return undefined;
  const tag = `@${target.nickname}`;
  const head = value.trimStart();
  if (!head.startsWith(tag)) return undefined;
  const next = head.charAt(tag.length);
  return next === "" || !new RegExp(NICKNAME_CHARS).test(next)
    ? target.mentionCommentId
    : undefined;
}

/**
 * 답글 대상이 바뀔 때 입력창 글의 맨 앞 태그를 바꿔 끼운다.
 * 이전 대상이 넣어 둔 태그가 그대로 남아 있을 때만 걷어 낸다 — 사용자가 고친 글은 건드리지 않는다.
 */
export function swapMention(
  value: string,
  prev: ReplyTarget | null,
  next: ReplyTarget | null,
): string {
  const prevPrefix = prefixOf(prev);
  const rest =
    prevPrefix && value.startsWith(prevPrefix)
      ? value.slice(prevPrefix.length)
      : value;
  const nextPrefix = prefixOf(next);
  if (!nextPrefix || rest.startsWith(nextPrefix)) return rest;
  return nextPrefix + rest;
}

/**
 * 태그 하나만 있고 할 말이 없는 글인지 — 이런 글은 등록하지 않는다.
 * 미리 넣은 태그와 비교하지 않고 모양으로 본다: 태그 뒤 공백을 지웠거나, 새로고침으로 답글 대상은
 * 사라지고 초안(`@B `)만 되살아난 경우도 같이 막기 위해서다.
 */
export function isMentionOnly(value: string): boolean {
  // 태그가 여럿이어도("@C @B") 할 말이 없으면 빈 글로 본다.
  return new RegExp(`^(@${NICKNAME_CHARS}\\s*)+$`).test(value.trim());
}

/**
 * 본문을 일반 글과 태그 조각으로 나눈다. 태그는 글 맨 앞이나 공백 바로 뒤의 `@`로 시작해
 * 닉네임 글자가 이어지는 데까지다 — 메일 주소(a@b.com)의 `@`는 태그로 보지 않는다.
 */
export function splitMentions(
  body: string,
): { text: string; mention: boolean }[] {
  const parts: { text: string; mention: boolean }[] = [];
  const pattern = new RegExp(`(^|\\s)(@${NICKNAME_CHARS})`, "g");
  let last = 0;
  for (const match of body.matchAll(pattern)) {
    const start = match.index + match[1].length;
    if (start > last) parts.push({ text: body.slice(last, start), mention: false });
    parts.push({ text: match[2], mention: true });
    last = start + match[2].length;
  }
  if (last < body.length) parts.push({ text: body.slice(last), mention: false });
  return parts;
}
