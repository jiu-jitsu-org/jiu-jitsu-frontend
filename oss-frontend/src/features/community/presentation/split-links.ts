/**
 * 글 · 댓글 본문에서 주소(`http://` · `https://`)를 찾아 링크 조각으로 나눈다 (#593).
 *
 * 경계 규칙 — 주소 뒤에 띄어 쓰지 않고 붙은 글자가 주소에 섞이지 않게 한다:
 * - 공백 · 한글 · 꺾쇠 · 따옴표 · 전각 문장부호(，。「」 등)에서 끊는다.
 *   한글 주소(namu.wiki/w/주짓수)는 앞부분까지만 링크가 된다 — "…/abc입니다"처럼 한글이 붙어 쓰이는 일이 훨씬 잦다.
 * - 끝에 붙은 문장부호(. , ! ? ; : …)는 뺀다. 닫는 괄호는 주소 안에 여는 괄호가 없을 때만 뺀다
 *   ("(https://a.com/x)"는 괄호를 빼고, 위키 주소 "…/Foo_(bar)"는 남긴다).
 * 링크가 아닌 글은 그대로 둔다 — `@닉네임` 태그 강조는 호출부가 링크 밖 조각에만 다시 건다.
 */

export type TextPart =
  { text: string; href?: undefined } | { text: string; href: string };

const URL_PATTERN =
  /https?:\/\/[^\s<>"'`\u1100-\u11FF\u3000-\u303F\u3130-\u318F\uAC00-\uD7A3\uFF00-\uFFEF]+/gi;

const TRAILING_PUNCTUATION = /[.,!?;:…~]$/;

function trimTrailing(url: string): string {
  let end = url;
  for (;;) {
    if (TRAILING_PUNCTUATION.test(end)) {
      end = end.slice(0, -1);
      continue;
    }
    const last = end.at(-1);
    const pair = last === ")" ? "(" : last === "]" ? "[" : null;
    if (pair && last && count(end, pair) < count(end, last)) {
      end = end.slice(0, -1);
      continue;
    }
    return end;
  }
}

function count(text: string, char: string): number {
  return text.split(char).length - 1;
}

/** 열 수 있는 주소인지 — 호스트가 있는 http · https만. */
function isOpenableUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.hostname !== ""
    );
  } catch {
    return false;
  }
}

export function splitLinks(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let last = 0;
  for (const match of text.matchAll(URL_PATTERN)) {
    const url = trimTrailing(match[0]);
    if (!isOpenableUrl(url)) continue;
    if (match.index > last) parts.push({ text: text.slice(last, match.index) });
    parts.push({ text: url, href: url });
    last = match.index + url.length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}
