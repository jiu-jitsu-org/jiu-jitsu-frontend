"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  useAuth,
  useOnLogout,
} from "@/features/auth/presentation/auth-provider";
import type { Comment } from "@/features/community/domain/comment";
import { useIsDemoMode } from "@/features/community/presentation/community-demo-context";
import { useRequestBeltPrompt } from "@/features/community/presentation/belt-prompt";
import {
  clearCommentDrafts,
  readCommentDraft,
  saveCommentDraft,
} from "@/features/community/presentation/comment-draft-store";
import {
  isMentionOnly,
  mentionCommentIdOf,
  swapMention,
} from "@/features/community/presentation/comment-mention";
import { useCommentReply } from "@/features/community/presentation/comment-reply-context";
import { useLoginGuard } from "@/features/community/presentation/use-login-guard";
import { ApiErrorCode } from "@/shared/lib/http/api-error";
import { bffFetch } from "@/shared/lib/http/bff-fetch";
import { cn } from "@/shared/lib/cn";
import { useViewportRect } from "@/features/community/presentation/use-viewport-rect";
import { CloseIcon, LoadingIcon, ReplyBranchIcon, SendIcon } from "@/shared/ui/icons";
import {
  notifyContentCreated,
  requestNativeLogin,
} from "@/shared/lib/native-bridge";
import { useToast } from "@/shared/ui";
import { IconButton } from "@/shared/ui/icon-button";

import { REACTION_PRESS_MOTION } from "./comment-reaction-styles";

/** 액션바의 "댓글쓰기"가 포커스 대상으로 참조하는 입력 id(단일 출처). */
export const COMMENT_INPUT_ELEMENT_ID = "community-comment-input";

/**
 * 하단 댓글 입력 바 (클라이언트 leaf).
 *
 * 제출 시 BFF로 POST하고, 응답의 댓글을 목록에 바로 넣은 뒤(#486) router.refresh()로 서버 렌더
 * 댓글 목록을 뒤에서 다시 가져온다. 401이면 네이티브 로그인 유도.
 *
 * 답글 모드: 댓글의 답글 버튼이 대상을 지정하면 입력창 위에 "○○님에게 답글" 칩이 뜨고,
 * 전송 시 parentId가 함께 나간다(대댓글에서 연 답글이면 누른 대댓글 id도 mentionCommentId로, #473).
 * 인라인 입력창을 따로 두지 않고 이 바를 재사용한다.
 *
 * 대상은 게시글일 수도 밸런스 게임일 수도 있어 `contentId`를 받는다 — 업스트림 댓글 API가
 * 처음부터 컨텐츠 단위라 이 바가 게시글을 알 이유가 없다.
 *
 * 앱 웹뷰 비로그인은 입력창을 그대로 보여주되 입력을 받지 않는다(#173) — 탭하면 로그인 알럿만 뜨고
 * 포커스·키보드·입력이 일어나지 않는다. 다 쓴 뒤 전송 시점에 막히는 것을 없애기 위함이다.
 * textarea를 readOnly로 두지 않고 버튼으로 바꾸는 이유: readOnly여도 iOS 웹뷰는 포커스를 잡아
 * 입력 보조 막대가 올라온다.
 */
