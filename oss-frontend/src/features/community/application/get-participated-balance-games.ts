import type {
  BalanceGameList,
  BalanceGameListQuery,
} from "@/features/community/domain/balance-game";
import type { BalanceGameRepository } from "@/features/community/domain/balance-game-repository";

/**
 * 내가 참여한(투표한) 밸런스 게임 목록을 조회한다 — 내 커뮤니티 활동 '밸런스 게임' 탭.
 *
 * 로그인 전용 목록이라 factory가 authed repository로만 조립한다.
 * 마감된 판도 포함된다 — 끝난 뒤에도 결과를 다시 볼 수 있게 하는 것이 이 목록의 목적이다.
 */
export class GetParticipatedBalanceGamesUseCase {
  constructor(private readonly balanceGameRepository: BalanceGameRepository) {}

  async execute(query: BalanceGameListQuery): Promise<BalanceGameList> {
    return this.balanceGameRepository.getParticipated(query);
  }
}
