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
