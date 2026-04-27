/**
 * Central place for server-side environment access.
 *
 * Why this file exists:
 * - Avoids reading `process.env` everywhere.
 * - Gives one validation point when the app boots or a route is hit.
 * - Makes future env expansion predictable for the whole team.
 */
type ServerEnv = {
  apiBaseUrl: string;
  apiTimeoutMs: number;
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
    apiBaseUrl: requireEnv("API_BASE_URL", process.env.API_BASE_URL),
    apiTimeoutMs: parseNumber(process.env.API_TIMEOUT_MS, 10000),
  };

  return cachedEnv;
}
