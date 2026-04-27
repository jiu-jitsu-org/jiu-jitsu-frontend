import { getServerEnv } from "@/config/env";
import { HttpClient } from "@/shared/lib/http/http-client";

/**
 * Factory for server-side HTTP clients.
 *
 * Every BFF feature can reuse this instead of reconstructing env-aware clients
 * on its own. If auth headers, tracing, or logging are needed later, this is
 * one of the first places to extend.
 */
export function createServerHttpClient(): HttpClient {
  const env = getServerEnv();

  return new HttpClient({
    baseUrl: env.apiBaseUrl,
    timeoutMs: env.apiTimeoutMs,
  });
}
