# 밸런스 게임 — 커뮤니티 피드(리스트) 개발 계획

관련 이슈: [jiu-jitsu-frontend#32](https://github.com/jiu-jitsu-org/jiu-jitsu-frontend/issues/32) (FE) · [jiu-jitsu-backend#91](https://github.com/jiu-jitsu-org/jiu-jitsu-backend/issues/91) (BE)

**이번 범위: 커뮤니티 피드 최상단 밸런스 게임 카드 + sticky 바.** 상세 화면(`balance_detail`)은 다음 이슈이며, 여기서는 **진입 경로(라우트 스텁)까지만** 만든다.

---

## 0. 확정된 정책 (합의 완료)

| 항목 | 결정 |
|---|---|
| 재투표 | **불가** — `myVote != null`이면 FE에서 요청 자체를 보내지 않음 (서버는 취소/변경을 허용하므로 FE 가드가 유일한 경계) |
| 재투표 재허용 가능성 | 있음 → 가드를 **한 곳(`use-balance-vote.ts`)에 모아** 정책 플래그 하나로 뒤집을 수 있게 만든다 |
| 마감 후 다음 게임 없음 | 카드 영역 **통째로 숨김** (종료 화면·문구 없음) |
| 조회 실패 · 네트워크 오류 | **에러 UI 없이 카드 미노출**, 피드는 정상 렌더 (실패 격리) |
| 옵션 이미지 | 1차는 **영역만 잡고 비워둠**(빈 자리). API `image`는 도메인 타입에만 보존하고 렌더에는 미사용 — asset이 나오면 그 자리에 채우기만 하면 되도록 |
| 선택지 문구 | 말줄임 없음, **가변 높이 허용** |
| sticky 전환 임계값 | 풀 카드가 **완전히 화면을 벗어난 뒤** 전환 |
| sticky 배경 | 콘텐츠를 **반투명으로 덮음**(fixed overlay) |
| sticky 노출 조건 | 미투표 사용자에게만 (비로그인 포함) |
| 로그인 유도 | 공통 `requireAuth` **기본 모드**(`AUTH_LOGIN_PROMPT`) — 작성 FAB(`use-open-post-write.ts`)과 동일 |
| 로그인 후 동작 | **자동 투표 안 함** → 다시 눌러야 함 (pending action에 no-op을 넘겨 자동 복귀를 차단) |
| 투표 실패 문구 | 보류 → **아무 동작 없음**(토스트 없음, 낙관적 상태만 롤백) |
| 투표율 % · 진행률 바 | 리스트 **미노출** (상세 전용) |

### 잔여 시간 표기 (시간 표시 정책 6)

```
remain = endAt - (기기 now + offset)      // offset = serverTime - 응답 수신 시각
remain < 60초           → "곧 종료돼요"
remain ≥ 60초, 시간 > 0 → "{h}시간 {m}분 {ss}초 남음"   예) 20시간 15분 46초 남음
remain ≥ 60초, 시간 = 0 → "{m}분 {ss}초 남음"          예) 42분 08초 남음
```

- 갱신 주기 **1초**
- **서버 종료 시각 기준** — 기기 시계를 직접 쓰지 않고 응답의 `serverTime`으로 오프셋을 보정
- 백그라운드 → 포그라운드 복귀 시 **서버 시각 재동기화 후 재계산** (= `GET /community/balance-game` 재조회)
- `remain ≤ 0` 도달 시 **즉시 재조회 → 다음 게임으로 교체**, 응답이 `null`이면 카드 제거

> 참고: 상대 시간 규칙(방금 전 / N분 전 …)은 게시글·댓글용이며 밸런스 게임과 무관하다. 이 문서는 정책 6만 다룬다.

---

## 1. 백엔드 API (실측 완료)

명세 원본: `https://dev-api.bjj-oss.kr/api/api-docs`

| 메서드 | 경로 | 인증 | 용도 |
|---|---|---|---|
| GET | `/api/community/balance-game` | 불필요(토큰 있으면 `myVote` 채워짐) | 오늘의 게임. **진행 중 없으면 `data: null`** |
| POST | `/api/community/balance-game/{contentId}/vote` | **필요** (403 `U0001`) | body `{ "option": "A" \| "B" }` → **투표 반영된 최신 전체 응답** 반환 |
| GET | `/api/community/balance-game/{contentId}` | 불필요 | 상세 — 다음 이슈 |
| POST | `/api/admin/balance-game` | ROLE_ADMIN | 임시 테스트 데이터 등록 |

`BalanceGameResponse` (응답 봉투 `{ success, code, message, data }`의 `data`):

```jsonc
{
  "contentId": 1,
  "endAt": "2026-09-02T00:00:00",     // 마감 일시
  "serverTime": "2026-09-01T03:44:14", // 서버 응답 시각 (카운트다운 기준)
  "closed": false,                     // 마감 여부 → true면 투표 불가, 결과만
  "optionA": { "option": "A", "text": "...", "image": { "id": 1, "imageUrl": "..." }, "voteCount": 7 },
  "optionB": { "option": "B", "text": "...", "image": null, "voteCount": 3 },
  "totalVoteCount": 10,
  "myVote": "A",       // null이면 미투표
  "commentCount": 5    // 0이면 "첫 댓글 남기러 가기"
}
```

**에러 코드**: `C0006` 존재하지 않는 게임(404) · `C0007` 이미 마감된 게임(400) · `U0001` 로그인 필요(403)

**`closed`가 언제 true로 오는지**: `endAt`이 지난 게임이다. `GET /community/balance-game`은 "현재 진행 중"을 주므로 평상시엔 `false`지만, **마감 시각 직후 다음 게임으로 교체되기 전 짧은 구간**에 마감된 게임이 그대로 내려올 수 있다. 그래서 리스트는 `closed: true`를 **"곧 교체될 상태"**로 보고, 투표를 막고 재조회 대상으로 삼는다(§4 Phase 5).

**댓글**: 상세에서 `GET /api/community/comments?id={contentId}&sortType=...`을 그대로 쓴다 — 기존 게시글 댓글 인프라를 재사용할 수 있다. 리스트에서는 `commentCount`만 사용.

---

## 2. 전제 조건 (착수 전)

- [ ] **dev 서버에 진행 중인 밸런스 게임 데이터** — 현재 `data: null`이라 화면 확인 불가. `POST /api/admin/balance-game`으로 등록 필요 (ROLE_ADMIN)
- ~~캐릭터 이미지 asset~~ — 1차는 **영역만 잡고 비워둔다**. asset이 나오면 `balance-option-button.tsx`의 이미지 슬롯만 채우면 되게 만든다

---

## 3. 파일 구조 (AGENTS.md 레이어 매핑)

밸런스 게임은 커뮤니티 도메인 안에 있고(피드에 붙고, 댓글 API를 `contentId`로 공유) 새 feature를 만들 만큼 독립적이지 않으므로 **`features/community` 내부**에 둔다.

```
src/features/community/
├── domain/
│   ├── balance-game.ts                       # BalanceGame, BalanceGameOption, BalanceOptionKey
│   └── balance-game-repository.ts            # BalanceGameRepository 계약
├── infrastructure/
│   └── external-balance-game-repository.ts   # 업스트림 호출 + DTO 매핑
├── application/
│   ├── get-current-balance-game.ts           # use case
│   ├── vote-balance-game.ts                  # use case
│   ├── get-balance-game-page-data.ts         # Server Component용 쿼리(실패는 null로 삼킴)
│   └── community-use-case-factory.ts         # (기존 파일에 조립 함수 2개 추가)
└── presentation/balance/
    ├── balance-game-section.tsx              # "use client" 상태 소유(조회·투표·타이머·sticky)
    ├── balance-game-card.tsx                 # 풀 카드 뷰(순수)
    ├── balance-option-button.tsx             # 선택지 1개(A/B 토큰 분기)
    ├── balance-sticky-bar.tsx                # 반투명 고정 바
    ├── balance-countdown.ts                  # 잔여 시간 포맷터(순수 함수)
    ├── use-balance-countdown.ts              # 1초 틱 + 서버 오프셋 보정
    ├── use-balance-vote.ts                   # 로그인 게이트 + 재투표 가드 + in-flight + 낙관적 갱신
    └── use-open-balance-detail.ts            # 상세 진입(네이티브 서브뷰 / 웹 라우터)

src/app/api/community/balance-game/
├── route.ts                                  # GET
└── [contentId]/vote/route.ts                 # POST (requireSessionOr401)

src/app/community/balance/[contentId]/page.tsx  # 상세 스텁(다음 이슈)
src/app/page.tsx                                # 피드 + 밸런스 병렬 조회로 수정
```

**디자인 토큰은 추가 작업 없음** — `--poll-sticky-bar-*`, `--poll-option-a/b-*`가 이미 들어와 있다. Tailwind 클래스로는 `bg-poll-option-a-default-bg` 형태로 참조한다(`theme.css`에 `--color-poll-*`로 등록되어 있음).

**아이콘**: sticky 바의 `>`는 기존 `ChevronDownIcon`을 `-rotate-90`으로 재사용한다(새 아이콘 파일 없이). 디자인 SVG가 따로 나오면 그때 교체.

---

## 4. 개발 단계

각 Phase는 **독립 커밋 단위**다. Phase 1~2는 화면 없이 서버 계층만, Phase 3부터 화면이 붙는다.

### Phase 1 — 도메인 · 인프라 · application

**만드는 것**

- `domain/balance-game.ts`
  ```ts
  export type BalanceOptionKey = "A" | "B";
  export type BalanceGameOption = {
    key: BalanceOptionKey;
    text: string;
    /** 업스트림 image.imageUrl. 1차 화면은 이미지를 비워두므로 계약만 보존한다. */
    imageUrl: string | null;
    voteCount: number;
  };
  export type BalanceGame = {
    contentId: number;
    endAt: string;      // ISO 8601
    serverTime: string; // ISO 8601 — 카운트다운 기준
    closed: boolean;
    optionA: BalanceGameOption;
    optionB: BalanceGameOption;
    totalVoteCount: number;
    myVote: BalanceOptionKey | null;
    commentCount: number;
  };
  ```
- `domain/balance-game-repository.ts` — `getCurrent(): Promise<BalanceGame | null>`, `vote(contentId, option): Promise<BalanceGame>` (상세용 `getDetail`은 다음 이슈에서 추가)
- `infrastructure/external-balance-game-repository.ts` — 경로 prefix는 기존 repository와 동일하게 `/api/...`를 직접 붙인다(`/api/community/balance-game`). 봉투 한 겹 벗기고 DTO → 도메인 매핑. **`data: null`은 정상 응답**이므로 `null`을 그대로 돌려준다(에러 아님)
- `application/get-current-balance-game.ts`, `application/vote-balance-game.ts`
- `community-use-case-factory.ts`에 `createGetCurrentBalanceGameUseCase(accessToken)` / `createVoteBalanceGameUseCase(accessToken)` 추가 — 조회는 토큰 유무에 따라 authed/unauthed, 투표는 **authed 전용**
- `application/get-balance-game-page-data.ts` — 정책상 실패 시 화면이 없으므로 result 타입 없이 **`Promise<BalanceGame | null>`**. 실패는 `console.error`로 서버 로그만 남기고 `null` 반환(세션 만료 포함 — 세션 복구는 피드 경로가 이미 담당)

**완료 기준**: `npx tsc --noEmit` 통과. 화면 변화 없음.

---

### Phase 2 — BFF route

**만드는 것**

- `app/api/community/balance-game/route.ts` (GET) — `readSessionToken()`으로 토큰이 있으면 부착, 없으면 익명 조회. 성공 시 `{ success: true, data: BalanceGame | null }`. 실패는 기존 `toErrorResponse` 사용(만료 A0003이 `bffFetch`로 전달돼 네이티브 갱신 후 1회 재시도됨)
- `app/api/community/balance-game/[contentId]/vote/route.ts` (POST) — `requireSessionOr401()` 게이트, body `option`이 `"A" | "B"`인지 검증(아니면 400), use case 호출 후 최신 `BalanceGame` 반환

**완료 기준**
- `npm run build` **먼저** 실행 (새 route가 있는 브랜치는 build 전에 `tsc`만 돌리면 가짜 타입 에러가 난다) → 이후 `npx tsc --noEmit`, `npm run lint`
- `curl localhost:3000/api/community/balance-game`으로 봉투 형태 확인

---

### Phase 3 — 순수 뷰 (풀 카드 · sticky 바)

이 단계에서는 **props로 받은 값만 그린다.** 조회·투표·타이머는 아직 붙이지 않는다.

**`balance-game-card.tsx`**
- "오늘의 밸런스 게임" 제목 + 타이머 텍스트 슬롯(문자열 props)
- 선택지 A / B — `balance-option-button.tsx`
- 하단 링크: `commentCount > 0` → "댓글 보러가기", `0` → **"첫 댓글 남기러 가기"**
- 탭 영역 분기: **선택지 = 투표 콜백 / 그 외 영역(제목·타이머·여백) = 상세 진입 콜백**. `FeedCard`가 내부 버튼을 `stopPropagation`으로 제외하는 패턴을 그대로 따른다

**`balance-option-button.tsx`**
- 미투표: 연한 배경 (`--poll-option-a-default-bg` / `--poll-option-b-default-bg`)
- 내가 고른 것: 진한 배경 + 흰 텍스트 (`--poll-option-*-selected-bg` / `-selected-text`)
- 안 고른 것(투표 후): 연한 배경 유지
- **% · 진행률 바 없음**
- 이미지: **빈 영역만 확보**(고정 크기 자리). asset이 정해지면 이 슬롯만 채운다
- 문구 말줄임 없이 가변 높이

**`balance-sticky-bar.tsx`**
- "오늘의 밸런스 게임" + 잔여 시간 + `>`
- `position: fixed; top: 0` + 반투명 배경(`--poll-sticky-bar-bg` 위에 알파) + `z-index`는 FAB보다 아래
- 전체가 상세 진입 콜백

**완료 기준**: 하드코딩 props로 5개 캡처 상태(미투표 / A 선택 / B 선택 / 댓글 0 / sticky)를 눈으로 재현.

---

### Phase 4 — 카운트다운

**`balance-countdown.ts`** (순수 함수, 테스트하기 쉬운 형태)
```ts
formatRemaining(remainMs: number): string
// < 60_000            → "곧 종료돼요"
// 시간 > 0            → `${h}시간 ${m}분 ${pad2(s)}초 남음`
// 시간 = 0            → `${m}분 ${pad2(s)}초 남음`
```

**`use-balance-countdown.ts`**
- 응답 수신 시각과 `serverTime`의 차이를 **오프셋**으로 저장 → 이후 매 틱은 `Date.now() + offset`으로 계산
- `setInterval` 1초. **틱 상태는 이 훅을 쓰는 최말단 컴포넌트에만 둔다** — 상위(피드)로 새어 나가면 매초 피드 전체가 리렌더된다
- `remain ≤ 0` 도달 → `onExpired()` 콜백 1회 발화 후 타이머 정지
- SSR/hydration: 서버에서 "남은 시간 문자열"을 렌더하지 않는다. 첫 프레임은 마운트 후 계산으로 채워 hydration mismatch를 피한다

**타이머 상수는 `const TICK_MS = 1_000` 처럼 이름을 준다** (매직 넘버 금지).

**완료 기준**: 카드에 실제 초가 흐름. 리액트 DevTools로 피드 카드들이 매초 리렌더되지 않음을 확인.

---

### Phase 5 — 데이터 · 투표 연결

**`app/page.tsx`**
```ts
const [feed, balanceGame] = await Promise.all([
  getBoardListPageData(DEFAULT_BOARD_LIST_QUERY),
  getBalanceGamePageData(),
]);
```
- `BalanceGameSection`은 **피드가 정상(ok)일 때만** 리스트 위에 렌더한다. 에러 화면·세션 복구 화면에는 노출하지 않는다(빈 피드는 노출 O)
- SSR로 함께 받으므로 카드가 뒤늦게 끼어드는 레이아웃 점프가 없다. 초기값이 `null`이면 아무것도 렌더하지 않는다

**`balance-game-section.tsx`** — 상태 소유
- SSR 초기값을 seed로 받고, 이후 갱신은 클라이언트 `bffFetch`
- 재조회 트리거 3가지: ① 카운트다운 만료(`onExpired`) ② `visibilitychange` → visible (포그라운드 복귀 시 서버 시각 재동기화) ③ 상세에서 돌아왔을 때(§Phase 7)
- 재조회 결과가 `null`이면 **카드 제거**. 별도 재시도 루프는 두지 않는다(다음 복귀/진입 때 다시 조회)

**`use-balance-vote.ts`** — 정책이 모이는 한 곳
1. `status === "loading"`이면 무시(세션 판정 전 오탐 방지)
2. 비로그인 → `requireAuth(() => {}, { reason: "밸런스 게임 투표" })` — **no-op을 넘겨 로그인 후 자동 투표를 막는다**(정책: 다시 눌러야 함)
3. `myVote != null` → **무시**(재투표 불가). 이 가드가 정책 스위치 지점이다 — 재투표가 허용되면 여기만 푼다
4. `closed === true` → 무시(마감된 게임)
5. **in-flight 가드** — 요청 중 재탭 무시. 없으면 더블탭 두 번째가 서버에서 "취소"로 처리된다
6. 낙관적으로 `myVote` 반영 → `POST .../vote` → **응답의 최신 `BalanceGame`으로 통째 교체**
7. 실패 → 낙관적 상태 롤백. **토스트 없음**(문구 보류)

**완료 기준**: 투표 → 색 반전 유지, 재탭 무반응, 더블탭에도 취소되지 않음, 비로그인 탭 시 로그인 유도 후 자동 투표되지 않음.

---

### Phase 6 — sticky 전환

- 풀 카드 아래에 sentinel `div`를 두고 `IntersectionObserver`로 관찰 — 기존 `use-infinite-scroll.ts`와 같은 패턴
- 조건: **카드가 완전히 벗어난 뒤** sticky 노출 (`threshold: 0`, 카드 하단이 뷰포트 위로 지나갈 때)
- **미투표(`myVote === null`)일 때만** 노출. 투표 직후에는 즉시 사라진다
- 다시 위로 스크롤하면 sticky는 사라지고 풀 카드가 원래 자리에 보인다
- 반투명 오버레이라 아래 콘텐츠가 비친다 — `backdrop-blur` 적용 여부는 실기에서 판단
- safe-area: 상단 앱바가 네이티브라 웹뷰 top inset이 0일 가능성이 높다. `app-bar-shell.tsx`는 `pt-[env(safe-area-inset-top)]`을 쓰므로 **실기에서 겹침 확인 후 결정**

**완료 기준**: 스크롤 다운/업 전환이 자연스럽고, 투표한 계정에서는 sticky가 뜨지 않음.

---

### Phase 7 — 상세 진입 (스텁까지)

- `use-open-balance-detail.ts` — `use-open-post-detail.ts`와 동일 구조: 네이티브면 `openNativeSubview`, 웹 단독이면 `router.push`
- 진입 전 `requireAuth`로 게이트 (비로그인은 이동하지 않고 로그인 유도). 여기도 **no-op**을 넘겨 로그인 후 자동 이동을 막는다(투표와 동일 원칙)
- 경로: **`/community/balance/[contentId]`**
- `app/community/balance/[contentId]/page.tsx`는 **빈 스텁**(제목만 있는 최소 화면). 실제 구현은 다음 이슈
- **복귀 갱신 계약**: 상세에서 투표/취소하면 리스트가 어긋나므로, 진입 시 "밸런스 게임이 바뀌었을 수 있다"를 `sessionStorage`에 남기고 복귀(`visibilitychange`) 때 재조회한다 — 기존 `dirty-posts.ts` + `use-feed-revalidate.ts`와 같은 방식. 이번 PR에서는 **재조회 훅까지만** 만들어 두면 상세 PR이 계약을 그대로 쓴다

**완료 기준**: 카드 여백/제목/댓글 링크/sticky 탭 → 스텁 화면 진입, 선택지 탭 → 진입하지 않고 투표만.

---

### Phase 8 — 검증

- [ ] `npm run build` → `npx tsc --noEmit` → `npm run lint` (build 먼저)
- [ ] 미투표 / A선택 / B선택 / 댓글 0 / sticky — 캡처 5장과 대조
- [ ] 비로그인: 선택지 탭 → 로그인 유도, 로그인 후 **자동 투표 안 됨**
- [ ] 비로그인: 여백·댓글 링크·sticky 탭 → 로그인 유도, 이동 안 함
- [ ] 더블탭·연타 시 투표가 취소되지 않음
- [ ] 마감 시각 통과 → 자동으로 다음 게임 교체 / 없으면 카드 사라짐
- [ ] 백그라운드 → 복귀 시 잔여 시간이 튀지 않음
- [ ] API 실패(네트워크 차단) → 카드만 사라지고 피드는 정상
- [ ] 상세 스텁 진입 후 뒤로가기 → **피드 스크롤 위치 유지**
- [ ] 글 작성 후 복귀(`window.scrollTo(0)`) 시 밸런스 카드가 최상단에 보임 — 의도한 모습인지 확인

---

## 5. 기술 리스크 · 주의점

1. **매초 리렌더 전파** — 카운트다운 상태를 `BalanceGameSection`(상위)에 두면 카드 전체가 매초 리렌더된다. 타이머 텍스트를 그리는 최말단 컴포넌트에 가둔다.
2. **hydration mismatch** — 서버에서 잔여 시간 문자열을 렌더하면 클라와 값이 달라진다. 서버는 `endAt`/`serverTime`만 내려보내고 계산은 클라에서.
3. **더블탭 = 투표 취소** — 서버가 같은 선택지 재전송을 취소로 처리하므로 in-flight 가드가 기능 요구사항이다(단순 UX 개선이 아님).
4. **카드 높이 불변** — 리스트에 %·진행률 바가 없어 투표 전후 높이가 같다. 덕분에 복귀 시 스크롤이 튀지 않는다. **이 제약은 유지한다.**
5. **`data: null`은 에러가 아니다** — repository에서 예외로 던지지 않도록 주의.
6. **`closed: true` 구간** — 마감 직후 교체 전 짧게 내려올 수 있다. 투표 차단 + 재조회 대상으로 처리.
7. **세션 만료** — 밸런스 조회 실패는 `SessionExpiredRecovery`에 얹지 않는다(조용히 카드 미노출). 세션 복구는 피드 경로가 이미 담당한다.

---

## 6. 아직 열린 항목 (개발 중 확인)

1. **sticky 바 잔여 시간 표기** — 캡처는 `8시간 남음`이지만 정책 6에는 단일 규칙만 있다. **기본값으로 풀 카드와 동일 규칙**(`N시간 M분 SS초 남음`)을 적용한다. 다르게 가려면 알려줄 것.
2. **자릿수 패딩** — 정책 예시(`42분 08초`, `20시간 15분 46초`)를 근거로 **초만 2자리 패딩, 시·분은 패딩 없음**으로 구현한다.
3. **재조회 결과가 계속 `null`일 때** — 재시도 루프 없이 카드 제거. 다음 포그라운드 복귀/진입에서 다시 조회.
4. **sticky `backdrop-blur`** 적용 여부 — 실기에서 판단.
5. **캐릭터 asset** — 나오면 이미지 슬롯에 채운다(레이아웃 변경 없이 교체 가능하게 자리를 먼저 잡아둠).
6. **디자인 가이드 미적용** — 가이드를 받지 못해 Phase 3의 간격·타이포·크기는 캡처와 기존 카드(FeedCard) 관례를 보고 잡은 잠정값이다. 색은 토큰(`poll-*`)이라 그대로 두고 치수만 맞추면 된다.
7. **타이머 아이콘** — 디자인 SVG가 없어 기존 규격(viewBox 16 · stroke currentColor · 1.33333)으로 임시 작성했다. 패스만 교체하면 된다.