export function CommentInputBar({ contentId }: { contentId: number }) {
  const router = useRouter();
  const demo = useIsDemoMode();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { target, cancelReply, markPosted, addPosted } = useCommentReply();
  // 답장 행이 접히는 동안에도 글자가 비지 않게 마지막 대상을 들고 있는다 — 컨텍스트 대상은
  // 취소 즉시 null이 되지만, 행은 300ms에 걸쳐 닫히므로 그동안 직전 닉네임을 그대로 보여준다.
  const [lastTarget, setLastTarget] = useState(target);
  if (target && target !== lastTarget) setLastTarget(target);
  const shownTarget = target ?? lastTarget;
  // 대댓글에 답할 땐 입력창 맨 앞에 `@닉네임 `을 넣는다(#451). 대상이 바뀌거나 취소되면 넣어 둔 태그를
  // 걷어 내고 새 태그로 바꾼다 — 렌더 중에 직전 대상과 비교해 바로 맞춘다(effect를 거치면 한 박자 늦게 깜빡인다).
  const [mentionTarget, setMentionTarget] = useState(target);
  if (target !== mentionTarget) {
    setMentionTarget(target);
    setValue((current) => swapMention(current, mentionTarget, target));
  }
  // 키보드가 떠 있는 동안엔 홈 인디케이터(safe-area)가 키보드에 가려 의미가 없으므로 하단 패딩 0.
  const rect = useViewportRect();
  const { guest, guard } = useLoginGuard();
  const toast = useToast();
  const requestBeltPrompt = useRequestBeltPrompt();

  // 쓰던 댓글은 회원 · 글별로 기기에 남겨(#528), 뒤로 갔다가(스와이프 포함) 같은 글을 다시 열면 되살린다.
  // 새 웹뷰에서 되살리면 토스트로 한 번 알린다. 앱의 당겨서 새로고침(#432)처럼 같은 웹뷰가 페이지를 다시
  // 불러온 경우는 지금처럼 말없이 되살린다 — 이 웹뷰가 쓰던 글은 sessionStorage에도 같이 남겨 둘을 가른다.
  // 본문만 되살린다. 답글 대상(칩)은 새로고침 때처럼 돌아오지 않는다 — `@닉네임`만 남은 글은 등록하지 않는다.
  const { userId } = useAuth();
  const sessionDraftKey = `oss:comment-draft:${contentId}`;
  // 회원 · 글마다 한 번만 되살린다(개발 모드에서 effect가 두 번 돌아도 토스트는 한 번).
  const restoredForRef = useRef<string | null>(null);
  // 되살린 그 커밋의 저장은 건너뛴다 — 아직 되살린 값이 반영되기 전이라 빈 값으로 초안을 지운다.
  const skipDraftSaveRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    // 다른 계정으로 바뀌면 입력칸에 남은 이전 계정의 글을 비운다(로그아웃 없이 계정이 바뀐 경우, #511).
    const switched =
      lastUserIdRef.current !== null && lastUserIdRef.current !== userId;
    lastUserIdRef.current = userId;
    if (!userId) return;
    const restoreKey = `${userId}:${contentId}`;
    if (restoredForRef.current === restoreKey) return;
    restoredForRef.current = restoreKey;
    skipDraftSaveRef.current = true;

    const saved = readCommentDraft(userId, contentId);
    // 세션 판정 뒤 기기에 남긴 초안을 되살린다.
    setValue((current) => (switched ? (saved ?? "") : current || saved || ""));
    if (!saved) return;
    let sameWebview = false;
    try {
      sameWebview = sessionStorage.getItem(sessionDraftKey) === saved;
    } catch {
      // 저장소를 못 쓰면 새 웹뷰로 본다.
    }
    if (!sameWebview) toast.show("쓰던 댓글을 불러왔어요", { tone: "info" });
  }, [contentId, sessionDraftKey, toast, userId]);
  useEffect(() => {
    if (skipDraftSaveRef.current) {
      skipDraftSaveRef.current = false;
      return;
    }
    if (!userId) return;
    // 등록 성공 · 입력칸을 모두 지움이면 빈 값이라 초안이 지워진다.
    saveCommentDraft(userId, contentId, value);
    try {
      if (value) sessionStorage.setItem(sessionDraftKey, value);
      else sessionStorage.removeItem(sessionDraftKey);
    } catch {
      // 저장소를 못 쓰는 환경이면 남기지 않는다.
    }
  }, [contentId, sessionDraftKey, userId, value]);
  // 로그아웃하면 이 기기의 초안을 모두 지운다 — 다음에 다른 계정이 열어도 보이지 않게.
  useOnLogout(() => {
    clearCommentDrafts();
    try {
      sessionStorage.removeItem(sessionDraftKey);
    } catch {
      // 저장소를 못 쓰면 지울 것도 없다.
    }
    setValue("");
  });

  // 입력에 따라 높이 자동 확장. 최대 5줄(max-h-[125px])은 CSS가 제한하고 초과분은 스크롤.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  // 답글 대상이 새로 지정되면 입력창으로 포커스를 옮긴다(버튼 쪽에서도 한 번 시도하지만,
  // 대상이 바뀌기만 한 경우까지 커버하려면 여기서도 반응해야 한다).
  // 미리 넣은 `@닉네임 ` 뒤에서 바로 이어 쓰게 커서를 글 끝으로 옮긴다 — 버튼이 값이 들어가기 전에
  // 포커스를 잡아 두므로, iOS 웹뷰는 커서를 태그 앞에 둔 채로 남길 수 있다.
  useEffect(() => {
    const el = textareaRef.current;
    if (!target || !el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, [target]);

  // 미리 넣은 태그만 있고 할 말이 없으면 등록하지 않는다.
  const canSubmit =
    value.trim().length > 0 && !isMentionOnly(value) && !submitting;
  // 등록에 성공할 때마다 1씩 — 아이콘 key로 써서 종이비행기 모션을 처음부터 다시 재생한다.
  const [sentCount, setSentCount] = useState(0);

  async function submit() {
    const content = value.trim();
    if (!canSubmit) return;

    // 예시(데모)에선 네트워크 없이 입력만 비운다(목록 갱신/전송 없음).
    if (demo) {
      setValue("");
      cancelReply();
      setSentCount((n) => n + 1);
      textareaRef.current?.blur();
      return;
    }

    // 대상은 전송 시점 값으로 고정한다 — 응답을 기다리는 동안 대상이 바뀌어도 영향받지 않게.
    const parentId = target?.parentId;
    // 누른 대댓글 id도 같이 고정한다(#473). 글 맨 앞의 `@닉네임`을 지웠으면 보내지 않는다.
    const mentionCommentId = mentionCommentIdOf(content, target);

    setSubmitting(true);
    try {
      const response = await bffFetch("/api/community/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          parentId
            ? { contentId, content, parentId, mentionCommentId }
            : { contentId, content },
        ),
      });

      if (!response.ok) {
        if (response.status === 401) {
          requestNativeLogin(parentId ? "reply" : "comment");
        } else if (await isForbiddenWord(response)) {
          // 금칙어 거절(#504) — 쓴 글은 그대로 두고 표현을 고치게 한다.
          toast.show("사용할 수 없는 표현이 있어요", { tone: "error" });
        } else {
          toast.show("댓글을 등록하지 못했어요", { tone: "error" });
        }
        return;
      }

      setValue("");
      setSentCount((n) => n + 1);
      // 앱이 알림 권한 안내를 띄울지 정하게 알린다(#495). 답글 · 밸런스 게임 댓글도 이 바로 등록돼 여기서 한 번만 나간다.
      notifyContentCreated("COMMENT");
      // 응답에 만든 댓글이 통째로 온다 — 서버 렌더를 기다리지 않고 목록에 바로 넣는다(#486).
      // 새 댓글 id를 알려 두면 목록에 들어올 때 그 댓글만 펼쳐지며 들어온다.
      const created = (await response.json().catch(() => null)) as {
        data?: Comment;
      } | null;
      const comment = created?.data;
      if (typeof comment?.id === "number") {
        markPosted(comment.id);
        // 작성된 순에서 뒤 페이지를 아직 안 받았거나 대댓글이 접혀 있으면 끼울 자리가 없다 —
        // 맨 뒤에 붙이면 안 받은 댓글보다 앞에 보여 순서가 틀린다. 그때는 등록됐다고만 알린다.
        if (!addPosted(comment, parentId)) {
          toast.show("댓글을 등록했어요", { tone: "success" });
        }
      }
      // 답글도 최상위 댓글도 대상 해제만 한다.
      cancelReply();
      // 서버 렌더 목록 재요청 — 뒤에서 돌아 댓글 수·정렬을 맞추고, 같은 id는 서버 것으로 바뀐다.
      router.refresh();
      // 띠가 없는 회원이면 띠를 묻는다(#275). 노출 규칙은 Provider가 본다.
      requestBeltPrompt();
    } finally {
      // 등록 중 readOnly로 바뀌는 순간 iOS 웹뷰는 키보드를 내리고 커서만 남긴다(#484). 끝나면 성공이든
      // 실패든 포커스까지 풀어 커서만 깜빡이는 상태를 없앤다 — 실패면 쓴 글은 남아 다시 탭해 이어 쓴다.
      // 기다리는 사이 답글·×를 눌러도 readOnly라 키보드는 없으므로 같이 푼다.
      textareaRef.current?.blur();
      setSubmitting(false);
    }
  }

  return (
    // 배경 comment-input-bar/container-bg. 평소엔 safe-area bottom(노치)도 같은 배경으로 칠하지만,
    // 키보드가 떠 있는 동안엔 그 영역이 키보드에 가려 의미가 없으므로 패딩을 0으로 줘 키보드에 딱 붙인다.
    <div
      className={cn(
        // toast-inset-comment-bar: 이 바가 떠 있는 화면에서는 토스트를 바 위로 올린다(globals.css).
        // 토스트는 body 직속 fixed라 부모 레이아웃으로는 위치를 못 알려줘, html:has()로 신호를 준다.
        "toast-inset-comment-bar bg-comment-input-bar-container-bg",
        rect?.keyboardOpen ? "pb-0" : "pb-[var(--safe-area-bottom)]",
      )}
    >
      {/* 답장 대상 행 — 답글 모드일 때만. 높이 44 고정, 수직 가운데, 좌우 16.
          분기 아이콘 24 바로 옆(간격 0)에 텍스트, 우측 끝에 × 버튼(40x40, 아이콘 24).
          좌우 16은 × "버튼 영역" 기준이라 음수 마진으로 당기지 않는다.
          열고 닫힐 때 입력창이 툭 튀지 않게 높이를 300ms에 걸쳐 0↔44로 늘이고 줄인다
          (grid 행 0fr↔1fr + 안쪽 overflow-hidden). 닫힌 동안엔 inert로 × 버튼에 포커스가 가지 않게 한다. */}
      <div
        aria-hidden={!target}
        inert={!target}
        className={cn(
          "grid motion-safe:transition-[grid-template-rows] motion-safe:duration-300 motion-safe:ease-smooth-out",
          target ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          {shownTarget ? (
            <div className="flex h-11 items-center px-4">
              {/* 대댓글 목록의 분기 아이콘과 동일 에셋(24, strokeWidth 2) — 색만 다르다. */}
              <ReplyBranchIcon
                size={24}
                className="shrink-0 text-comment-input-bar-reply-ref-thread-icon"
              />
              <span className="min-w-0 flex-1 truncate text-body-s text-comment-input-bar-reply-ref-text">
                {shownTarget.nickname}님에게 답장
              </span>
              {/* 버튼 영역 40x40(size-10) = 아이콘 24 + 사방 여백 8. 우측 16은 이 버튼 바깥 기준.
                  누르는 동안 아이콘 뒤에 둥근 옅은 면이 깔린다(앱바 아이콘 버튼과 같은 눌림). */}
              <IconButton
                onClick={cancelReply}
                aria-label="답장 취소"
                className="text-comment-input-bar-reply-ref-close-icon"
              >
                <CloseIcon size={24} />
              </IconButton>
            </div>
          ) : null}
        </div>
      </div>

      {/* 입력 행 — 높이는 필드(1줄 41) + 상하 여백으로만 결정된다(min-h 없음).
          전송 버튼은 하단 고정(items-end), 좌우 16(px-4).
            상 여백: 답장 행이 있으면 4, 없으면 12
            하 여백: 키보드가 올라오면 12, 내려가면 16
          결과 높이 — 답장 행 없음 65/69, 있음 57/61 (키보드 올라옴/내려감).
          하 여백은 transition을 두지 않아 키보드 전환 시 애니메이션 없이 바로 바뀐다.
          상 여백만 답장 행과 같은 300ms로 옮겨, 행이 열고 닫힐 때 8px이 따로 튀지 않게 한다. */}
      <div
        className={cn(
          "flex items-end px-4 motion-safe:transition-[padding-top] motion-safe:duration-300 motion-safe:ease-smooth-out",
          target ? "pt-1" : "pt-3",
          rect?.keyboardOpen ? "pb-3" : "pb-4",
        )}
      >
        {/* 텍스트 영역: 좌우 16(px-4)/상하 10 → 1줄 높이 41(10+21+10).
            멀티라인 — 엔터=줄바꿈, 최대 5줄(20+21×5=125) 후 스크롤.
            radius 24. 색은 comment-input-bar 토큰(배경/입력/플레이스홀더). */}
        {guest ? (
          // 모양은 빈 입력창과 같게(플레이스홀더 색) — 로그인하면 같은 자리에 진짜 입력창이 온다.
          // 외부 브라우저 문구는 쓰이지 않는다(외부 브라우저는 이 바 자체가 감춰진다 — PostDetailFooter).
          <button
            type="button"
            onClick={guard(() => {}, "comment", "")}
            className="flex-1 rounded-[24px] bg-comment-input-bar-bg px-4 py-[10px] text-left text-body-s text-comment-input-bar-placeholder"
          >
            로그인 후 이용해주세요.
          </button>
        ) : (
          <textarea
            id={COMMENT_INPUT_ELEMENT_ID}
            ref={textareaRef}
            rows={1}
            value={value}
            // 등록 중엔 글을 고칠 수 없게 한다 — 고쳐도 등록이 끝나면 비워져 사라진다.
            // readOnly여도 iOS 웹뷰는 포커스된 입력의 키보드를 내린다(포커스·커서는 남음) — 그래서
            // 등록이 끝나면 submit에서 포커스를 푼다(#484).
            readOnly={submitting}
            aria-busy={submitting}
            onChange={(event) => setValue(event.target.value)}
            placeholder="댓글을 입력해주세요."
            className="max-h-[125px] flex-1 resize-none overflow-y-auto rounded-[24px] bg-comment-input-bar-bg px-4 py-[10px] text-body-s text-comment-input-bar-text outline-none placeholder:text-comment-input-bar-placeholder"
          />
        )}
      <button
        type="button"
        onClick={() => void submit()}
        disabled={!canSubmit}
        aria-label="댓글 등록"
        // 버튼 40x40(size-10) = 종이비행기 아이콘 24 + 상하좌우 여백 8(가운데 정렬). 우측 고정.
        // 전송 중: 스피너(active색) / 입력 1자 이상: send-icon-active / 빈 상태: send-icon-disabled.
        className={cn(
          "inline-flex size-10 shrink-0 items-center justify-center rounded-full",
          canSubmit && REACTION_PRESS_MOTION,
          submitting || canSubmit
            ? "text-comment-input-bar-send-icon-active"
            : "text-comment-input-bar-send-icon-disabled",
        )}
      >
        {submitting ? (
          <LoadingIcon size={24} className="animate-spin" />
        ) : (
          <span
            key={sentCount}
            className={cn(
              "inline-flex",
              sentCount > 0 && "motion-safe:animate-comment-send-fly",
            )}
          >
            <SendIcon size={24} />
          </span>
        )}
      </button>
      </div>
    </div>
  );
}

/** 금칙어 거절 응답인지 — 400 + 업스트림 code `C0015`(#504). 상태코드만으론 일반 400과 구분되지 않는다. */
async function isForbiddenWord(response: Response): Promise<boolean> {
  if (response.status !== 400) return false;
  const json = (await response.json().catch(() => null)) as {
    details?: { code?: unknown };
  } | null;
  return json?.details?.code === ApiErrorCode.FORBIDDEN_WORD;
}
