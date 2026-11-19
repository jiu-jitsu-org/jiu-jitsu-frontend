"use client";

import { Fragment } from "react";

import { splitMentions } from "@/features/community/presentation/comment-mention";
import { splitLinks } from "@/features/community/presentation/split-links";
import { contentOfPath, track } from "@/shared/lib/analytics";

/**
 * 글 · 댓글 본문 글자 — 속의 주소를 눌러 열 수 있게 그린다 (#593).
 *
 * 여는 방식은 대회 정보 링크(대회 공지 · 신청하기)와 같다: `target="_blank"` — 앱 웹뷰는 앱 위 브라우저로 띄우고
 * 닫으면 보던 글로 돌아온다(jiu-jitsu-ios#316, 브릿지 메시지 없음), 브라우저는 새 창.
 * 모양도 대회 상세 '대회 공지' 글 안 링크와 같다 — 글자색은 그대로 두고 옅은 밑줄, 누르는 동안 한 단계 옅게.
 * 남이 쓴 주소라 `nofollow ugc`를 붙인다.
 *
 * `mentions`면 링크 밖 조각의 `@닉네임` 태그를 지금처럼 파란 글씨로 강조한다(댓글).
 * 긴 주소 줄바꿈은 감싸는 문단의 `wrap-anywhere`가 맡는다(#517).
 */
export function LinkedText({
  text,
  mentions = false,
}: {
  text: string;
  mentions?: boolean;
}) {
  return splitLinks(text).map((part, index) =>
    part.href !== undefined ? (
      <a
        key={index}
        href={part.href}
        target="_blank"
        rel="noopener noreferrer nofollow ugc"
        onClick={() => trackLinkOpen(part.href)}
        className="underline decoration-text-tertiary/50 underline-offset-[3px] active:text-text-secondary"
      >
        {part.text}
        <span className="sr-only">(새 창)</span>
      </a>
    ) : mentions ? (
      <Fragment key={index}>
        {splitMentions(part.text).map((piece, pieceIndex) =>
          piece.mention ? (
            <span key={pieceIndex} className="text-interactive-primary">
              {piece.text}
            </span>
          ) : (
            piece.text
          ),
        )}
      </Fragment>
    ) : (
      part.text
    ),
  );
}

/** 링크를 연 기록 — 어느 글에서(content_type) 어느 사이트로(link_host). 주소 전체는 싣지 않는다. */
function trackLinkOpen(href: string): void {
  let host: string | undefined;
  try {
    host = new URL(href).hostname;
  } catch {
    host = undefined;
  }
  track("link_open", {
    content_type: contentOfPath(window.location.pathname)?.type,
    link_host: host,
  });
}
