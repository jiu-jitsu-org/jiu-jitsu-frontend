import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * 커뮤니티 화면은 오픈 초기 검색 결과에 올리지 않는다(#513) — 글 · 닉네임 · 띠가 검색에 노출되면 처리방침이 말하는
 * "서비스 내 다른 이용자에게 공개" 범위보다 넓다. 하위 화면의 generateMetadata(공유 미리보기)는 robots를 건드리지
 * 않으므로 이 값이 그대로 남는다. 링크는 따라가게 둔다(follow) — 글 속 대회 등 공개 화면으로 이어지게.
 */
export const metadata: Metadata = {
  robots: { index: false },
};

export default function CommunityLayout({ children }: { children: ReactNode }) {
  return children;
}
