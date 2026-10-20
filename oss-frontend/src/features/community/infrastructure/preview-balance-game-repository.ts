import type {
  BalanceGame,
  BalanceGameList,
  BalanceGameListQuery,
  BalanceOptionKey,
} from "@/features/community/domain/balance-game";
import type { BalanceGameRepository } from "@/features/community/domain/balance-game-repository";

/**
 * [임시] 디자인 검토 전용(NEXT_PUBLIC_MY_BALANCE_GAMES=preview). 업스트림 목록 API가 생기면
 * 이 파일과 factory의 preview 분기를 통째로 지운다.
 *
 * '참여한 밸런스 게임' 목록 API가 아직 없어, 실제로 존재하는 판으로 목록을 지어낸다:
 * 오늘의 게임(getCurrent)부터 contentId를 하나씩 거슬러 단건 조회(getById)해 최대 10개를 모은다.
 * 없는 id는 건너뛰고, 연속으로 여러 번 비면 더 이전 판이 없다고 보고 멈춘다.
 * 내가 실제로 투표했는지는 거르지 않는다 — 진행 중 · 마감 · 미투표 모양을 한 화면에서 보기 위함.
 *
 * 나머지 동작(오늘의 게임 · 단건 · 투표)은 실제 repository에 그대로 위임한다.
 */
const PREVIEW_MAX_ITEMS = 10;
/** 연속으로 이만큼 비면 멈춘다(지운 판 · 번호 건너뜀 허용). */
const PREVIEW_MAX_CONSECUTIVE_MISSES = 5;

export class PreviewBalanceGameRepository implements BalanceGameRepository {
  constructor(private readonly delegate: BalanceGameRepository) {}

  getCurrent(): Promise<BalanceGame | null> {
    return this.delegate.getCurrent();
  }

  getById(contentId: number): Promise<BalanceGame | null> {
    return this.delegate.getById(contentId);
  }

  vote(contentId: number, option: BalanceOptionKey): Promise<BalanceGame> {
    return this.delegate.vote(contentId, option);
  }

  async getParticipated(query: BalanceGameListQuery): Promise<BalanceGameList> {
    // 한 페이지로 끝낸다 — 다음 페이지 요청에는 빈 마지막 페이지를 준다.
    const items = query.page === 0 ? await this.collectRecentGames() : [];

    return {
      items,
      page: query.page,
      size: query.size,
      totalElements: items.length,
      totalPages: 1,
      isLast: true,
    };
  }

  private async collectRecentGames(): Promise<BalanceGame[]> {
    const current = await this.delegate.getCurrent();
    if (!current) return [];

    const games: BalanceGame[] = [current];
    let misses = 0;

    for (
      let id = current.contentId - 1;
      id > 0 &&
      games.length < PREVIEW_MAX_ITEMS &&
      misses < PREVIEW_MAX_CONSECUTIVE_MISSES;
      id -= 1
    ) {
      // 순서대로 하나씩 — 미리보기라 속도보다 단순함이 낫다(최대 십수 번).
      // 404 외 실패도 "없는 판"으로 넘긴다(미리보기를 에러 화면으로 막지 않는다).
      const game = await this.delegate.getById(id).catch(() => null);
      if (game) {
        games.push(game);
        misses = 0;
      } else {
        misses += 1;
      }
    }

    return games;
  }
}
