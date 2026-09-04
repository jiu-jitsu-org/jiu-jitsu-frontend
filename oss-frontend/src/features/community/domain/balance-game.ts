/**
 * 밸런스 게임 도메인 타입.
 *
 * 업스트림: GET /community/balance-game (오늘의 게임) · POST /community/balance-game/{id}/vote
 * 응답 계약. 하루 1개 주제가 24시간 단위로 갱신되며, 마감되면 서버가 다음 주제로 교체한다.
 *
 * 게시글(PostSummary)과 달리 작성자·이미지 목록·좋아요/저장이 없고, 식별자도 게시글 id가 아닌
 * contentId다. 댓글은 게시글과 같은 API(GET /community/comments?id=)를 contentId로 호출한다.
 */

/** 선택지 식별자. 투표 요청 body의 option 값과 같다. */
export type BalanceOptionKey = "A" | "B";

/** 선택지 한 개. */
export type BalanceGameOption = {
  key: BalanceOptionKey;
  text: string;
  /**
   * 업스트림 image.imageUrl.
   *
   * 1차 리스트 화면은 이미지 자리를 비워두므로 렌더에 쓰지 않는다. asset이 정해졌을 때
   * 계약을 다시 찾지 않아도 되도록 도메인에는 미리 담아 둔다.
   */
  imageUrl: string | null;
  /**
   * 득표 수.
   *
   * 리스트는 투표율(%)·진행률 바를 노출하지 않아 쓰지 않는다(상세 전용). 같은 응답을 상세가
   * 그대로 쓰므로 도메인에는 포함해 둔다.
   */
  voteCount: number;
};

/**
 * 밸런스 게임 한 판.
 *
 * 시각 필드가 두 개인 이유: 카운트다운을 기기 시계로 계산하면 시계가 틀어진 기기에서 잔여 시간이
 * 어긋난다. serverTime(응답 시각)과 수신 시각의 차이를 오프셋으로 잡아 endAt까지를 계산한다.
 */
export type BalanceGame = {
  /** 컨텐츠 ID — 상세 이동·투표·댓글 조회의 키. */
  contentId: number;
  /** 마감 일시(ISO 8601). 카운트다운의 종점. */
  endAt: string;
  /** 서버 응답 시각(ISO 8601). 기기 시계 대신 이 값을 기준으로 남은 시간을 계산한다. */
  serverTime: string;
  /**
   * 마감 여부.
   *
   * "오늘의 게임" 조회는 진행 중인 판을 주므로 평소엔 false다. 마감 직후 다음 판으로 교체되기 전
   * 짧은 구간에 true로 내려올 수 있어, 화면은 이를 "곧 교체될 상태"로 다룬다(투표 차단 + 재조회).
   */
  closed: boolean;
  optionA: BalanceGameOption;
  optionB: BalanceGameOption;
  totalVoteCount: number;
  /** 내가 투표한 선택지. null이면 미투표. */
  myVote: BalanceOptionKey | null;
  /** 댓글 수. 0이면 "첫 댓글 남기러 가기"로 노출한다. */
  commentCount: number;
  /**
   * 좋아요 수.
   *
   * 리스트는 좋아요를 노출하지 않지만 **같은 응답을 상세와 공유**하므로 도메인에 담아 둔다
   * (imageUrl·voteCount와 같은 이유). 리스트가 나중에 노출하게 되어도 계약을 다시 찾을 일이 없다.
   */
  likeCount: number;
  /** 내가 좋아요를 눌렀는지. 비로그인은 false. */
  isLiked: boolean;
};

/**
 * 저장(북마크)은 업스트림 미지원이라 필드가 없다 — `saveCount`·`isSaved`는 내려오지 않는다.
 * 밸런스 contentId로 저장을 호출하면 C0008(CONTENT_SAVE_NOT_SUPPORTED)이 온다.
 * 기획 확인 중이라 뒤집힐 수 있다(docs/balance-game-detail-plan.md §1).
 */
