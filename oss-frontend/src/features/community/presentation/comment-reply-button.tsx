"use client";

import {
  COMMENT_REACTION_BUTTON,
  COMMENT_REACTION_ICON,
  COMMENT_REACTION_TEXT,
  COMMENT_REACTION_TEXT_ACTIVE,
} from "@/features/community/presentation/comment-reaction-styles";
import { useCommentReply } from "@/features/community/presentation/comment-reply-context";
import { COMMENT_INPUT_ELEMENT_ID } from "@/features/community/presentation/comment-input-bar";
import { cn } from "@/shared/lib/cn";
import { CommentIcon } from "@/shared/ui/icons";

/**
 * 댓글 답글 버튼 (클라이언트 leaf).
 *
 * 탭하면 하단 입력 바를 답글 모드로 전환한다(대상 칩 노출 + 포커스).
 * 인라인 입력창 대신 기존 입력 바를 재사용하는 이유: 키보드 대응·멀티라인·전송 로직이 이미
 * 그쪽에 있고, 입력창이 키보드에 가리지 않게 스크롤을 따로 보정할 필요도 없다.
 *
 * 카운트 0이면 "댓글쓰기", 1 이상이면 숫자 — 다른 반응 버튼과 동일 규칙.
 */
export function CommentReplyButton({
  parentId,
  nickname,
  replyCount,
  replied,
}: {
  /** 서버로 보낼 부모 댓글 id — 대댓글에서 탭해도 최상위 댓글 id가 들어온다. */
  parentId: number;
  /** 탭한 댓글의 작성자 닉네임(대상 표시용). */
  nickname: string;
  replyCount: number;
  replied: boolean;
}) {
  const { startReply } = useCommentReply();

  function start() {
    startReply({ parentId, nickname });
    // 포커스는 입력 바가 대상 변화를 감지해 잡지만, 사용자 제스처 컨텍스트가 살아 있는
    // 이 시점에도 한 번 시도한다 — iOS 웹뷰는 제스처 밖 focus()로 키보드가 안 올라온다.
    document.getElementById(COMMENT_INPUT_ELEMENT_ID)?.focus();
  }

  return (
    <button
      type="button"
      onClick={start}
      aria-label={replyCount > 0 ? `답글 ${replyCount}개` : "답글 쓰기"}
      className={cn(
        COMMENT_REACTION_BUTTON,
        COMMENT_REACTION_ICON,
        replied && "text-reaction-bar-active-comment-icon",
      )}
    >
      <CommentIcon size={16} filled={replied} />
      <span
        className={cn(
          COMMENT_REACTION_TEXT,
          replied && COMMENT_REACTION_TEXT_ACTIVE,
        )}
      >
        {replyCount > 0 ? replyCount : "댓글쓰기"}
      </span>
    </button>
  );
}
