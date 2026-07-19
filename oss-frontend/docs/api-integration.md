# API 연동 가이드 (인증 · 토큰 만료)

새 API를 붙일 때 **"어디서 호출하느냐"** 에 따라 만료 토큰 처리 방법이 다릅니다.
아래 2가지 규칙만 지키면 됩니다.

> 배경: accessToken은 httpOnly 세션 쿠키에 있고, **갱신용 refreshToken은 네이티브(Keychain)만** 가집니다.
> 그래서 토큰 갱신은 **브라우저(클라이언트)에서 네이티브 브리지로 위임**해야만 가능합니다. 서버는 못 합니다.

---

## 규칙 1. 클라이언트에서 부를 땐 → `bffFetch`

버튼 클릭, 좋아요, 다음 페이지 로드처럼 **브라우저에서 API를 호출**하면 `fetch` 대신 `bffFetch`를 씁니다.

```ts
import { bffFetch } from "@/shared/lib/http/bff-fetch";

const res = await bffFetch(`/api/community/posts/${id}/likes`, { method: "POST" });
```

- 만료(403 A0003)를 만나면 `bffFetch`가 **네이티브 갱신 → 그 호출만 1회 재시도**까지 알아서 처리합니다.
- 시그니처가 `fetch`와 같아서 그냥 이름만 바꿔주면 됩니다.
- ❌ 클라이언트에서 raw `fetch("/api/...")` 쓰지 마세요. (만료 갱신이 안 됨)

---

## 규칙 2. 서버(SSR)에서 부를 땐 → `session-expired` 반환 + `SessionExpiredRecovery`

Server Component가 초기 데이터를 조회하는 경로(`*-page-data.ts`)는 `bffFetch`를 못 씁니다(서버엔 네이티브 브리지가 없음).
그래서 만료를 만나면 **화면을 못 그린다고 하지 말고**, "만료됐으니 클라이언트가 처리해" 하고 **위임**합니다.

익명으로 격하하면 ❌ (네이티브는 로그인 상태인데 웹만 로그아웃처럼 보여 세션이 어긋남)

### 3단계만 반복하면 됩니다

**① page-data 쿼리: 만료면 `session-expired` 반환**
```ts
// src/features/<feature>/application/get-xxx-page-data.ts
const accessToken = await readSessionToken();
try {
  const data = await createXxxUseCase(accessToken).execute(...);
  return { ok: true, data };
} catch (error) {
  const apiError = toApiError(error);
  if (accessToken && apiError.code === ApiErrorCode.EXPIRED_TOKEN) {
    return { ok: false, reason: "session-expired" };   // ← 익명 격하 X, 위임 O
  }
  return { ok: false, reason: "error", status: apiError.status, code: apiError.code, error: apiError.message };
}
```

**② 결과 타입에 `session-expired` 추가**
```ts
export type XxxPageDataResult =
  | { ok: true; data: XxxPageData }
  | { ok: false; reason: "session-expired" }
  | { ok: false; reason: "error"; status: number; code: string; error: string };
```

**③ Server Component: 만료면 `SessionExpiredRecovery` 렌더**
```tsx
import { SessionExpiredRecovery } from "@/features/auth/presentation/session-expired-recovery";

if (!result.ok) {
  if (result.reason === "session-expired") {
    return <SessionExpiredRecovery loading={<로딩스피너 />} fallback={<에러화면 />} />;
  }
  return <에러화면 />;
}
```

`SessionExpiredRecovery`가 **네이티브 갱신 → 성공 시 `router.refresh()`로 SSR 재실행**해서
인증 상태로 화면을 다시 그립니다. (실패하면 `fallback` 표시)

참고 구현: 피드 [`get-board-list-page-data.ts`](../src/features/community/application/get-board-list-page-data.ts) · [`page.tsx`](../src/app/page.tsx),
상세 [`get-post-detail-page-data.ts`](../src/features/community/application/get-post-detail-page-data.ts) · [`post-detail-screen.tsx`](../src/features/community/presentation/post-detail-screen.tsx)

---

## 한눈에

| 호출 위치 | 방법 | 만료 갱신 |
|---|---|---|
| 클라이언트 (버튼/스크롤 등) | `bffFetch` | ✅ 자동 |
| 서버 SSR 초기 조회 | `session-expired` → `SessionExpiredRecovery` | ✅ 클라이언트로 위임 |
| BFF route (`app/api/*`) | 그대로 (클라이언트가 `bffFetch`로 부름) | ✅ 규칙 1로 커버 |
| 비인증(공개) 조회 | 신경 안 써도 됨 | — |

## 계층 흐름 (참고)

```
클라이언트 동작:  Browser → bffFetch → app/api/* → application → infrastructure → 업스트림
SSR 초기 조회:   Server Component → *-page-data → application → infrastructure → 업스트림
```

- 실제 fetch 상세는 `infrastructure`(repository) 또는 `shared/lib/http`에 둡니다.
- 에러 코드 분기는 `ApiErrorCode`([api-error.ts](../src/shared/lib/http/api-error.ts))에 상수로 모읍니다.
