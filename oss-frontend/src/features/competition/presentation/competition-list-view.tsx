"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useIsSignedIn } from "@/features/auth/presentation/auth-provider";
import { useLoginGuard } from "@/features/community/presentation/use-login-guard";
import type { BeltRank } from "@/features/community/domain/belt";
import type {
  CompetitionListChunk,
  CompetitionListItem,
} from "@/features/competition/application/get-competition-list-page-data";
import {
  COMPETITION_LIST_PAGE_SIZE,
  groupByMonth,
  type Competition,
} from "@/features/competition/domain/competition";
import {
  EMPTY_COMPETITION_FILTER,
  competitionListQueryOf,
  hasNameQuery,
  isCompetitionFilterEmpty,
  type CompetitionFilter,
} from "@/features/competition/domain/competition-filter";
import { bannerSlotQueue } from "@/features/competition/domain/competition-banner-slot";
import {
  deadlineSoonInterested,
  eventSoonInterested,
} from "@/features/competition/domain/competition-interest-banner";
import type { CompetitionRegion } from "@/features/competition/domain/competition-region";
import type { ResultCardGroup } from "@/features/competition/domain/competition-result-prompt";
import {
  CompetitionBannerSlot,
  dismissBannerSlotItem,
  useBannerSlot,
} from "@/features/competition/presentation/competition-banner-slot";
import { CompetitionCalendar } from "@/features/competition/presentation/competition-calendar";
import {
  CompetitionTopTint,
  isDeadlineBannerDismissed,
  smoothOutEasing,
} from "@/features/competition/presentation/competition-interest-banner";
import { RegistrationIcon } from "@/features/competition/presentation/competition-icons";
import {
  MonthSection,
  monthLabel,
} from "@/features/competition/presentation/competition-month-section";
import { CompetitionRegionSheet } from "@/features/competition/presentation/competition-region-sheet";
import { CompetitionSearchField } from "@/features/competition/presentation/competition-search-field";
import {
  useOpenCompetitionDetail,
  useRefreshAfterDetail,
} from "@/features/competition/presentation/competition-detail-link";
import {
  loadCompetitionListAction,
  type LoadCompetitionListResult,
} from "@/features/competition/presentation/actions/load-competition-list-action";
import { useCompetitionInterest } from "@/features/competition/presentation/use-competition-interest";
import { useMyBeltRank } from "@/features/competition/presentation/use-my-belt-rank";
import { cn } from "@/shared/lib/cn";
import {
  CalendarIcon,
  ChevronDownIcon,
  HeartIcon,
  ListIcon,
  SearchIcon,
  useToast,
} from "@/shared/ui";
import { Chip } from "@/shared/ui/chip";
import { EmptyState } from "@/shared/ui/empty-state";
import { IconButton } from "@/shared/ui/icon-button";

/**
 * 대회 목록 + 위 필터 줄 (#334·#396) — 지금 달 · 지역 · 접수 중 (+ 관심 하트 · 목록/달력).
 *
 * 거르기는 서버가 한다(#419) — 칩을 바꾸면 그 조건의 첫 페이지를 Server Action으로 받고, 받기 전까지는 앞 결과를 둔다.
 * 아래 끝에 닿으면 다음 페이지를 이어 받는다. 필터 줄은 목록을 내려도 위에 붙어 있어 언제든 바꿀 수 있다.
 * 대회가 하나도 없는 달은 달 이름까지 뺀다. 조건에 맞는 다가오는 대회가 없으면 가장 최근 지난 대회를 보여 주고
 * (지난 대회만 있는 지역), 지난 대회도 없으면 빈 목록 안내를 띄운다.
 * 관심 하트와 목록 ↔ 달력은 화면 전체에 걸리는 동작이라 앱 '대회' 머리에 둔다(#396). 앱이 그 버튼을 모르면
 * (구버전 앱·브라우저) 필터 줄 오른쪽 끝에 같은 버튼을 그린다.
 *
 * 관심은 로그인한 사용자만 갖는다. 비로그인이 누르면 다른 화면의 좋아요와 같은 로그인 안내를 띄우고
 * (외부 브라우저면 앱 안내), 필터는 켜지 않는다 — 켜 봐야 늘 빈 결과다.
 */
