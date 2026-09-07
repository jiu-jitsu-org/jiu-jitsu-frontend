import type { BalanceGame } from "@/features/community/domain/balance-game";
import type { BalanceGameRepository } from "@/features/community/domain/balance-game-repository";

/**
 * 밸런스 게임 단건 조회 — 상세 화면용.
 *
 * 오늘의 게임(GetCurrentBalanceGameUseCase)과 나누는 이유는 대상이 다르기 때문이다.
 * 이쪽은 **지정한 판**을 그대로 가져온다 — 마감됐어도, 오늘의 게임이 다른 판으로 바뀌었어도.
 * 상세를 보던 중 마감돼도 그 자리에 머물러야 한다는 정책이 이 구분에 기대고 있다.
 *
 * 없는 컨텐츠면 null이다(에러 아님). 화면은 닫고 안내 토스트를 남긴다.
 */
export class GetBalanceGameDetailUseCase {
  constructor(private readonly balanceGameRepository: BalanceGameRepository) {}

  async execute(contentId: number): Promise<BalanceGame | null> {
    return this.balanceGameRepository.getById(contentId);
  }
}
