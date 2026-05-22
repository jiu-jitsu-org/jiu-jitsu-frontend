# Bootstrap Feature Presentation

이 디렉터리는 `bootstrap` 관련 화면, hooks, 클라이언트 컴포넌트를 둘 자리다.

현재 `version-info-page.tsx`는 bootstrap 응답을 렌더링하는 순수 presentation 컴포넌트다.
초기 Server Component 조회는 BFF Route Handler를 다시 호출하지 않고 application query를 직접 사용한다.
이후 사용자가 버튼을 누르는 갱신 동작은 `actions/load-bootstrap-info-action.ts` Server Action을 사용한다.
단, `/api/bootstrap/info` Route Handler는 브라우저 또는 외부 HTTP 클라이언트용 BFF endpoint로 유지한다.
