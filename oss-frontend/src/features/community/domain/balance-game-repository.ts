import type {
  BalanceGame,
  BalanceOptionKey,
} from "@/features/community/domain/balance-game";

/**
 * 밸런스 게임 도메인 계약.
 *
 * 읽기와 쓰기를 한 인터페이스에 둔다 — 게시글(PostRepository/CommunityWriteRepository)처럼
 * 구현이 갈릴 만큼 크지 않고, 투표 응답이 곧 최신 조회 결과라 두 동작이 같은 모델을 돌려준다.
 * 토큰 부착은 클라이언트 구성 시점에 주입되므로 메서드는 토큰을 받지 않는다.
 */
export interface BalanceGameRepository {
  /**
   * 오늘의 밸런스 게임 조회(GET /community/balance-game).
   *
   * 진행 중인 게임이 없으면 null이다 — 에러가 아니라 "지금은 없음"이라는 정상 응답이다.
   * 토큰이 있으면 myVote가 채워진다(비로그인도 조회 가능).
   */
  getCurrent(): Promise<BalanceGame | null>;
  /**
   * 단건 조회(GET /community/balance-game/{contentId}). 상세 화면이 쓴다.
   *
   * getCurrent와 달리 **마감된 판도 돌려준다** — 상세를 보던 중 마감돼도 그 자리에 머물 수
   * 있어야 하고, 새로고침이 사용자를 다음 판으로 밀어내면 안 된다.
   *
   * 없는 컨텐츠면 null이다. 업스트림이 200 + data:null로 주든 404로 주든 호출부가 분기할 것은
   * "화면을 닫는다" 하나뿐이라 여기서 null로 합친다.
   */
  getById(contentId: number): Promise<BalanceGame | null>;
  /**
   * 투표(POST /community/balance-game/{contentId}/vote). 인증 필요.
   *
   * 서버는 투표가 반영된 최신 상태를 통째로 돌려주므로 호출부는 재조회하지 않는다.
   *
   * 주의: 업스트림은 같은 선택지를 다시 보내면 **취소**, 다른 선택지면 **변경**으로 처리한다.
   * "한 번 투표하면 재투표 불가"는 화면 정책이라 presentation에서 막는다(use-balance-vote).
   */
  vote(contentId: number, option: BalanceOptionKey): Promise<BalanceGame>;
}
