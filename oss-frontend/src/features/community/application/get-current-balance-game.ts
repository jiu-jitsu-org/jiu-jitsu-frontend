import type { BalanceGame } from "@/features/community/domain/balance-game";
import type { BalanceGameRepository } from "@/features/community/domain/balance-game-repository";

/**
 * 오늘의 밸런스 게임을 조회한다.
 *
 * 진행 중인 게임이 없으면 null이다(에러 아님). myVote는 infrastructure가 토큰 유무에 따라 채운다.
 */
export class GetCurrentBalanceGameUseCase {
  constructor(
    private readonly balanceGameRepository: BalanceGameRepository,
  ) {}

  async execute(): Promise<BalanceGame | null> {
    return this.balanceGameRepository.getCurrent();
  }
}
