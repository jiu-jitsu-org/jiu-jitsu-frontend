import type { CSSProperties } from "react";

import { BlockedMembersAppBar } from "@/features/community/presentation/blocked-members/blocked-members-app-bar";
import { SubviewScrollShell } from "@/features/community/presentation/subview-scroll-shell";

/** 줄마다 150ms씩 늦춰 위에서 아래로 물결치게 깜빡인다(내 커뮤니티 활동 스켈레톤과 같은 방식). */
function pulseDelay(order: number): CSSProperties {
  return { animationDelay: `${order * 150}ms` };
}

const BLOCK = "rounded bg-feed-card-header-avatar-bg";

/**
 * 차단한 회원 로딩 스켈레톤 — 라우트 loading.tsx가 그린다.
 *
 * 앱바는 진짜를 그린다(제목이 바로 보이고, 느린 조회에서도 뒤로 나갈 수 있다).
 * 그 아래 줄(아바타 40 + 닉네임 + 버튼 자리)을 실제 목록과 같은 간격으로 잡는다.
 */
export function BlockedMembersSkeleton() {
  return (
    <SubviewScrollShell className="bg-[var(--bw-white)]">
      <BlockedMembersAppBar />

      <ul aria-hidden className="pt-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <li
            key={index}
            style={pulseDelay(index)}
            className="flex items-center gap-3 px-4 py-2.5 motion-safe:animate-pulse"
          >
            <div className="size-10 shrink-0 rounded-full bg-feed-card-header-avatar-bg" />
            <div className={`h-4 w-28 ${BLOCK}`} />
            <div className={`ml-auto h-8 w-[66px] rounded-[8px] ${BLOCK}`} />
          </li>
        ))}
      </ul>
    </SubviewScrollShell>
  );
}
