# 밸런스 게임 — 상세 화면 개발 계획

관련 이슈: [jiu-jitsu-frontend#32](https://github.com/jiu-jitsu-org/jiu-jitsu-frontend/issues/32)

**이번 범위: 밸런스 게임 상세(`/community/balance/[contentId]`) 전체.** 리스트는 [#115](https://github.com/jiu-jitsu-org/jiu-jitsu-frontend/pull/115)에서 완료했고, 이 문서는 그 PR이 남긴 라우트 스텁을 실제 화면으로 채우는 계획이다.

디자인 가이드는 **마지막에 별도로 적용**한다. Phase 3까지는 캡처와 기존 게시글 상세 관례를 따른 잠정값으로 만든다 — 리스트에서 이미 한 번 겪은 순서다.

---

## 0. 확정된 정책

| 항목 | 결정 |
|---|---|
| 헤더 뒤로가기 | **네이티브 내비게이션이 담당** — 웹은 그리지 않는다. 게시글 상세(`PostDetailAppBar`)와 같다. 캡처의 `‹`는 네이티브 바로 본다 |
| 헤더 ⋮ 메뉴 | **없음** — 서비스 제공 콘텐츠라 수정·삭제·신고·숨기기 대상이 아니다 |
| 헤더 알림(벨) | **게시글과 같은 API를 그대로 쓴다** — `GET·PUT /notice/setting/board/{contentId}`. 경로에 `board`가 들어가지만 파라미터는 contentId다 |
| 리액션 바 | **댓글쓰기 · 좋아요 · 공유 3개.** 저장은 업스트림 미지원이라 **버튼을 그리지 않는다**(기획 확인 중, 뒤집히면 추가) |
| 좋아요 | 게시글과 같은 `PUT /board/like/{contentId}` — 밸런스 전용 엔드포인트는 없다 |
| 재투표 | **취소 열어둔 현 상태 유지** (리스트·상세 동일). `balance-vote-policy.ts`의 `allowCancel: true` / `allowChange: false`를 그대로 읽는다 |
| 투표율·진행률 바 | **상세 전용.** 투표 전에는 미표시, 투표 후·마감 후에는 양쪽 다 표시 |
| 마감 전환 | 화면을 벗어나지 않고 **투표 영역만** 마감 상태로 전환. 댓글·스크롤 위치 유지 |
| 마감 상태 투표 시도 | 투표되지 않고 토스트 `마감된 밸런스 게임이에요` |
| 마감 후 캐릭터 | **내 선택 그대로 유지**(놀람/슬픔). 정책의 "색상 강조 없음"은 배경 얘기이며, 배경 색이 빠져도 무엇을 골랐는지는 읽을 수 있어야 한다는 판단 |
| 상세 캐릭터 크기 | 리스트와 **같은 3단계**(66 / 81.93 / 54.62) |
| 마감 후 댓글 | **계속 작성 가능** |
| 댓글 영역 | 게시글 상세와 **동일 규칙** (정렬·댓글·대댓글·placeholder·입력창) |
| 토스트 겹침 | 나중 것이 이전 것을 덮어씀 — 공통 `ToastProvider`가 이미 **단일 슬롯**이라 추가 작업 없음 |
| 비로그인 진입 | 상세로 가지 않고 로그인 유도, 성공 후 자동 이동 — `use-open-balance-detail`에 **이미 구현됨** |
| 지난 게임 접근 | 알림 작업 시 정의. 이번 범위 밖 |

### 타이머

표기 규칙은 리스트와 **완전히 동일**하다 (`balance-countdown.ts` 재사용, 시간 표시 정책 6).

상세에만 추가되는 것 두 가지:

1. **아이콘 깜빡임** — 카운트다운 중 1초 주기로 회색 ↔ 파랑. 별도 타이머를 만들지 않고 **이미 도는 1초 틱에 얹는다** (틱이 두 개면 위상이 어긋나 깜빡임이 문구 갱신과 따로 논다)
2. **마감 문구** — `투표가 종료되었어요`로 교체하고 깜빡임 정지

> 리스트에는 없던 상태다. `BalanceRemaining`에 마감 문구와 깜빡임을 옵션으로 얹되, 리스트 호출부의 동작은 바뀌지 않아야 한다.

### 투표율 표기

```
percentA = round(voteCountA / totalVoteCount * 100)
percentB = 100 - percentA          // 합을 100으로 강제
totalVoteCount === 0  → 0% / 0%
```

`percentB`를 따로 반올림하지 않는 이유: 각자 반올림하면 49.5/50.5가 50/51처럼 합 101이 된다. 화면에 둘이 나란히 있어 합이 100이 아니면 바로 보인다.

---

## 1. 백엔드 API

밸런스 전용 엔드포인트는 **없다.** 게시글 API의 `{id}`가 원래부터 board id가 아니라 **contentId**라, 밸런스 응답의 `contentId`를 그 자리에 넣으면 그대로 동작한다 (BE 안내 · [backend#121](https://github.com/jiu-jitsu-org/jiu-jitsu-backend/issues/121)).

| 메서드 | 경로 | 인증 | 용도 | FE 현황 |
|---|---|---|---|---|
| GET | `/api/community/balance-game/{contentId}` | 불필요 | **상세 조회.** 마감된 판도 조회 가능 | repository에 `getById` 추가 필요 |
| POST | `/api/community/balance-game/{contentId}/vote` | 필요 | 투표 → 반영된 최신 전체 응답 | 완료 |
| GET | `/api/community/balance-game` | 불필요 | 오늘의 게임 — 마감 전환 토스트가 새 게임 id를 얻는 데 쓴다 | 완료 |
| PUT | `/board/like/{contentId}` | 필요 | **좋아요 토글** | BFF `/api/community/posts/{id}/likes`가 이미 이 경로로 위임 — 그대로 재사용 |
| GET | `/notice/setting/board/{contentId}` | 필요 | **알림 수신 여부 조회** | **미구현** — 게시글은 상세 응답의 `noticeEnabled`로 초기값을 받아 GET을 쓴 적이 없다 |
| PUT | `/notice/setting/board/{contentId}` | 필요 | **알림 토글** | `toggleNotice`가 이미 이 경로를 쓴다 — 그대로 재사용 |
| GET | `/community/comments?id={contentId}&sortType=` | 불필요 | 댓글 목록 | 완료 (게시글과 공용) |
| POST | `/community/comments` | 필요 | 댓글·대댓글 작성 `{ contentId, parentId, body }` | 완료 (게시글과 공용) |
| DELETE | `/community/comments/{id}` | 필요 | 댓글 삭제 | 완료 |
| POST | `/community/comments/like` | 필요 | 댓글 좋아요 토글 | 완료 |

> **정정.** 앞서 "게시글 알림은 `POST /posts/{id}/notice`"라고 적었던 것은 우리 **BFF 라우트 이름**이었다. 실제 업스트림은 처음부터 `PUT /notice/setting/board/{id}`를 부르고 있었다(`external-community-write-repository.ts`). 알림은 BE 대기 항목이 아니다.

### 조회 응답에 추가되는 필드

`GET /community/balance-game` (리스트) · `GET /community/balance-game/{contentId}` (상세) **공통**

| 필드 | 타입 | 비고 |
|---|---|---|
| `likeCount` | number | |
| `isLiked` | boolean | 비로그인 시 `false` |

`saveCount` · `isSaved`는 저장 미지원이라 내려오지 않는다.

리스트는 좋아요를 노출하지 않지만 **같은 응답을 공유**하므로 도메인 타입에는 함께 담는다 — 리스트가 나중에 노출하게 되어도 계약을 다시 찾지 않아도 된다(`imageUrl` · `voteCount`를 담아둔 것과 같은 이유).

### 미지원

| 항목 | 처리 |
|---|---|
| 저장(북마크) | 버튼 **미노출**. 밸런스 contentId로 저장을 호출하면 `CONTENT_SAVE_NOT_SUPPORTED` (C0008, 400). 기획 확인 중이라 뒤집힐 수 있다 |

### 에러 코드 변경 — 확인 완료, 작업 없음

두 코드는 이름이 바뀐 것이 아니라 **원래부터 별개**다.

| 상수 | 값 | 변화 |
|---|---|---|
| `CONTENT_NOT_FOUND` | `C0001` | 기존부터 존재 (신설 아님) |
| `BOARD_NOT_FOUND` | `C0002` | **변경 없음** |

바뀌는 것은 **알림 설정 API 2개**(`GET`·`PUT /notice/setting/board/{contentId}`)의 404 코드가 `C0002` → `C0001`이 되는 것뿐이다. 게시글 상세·수정·삭제·숨김·신고는 전부 `C0002` 그대로다.

**FE 작업 없음.** 알림 토글 경로는 404를 코드로 분기하지 않는다 — `post-detail-app-bar.tsx`는 HTTP status만 보고(401이면 로그인 유도, 그 외는 실패 토스트), BFF의 `toErrorResponse`도 status 기반이다. `ApiErrorCode.BOARD_NOT_FOUND`를 읽는 곳은 게시글 상세 404 분기 하나이며 그쪽은 값이 그대로다.

밸런스의 알림 벨도 같은 방식(status 기반)으로 붙이면 `C0001`을 따로 다룰 일이 없다.

### 이 레포 밖 — `BALANCE_DETAIL` actionType

BE가 신규 `actionType`을 추가하며 "모르는 값을 받아도 죽지 않게 기본 분기"를 FE에 요청했다([backend#120](https://github.com/jiu-jitsu-org/jiu-jitsu-backend/issues/120)). **이 웹 레포에서는 할 일이 없다**는 것을 브릿지 계약으로 확인했다.

근거 세 가지:

1. **`actionType`을 참조하는 코드가 0건**이다
2. **인바운드 메시지(네이티브 → 웹)에 딥링크 경로가 없다.** `InboundMessageType`은 `AUTH_LOGIN_SUCCESS` · `AUTH_LOGIN_CANCELLED` · `AUTH_SESSION_EXPIRED` · `AUTH_LOGOUT` · `BACK_PRESSED` · `CONFIRM_DIALOG_RESULT` · `SELECT_SHEET_RESULT` 뿐이고, 어느 것도 `actionType`이나 이동 대상을 싣지 않는다
3. **`OPEN_SUBVIEW`는 아웃바운드다.** 웹이 URL을 주고 네이티브가 여는 방향이라, 네이티브가 푸시로 받은 `actionType`을 웹에 넘기는 경로가 아니다

즉 푸시·알림함의 `actionType`을 해석해 화면을 고르는 것은 **iOS 앱의 일**이다. 웹은 네이티브가 열어준 URL을 렌더할 뿐이고, `/community/balance/{contentId}` 라우트는 이미 있다 — iOS가 `BALANCE_DETAIL`을 그 URL로 매핑하면 Phase 1~7의 결과물이 그대로 뜬다.

**웹이 해야 할 일: 없음. iOS에 전달할 것: `BALANCE_DETAIL` → `{origin}/community/balance/{contentId}` 매핑과 미지원 값 기본 분기.**

---

## 2. 화면 구조 (캡처 기준)

```
AppBarShell                       ← 알림 벨만 (뒤로가기 없음)
│
├ 스크롤 영역
│  ├ 제목      "오늘의 밸런스 게임"
│  ├ 타이머 pill   ⏱ 8시간 29분 46초 남음      ← 아이콘 1초 깜빡임
│  ├ 선택지 A    [캐릭터] 문구            (투표 후) 진행률 바 + %
│  ├ 선택지 B    [캐릭터] 문구            (투표 후) 진행률 바 + %
│  ├ 리액션 바   댓글쓰기 · 좋아요 · 공유       ← 저장은 미지원이라 없음
│  ├ 디바이더 (h-1)
│  └ 댓글 섹션   정렬 · 목록 · placeholder
│
└ 댓글 입력 바                     ← 키보드 위 고정
```

게시글 상세(`PostDetailView`)와 **뼈대가 같다** — `KeyboardAwareShell` + `CommentReplyProvider` + 리액션 바 + 디바이더 + 댓글 섹션. 본문 자리(작성자 행·제목·이미지·태그)만 투표 블록으로 갈아끼우는 구조다.

### 상태 4종

| 상태 | 타이머 | 선택지 | % |
|---|---|---|---|
| 투표 전 | 카운트다운 + 깜빡임 | 양쪽 연한 배경, 캐릭터 회색 | 없음 |
| 투표 후 (내가 고른 쪽) | 카운트다운 + 깜빡임 | **진한 배경 + 진행률 바** | 진한 색 텍스트 |
| 투표 후 (밀려난 쪽) | 〃 | 연한 배경 + 진행률 바 | 회색 텍스트 |
| 마감 | `투표가 종료되었어요`, 깜빡임 정지 | **양쪽 다 연한 배경** (내 선택 강조 없음, 캐릭터는 유지) | 회색 텍스트 |

### 진행률 바 — 토큰이 이미 두 벌로 나뉘어 있다

리스트에서 미사용으로 남겨둔 토큰이 정확히 이 구조다. 새로 정의할 것이 없다.

| 상황 | fill (채워진 부분) | track (남은 부분) | % 텍스트 |
|---|---|---|---|
| 내가 고른 쪽 | `poll-option-*-selected-bg` (a-500 / b-500) | `poll-option-*-selected-bg-track` (a-100 / b-100) | `poll-option-*-selected-percent-text` |
| 밀려난 쪽 · 마감 | `poll-option-*-result-bg-fill` (a-100 / b-100) | `poll-option-*-result-bg-track` (a-50 / b-50) | `poll-option-*-result-percent-text` |

캡처와 대조: 투표 후 내가 고른 A행이 진한 빨강으로 70%까지 차고 나머지가 연한 빨강 → `selected-bg` + `selected-bg-track`. 마감 화면은 양쪽 다 연한 계열 → `result-*`. 일치한다.

---

## 3. 재사용 · 신규

### 그대로 재사용 (수정 없음)

- `balance-countdown.ts` · `use-balance-countdown.ts` — 잔여 시간 계산·틱
- `balance-vote-policy.ts` — 투표 허용 판단
- `CommentSection` · `CommentList` · `CommentSortSelect` · `CommentEmpty` · `CommentReplyProvider`
- `KeyboardAwareShell` · `AppBarShell` · `ToastProvider`
- `use-open-balance-detail.ts` — 비로그인 게이트 포함, 이미 완성

### 손봐야 하는 것

| 파일 | 변경 |
|---|---|
| `BalanceRemaining` | 마감 문구 · 아이콘 깜빡임 옵션 추가 (리스트 동작 불변) |
| `CommentInputBar` | prop `postId` → `contentId`로 일반화 |
| `BalanceGameRepository` | `getById(contentId)` · `getNoticeSetting(contentId)` 추가 |
| `BalanceGame` 도메인 · DTO | `likeCount` · `isLiked` 추가 (리스트도 같은 응답을 받는다) |
| `balance-option-button.tsx` | 진행률 바 · % 표기 추가 (리스트는 계속 미표시) |
| `CommunityWriteRepository` | 알림 수신 여부 **조회**(GET) 추가 — 지금은 토글(PUT)만 있다 |

### 신규

```
app/community/balance/[contentId]/page.tsx      ← 스텁을 실제 화면으로
features/community/application/
  get-balance-detail-page-data.ts               ← 게임 + 댓글 동시 조회
features/community/presentation/balance/
  balance-detail-view.tsx                       ← 레이아웃 (순수 표현)
  balance-detail-screen.tsx                     ← 상태 소유 · 마감 전환
  balance-detail-app-bar.tsx                    ← 벨만 있는 앱바
  balance-option-result.tsx                     ← 진행률 바 + %
  balance-detail-action-bar.tsx                 ← 리액션 바 (저장 없는 3버튼)
  use-balance-close-transition.ts               ← 마감 전환 + 토스트
```

---

## 4. 개발 단계

### Phase 1 — 조회 경로

`BalanceGameRepository.getById(contentId)` 추가 → BFF route `GET /api/community/balance-game/[contentId]` → `getBalanceDetailPageData()`에서 게임과 댓글을 **병렬로** 조회.

댓글은 게시글과 같은 업스트림(`GET /community/comments?id=`)이라 기존 조회 함수를 `contentId`로 부르기만 하면 된다.

- 없는 게임(`data: null`) → `notFound()`
- 조회 실패 → 게시글 상세와 같은 에러 화면. **리스트와 다르다** — 리스트는 조용히 숨기지만, 상세는 사용자가 의도적으로 들어온 화면이라 빈 화면을 보여줄 수 없다

### Phase 2 — 레이아웃 (정적)

`BalanceDetailView` — 게시글 상세의 뼈대를 그대로 따라 앱바 · 제목 · 타이머 · 선택지 · 리액션 바 · 디바이더 · 댓글 · 입력 바를 배치. 이 단계에서는 **투표 전 상태만** 그린다.

댓글 섹션은 게시글 상세 컴포넌트를 그대로 꽂는다.

### Phase 3 — 투표율 · 진행률 바

`BalanceOptionResult` — 2절의 토큰 표대로 fill / track / % 텍스트를 그린다. 선택지 버튼은 상세에서만 이 블록을 얹고, 리스트는 지금처럼 미표시를 유지한다(리스트의 카드 높이 불변 제약).

### Phase 4 — 투표 연결

`use-balance-vote`를 그대로 쓴다. 리스트와 정책·가드가 같아 새로 만들 것이 없다.

상세에만 추가되는 것: **마감 상태에서 탭하면 토스트** `마감된 밸런스 게임이에요`. 현재 훅은 마감 시 조용히 무시하므로, 무시 사유를 호출부가 알 수 있게 결과를 돌려주거나 콜백을 받는다.

### Phase 5 — 타이머 (깜빡임 · 마감 문구)

`BalanceRemaining`에 옵션 두 개를 얹는다. 깜빡임은 새 타이머 없이 기존 1초 틱에 얹는다.

### Phase 6 — 마감 전환

카운트다운이 0에 닿으면:

1. **화면 이동 없이** 투표 영역만 마감 상태로 (`closed: true`)
2. 타이머 문구 교체 · 깜빡임 정지
3. `GET /api/community/balance-game`으로 새 게임 조회
4. 토스트 `오늘의 밸런스 게임 보기` — 누르면 새 게임 상세로 이동

**스크롤 보정은 필요 없다(Phase 3에서 확인).** 우려했던 "미투표 → 마감 시 % 가 생겨 행이 늘어난다"는 실제로 일어나지 않는다:

- % 는 문구 **옆**(같은 flex 행)에 붙는다. 행 높이는 캐릭터(최소 66)가 정하고 % 는 그보다 낮아 높이에 관여하지 않는다
- 진행률 fill은 `absolute inset-y-0`이라 애초에 높이에 관여하지 않는다
- 마감 후에도 캐릭터 상태·크기를 유지하기로 해(§0) 투표한 사용자도 높이가 그대로다

즉 마감 전환에서 바뀌는 것은 **색과 문구뿐**이고 레이아웃은 움직이지 않는다.

### Phase 7 — 리액션 바 · 알림 벨

**BE 대기 없이 진행한다.** 좋아요·알림 모두 게시글과 같은 엔드포인트를 contentId로 부르면 된다.

- **좋아요** — BFF `/api/community/posts/{contentId}/likes`가 이미 `PUT /board/like/{id}`로 위임하므로 그대로 재사용. `usePostActions`도 좋아요 부분은 그대로 쓸 수 있다
- **저장** — 버튼을 그리지 않는다. `PostActionBar`는 저장이 필수라 그대로 못 쓰고, 저장 없는 3버튼 바를 따로 만든다
- **공유** — 서버 불필요. 게시글과 같은 방식(navigator.share → 네이티브 브릿지 → 링크 복사)
- **알림 벨** — 토글(PUT)은 기존 `toggleNotice` 재사용. **초기값 조회(GET)는 새로 붙인다** — 게시글은 상세 응답의 `noticeEnabled`로 받지만 밸런스 응답에는 그 필드가 없다

> 저장이 기획에서 뒤집히면 버튼 하나를 추가하는 일이라, 3버튼 바를 만들어 두는 것이 되돌리기 쉽다.

### Phase 8 — 디자인 가이드 적용

가이드를 받아 간격·타이포·크기를 실측값으로 맞춘다. 색은 이미 토큰이라 그대로 둔다.

### Phase 9 — 검증

`tsc` · `eslint` · `build` + 4개 상태 전환, 마감 전환 시 스크롤 유지, 댓글 작성 후 갱신, 비로그인 진입 차단, **게시글 상세 회귀**(댓글 입력 바 `postId` → `contentId` 일반화).

---

## 5. 기술 리스크

1. ~~**마감 전환 시 레이아웃 점프**~~ — **해소됨(Phase 3).** % 는 문구 옆에 붙고 진행률 fill은 절대 배치라 둘 다 행 높이에 관여하지 않는다. 캐릭터 상태도 마감 후 유지되므로 전환 시 바뀌는 것은 색과 문구뿐이다
2. **깜빡임 타이머 이중화** — 별도 `setInterval`을 만들면 문구 갱신과 위상이 어긋난다. 기존 틱에 얹을 것
3. **댓글 입력 바 일반화 blast radius** — `postId` → `contentId`는 게시글 상세도 건드린다. prop 이름만 바뀌고 값·경로는 동일하므로 동작 변화는 없어야 하지만, 게시글 상세 회귀 확인이 필요하다
4. **마감 전환 토스트에 새 게임이 없을 때** — `GET /community/balance-game`이 `null`이면 이동할 곳이 없다. 액션 없는 토스트만 띄운다(기본값)
5. **마감 판정 출처 이원화** — 서버의 `closed` 플래그와 클라이언트 카운트다운이 각자 마감을 판정한다. 둘 중 하나라도 마감이면 마감으로 본다
6. **`PostActionBar` 재사용 불가** — 저장이 필수 prop이라 그대로 못 쓴다. 공유·댓글 포커스 로직은 겹치므로, 공통 부분을 뽑을지 밸런스용 바를 따로 둘지는 Phase 7에서 판단한다. 게시글 쪽 회귀를 감안하면 따로 두는 편이 안전하다

---

## 6. 아직 열린 항목 (기본값으로 진행)

1. **캡처의 `조회 0 · 수정됨`** — 게시글 상세 템플릿이 딸려온 것으로 보인다. 밸런스 게임에는 조회수도 수정 개념도 없어 **노출하지 않는다**
2. **0표 마감** — `0% / 0%`로 표기. 진행률 바는 양쪽 다 비어 있다
3. **댓글 작성 BFF 경로** — 업스트림은 `POST /community/comments`로 중립인데 현재 BFF는 `/api/community/posts/{id}/comments`다. **중립 경로를 새로 만들어** 밸런스가 게시글 이름을 빌리지 않게 한다
4. **공유 문구·링크** — 게시글 공유와 같은 형식으로 상세 URL을 공유. 카운트 없음(게시글 정책과 동일)
5. **타이머 pill 배경** — 캡처의 회색 라운드 배경은 리스트에 없던 것이다. 가이드 전까지 기존 토큰으로 잠정 적용

### 다른 팀에 넘길 것 (웹 착수를 막지 않음)

6. **`BALANCE_DETAIL` actionType** → **iOS.** 브릿지 계약상 웹 작업 없음으로 확인됨(§1). `BALANCE_DETAIL` → `{origin}/community/balance/{contentId}` 매핑과 미지원 값 기본 분기를 iOS에 전달한다
7. **저장 지원 여부** → **기획.** 확인 중. 지원으로 뒤집히면 리액션 바에 버튼 하나를 추가한다

> 에러 코드(§1)와 알림 API(§1)는 확인 완료 — **착수를 막는 항목은 없다.**
