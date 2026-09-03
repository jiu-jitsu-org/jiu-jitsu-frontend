import type {
  BalanceGame,
  BalanceGameOption,
  BalanceOptionKey,
} from "@/features/community/domain/balance-game";
import type { BalanceGameRepository } from "@/features/community/domain/balance-game-repository";
import type { HttpClient } from "@/shared/lib/http";

/**
 * 업스트림 밸런스 게임 API를 사용하는 infrastructure 구현.
 *
 * 경로 prefix `/api`: 업스트림은 {API_BASE_URL}/api/... 아래에 라우트가 있다(기존 repository와 동일).
 * 응답 봉투 { success, code, message, data }에서 data를 한 겹 벗겨 도메인으로 매핑한다.
 *
 * 조회는 토큰 유무에 따라 myVote가 채워지고(비로그인 가능), 투표는 authed 클라이언트가 필요하다.
 * 어느 쪽이든 응답 형태가 같아 매핑을 공유한다.
 */
const BALANCE_GAME_ENDPOINT_PATH = "/api/community/balance-game";

type Envelope<T> = {
  success: boolean;
  code: string;
  message: string;
  data: T;
};

/** 선택지 DTO. image는 미등록 시 null로 온다. */
type BalanceGameOptionDto = {
  option: BalanceOptionKey;
  text: string;
  image: { id: number; imageUrl: string } | null;
  voteCount: number;
};

type BalanceGameDto = {
  contentId: number;
  endAt: string;
  serverTime: string;
  closed: boolean;
  optionA: BalanceGameOptionDto;
  optionB: BalanceGameOptionDto;
  totalVoteCount: number;
  /** 미투표면 null. */
  myVote: BalanceOptionKey | null;
  commentCount: number;
};

/**
 * 선택지 매핑.
 *
 * key는 DTO의 option을 그대로 쓴다 — 투표 요청 body에 되돌려 보내는 값이라, 화면이 A/B를
 * 다시 만들어내지 않고 서버가 준 식별자를 왕복시키는 편이 안전하다.
 */
function toBalanceGameOption(dto: BalanceGameOptionDto): BalanceGameOption {
  return {
    key: dto.option,
    text: dto.text,
    imageUrl: dto.image?.imageUrl ?? null,
    voteCount: dto.voteCount ?? 0,
  };
}

function toBalanceGame(dto: BalanceGameDto): BalanceGame {
  return {
    contentId: dto.contentId,
    endAt: dto.endAt,
    serverTime: dto.serverTime,
    closed: dto.closed,
    optionA: toBalanceGameOption(dto.optionA),
    optionB: toBalanceGameOption(dto.optionB),
    totalVoteCount: dto.totalVoteCount ?? 0,
    myVote: dto.myVote ?? null,
    commentCount: dto.commentCount ?? 0,
  };
}

export class ExternalBalanceGameRepository implements BalanceGameRepository {
  constructor(private readonly httpClient: HttpClient) {}

  async getCurrent(): Promise<BalanceGame | null> {
    // 진행 중인 게임이 없으면 data가 null로 온다(200 + success:true). 에러로 올리지 않고
    // 그대로 null을 돌려줘 화면이 "카드 미노출"로 처리하게 한다.
    const response = await this.httpClient.get<Envelope<BalanceGameDto | null>>(
      { path: BALANCE_GAME_ENDPOINT_PATH },
    );

    return response.data ? toBalanceGame(response.data) : null;
  }

  async vote(
    contentId: number,
    option: BalanceOptionKey,
  ): Promise<BalanceGame> {
    // 응답이 투표 반영 후의 최신 전체 상태라 별도 재조회가 필요 없다.
    const response = await this.httpClient.post<Envelope<BalanceGameDto>>({
      path: `${BALANCE_GAME_ENDPOINT_PATH}/${contentId}/vote`,
      body: { option },
    });

    return toBalanceGame(response.data);
  }
}
