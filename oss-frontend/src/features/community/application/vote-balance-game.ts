import type {
  BalanceGame,
  BalanceOptionKey,
} from "@/features/community/domain/balance-game";
import type { BalanceGameRepository } from "@/features/community/domain/balance-game-repository";

/**
 * 밸런스 게임에 투표한다.
 *
 * 서버가 투표를 반영한 최신 상태를 돌려주므로 그대로 반환한다(호출부 재조회 불필요).
 * 같은 선택지 재전송은 취소, 다른 선택지는 변경으로 업스트림이 처리하며 정책도 둘 다 허용한다.
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
