import { unstable_isUnrecognizedActionError } from "next/navigation";

/** 마지막으로 새로 불러온 시각(ms) — 새로 불러온 뒤에도 같은 실패면 다시 불러오지 않는다. */
const RELOADED_AT_KEY = "stale-action-reload-at";
const RELOAD_COOLDOWN_MS = 60_000;
/** 이 화면이 이미 새로 불러오기를 시작했는지. */
let reloading = false;

/**
 * 배포가 바뀌어 서버가 이 화면의 Server Action을 모르면(#515) 한 번만 새로 불러온다.
 *
 * Server Action id는 빌드마다 바뀐다. 앱의 대회 탭 웹뷰는 앱이 살아 있는 동안 다시 불러오지 않아, 배포 전에 연 화면에서
 * 하트 · 알림 · 더 불러오기를 누르면 서버가 그 액션을 모르고 계속 실패한다. 새로 불러오면 새 빌드의 액션으로 맞춰진다.
 * 1분 안에 이미 새로 불러왔으면 하지 않는다 — 다른 이유로 계속 실패할 때 끝없이 새로 불러오지 않게. 그때는 호출부의
 * 지금 실패 처리(토스트 등)가 그대로 돈다.
 *
 * @returns 새로 불러오기를 시작했으면 true.
 */
export function reloadIfStaleDeployment(error: unknown): boolean {
  if (!unstable_isUnrecognizedActionError(error)) return false;
  // 함께 나간 다른 요청도 같은 이유로 실패한다 — 이미 새로 불러오는 중이면 그 요청도 조용히 기다리게 한다.
  if (reloading) return true;
  try {
    const last = Number(window.sessionStorage.getItem(RELOADED_AT_KEY)) || 0;
    if (Date.now() - last < RELOAD_COOLDOWN_MS) return false;
    window.sessionStorage.setItem(RELOADED_AT_KEY, String(Date.now()));
  } catch {
    // 저장소를 못 쓰면 반복을 막을 수 없어 새로 불러오지 않는다.
    return false;
  }
  reloading = true;
  window.location.reload();
  return true;
}

/**
 * Server Action을 부르고, 배포가 바뀌어 실패했으면 새로 불러온다(#515).
 * 새로 불러오는 중이면 끝나지 않는 Promise를 돌려 호출부가 실패 토스트를 띄우지 않게 한다(곧 화면이 바뀐다).
 * 그 밖의 실패는 그대로 다시 던진다.
 */
export async function callServerAction<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (error) {
    if (reloadIfStaleDeployment(error)) return new Promise<T>(() => {});
    throw error;
  }
}
