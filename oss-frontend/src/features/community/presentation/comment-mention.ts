import type { ReplyTarget } from "@/features/community/presentation/comment-reply-context";

/**
 * 댓글 태그(`@닉네임`) 도우미 (#451).
 *
 * 태그는 서버에 따로 보내지 않고 본문 글에 그대로 남긴다 — 요청 형태(contentId·parentId·body)를
 * 바꾸지 않고도 누구에게 하는 말인지 보이게 하기 위해서다. 태그된 사람에게 가는 알림은 BE 몫이다.
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
  return target?.mention ? mentionPrefix(target.nickname) : null;
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
