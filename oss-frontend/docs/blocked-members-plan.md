# 차단한 회원 화면 계획

## 목적

댓글 ⋮ 메뉴로 차단한 회원을 모아 보고, 원하면 차단을 풀 수 있게 한다.
지금은 차단만 있고 해제할 곳이 없다.

## 진입점

- iOS 앱 **설정 > 차단한 회원** 줄 → 이 URL을 서브뷰(`OPEN_SUBVIEW`)로 push한다. 화면은 웹이 전부 그린다. (jiu-jitsu-ios#56, 설정에서 "알림" 아래 별도 묶음)
- 뒤로가기는 다른 서브뷰와 같다(`closeDetail` — 앱이면 네이티브 팝, 웹 단독이면 히스토리 뒤로).
- 유니버설 링크는 이미 `/community/*` 전체를 덮는다.

## 라우트

`/community/blocked-users`

- 엔트리: `src/app/community/blocked-users/page.tsx` · `loading.tsx`(스켈레톤)
- 화면: `src/features/community/presentation/blocked-members/`
- 조회: `get-blocked-members-page-data.ts` → `GetBlockedMembersUseCase` → `CommunityWriteRepository.getBlockedMembers()`

## 백엔드 API (jiu-jitsu-backend#158)

### 목록

```
GET /user/block
→ Envelope<Array<{
    userId: number;
    nickname: string;
    profileImageUrl: string | null;
    blockedAt: string; // ISO 8601
  }>>
```

- 차단한 시각 **최신순**, 탈퇴한 회원은 빠진다.
- 다른 `/user/block` 응답처럼 봉투 없이 배열만 와도 읽는다.

### 해제

```
DELETE /user/block/{id}
→ Envelope<null>
```

- 해제 전용. 이미 풀려 있는 회원이어도 성공한다 → 다른 기기에서 먼저 풀었어도 다시 차단되지 않는다.
- 웹은 BFF `DELETE /api/community/users/{id}/block`으로 보낸다. `data`가 `null`이라 성공 여부는 응답 상태로만 본다.
- 차단 토글 `POST /user/block/{id}`(BFF `POST /api/community/users/{id}/block`)는 댓글 ⋮ 차단용으로 그대로 둔다.

## 상태

| 상태 | 화면 |
|---|---|
| 목록 있음 | 아바타 + 닉네임 + "차단 해제" 버튼. 줄 사이 선 없이 간격으로만 구분 |
| 목록 없음 | "차단한 회원이 없어요" / "차단하면 그 회원의 글과 댓글이 보이지 않아요." |
| 비로그인 | "로그인 후 이용할 수 있어요" (로그인하면 자동 새로고침) |
| 토큰 만료 | 네이티브 갱신 후 다시 그림(`SessionExpiredRecovery`) |
| 에러 | 피드 에러 화면 + 재시도 |

해제 흐름: 확인 알럿("○○님 차단 해제" / "이 회원의 글과 댓글이 다시 보여요.") → 줄을 먼저 지움 → 요청 →
성공 "차단을 해제했어요" / 실패(네트워크 · 401 · 5xx) 시 줄을 원래 자리로 되돌리고 "차단을 해제하지 못했어요".
