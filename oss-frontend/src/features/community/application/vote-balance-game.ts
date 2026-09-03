import type {
  BalanceGame,
  BalanceOptionKey,
} from "@/features/community/domain/balance-game";
import type { BalanceGameRepository } from "@/features/community/domain/balance-game-repository";

/**
 * 밸런스 게임에 투표한다.
 *
 * 서버가 투표를 반영한 최신 상태를 돌려주므로 그대로 반환한다(호출부 재조회 불필요).
 * "재투표 불가"는 화면 정책이라 여기서 막지 않는다 — presentation의 투표 훅이 게이트를 갖는다.
 */
export class VoteBalanceGameUseCase {
  constructor(
    private readonly balanceGameRepository: BalanceGameRepository,
  ) {}

  async execute(
    contentId: number,
    option: BalanceOptionKey,
  ): Promise<BalanceGame> {
    return this.balanceGameRepository.vote(contentId, option);
  }
}
