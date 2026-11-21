import { splitLinks } from "@/features/community/presentation/split-links";

/**
 * 공지 본문 (#509) — 평문을 줄바꿈 그대로 그리고, 속의 주소(`http(s)://`)는 눌러 열 수 있게 한다.
 *
 * 주소를 끊는 규칙은 글 · 댓글 본문과 같다(`splitLinks`, #593). 여는 방식도 같은 `target="_blank"`
 * — 브라우저는 새 창, 앱 웹뷰는 앱 위 브라우저(공지를 여는 iOS 약관 웹뷰는 jiu-jitsu-ios#369에서 맞춤).
 * 운영자가 쓴 글이라 `nofollow ugc`는 붙이지 않는다.
 */
export function AnnouncementBody({ body }: { body: string }) {
  return (
    <p className="whitespace-pre-wrap wrap-anywhere text-sm leading-7 text-zinc-700">
      {splitLinks(body).map((part, index) =>
        part.href !== undefined ? (
          <a
            key={index}
            href={part.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-900 underline decoration-zinc-400 underline-offset-[3px] active:text-zinc-600"
          >
            {part.text}
            <span className="sr-only">(새 창)</span>
          </a>
        ) : (
          part.text
        ),
      )}
    </p>
  );
}
