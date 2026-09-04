import type { BalanceGame } from "@/features/community/domain/balance-game";
import type { CommentList } from "@/features/community/domain/comment";
import type { CommentSort } from "@/features/community/domain/post";
import { AppBarShell } from "@/features/community/presentation/app-bar-shell";
import { BalanceVotePanel } from "@/features/community/presentation/balance/balance-vote-panel";
import { CommentInputBar } from "@/features/community/presentation/comment-input-bar";
import { CommentReplyProvider } from "@/features/community/presentation/comment-reply-context";
import { CommentSection } from "@/features/community/presentation/comment-section";
import { KeyboardAwareShell } from "@/features/community/presentation/keyboard-aware-shell";
import { PostDetailFooter } from "@/features/community/presentation/post-detail-footer";
import { PostDetailHeader } from "@/features/community/presentation/post-detail-header";

/**
 * 밸런스 게임 상세 레이아웃 (순수 표현 서버 컴포넌트).
 *
 * 게시글 상세(PostDetailView)와 뼈대가 같다 — KeyboardAwareShell + CommentReplyProvider +
 * 본문 + 디바이더 + 댓글 섹션 + 하단 입력 바. 본문 자리(작성자 행·제목·이미지·태그)만
 * 투표 블록으로 갈아끼운 것이다.
 *
 * 데이터 조회를 모른다 — 받은 game/comments를 배치만 한다. 상태가 필요한 투표 영역만
 * 클라이언트 leaf(BalanceVotePanel)로 내려보내고, 댓글은 서버 렌더 그대로 둔다.
 *
 * PostDetailHeader/Footer를 그대로 쓴다. 이름은 게시글을 가리키지만 하는 일은 "상세 화면에서
 * 외부 브라우저면 앱바 대신 배너 · 입력 바 감춤"이라 컨텐츠 종류와 무관하다(#72). 밸런스 상세도
 * 같은 이유로 같은 처리가 필요하다 — 세션이 없으면 댓글 전송이 반드시 401로 끝난다.
 *
 * FIXME(Phase 7): 리액션 바(댓글쓰기·좋아요·공유)와 앱바의 알림 벨은 아직 없다.
 */
export function BalanceDetailView({
  game,
  comments,
  sort,
}: {
  game: BalanceGame;
  comments: CommentList;
  sort: CommentSort;
}) {
  return (
    <CommentReplyProvider>
      <KeyboardAwareShell
        header={<PostDetailHeader appBar={<AppBarShell>{null}</AppBarShell>} />}
        footer={
          <PostDetailFooter
            inputBar={<CommentInputBar contentId={game.contentId} />}
          />
        }
      >
        <div>
          {/* 본문 영역: 헤더와 간격 24, 좌우 16 — 게시글 상세와 같은 규격 */}
          <section className="flex flex-col px-4 pt-6">
            <h1 className="text-center text-title-1 text-feed-card-body-title-text">
              오늘의 밸런스 게임
            </h1>

            <BalanceVotePanel initialGame={game} />
          </section>

          {/* 디바이더: 풀폭(좌우 여백 없음), 높이 4 — 게시글 상세와 같은 규격 */}
          <div className="mt-6 h-1 bg-divider-bg" />

          <CommentSection comments={comments} sort={sort} />
        </div>
      </KeyboardAwareShell>
    </CommentReplyProvider>
  );
}
