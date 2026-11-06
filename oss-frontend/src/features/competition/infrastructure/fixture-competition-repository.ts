import type { Competition } from "@/features/competition/domain/competition";
import type { CompetitionRepository } from "@/features/competition/domain/competition-repository";

/**
 * 대회 목록 API가 나오기 전까지 쓰는 고정 데이터 (#332).
 *
 * 백엔드 대회 데이터는 아직 이름·연도뿐이라 화면을 먼저 만들기 위해 둔다. API가 나오면
 * External 저장소를 만들어 competition-use-case-factory에서 바꿔 끼우고 이 파일은 지운다.
 * 일부러 날짜순이 아니게 섞고 지난 대회도 하나 넣었다 — 정렬·지난 대회 숨김이 실제로 도는지 보이게.
 */
const FIXTURE_COMPETITIONS: Competition[] = [
  {
    id: "seoul-open-championship",
    name: "서울 오픈 챔피언십",
    date: "2026-11-22",
    place: "서울 송파",
    divisions: ["gi"],
  },
  {
    id: "incheon-autumn-open",
    name: "인천 가을 오픈",
    date: "2026-11-01",
    place: "인천",
    divisions: ["gi", "nogi"],
  },
  {
    id: "gyeonggi-youth",
    name: "경기 유소년 주짓수 대회",
    date: "2026-11-29",
    place: "수원",
    divisions: ["gi"],
    audience: "키즈",
  },
  {
    id: "gwangju-championship",
    name: "광주 주짓수 챔피언십",
    date: "2026-11-07",
    place: "광주",
    divisions: ["gi"],
  },
  {
    id: "seoul-nogi-invitational",
    name: "서울 노기 인비테이셔널",
    date: "2026-11-08",
    place: "서울 강남",
    divisions: ["nogi"],
  },
  {
    id: "daejeon-open",
    name: "대전 오픈",
    date: "2026-11-14",
    place: "대전",
    divisions: ["gi", "nogi"],
  },
  {
    id: "busan-nogi-open",
    name: "부산 노기 오픈",
    date: "2026-12-05",
    place: "부산",
    divisions: ["nogi"],
  },
  {
    id: "gyeonggi-governor-cup",
    name: "제1회 경기도지사배 생활체육 주짓수 오픈 챔피언십",
    date: "2026-12-06",
    place: "고양",
    divisions: ["gi", "nogi"],
  },
  {
    id: "daegu-open",
    name: "대구 주짓수 오픈",
    date: "2026-12-13",
    place: "대구",
    divisions: ["gi"],
  },
  {
    id: "jeju-open",
    name: "제주 오픈",
    date: "2026-12-19",
    place: "제주",
    divisions: ["gi", "nogi"],
  },
  {
    id: "new-year-open-2027",
    name: "신년 오픈 챔피언십",
    date: "2027-01-16",
    place: "서울 마포",
    divisions: ["gi"],
  },
  {
    id: "weeknight-nogi-league",
    name: "평일 저녁 노기 리그",
    date: "2026-11-18",
    place: "서울 마포",
    divisions: ["nogi"],
  },
  {
    // 장소·부문이 아직 안 나온 대회 — 둘째 줄이 빠진 모양을 보이게.
    id: "undecided-open",
    name: "연말 오픈",
    date: "2026-12-27",
    place: "",
    divisions: [],
  },
  {
    // 2월에는 대회가 없다 — 대회 없는 달을 어떻게 건너뛰는지 보이게.
    id: "spring-open-2027",
    name: "봄맞이 오픈",
    date: "2027-03-14",
    place: "인천",
    divisions: ["gi"],
  },
  {
    id: "winter-kids-cup-2027",
    name: "겨울 키즈 컵",
    date: "2027-01-17",
    place: "성남",
    divisions: ["gi"],
    audience: "키즈",
  },
];

export class FixtureCompetitionRepository implements CompetitionRepository {
  async getCompetitions(): Promise<Competition[]> {
    return FIXTURE_COMPETITIONS.map((competition) => ({ ...competition }));
  }
}
