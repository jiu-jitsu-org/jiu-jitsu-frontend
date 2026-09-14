import { headers } from "next/headers";

/**
 * 지금 요청이 들어온 origin(예: https://bjj-oss.kr) — 공유 미리보기의 절대 URL(metadataBase) 기준.
 *
 * WHY 환경변수가 아니라 요청 헤더인가: 공유 URL 자체를 "환경별 origin 그대로"(window.location.origin)
 * 쓰는 정책이라(shareCurrentPage), 미리보기 이미지도 같은 origin에서 나가야 dev/운영이 각자 맞는다.
 * 별도 설정 없이 배포 환경마다 따라간다.
 *
 * 프록시 뒤에서는 x-forwarded-* 가 실제 외부 주소다. 콤마로 여러 개 오면 맨 앞(최초 진입)을 쓴다.
 * host가 없는 비정상 요청이면 null — 호출부는 상대 경로 이미지를 빼고 보낸다(잘못된 절대 URL 방지).
 */
export async function getRequestOrigin(): Promise<URL | null> {
  const requestHeaders = await headers();

  const host = firstForwarded(
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"),
  );
  if (!host) return null;

  const protocol =
    firstForwarded(requestHeaders.get("x-forwarded-proto")) ??
    (isLoopbackHost(host) ? "http" : "https");

  try {
    return new URL(`${protocol}://${host}`);
  } catch {
    return null;
  }
}

function firstForwarded(value: string | null): string | null {
  const first = value?.split(",")[0]?.trim();
  return first ? first : null;
}

/** 로컬 개발(http://localhost:3000 · LAN IP 웹뷰 테스트)은 TLS가 없다. */
function isLoopbackHost(host: string): boolean {
  return (
    host.startsWith("localhost") ||
    host.startsWith("127.") ||
    host.startsWith("0.0.0.0") ||
    /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)
  );
}
