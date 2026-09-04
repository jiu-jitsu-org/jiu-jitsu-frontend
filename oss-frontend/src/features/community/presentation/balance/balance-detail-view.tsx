import type {
  BalanceGame,
  BalanceOptionKey,
} from "@/features/community/domain/balance-game";
import type { CommentList } from "@/features/community/domain/comment";
import type { CommentSort } from "@/features/community/domain/post";
import { AppBarShell } from "@/features/community/presentation/app-bar-shell";
import {
  BalanceOptionButton,
  type BalanceOptionState,
} from "@/features/community/presentation/balance/balance-option-button";
import { BalanceRemaining } from "@/features/community/presentation/balance/balance-remaining";
import { readOptionResult } from "@/features/community/presentation/balance/balance-result";
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
 * PostDetailHeader/Footer를 그대로 쓴다. 이름은 게시글을 가리키지만 하는 일은 "상세 화면에서
 * 외부 브라우저면 앱바 대신 배너 · 입력 바 감춤"이라 컨텐츠 종류와 무관하다(#72). 밸런스 상세도
 * 같은 이유로 같은 처리가 필요하다 — 세션이 없으면 댓글 전송이 반드시 401로 끝난다.
 *
 * FIXME(Phase 4): 선택지는 아직 표시 전용이다. 투표 연결은 클라이언트 상태가 필요해
 * BalanceDetailBody(Phase 4)가 생기면 그쪽으로 옮긴다.
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
  /**
   * 선택지 표시 상태 — 리스트 카드(BalanceGameCard)와 같은 규칙이다.
   *
   * **마감 여부를 보지 않는 것이 의도적이다.** 마감 후 배경 강조는 사라지지만(readOptionResult가
   * emphasized: false를 준다) 캐릭터는 내가 고른 그대로 남는다 — 배경 색이 빠져도 무엇을 골랐는지는
   * 읽을 수 있어야 한다는 판단이다. 크기도 함께 유지되므로 마감 전환 시 행 높이가 변하지 않는다.
   */
  const optionState = (option: BalanceOptionKey): BalanceOptionState => {
    if (game.myVote === null) return "default";
    return game.myVote === option ? "selected" : "unselected";
  };

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

            {/*
              타이머는 리스트와 달리 알약(pill) 안에 들어간다. 가운데 정렬을 위해 한 겹 감싼다 —
              inline-flex인 pill 자체는 자기 폭만 차지한다.

              FIXME(Phase 8): pill 배경·여백은 디자인 가이드 전 잠정값이다(캡처 기준).
              FIXME(Phase 5): 아이콘 깜빡임과 마감 문구는 아직 없다.
            */}
            <div className="mt-4 flex justify-center">
              <span className="inline-flex items-center rounded-full bg-surface-secondary px-4 py-2 text-feed-card-header-date-text">
                <BalanceRemaining
                  endAt={game.endAt}
                  serverTime={game.serverTime}
                  showIcon
                />
              </span>
            </div>

            {/* 선택지 사이 4 — 리스트와 같다 */}
            <div className="mt-5 flex flex-col gap-1">
              <BalanceOptionButton
                option={game.optionA}
                state={optionState("A")}
                interactive={false}
                result={readOptionResult(game, "A")}
                onPress={() => {}}
              />
              <BalanceOptionButton
                option={game.optionB}
                state={optionState("B")}
                interactive={false}
                result={readOptionResult(game, "B")}
                onPress={() => {}}
              />
            </div>
          </section>

          {/* 디바이더: 풀폭(좌우 여백 없음), 높이 4 — 게시글 상세와 같은 규격 */}
          <div className="mt-6 h-1 bg-divider-bg" />

          <CommentSection comments={comments} sort={sort} />
        </div>
      </KeyboardAwareShell>
    </CommentReplyProvider>
  );
}
