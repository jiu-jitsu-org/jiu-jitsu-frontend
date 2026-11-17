import type { MetadataRoute } from "next";

/**
 * robots.txt (#513) — 검색 엔진이 들어오지 않을 경로.
 *
 * 로그인해야 의미가 있는 화면(내 활동 · 알림함 · 차단 목록 · 글쓰기 · 수정)과 BFF(`/api`), 디자인 시스템(`/ds`)은 막는다.
 * 글 · 밸런스 게임 상세는 여기서 막지 않고 페이지 메타의 noindex로 뺀다(community/layout.tsx) — robots.txt로 막으면
 * 검색 엔진이 noindex를 읽지 못해 주소만 결과에 남을 수 있다. 홈 · 대회 · 정책은 연다.
 * 카카오톡 등 링크 미리보기는 robots.txt를 보지 않는다.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/ds",
        "/community/me",
        "/community/notifications",
        "/community/blocked-users",
        "/community/write",
        "/community/*/edit",
      ],
    },
  };
}
