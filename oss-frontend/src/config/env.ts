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
 * '참여한 밸런스 게임' 탭(내 커뮤니티 활동 ?tab=balance) 노출 모드.
 *
 * - "off": 탭을 감춘다(기본). 업스트림 목록 API가 아직 없어 운영에서는 이 값이다.
 * - "on": 탭을 보이고 실제 목록 API(GET /community/balance-game/participated)를 부른다.
 * - "preview": 탭을 보이되 목록을 기존 단건 조회로 지어낸다 — 디자인 검토 전용 임시 모드.
 *
 * NEXT_PUBLIC인 이유: 탭 바(클라이언트)와 서버 라우트가 같은 값을 봐야 한다. 빌드 시 인라인된다.
 * 업스트림 API가 생기고 운영에 켜지면 이 플래그와 preview 분기를 함께 걷어낸다.
 */
export type MyBalanceGamesMode = "off" | "on" | "preview";

export function getMyBalanceGamesMode(): MyBalanceGamesMode {
  const value = process.env.NEXT_PUBLIC_MY_BALANCE_GAMES;
  return value === "on" || value === "preview" ? value : "off";
}
