/**
 * Central place for environment access (server + public client values).
 *
 * Why this file exists:
 * - Avoids reading `process.env` everywhere.
 * - Gives one validation point when the app boots or a route is hit.
 * - Makes future env expansion predictable for the whole team.
 *
 * Note on client values: `NEXT_PUBLIC_*` reads must stay as literal
 * `process.env.NEXT_PUBLIC_X` expressions so the bundler can inline them at
 * build time. Keep those reads here (not scattered in feature code).
 */
type ServerEnv = {
  apiBaseUrl: string;
  apiTimeoutMs: number;
  /**
   * (dev 전용) 업스트림 API 요청/응답을 서버 터미널에 로깅할지 여부.
   * NODE_ENV가 production이면 어떤 경우에도 false → 운영 노출 원천 차단.
   */
  apiDebugLog: boolean;
  /**
   * 대회 화면(대회 탭·상세·글 속 대회 카드·글쓰기 대회 고르기·알림함 대회 줄)을 열지.
   * COMPETITION_ENABLED가 "false"일 때만 끈다. 비어 있으면 켠다 — 앱은 대회 탭을 늘 띄우고 숨길 방법이
   * 없어, 배포에 값이 빠져 꺼지면 탭 전체가 오류 화면이 된다(#502). 대회 API가 없는 백엔드를 바라보는
   * 배포만 "false"를 넣는다.
   */
  competitionEnabled: boolean;
};

type ImageKitClientEnv = {
  uploadUrl: string;
  publicKey: string;
};

let cachedEnv: ServerEnv | null = null;

function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Check your .env.development or .env.production file.`,
    );
  }

  return value;
}

export function getServerEnv(): ServerEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  cachedEnv = {
    apiBaseUrl: requireEnv(
      "INTERNAL_API_BASE_URL or API_BASE_URL",
      process.env.INTERNAL_API_BASE_URL ?? process.env.API_BASE_URL,
    ),
    apiTimeoutMs: parseNumber(process.env.API_TIMEOUT_MS, 10000),
    // 이중 게이트: production 빌드에서는 플래그 값과 무관하게 항상 꺼진다.
    apiDebugLog:
      process.env.NODE_ENV !== "production" &&
      process.env.API_DEBUG_LOG === "true",
    competitionEnabled: resolveCompetitionEnabled(process.env.COMPETITION_ENABLED),
  };

  return cachedEnv;
}

/**
 * Public ImageKit config for the browser-side upload flow.
 *
 * publicKey/uploadUrl are not secrets, so client exposure via `NEXT_PUBLIC_*`
 * is expected. Defaults point at the live 주짓수랩 ImageKit account so a
 * standalone build keeps working without extra injection; env can override.
 * The server signing route (/api/community/image/auth) must use the same account.
 */
export function getImageKitClientEnv(): ImageKitClientEnv {
  return {
    uploadUrl:
      process.env.NEXT_PUBLIC_IMAGEKIT_UPLOAD_URL ??
      "https://upload.imagekit.io/api/v1/files/upload",
    publicKey:
      process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY ??
      "public_mQk8MsljUr3YQ2KBYGqSJg3gYAc=",
  };
}

/**
 * 대회 화면을 열지(ServerEnv.competitionEnabled) — COMPETITION_ENABLED가 "false"(대소문자·앞뒤 공백 무시)면 끄고,
 * 그 밖(비어 있음 · "true")은 켠다(#502).
 */
function resolveCompetitionEnabled(flag: string | undefined): boolean {
  return flag?.trim().toLowerCase() !== "false";
}

/**
 * (dev 전용) 로컬 개발 서버(next dev)에서 도는지 — 화면 확인용 예시 데이터 같은 개발 편의 분기에 쓴다.
 * production 빌드에서는 항상 false라 그 분기는 운영에서 동작하지 않는다.
 */
export function isDevelopmentRuntime(): boolean {
  return process.env.NODE_ENV === "development";
}
