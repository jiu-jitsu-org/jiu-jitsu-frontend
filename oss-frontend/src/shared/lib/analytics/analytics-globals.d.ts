/**
 * GA 웹 태그(gtag.js) 전역 타입(#575 · #579). 태그는 앱 밖 브라우저에서만 뜬다.
 * 직접 접근은 web-tag.ts(정의 · 설정)와 track.ts(기록 보내기) 두 곳으로만 한정한다.
 *
 * NOTE: 파일명을 track.ts와 다르게 둔다(같은 basename의 .d.ts는 그 .ts의 선언 파일로 간주된다).
 */
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export {};
