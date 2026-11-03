import { getServerEnv, isDevelopmentRuntime } from "@/config/env";

/**
 * /ds(디자인 시스템) 페이지를 보여줄지.
 *
 * 로컬(next dev)과 개발 서버(dev API를 바라보는 배포)에서만 연다 — 디자이너·개발자가 실물을 보는 곳이라
 * 운영 사용자에게는 404로 보인다.
 */
export function isDesignSystemPageEnabled(): boolean {
  if (isDevelopmentRuntime()) return true;
  try {
    return getServerEnv().apiBaseUrl.includes("dev-api");
  } catch {
    return false;
  }
}