export function CompetitionListView({
  list,
  currentYear,
  today,
  interestedUpcoming,
  myBeltRank,
  endedInterested,
  availableRegions,
}: {
  /** 필터 없이 받은 오늘 이후 대회 첫 페이지 */
  list: CompetitionListChunk;
  currentYear: number;
  /** 한국 날짜 "YYYY-MM-DD" — 응답의 today. */
  today: string;
  /** 다가오는(접수 예정·접수 중·접수 마감) 내 관심 대회 — 곧 마감·곧 열려요 배너 후보(#396). */
  interestedUpcoming: CompetitionListItem[];
  /** 내 띠 — 위 그라데이션 색. 없으면 흰띠. */
  myBeltRank: BeltRank | null;
  /** 끝난 지 며칠 안 된 내 관심 대회 묶음(#403) — 배너 자리의 결과 남기기 배너. */
  endedInterested: ResultCardGroup[];
  /** 지역 시트에서 고를 수 있는 시·도 — 공개 대회(지난 대회 포함)가 있는 곳. 못 받았으면 17개 모두. */
  availableRegions: readonly CompetitionRegion[];
}) {
  const [filter, setFilter] = useState<CompetitionFilter>(
    EMPTY_COMPETITION_FILTER,
  );
  const [regionSheetOpen, setRegionSheetOpen] = useState(false);
  // 시트를 열 때마다 key를 바꿔 고르던 값을 지금 필터로 다시 시작한다.
  const [regionSheetKey, setRegionSheetKey] = useState(0);
  // 기본은 목록이다 — 대회가 거의 토·일에 몰려 달력을 먼저 펼치면 빈 칸이 대부분이다(#339).
  const [mode, setMode] = useState<"list" | "calendar">("list");
  // 이름 검색(#345)은 돋보기를 눌러야 열린다. 닫으면 검색어도 지운다 — 안 보이는 검색어로 걸러지지 않게.
  const [searchOpen, setSearchOpen] = useState(false);
  // 필터 줄(칩 + 열린 검색칸)과 목록 — 스크롤하며 어느 달 머리가 필터 줄 밑으로 지나갔는지 잰다.
  // 지나간 마지막 달이 필터 줄 왼쪽의 '지금 달'이다. 아무 달도 안 지났으면(맨 위) 첫 달.
  const filterBarRef = useRef<HTMLDivElement>(null);
  const filterBarBackgroundRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [passedMonthIndex, setPassedMonthIndex] = useState<number | null>(null);

  const signedIn = useIsSignedIn();
  // 서버가 띠를 못 받아 흰띠로 그렸어도 화면에서 다시 읽어 내 띠로 바로잡는다(#388).
  const beltRank = useMyBeltRank(myBeltRank, signedIn);
  const { guard } = useLoginGuard();
  const toast = useToast();

  // 관심 상태의 서버 값 — 첫 그림의 대회들에 이어 받은 페이지·달력 달의 대회를 더해 간다.
  const [known, setKnown] = useState(() =>
    knownInterestOf(
      initialCompetitions(list, interestedUpcoming, endedInterested),
    ),
  );
  // 필터 없는 목록(첫 페이지 + 이어 받은 페이지)과 마지막으로 받은 필터 결과.
  const [base, setBase] = useState<ListState>(() =>
    toListState(EMPTY_KEY, list),
  );
  const [filtered, setFiltered] = useState<ListState | null>(null);
  const [interestResetKey, setInterestResetKey] = useState(list);
  const absorb = useCallback((competitions: Competition[]) => {
    if (competitions.length > 0) {
      setKnown((current) => mergeKnownInterest(current, competitions));
    }
  }, []);
  const interest = useCompetitionInterest({
    interestedIds: known.ids,
    interestCounts: known.counts,
    resetKey: interestResetKey,
  });
  // 서버가 다시 그리면(상세에서 돌아옴 등) 이어 받은 페이지·필터 결과는 그대로 두고 관심 값만 맞춘다 —
  // 이 화면에서 누른 결과를 먼저 접어 넣고 새 서버 값으로 덮는다. 필터를 켠 채 돌아와도 거르지 않은 목록이 깜빡이지 않는다.
  // 로그인 상태가 바뀌었으면 관심 값이 통째로 달라져 처음부터 다시 모은다.
  const [seen, setSeen] = useState({ list, signedIn });
  if (seen.list !== list || seen.signedIn !== signedIn) {
    const fresh = initialCompetitions(
      list,
      interestedUpcoming,
      endedInterested,
    );
    if (seen.signedIn !== signedIn) {
      setKnown(knownInterestOf(fresh));
      setBase(toListState(EMPTY_KEY, list));
      setFiltered(null);
    } else {
      setKnown((current) =>
        mergeKnownInterest(foldInterest(current, interest), fresh),
      );
    }
    setSeen({ list, signedIn });
    setInterestResetKey(list);
  }
  // 상세에서 관심을 바꾸고 돌아오면 그 값으로 다시 그린다(#362).
  useRefreshAfterDetail();

  // 로그아웃했거나 세션이 만료돼 비로그인으로 판정되면 켜 두었던 관심 필터는 풀린 것으로 본다 —
  // 남겨 두면 이전 관심 목록으로 거르거나(서버가 막는다) 늘 빈 결과만 보인다.
  const activeFilter = useMemo(
    () => (signedIn ? filter : { ...filter, interestedOnly: false }),
    [filter, signedIn],
  );
  const serverQuery = useMemo(
    () => competitionListQueryOf(activeFilter),
    [activeFilter],
  );
  const queryKey = isCompetitionFilterEmpty(activeFilter)
    ? EMPTY_KEY
    : JSON.stringify(serverQuery);
  // 받기 전에는 앞 결과를 그대로 둔다 — 칩을 누를 때마다 목록이 비었다 차지 않게.
  const shown = queryKey === EMPTY_KEY ? base : (filtered ?? base);
  const shownSettled = shown.key === queryKey;

  // 마지막으로 받은 필터 — 받기에 실패하면 칩을 이 값으로 되돌린다. 필터를 비우면 바로 그 값이 된다.
  const [appliedFilter, setAppliedFilter] = useState(filter);
  if (queryKey === EMPTY_KEY && appliedFilter !== filter)
    setAppliedFilter(filter);
  useEffect(() => {
    // 달력은 달마다 따로 받는다 — 목록 결과는 목록으로 돌아왔을 때 받는다.
    if (mode === "calendar") return;
    if (queryKey === EMPTY_KEY || filtered?.key === queryKey) return;
    let cancelled = false;
    void loadCompetitionListAction({
      ...serverQuery,
      size: COMPETITION_LIST_PAGE_SIZE,
    })
      // 연결이 끊겨 호출 자체가 실패해도(오프라인·웹뷰 끊김) 같은 실패 갈래로 처리한다.
      .catch((): LoadCompetitionListResult => ({ ok: false, reason: "failed" }))
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          toast.show("대회를 불러오지 못했어요. 다시 시도해 주세요", {
            tone: "error",
          });
          setFilter(appliedFilter);
          return;
        }
        absorb(result.chunk.items.map(({ competition }) => competition));
        setFiltered(toListState(queryKey, result.chunk));
        setAppliedFilter(filter);
      });
    return () => {
      cancelled = true;
    };
    // serverQuery·filter는 queryKey가 바뀔 때만 다시 본다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, filtered?.key, mode]);

  // 아래 끝에 닿으면 다음 페이지를 이어 받는다 — 지금 보는 조건 그대로, date 없이 커서만.
  // 실패한 커서는 다시 부르지 않는다 — 끝 표시가 계속 보여 끝없이 다시 부르게 된다(새로 그리면 다시 시도한다).
  const loadingMore = useRef(false);
  const [failedCursor, setFailedCursor] = useState<string | null>(null);
  const loadMore = useCallback(() => {
    if (!shownSettled || !shown.nextCursor || loadingMore.current) return;
    if (shown.nextCursor === failedCursor) return;
    const key = shown.key;
    const cursor = shown.nextCursor;
    loadingMore.current = true;
    void loadCompetitionListAction({
      ...serverQuery,
      cursor,
      size: COMPETITION_LIST_PAGE_SIZE,
    })
      // 연결이 끊겨 호출 자체가 실패해도(오프라인·웹뷰 끊김) 같은 실패 갈래로 처리한다.
      .catch((): LoadCompetitionListResult => ({ ok: false, reason: "failed" }))
      .then((result) => {
        if (!result.ok) {
          setFailedCursor(cursor);
          return;
        }
        absorb(result.chunk.items.map(({ competition }) => competition));
        const append = (current: ListState | null) =>
          current && current.key === key && current.nextCursor === cursor
            ? {
                key,
                items: [...current.items, ...result.chunk.items],
                nextCursor: result.chunk.nextCursor,
              }
            : current;
        if (key === EMPTY_KEY) setBase((current) => append(current) ?? current);
        else setFiltered(append);
      })
      .finally(() => {
        loadingMore.current = false;
      });
  }, [absorb, failedCursor, serverQuery, shown, shownSettled]);
  const moreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sentinel = moreRef.current;
    if (!sentinel || !shown.nextCursor) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, shown.nextCursor]);

  const visibleMonths = useMemo(() => {
    // 관심만 보는 중에 이 화면에서 해제하면 바로 뺀다(서버 결과는 누르기 전 값이다).
    const items = activeFilter.interestedOnly
      ? shown.items.filter(({ competition }) =>
          interest.interestedIds.has(competition.id),
        )
      : shown.items;
    return groupByMonth(items, ({ competition }) => competition.date);
  }, [activeFilter.interestedOnly, interest.interestedIds, shown.items]);

  // 달 머리가 필터 줄 밑으로 지나가면 필터 줄 왼쪽의 달 이름을 그 달로 바꾼다(#396).
  // 전에는 지나간 달 머리를 필터 줄 아래에 한 줄 더 이어 달았는데, 위에 붙는 줄이 둘이 되어 한 줄로 합쳤다.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      // 검색칸을 여닫으며 목록이 미끄러지는 동안은 옮겨 둔 자리라 재지 않는다 — 끝나면 다시 잰다.
      if (belowBarRef.current?.getAnimations().length) return;
      const barBottom = filterBarRef.current?.offsetHeight ?? 0;
      // 목록 속 달 글자가 필터 줄 아래 끝에 닿는 순간 바꾼다 — 그 달 머리가 줄 밑으로 들어가며 이름을 넘겨준다.
      const labels = Array.from(
        list.querySelectorAll("section > h2 [data-month-label]"),
      );
      let passed: number | null = null;
      for (const [index, label] of labels.entries()) {
        if (label.getBoundingClientRect().top <= barBottom + 0.5)
          passed = index;
      }
      setPassedMonthIndex(passed);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [mode, visibleMonths, searchOpen]);
  // 달력은 제 머리에 달을 크게 보여 주므로 필터 줄의 달 이름은 목록에서만 둔다.
  const currentMonth =
    mode === "list"
      ? // 필터로 달이 줄면 잰 값이 다시 재기 전까지 범위를 벗어날 수 있다 — 그동안은 첫 달을 보인다.
        (visibleMonths[passedMonthIndex ?? 0] ?? visibleMonths[0])
      : undefined;

  // 배너 자리 — 필터 줄 바로 아래에 한 번에 한 장(결과 남기기 · 곧 마감). 당겨서 새로고침할 때마다 다음 장으로 넘긴다.
  // 곧 마감(#396)은 필터와 무관하게 내 관심 대회 전체에서 접수 마감이 일주일 안인 대회, 대회마다 한 장.
  // 결과 남기기(#403)는 끝난 지 며칠 안 된 관심 대회 묶음 — 서버가 그린 뒤 관심을 끈 대회는 뺀다.
  // 비로그인이면 관심이 없어 둘 다 비어 있다.
  const bannerQueue = useMemo(() => {
    if (!signedIn) return [];
    const results = endedInterested
      .map((group) => ({
        ...group,
        competitions: group.competitions.filter(({ id }) =>
          interest.interestedIds.has(id),
        ),
      }))
      .filter((group) => group.competitions.length > 0);
    // 다가오는(접수 예정·접수 중·접수 마감) 관심 대회 + 목록에서 이 화면에서 관심 등록한 대회 — 필터와 무관하다.
    const candidates = new Map<number, CompetitionListItem>();
    for (const item of [...interestedUpcoming, ...base.items]) {
      if (!candidates.has(item.competition.id)) {
        candidates.set(item.competition.id, item);
      }
    }
    const deadlines = deadlineSoonInterested(
      [...candidates.values()],
      interest.interestedIds,
      today,
    );
    // 곧 열려요 — 같은 대회의 곧 마감이 떠 있으면 그게 먼저라 뺀다. 곧 마감을 ✕로 닫은 대회는 곧 열려요로 다시 알린다.
    const events = eventSoonInterested(
      [...candidates.values()],
      interest.interestedIds,
      today,
      new Set(
        deadlines
          .filter((deadline) => !isDeadlineBannerDismissed(deadline))
          .map(({ competition }) => competition.id),
      ),
    );
    return bannerSlotQueue(results, deadlines, events);
  }, [
    base.items,
    endedInterested,
    interest.interestedIds,
    interestedUpcoming,
    signedIn,
    today,
  ]);
  const bannerSlot = useBannerSlot(bannerQueue);
  const bannerDecided = bannerSlot.item !== null;
  // 배너는 목록보다 반 박자 늦게 들어온다 — 목록이 다 보인 뒤 배너 자리가 열리며 내려와 눈이 그리로 간다.
  // 화면이 실제로 보일 때부터 센다: 앱은 대회 탭 웹을 안 보이는 채로 미리 불러 두고(#271), 처음 불러올 때는
  // 로딩 덮개가 0.5초에 걸쳐 걷힌다(#261) — 그 뒤에 내려와야 눈에 보인다. 당겨서 새로고침도 같은 박자다.
  // 이 문서에서 한 번 들어왔으면(웹에서 상세에 갔다 돌아와 목록을 다시 그릴 때) 다시 기다리지 않는다.
  const [bannerEntered, setBannerEntered] = useState(
    () => bannerEnteredInDocument,
  );
  useEffect(() => {
    if (bannerEntered || !bannerDecided) return;
    // 움직임 줄이기를 켰으면 기다리지 않는다.
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : BANNER_ENTRANCE_DELAY;
    let timer = 0;
    const start = () => {
      if (document.visibilityState !== "visible" || timer) return;
      timer = window.setTimeout(() => {
        bannerEnteredInDocument = true;
        setBannerEntered(true);
      }, delay);
    };
    // 세는 도중 탭을 떠나면 멈췄다가 돌아오면 처음부터 다시 센다.
    const onVisibility = () => {
      if (document.visibilityState === "visible") return start();
      window.clearTimeout(timer);
      timer = 0;
    };
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [bannerEntered, bannerDecided]);
  // 달력에서는 배너를 걷는다 — 달력 칸이 첫 화면에 다 들어와야 날짜를 고를 수 있다.
  const decidedBanner = mode === "list" ? bannerSlot.item : null;
  const banner = bannerEntered ? decidedBanner : null;
  // ✕를 눌러 접히는 중인 배너 — 접히는 0.5초 동안 ✕를 또 눌러도 움직임이 겹치지 않게 막는다(그라데이션과는 무관).
  const [closingKey, setClosingKey] = useState<string | null>(null);
  // 위 그라데이션(내 띠 색, 로그인 전·띠를 모르면 흰띠 색)은 배너가 없어도 늘 깐다 — 관심 대회가 없어도
  // 대회 탭 맨 위는 같은 얼굴이다. 배너 자리가 정해진 뒤(서버 그림·첫 그림이 지난 뒤) 한 번 옅게 들어오고,
  // 배너를 닫거나 달력으로 바꿔도 걷지 않는다.
  const tintShown = bannerSlot.ready ? true : null;

  // 배너 자리·검색칸 높이가 바뀌면 그 아래(배너·목록)가 한 번에 밀린다. 밀린 만큼 거꾸로 옮겨 놓고 제자리로
  // 미끄러지게 해(0.5초) 함께 움직이게 한다 — 배너가 처음 뜨면 필터 줄 밑에서 내려오며 목록을 밀어낸다.
  // 높이는 움직이지 않고 위치(transform)만 움직이며, 끝나면 아무것도 남기지 않는다.
  const belowBarRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const lastBelowBarTop = useRef<{ top: number; mode: string } | null>(null);
  const lastBannerKey = useRef<string | null>(null);
  const collapsingRef = useRef(false);
  const bannerKey = banner?.key ?? null;
  useLayoutEffect(() => {
    const element = belowBarRef.current;
    const barHeight = filterBarRef.current?.offsetHeight ?? 0;
    const top = barHeight + (slotRef.current?.offsetHeight ?? 0);
    // 처음에는 배너 없이 그린 것으로 본다 — 첫 그림 뒤에 배너가 뜨면 내려오게.
    const last = lastBelowBarTop.current ?? { top: barHeight, mode };
    lastBelowBarTop.current = { top, mode };
    // 배너가 새로 들어온 그림인지 — 검색칸이 열려 밀릴 때는 배너를 다시 옅게 하지 않는다.
    const bannerArrived = lastBannerKey.current === null && bannerKey !== null;
    lastBannerKey.current = bannerKey;
    if (!element) return;
    // ✕로 접은 뒤 — 접히는 동안 이미 위로 옮겨 두었으니 그 옮김만 걷어 낸다(그림 직전이라 튀지 않는다).
    if (collapsingRef.current) {
      collapsingRef.current = false;
      for (const running of element.getAnimations()) running.cancel();
      return;
    }
    // 목록 ↔ 달력은 화면이 통째로 바뀌어 미끄러지지 않는다.
    const shift = last.top - top;
    if (shift === 0 || last.mode !== mode) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // 미끄러지는 도중에 다시 바뀌면 지금 보이는 자리에서 이어 간다(처음 자리로 튀지 않게).
    const current = new DOMMatrixReadOnly(getComputedStyle(element).transform)
      .m42;
    for (const running of element.getAnimations()) running.cancel();
    const timing = { duration: 500, easing: smoothOutEasing() };
    const animation = element.animate(
      [
        { transform: `translateY(${shift + current}px)` },
        { transform: "none" },
      ],
      timing,
    );
    // 배너가 새로 들어오면 필터 줄 밑에서 내려오며 함께 짙어진다(한 동작).
    if (bannerArrived && slotRef.current) {
      slotRef.current.animate([{ opacity: 0 }, { opacity: 1 }], timing);
    }
    // 움직이는 동안 잰 달 머리 위치는 옮겨 둔 자리라, 끝나면 다시 잰다.
    animation.onfinish = () => window.dispatchEvent(new Event("scroll"));
  }, [searchOpen, bannerKey, mode]);

  // ✕ — 배너가 필터 줄 밑으로 올라가며 옅어지고 목록이 따라 올라온다(0.5초). 다 접히면 닫은 기록을 남겨
  // 자리를 비운다. 다음 새로고침에서 다음 장이 뜬다.
  const closeBanner = (item: NonNullable<typeof banner>) => {
    const element = belowBarRef.current;
    const slot = slotRef.current;
    if (
      !element ||
      !slot ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      dismissBannerSlotItem(item);
      return;
    }
    // 접히는 중에 ✕를 또 누르면 무시한다(움직임이 겹쳐 쌓이지 않게).
    if (closingKey === item.key) return;
    setClosingKey(item.key);
    collapsingRef.current = true;
    const timing = {
      duration: 500,
      easing: smoothOutEasing(),
      fill: "forwards",
    } as const;
    for (const running of element.getAnimations()) running.cancel();
    slot.animate([{ opacity: 1 }, { opacity: 0 }], timing);
    const collapse = element.animate(
      [
        { transform: "none" },
        { transform: `translateY(${-slot.offsetHeight}px)` },
      ],
      timing,
    );
    // 다 접혀도, 접히는 도중 검색칸·달력 전환으로 움직임이 끊겨도 닫은 기록은 꼭 남긴다.
    let dismissed = false;
    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      dismissBannerSlotItem(item);
    };
    collapse.onfinish = dismiss;
    collapse.oncancel = dismiss;
  };

  // 필터 줄 바탕은 줄 아래로 8px 더 내려와 지나가는 카드를 옅게 지운다. 맨 위에 서 있을 때는 그 8px이
  // 바로 아래 배너 윗부분을 덮어 검은 배너 위로 회색 막이 비쳐, 스크롤한 만큼만(최대 8px) 내려오게 한다.
  useEffect(() => {
    const background = filterBarBackgroundRef.current;
    if (!background) return;
    const update = () => {
      const reach = Math.min(
        Math.max(window.scrollY, 0),
        FILTER_BAR_FADE_OUTSIDE,
      );
      background.style.bottom = `${-reach}px`;
    };
    update();
    // 위 그라데이션이 같은 스크롤에서 줄 바탕을 다시 칠하기 전에(다음 프레임) 높이를 먼저 맞춘다.
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  // 배너에서 누른 대회는 상세로 바로 연다(#361) — 목록 줄을 누른 것과 같다.
  const openDetail = useOpenCompetitionDetail();

  const toggle = (key: "interestedOnly" | "openOnly") =>
    setFilter((current) => ({ ...current, [key]: !current[key] }));

  const toggleInterested = () => toggle("interestedOnly");
  // 비로그인이 누르면 필터는 켜지 않고 로그인 안내만 — 켜 봐야 늘 빈 결과다.
  const pressInterested = signedIn
    ? toggleInterested
    : guard(toggleInterested, "관심 대회는 OSS 앱에서 로그인 후 볼 수 있어요.");
  const toggleMode = () =>
    setMode((current) => (current === "list" ? "calendar" : "list"));

  const setNameQuery = (nameQuery: string) =>
    setFilter((current) => ({ ...current, nameQuery }));

  const closeSearch = () => {
    setSearchOpen(false);
    setNameQuery("");
    // 입력칸이 사라지면 초점이 화면 맨 앞으로 튀지 않게 돋보기로 돌려준다.
    document.getElementById(SEARCH_BUTTON_ID)?.focus();
  };

  // 검색어만 걸려서 비었으면 검색어 탓이라고 말하고, 검색어만 지우게 한다.
  const emptyBySearchOnly =
    hasNameQuery(filter.nameQuery) &&
    isCompetitionFilterEmpty({ ...activeFilter, nameQuery: "" });

  return (
    <>
      <CompetitionTopTint
        rank={beltRank ?? "white"}
        shown={tintShown}
        barRef={filterBarBackgroundRef}
      />
      {/* 필터 줄: 좌우 16 · 칩 간격 8, 넘치면 가로 스크롤(스크롤바 숨김) — 글쓰기 카테고리 칩 줄과 같은 규격.
          바탕은 꽉 채워(띠 색이 깔려 있으면 그 자리의 그라데이션 구간 — CompetitionTopTint가 칠한다, 아니면 목록 바탕색) 아래로 지나가는 카드·배너가
          줄 뒤로 깔끔히 숨게 하고, 줄 아래 끝 16px(줄 안 8 + 밖 8)에서만 완만하게(ease) 지워 선 없이 목록으로 녹아들게 한다.
          반투명 + 흐림으로 비치게 하면 검은 배너가 지날 때 줄 뒤에 탁한 회색 띠가 남아 쓰지 않는다.
          왼쪽 끝에 지금 달(#396), 앱이 머리 버튼을 모르면 오른쪽 끝에 관심 하트 · 목록 ↔ 달력(#339)을 고정해 둔다 —
          칩이 늘어 가로로 밀어도 늘 같은 자리에 있게. */}
      <div className="sticky top-0 z-10 [overflow-anchor:none]">
        <div
          aria-hidden
          ref={filterBarBackgroundRef}
          className="pointer-events-none absolute inset-x-0 top-0 bottom-0 bg-surface-container"
          style={{
            maskImage: FILTER_BAR_FADE,
            WebkitMaskImage: FILTER_BAR_FADE,
          }}
        />
        <div id={FILTER_BAR_ID} ref={filterBarRef} className="relative">
          <div className="flex items-center">
            {currentMonth ? (
              // 목록 속 달 머리(h2)가 뜻을 맡으니 여기는 보이기만 한다. 달 머리 글자와 같은 모양.
              <span
                aria-hidden
                className="flex-none pl-4 text-[13px] leading-[18px] font-semibold whitespace-nowrap text-text-secondary tabular-nums"
              >
                {monthLabel(currentMonth, currentYear)}
              </span>
            ) : null}
            <div
              className={cn(
                "flex min-w-0 flex-1 gap-2 overflow-x-auto py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                currentMonth ? "pl-3" : "pl-4",
                "pr-2",
              )}
            >
              <Chip
                tone="primary"
                selected={filter.regions.length > 0}
                aria-haspopup="dialog"
                // 시트를 여는 칩이라 aria-pressed 대신 이름에 고른 지역을 담는다.
                aria-label={
                  filter.regions.length > 0
                    ? `지역: ${filter.regions.join(", ")}`
                    : "지역: 전체"
                }
                onClick={() => {
                  setRegionSheetKey((key) => key + 1);
                  setRegionSheetOpen(true);
                }}
                className={cn(
                  "gap-0.5 pr-2",
                  filter.regions.length > 0 ? null : CHIP_ON_TINT,
                )}
              >
                {regionLabel(filter.regions)}
                <ChevronDownIcon size={16} />
              </Chip>
              <Chip
                tone="primary"
                selected={filter.openOnly}
                aria-pressed={filter.openOnly}
                onClick={() => toggle("openOnly")}
                className={cn(
                  "gap-1 pl-2.5",
                  filter.openOnly ? null : CHIP_ON_TINT,
                )}
              >
                <RegistrationIcon stage="open" size={16} />
                접수 중
              </Chip>
            </div>
            {COMPETITION_SEARCH_ENABLED ? (
              <IconButton
                id={SEARCH_BUTTON_ID}
                aria-label="대회 이름 검색"
                aria-expanded={searchOpen}
                aria-controls={searchOpen ? SEARCH_INPUT_ID : undefined}
                onClick={() =>
                  searchOpen ? closeSearch() : setSearchOpen(true)
                }
                className={searchOpen ? "text-primary" : undefined}
              >
                <SearchIcon size={22} />
              </IconButton>
            ) : null}
            {/* 하트(관심만 보기)와 목록 ↔ 달력은 칩처럼 바로 아래 목록을 바꾸는 도구라 같은 줄 오른쪽 끝에 둔다.
                앱 머리줄의 알림함은 다른 화면으로 가는 입구라 그쪽에 따로 남긴다. */}
            {/* 관심은 대회 줄의 관심 버튼과 같은 하트·같은 빨강이라 무엇을 거르는지 바로 읽힌다. */}
            <IconButton
              aria-label="관심 대회만 보기"
              aria-pressed={activeFilter.interestedOnly}
              onClick={pressInterested}
            >
              <HeartIcon
                size={22}
                filled={activeFilter.interestedOnly}
                className={
                  activeFilter.interestedOnly
                    ? "text-reaction-bar-active-like-icon"
                    : undefined
                }
              />
            </IconButton>
            <IconButton
              aria-label={mode === "list" ? "달력으로 보기" : "목록으로 보기"}
              onClick={toggleMode}
              className="mr-2"
            >
              {mode === "list" ? (
                <CalendarIcon size={22} />
              ) : (
                <ListIcon size={22} />
              )}
            </IconButton>
          </div>
          {COMPETITION_SEARCH_ENABLED && searchOpen ? (
            <CompetitionSearchField
              id={SEARCH_INPUT_ID}
              value={filter.nameQuery}
              onChange={setNameQuery}
              onClose={closeSearch}
            />
          ) : null}
        </div>
      </div>

      {/* 브라우저가 스크롤을 몰래 고쳐 목록을 제자리에 붙잡으면(크롬) 위 미끄러짐과 어긋나, 여기서는 끈다 —
          사파리처럼 늘 검색칸만큼 밀리고 그 밀림을 미끄러지게 보여 준다. */}
      <div ref={belowBarRef} className="[overflow-anchor:none]">
        {banner ? (
          // 한 번에 한 장. 아래 여백까지 자리 높이에 넣어, 접히고 펼쳐질 때 목록이 그만큼 움직인다.
          <div ref={slotRef} className="px-4 pb-3">
            <CompetitionBannerSlot
              item={banner}
              today={today}
              onSelectCompetition={(competition) => openDetail(competition.id)}
              onClose={() => closeBanner(banner)}
            />
          </div>
        ) : null}

        {mode === "calendar" ? (
          // 달력은 걸러서 비어도 그대로 둔다 — 달을 넘기며 다른 날을 볼 수 있어야 한다.
          <CompetitionCalendar
            // 조건이 바뀌면 처음 고를 날도 새 목록으로 다시 정한다.
            key={queryKey}
            query={serverQuery}
            // 이 조건의 목록을 아직 받지 않았으면(달력에서 필터를 바꿈) 달력이 받은 달에서 첫 대회 날을 찾는다.
            initialDate={
              shownSettled
                ? (visibleMonths[0]?.items[0]?.competition.date ?? today)
                : today
            }
            seekFirstDay={!shownSettled}
            today={today}
            currentYear={currentYear}
            interest={interest}
            interestedOnly={activeFilter.interestedOnly}
            filtered={!isCompetitionFilterEmpty(activeFilter)}
            onLoad={absorb}
          />
        ) : visibleMonths.length === 0 && shownSettled ? (
          <EmptyState
            title={
              emptyBySearchOnly
                ? "이름이 맞는 대회가 없어요"
                : "조건에 맞는 대회가 없어요"
            }
            action={
              emptyBySearchOnly
                ? { label: "검색어 지우기", onClick: () => setNameQuery("") }
                : {
                    label: "필터 지우기",
                    // 검색칸이 열려 있으면 검색어도 함께 비운다 — EMPTY에 빈 검색어가 들어 있다.
                    onClick: () => setFilter(EMPTY_COMPETITION_FILTER),
                  }
            }
            className="pt-[30vh]"
          />
        ) : (
          <div ref={listRef} className="pb-6">
            {visibleMonths.map((month, index) => (
              <MonthSection
                key={`${month.year}-${month.month}`}
                month={month}
                currentYear={currentYear}
                interest={interest}
                // 첫 달은 필터 줄 왼쪽에 늘 떠 있어 목록 속 머리는 감춘다 — 같은 달이 두 번 보이지 않게.
                hideHeading={index === 0}
              />
            ))}
            {/* 아래 끝 표시 — 닿으면 다음 페이지를 받는다. */}
            {shown.nextCursor ? <div ref={moreRef} aria-hidden /> : null}
          </div>
        )}
      </div>

      <CompetitionRegionSheet
        key={regionSheetKey}
        open={regionSheetOpen}
        selected={filter.regions}
        // 공개 대회(지난 대회 포함)가 있는 지역만 고를 수 있다(backend#206) — 못 받았으면 17개 모두.
        available={availableRegions}
        onDismiss={() => setRegionSheetOpen(false)}
        onApply={(regions) => {
          setFilter((current) => ({ ...current, regions }));
          setRegionSheetOpen(false);
        }}
      />
    </>
  );
}

const FILTER_BAR_ID = "competition-filter-bar";

/** 필터 없는 목록의 이름 */
const EMPTY_KEY = "";

/** 한 조건으로 받은 목록 — key는 조건 이름(필터 없음은 EMPTY_KEY). */
type ListState = {
  key: string;
  items: CompetitionListItem[];
  nextCursor: string | null;
};

function toListState(key: string, chunk: CompetitionListChunk): ListState {
  return { key, items: chunk.items, nextCursor: chunk.nextCursor };
}

type KnownInterest = { ids: number[]; counts: Record<number, number> };

function initialCompetitions(
  list: CompetitionListChunk,
  interestedUpcoming: readonly CompetitionListItem[],
  endedInterested: readonly ResultCardGroup[],
): Competition[] {
  return [
    ...interestedUpcoming.map(({ competition }) => competition),
    ...endedInterested.flatMap((group) => group.competitions),
    ...list.items.map(({ competition }) => competition),
  ];
}

/** 이 화면에서 누른 결과를 서버 값처럼 접어 넣는다 — 관심 덮어쓰기가 비워지기 전에. */
function foldInterest(
  current: KnownInterest,
  interest: {
    isInterested: (id: number) => boolean;
    countOf: (id: number) => number;
  },
): KnownInterest {
  const ids: number[] = [];
  const counts: Record<number, number> = {};
  for (const key of Object.keys(current.counts)) {
    const id = Number(key);
    counts[id] = interest.countOf(id);
    if (interest.isInterested(id)) ids.push(id);
  }
  return { ids, counts };
}

function knownInterestOf(competitions: readonly Competition[]): KnownInterest {
  return mergeKnownInterest({ ids: [], counts: {} }, competitions);
}

/** 새로 받은 대회의 관심 값으로 덮는다 — 늦게 받은 값이 더 새 값이다. */
function mergeKnownInterest(
  current: KnownInterest,
  competitions: readonly Competition[],
): KnownInterest {
  const ids = new Set(current.ids);
  const counts = { ...current.counts };
  for (const competition of competitions) {
    counts[competition.id] = competition.interestCount;
    if (competition.interested) ids.add(competition.id);
    else ids.delete(competition.id);
  }
  return { ids: [...ids], counts };
}

/** 필터 줄 바탕이 줄 밖으로 내려와 지우는 길이(px) — 스크롤해 목록이 줄 밑을 지날 때만 내려온다. */
const FILTER_BAR_FADE_OUTSIDE = 8;

/** 이 문서에서 배너가 이미 들어왔는지 — 문서를 다시 불러오면(당겨서 새로고침) 처음부터 다시 기다린다. */
let bannerEnteredInDocument = false;

/** 목록이 보이고 나서 배너가 들어오기까지(ms) — 반 박자. 처음 불러올 때 앱 로딩 덮개(0.5초)가 걷힌 뒤다. */
const BANNER_ENTRANCE_DELAY = 600;

/** 필터 줄 바탕의 아래 끝 16px을 지우는 마스크 — 일정한 속도로 지우면 끝나는 자리가 줄처럼 보여 완만한 곡선(ease)으로 지운다. */
const FILTER_BAR_FADE =
  "linear-gradient(to bottom, black calc(100% - 16px), rgb(0 0 0 / 0.92) calc(100% - 13px), rgb(0 0 0 / 0.75) calc(100% - 10px), rgb(0 0 0 / 0.5) calc(100% - 7px), rgb(0 0 0 / 0.27) calc(100% - 5px), rgb(0 0 0 / 0.1) calc(100% - 2px), transparent)";

/**
 * 맨 위에 띠 색이 깔려 있는 동안(html[data-competition-tint]) 꺼진 필터 칩 — 파란 바탕 위 연회색 테두리 대신
 * 반투명 흰 면(55%)으로 띄워 뒤의 띠 색이 비치게 한다. 켜진 칩은 제 파랑을 지키고, 띠 색이 다 옅어지면
 * 원래 테두리 칩으로 돌아간다 — 흰 바탕 위에서는 반투명 흰 면이 보이지 않아 선이 있어야 칩 모양이 읽힌다.
 * 눌림 면은 위 바탕 규칙에 덮이지 않게 같은 조건 아래 다시 적는다.
 */
const CHIP_ON_TINT =
  "[:root[data-competition-tint]_&]:border-transparent [:root[data-competition-tint]_&]:bg-[color-mix(in_srgb,var(--surface-container)_55%,transparent)] [:root[data-competition-tint]_&]:not-disabled:active:bg-surface-container-pressed";
// 이름 검색(#345)은 당분간 숨긴다(#387) — 검색 로직은 그대로 두고 돋보기·검색칸만 감춘다. 다시 켤 때 true.
const COMPETITION_SEARCH_ENABLED = false;
const SEARCH_INPUT_ID = "competition-name-search";
const SEARCH_BUTTON_ID = "competition-name-search-toggle";

/** 안 골랐으면 "지역", 하나면 "서울", 여럿이면 "서울 외 2". */
function regionLabel(regions: readonly CompetitionRegion[]) {
  if (regions.length === 0) return "지역";
  if (regions.length === 1) return regions[0];
  return `${regions[0]} 외 ${regions.length - 1}`;
}
