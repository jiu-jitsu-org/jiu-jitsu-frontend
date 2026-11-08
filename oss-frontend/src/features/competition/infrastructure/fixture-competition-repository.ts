import type { Competition } from "@/features/competition/domain/competition";
import type { CompetitionRepository } from "@/features/competition/domain/competition-repository";

/**
 * 대회 목록 API가 나오기 전까지 쓰는 고정 데이터 (#332).
 *
 * 백엔드 대회 데이터는 아직 이름·연도뿐이라 화면을 먼저 만들기 위해 둔다. API가 나오면
 * External 저장소를 만들어 competition-use-case-factory에서 바꿔 끼우고 이 파일은 지운다.
 * 일부러 날짜순이 아니게 섞고 지난 대회도 하나 넣었다 — 정렬·지난 대회 숨김이 실제로 도는지 보이게.
 * 접수 일정(#333)은 2026-11-06 기준으로 접수 예정 · 접수 중(얼리버드 강조 포함) · 마감 · 미공지가 다 보이게 잡았다.
 */
const FIXTURE_COMPETITIONS: Competition[] = [
  {
    id: "seoul-open-championship",
    name: "서울 오픈 챔피언십",
    date: "2026-11-22",
    place: "서울 송파",
    region: "서울",
    divisions: ["gi"],
    registration: {
      opensOn: "2026-10-20",
      closesOn: "2026-11-16",
      earlyBirdClosesOn: "2026-11-09",
    },
  },
  {
    id: "incheon-autumn-open",
    name: "인천 가을 오픈",
    date: "2026-11-01",
    place: "인천",
    region: "인천",
    divisions: ["gi", "nogi"],
  },
  {
    id: "gyeonggi-youth",
    name: "경기 유소년 주짓수 대회",
    date: "2026-11-29",
    place: "수원",
    region: "경기",
    divisions: ["gi"],
    audience: "키즈",
    registration: {
      opensOn: "2026-10-10",
      closesOn: "2026-11-18",
      earlyBirdClosesOn: "2026-10-31",
    },
  },
  {
    id: "gwangju-championship",
    name: "광주 주짓수 챔피언십",
    date: "2026-11-07",
    place: "광주",
    region: "광주",
    divisions: ["gi"],
    registration: {
      opensOn: "2026-10-12",
      closesOn: "2026-11-01",
    },
  },
  {
    id: "seoul-nogi-invitational",
    name: "서울 노기 인비테이셔널",
    date: "2026-11-08",
    place: "서울 강남",
    region: "서울",
    divisions: ["nogi"],
    registration: {
      opensOn: "2026-10-15",
      closesOn: "2026-11-02",
    },
  },
  {
    id: "daejeon-open",
    name: "대전 오픈",
    date: "2026-11-14",
    place: "대전",
    region: "대전",
    divisions: ["gi", "nogi"],
    registration: {
      opensOn: "2026-10-20",
      closesOn: "2026-11-09",
    },
  },
  {
    id: "busan-nogi-open",
    name: "부산 노기 오픈",
    date: "2026-12-05",
    place: "부산",
    region: "부산",
    divisions: ["nogi"],
    registration: {
      opensOn: "2026-11-10",
      closesOn: "2026-11-28",
    },
  },
  {
    id: "gyeonggi-governor-cup",
    name: "제1회 경기도지사배 생활체육 주짓수 오픈 챔피언십",
    date: "2026-12-06",
    place: "고양",
    region: "경기",
    divisions: ["gi", "nogi"],
    registration: {
      opensOn: "2026-10-27",
      closesOn: "2026-11-29",
      earlyBirdClosesOn: "2026-11-06",
    },
  },
  {
    id: "daegu-open",
    name: "대구 주짓수 오픈",
    date: "2026-12-13",
    place: "대구",
    region: "대구",
    divisions: ["gi"],
    registration: {
      opensOn: "2026-11-16",
      closesOn: "2026-12-06",
      earlyBirdClosesOn: "2026-11-23",
    },
  },
  {
    id: "jeju-open",
    name: "제주 오픈",
    date: "2026-12-19",
    place: "제주",
    region: "제주",
    divisions: ["gi", "nogi"],
    registration: {
      opensOn: "2026-11-01",
      closesOn: "2026-12-05",
      earlyBirdClosesOn: "2026-11-20",
    },
  },
  {
    id: "new-year-open-2027",
    name: "신년 오픈 챔피언십",
    date: "2027-01-16",
    place: "서울 마포",
    region: "서울",
    divisions: ["gi"],
    registration: {
      opensOn: "2026-12-01",
      closesOn: "2027-01-09",
      earlyBirdClosesOn: "2026-12-15",
    },
  },
  {
    id: "weeknight-nogi-league",
    name: "평일 저녁 노기 리그",
    date: "2026-11-18",
    place: "서울 마포",
    region: "서울",
    divisions: ["nogi"],
    registration: {
      opensOn: "2026-10-25",
      closesOn: "2026-11-06",
    },
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
    region: "인천",
    divisions: ["gi"],
    registration: {
      opensOn: "2027-02-01",
      closesOn: "2027-03-07",
      earlyBirdClosesOn: "2027-02-14",
    },
  },
  {
    id: "winter-kids-cup-2027",
    name: "겨울 키즈 컵",
    date: "2027-01-17",
    place: "성남",
    region: "경기",
    divisions: ["gi"],
    audience: "키즈",
    registration: {
      opensOn: "2027-01-02",
      closesOn: "2027-01-10",
    },
  },
];

