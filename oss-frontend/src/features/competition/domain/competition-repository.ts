import type {
  Competition,
  CompetitionListQuery,
  CompetitionPage,
} from "@/features/competition/domain/competition";
import type { CompetitionStory } from "@/features/competition/domain/competition-story";

/** 대회 상세 — 대회와 서버가 본 오늘. */
export type CompetitionDetail = {
  competition: Competition;
  /** 한국 날짜 "YYYY-MM-DD" */
  today: string;
};

/** 글쓰기 대회 고르기 목록(#367) — 다가오는 대회(가까운 순) → 끝난 대회(최근 순), 합쳐 최대 20개. */
export type CompetitionPickerPage = {
  today: string;
  competitions: Competition[];
};

/**
 * 공개 대회 읽기(backend#193). 로그인 없이도 읽는다 — 로그인이면 내 관심(interested)까지 채워 온다.
 */
export interface CompetitionRepository {
  getCompetitions(query: CompetitionListQuery): Promise<CompetitionPage>;
  /** 대회 하나 — 없거나 미공개면 null(#361). 조회수는 올리지 않는다. */
  getCompetition(id: number): Promise<CompetitionDetail | null>;
  /** 상세를 한 번 연 것으로 세고, 센 뒤의 조회수를 돌려준다(#362). */
  recordView(id: number): Promise<number>;
  /** 이 대회를 고른 커뮤니티 글 — 최대 5개, 서버 순서(#366). */
  getStories(id: number): Promise<CompetitionStory[]>;
  getPickerCompetitions(keyword?: string): Promise<CompetitionPickerPage>;
}
