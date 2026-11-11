/**
 * ImageKit 사진을 보이는 크기에 맞춰 줄여 받는 주소.
 *
 * 피드 프로필 사진은 24px로 보이는데 1024px 원본(약 290KB)을 그대로 받고 있었다. 첫 화면 사진 수만큼
 * 내려받기가 길어지고, 앱은 그동안 로딩 덮개를 띄워 둔다(jiu-jitsu-ios#261). ImageKit은 주소에
 * `tr` 파라미터를 붙이면 잘라·줄여서 보낸다(1024px 프로필 → 192px 약 12KB).
 *
 * ImageKit 주소가 아니거나(외부·로컬·blob 미리보기) 이미 변환이 붙어 있으면 그대로 돌려준다.
 * `,`가 `%2C`로 바뀌지 않게 URLSearchParams 대신 문자열로 붙인다.
 */
const IMAGEKIT_HOST = "ik.imagekit.io";

/** 프로필 사진: 가장 크게 보이는 64px(내 활동 머리)의 3배. 화면마다 같은 주소라 한 번 받으면 캐시를 같이 쓴다. */
export const AVATAR_IMAGE_TRANSFORM = "w-192,h-192";

/** 피드 글 사진: 카드 폭(화면 폭 − 32, 최대 약 400px)의 3배. 원본이 더 작으면 키우지 않는다(c-at_max). */
export const FEED_IMAGE_TRANSFORM = "w-1200,c-at_max";

export function resizeImageKitUrl(url: string, transform: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  if (parsed.hostname !== IMAGEKIT_HOST) return url;
  if (parsed.searchParams.has("tr") || parsed.pathname.includes("/tr:")) return url;
  return `${url}${url.includes("?") ? "&" : "?"}tr=${transform}`;
}
