/**
 * (dev 전용) 업스트림 API 요청/응답을 서버 터미널에 가독성 있게 찍는 디버깅 로거.
 *
 * 원칙:
 * - 서버측 HttpClient에서만 호출된다 → 로그는 `npm run dev` 터미널에만 남고
 *   브라우저/웹뷰/클라이언트 번들로는 절대 나가지 않는다.
 * - Authorization/Cookie 등 민감 헤더는 값을 마스킹한다(토큰 유출 방지).
 * - 요청/응답을 상관 ID(#seq)로 묶어 어떤 호출의 응답인지 한눈에 보이게 한다.
 * - 활성화는 config/env.ts의 이중 게이트(NODE_ENV!==production && API_DEBUG_LOG)로만.
 */

// 요청↔응답을 짝지어 볼 수 있게 하는 프로세스 단위 시퀀스 카운터.
let requestSeq = 0;

export function nextRequestSeq(): number {
  requestSeq += 1;
  return requestSeq;
}

// 값을 통째로 가리지 않고 스킴(Bearer 등)만 남겨 "무엇이 붙었는지"는 보이게 한다.
const SENSITIVE_HEADER_KEYS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "x-auth-token",
]);

function maskHeaderValue(value: string): string {
  const spaceIndex = value.indexOf(" ");
  if (spaceIndex > 0) {
    // 예: "Bearer eyJ..." → "Bearer ***redacted***"
    return `${value.slice(0, spaceIndex)} ***redacted***`;
  }
  return "***redacted***";
}

function maskHeaders(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    // Headers는 key를 소문자로 정규화하므로 그대로 비교 가능.
    out[key] = SENSITIVE_HEADER_KEYS.has(key) ? maskHeaderValue(value) : value;
  });
  return out;
}

// 응답/요청 본문이 거대할 수 있어 길이를 제한한다. 구조 파악이 목적이라 pretty-print.
function formatBody(value: unknown, maxChars = 4000): string {
  let text: string;
  try {
    text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  } catch {
    text = String(value);
  }

  if (text === undefined) {
    return String(value);
  }

  if (text.length > maxChars) {
    return `${text.slice(0, maxChars)}\n… (${text.length - maxChars} chars truncated)`;
  }

  return text;
}

export function logHttpRequest(params: {
  seq: number;
  method: string;
  url: string;
  headers: Headers;
  hasBody: boolean;
  body: unknown;
}): void {
  const { seq, method, url, headers, hasBody, body } = params;
  console.log(`\n[API #${seq}] → ${method} ${url}`);
  console.log(`[API #${seq}]   headers`, maskHeaders(headers));
  if (hasBody) {
    console.log(`[API #${seq}]   body\n${formatBody(body)}`);
  }
}

export function logHttpResponse(params: {
  seq: number;
  method: string;
  url: string;
  status: number;
  ok: boolean;
  elapsedMs: number;
  body: unknown;
}): void {
  const { seq, method, url, status, ok, elapsedMs, body } = params;
  const mark = ok ? "←" : "✕";
  console.log(
    `[API #${seq}] ${mark} ${status} (${elapsedMs}ms) ${method} ${url}`,
  );
  console.log(`[API #${seq}]   response\n${formatBody(body)}`);
}

export function logHttpFailure(params: {
  seq: number;
  method: string;
  url: string;
  elapsedMs: number;
  reason: string;
}): void {
  const { seq, method, url, elapsedMs, reason } = params;
  console.log(
    `[API #${seq}] ✕ FAILED (${elapsedMs}ms) ${method} ${url} — ${reason}`,
  );
}
