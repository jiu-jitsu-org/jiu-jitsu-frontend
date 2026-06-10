/**
 * Shared HTTP barrel.
 *
 * 이 index는 의도적으로 런타임 경계가 비교적 중립적인 API만 공개한다.
 * - `HttpClient`: infrastructure repository가 주입받아 쓰는 공통 fetch adapter
 * - `HttpError`: route/page-data에서 upstream 실패를 판별하는 공통 error type
 *
 * `create-server-http-client.ts`의 factory들은 여기서 re-export하지 않는다.
 * 해당 factory들은 `getServerEnv()`를 통해 서버 전용 환경 값을 읽고, 인증 factory는
 * accessToken을 Authorization header로 조립한다. 이들을 `@/shared/lib/http`에 함께
 * 노출하면 클라이언트 코드가 단순 error/type import를 하려다 서버 전용 조립 코드까지 같은
 * public entrypoint로 끌어들이기 쉽다. Next의 Server/Client Component 경계가 흐려지는
 * 것을 막기 위해 서버 factory 사용처는 지금처럼
 * `@/shared/lib/http/create-server-http-client`를 직접 import해서 서버 전용 의존성임을
 * import 경로에서 드러낸다.
 *
 * 내부 구현 파일도 이 barrel을 거치지 않고 sibling 파일을 직접 import한다. 그래야 index가
 * 구현 파일의 의존성 그래프 한가운데 끼어들지 않고, barrel self-dependency나 순환 의존을
 * 피할 수 있다.
 */
export { HttpClient } from "./http-client";
export { HttpError } from "./http-error";
export {
  ApiError,
  ApiErrorCode,
  isApiErrorBody,
  toApiError,
  type ApiErrorBody,
} from "./api-error";