/**
 * 상세(#361~#365)에만 쓰는 정보 — 시작 시각 · 경기장 · 주최 · 공지 · 참가비 · 확인일.
 * 다 갖춘 대회, 참가비 단계가 셋인 대회, 확인하지 못한 대회, 상세 정보가 없는 대회가 섞이게 잡았다.
 * 이름은 모두 예시다.
 */
const FIXTURE_DETAILS: Record<string, Partial<Competition>> = {
  "seoul-open-championship": {
    startTime: "09:00",
    venue: "송파 체육문화회관",
    host: "서울 주짓수 협회",
    noticeUrl: "https://example.com/seoul-open-championship",
    fees: [
      { label: "얼리버드", amount: 60000, until: "2026-11-09" },
      { label: "기본 참가비", amount: 70000 },
    ],
    verifiedOn: "2026-11-04",
  },
  "gyeonggi-governor-cup": {
    startTime: "10:00",
    venue: "고양 체육관",
    host: "경기도 주짓수 협회",
    noticeUrl: "https://example.com/gyeonggi-governor-cup",
    fees: [
      { label: "얼리버드", amount: 50000, until: "2026-11-06" },
      { label: "일반 접수", amount: 60000, until: "2026-11-20" },
      { label: "마감 접수", amount: 70000 },
    ],
    verifiedOn: "2026-11-02",
  },
  "daejeon-open": {
    startTime: "09:30",
    host: "대전 주짓수 클럽 연합",
    noticeUrl: "https://example.com/daejeon-open",
    fees: [{ label: "기본 참가비", amount: 65000 }],
  },
  "busan-nogi-open": {
    venue: "부산 사직 보조경기장",
    host: "부산 노기 리그",
    noticeUrl: "https://example.com/busan-nogi-open",
    fees: [{ label: "기본 참가비", amount: 55000 }],
    verifiedOn: "2026-11-05",
  },
  "gwangju-championship": {
    startTime: "09:00",
    venue: "광주 염주체육관",
    host: "광주 주짓수 협회",
    noticeUrl: "https://example.com/gwangju-championship",
    fees: [{ label: "기본 참가비", amount: 60000 }],
    verifiedOn: "2026-10-28",
  },
  "incheon-autumn-open": {
    host: "인천 주짓수 협회",
    noticeUrl: "https://example.com/incheon-autumn-open",
  },
};

function withDetails(competition: Competition): Competition {
  return { ...competition, ...FIXTURE_DETAILS[competition.id] };
}

export class FixtureCompetitionRepository implements CompetitionRepository {
  async getCompetitions(): Promise<Competition[]> {
    return FIXTURE_COMPETITIONS.map(withDetails);
  }

  async getCompetition(id: string): Promise<Competition | null> {
    const competition = FIXTURE_COMPETITIONS.find((item) => item.id === id);
    return competition ? withDetails(competition) : null;
  }
}
