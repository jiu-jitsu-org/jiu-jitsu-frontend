import { getServerEnv, isDevelopmentRuntime } from "@/config/env";

/**
 * 대회 탭 화면을 열지.
 *
 * 대회 목록 API가 나오기 전까지는 고정(가짜) 데이터로 그리므로 로컬(next dev)과 개발 서버(dev API를
 * 바라보는 배포)에서만 연다. 운영 사용자가 가짜 대회를 보지 않게 운영에서는 404다.
 * API를 붙이면 이 파일과 호출부를 지운다.
 */
export function isCompetitionPageEnabled(): boolean {
  if (isDevelopmentRuntime()) return true;
  try {
    return getServerEnv().apiBaseUrl.includes("dev-api");
  } catch {
    return false;
  }
}
