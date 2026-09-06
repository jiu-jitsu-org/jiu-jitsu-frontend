import type {
  BalanceGame,
  BalanceGameOption,
  BalanceOptionKey,
} from "@/features/community/domain/balance-game";
import type { BalanceGameRepository } from "@/features/community/domain/balance-game-repository";
import { HttpError, type HttpClient } from "@/shared/lib/http";

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
  /** 내가 댓글을 남겼는지. 비로그인은 false. */
  isCommented: boolean;
  likeCount: number;
  /** 비로그인은 false. */
  isLiked: boolean;
  /** 조회수. */
  viewCount?: number;
  /** 미설정이면 null로 오므로 매핑 시 false로 정규화(게시글 상세와 같다). */
  noticeEnabled?: boolean | null;
  /** 생성 일시. 아직 내려오지 않는다 — 없으면 메타 행이 날짜를 그리지 않는다. */
  createdAt?: string;
  /** 서버가 계산한 상대 시각(예: "9시간 전"). 메타 행 날짜의 정본. */
  timeAgo?: string;
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
    // 좋아요·댓글여부·알림·조회수는 나중에 추가된 계약이라 방어적으로 읽는다 — 배포 순서상 아직
    // 내려오지 않는 환경에서도 화면이 뜨는 편이 낫다(카운트 0 · 미선택 · 종 꺼짐으로 보인다).
    commented: dto.isCommented ?? false,
    likeCount: dto.likeCount ?? 0,
    isLiked: dto.isLiked ?? false,
    noticeEnabled: dto.noticeEnabled ?? false,
    // 날짜는 폴백을 만들지 않는다 — 없는 시각을 지어내는 것보다 화면이 비는 편이 낫고,
    // 메타 행이 timeAgo → createdAt 순으로 알아서 물러선다.
    createdAt: dto.createdAt,
    timeAgo: dto.timeAgo,
    views: dto.viewCount ?? 0,
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

  async getById(contentId: number): Promise<BalanceGame | null> {
    // 없는 컨텐츠를 업스트림이 404로 줄지 200 + data:null로 줄지 계약이 확정되지 않았다.
    // 호출부가 분기할 것은 "화면을 닫는다" 하나뿐이라 두 형태를 여기서 null로 합친다.
    try {
      const response = await this.httpClient.get<
        Envelope<BalanceGameDto | null>
      >({ path: `${BALANCE_GAME_ENDPOINT_PATH}/${contentId}` });

      return response.data ? toBalanceGame(response.data) : null;
    } catch (error) {
      if (error instanceof HttpError && error.status === 404) return null;
      throw error;
    }
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
