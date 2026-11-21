import { BalanceBoardSkeleton } from "@/features/community/presentation/balance/balance-board-skeleton";
import {
  FeedCardsSkeleton,
  pulseDelay,
} from "@/features/community/presentation/feed/feed-cards-skeleton";
import { HomeOpenInAppBanner } from "@/features/community/presentation/feed/home-open-in-app-banner";

/**
 * 메인 피드 로딩 스켈레톤.
 *
 * Server Component가 GET /board 응답을 기다리는 동안 노출된다(Next.js route loading).
 * 위에 오늘의 밸런스 게임 자리, 아래에 실제 FeedCard 레이아웃(좌우 px-4, 카드 사이 16)을 흉내 낸
 * 자리표시 카드를 둔다. 밸런스 자리를 비워 두면 데이터가 왔을 때 목록이 한 번에 아래로 밀린다
 * (진행 중인 판이 없는 날은 반대로 한 번 올라온다 — 판이 있는 날이 기본이라 이쪽에 맞춘다).
 *
 * 깜빡임(pulse)은 카드마다 150ms씩 늦춰 위에서 아래로 물결치게 하고, 동작 줄이기면 멈춘다.
 *
 * 브라우저면 홈처럼 맨 위에 '앱으로 보기' 배너(#518). 서버 힌트(AppClientHint)는 깔지 않는다 — 루트 loading이라
 * 요청 헤더를 읽으면 모든 라우트(정책 문서 등 정적 페이지까지)가 동적으로 바뀐다. 하이드레이션 뒤 브릿지 유무로 그린다.
 */
export default function Loading() {
  return (
    <main className="min-h-screen bg-surface-container" aria-hidden>
      <HomeOpenInAppBanner />
      <BalanceGameSkeleton />
      <div className="home-sheet relative bg-surface-container">
        <CategoryTabsSkeleton />
        <FeedCardsSkeleton firstDelay={1} />
      </div>
    </main>
  );
}

/** 오늘의 밸런스 게임 자리 — 홈 맨 위 스코어보드 판과 같은 먹색 뼈대(#305). */
function BalanceGameSkeleton() {
  return <BalanceBoardSkeleton variant="hero" style={pulseDelay(0)} />;
}

/** 카테고리 탭 줄 자리(#590) — 탭 줄과 같은 높이 · 여백이라 목록이 오면 아래가 밀리지 않는다. */
function CategoryTabsSkeleton() {
  return (
    <div className="flex gap-2 overflow-hidden px-4 py-3">
      {[48, 96, 48, 88, 80].map((width, index) => (
        <div
          key={index}
          style={{ width }}
          className="h-8 shrink-0 rounded-full bg-feed-card-header-avatar-bg motion-safe:animate-pulse"
        />
      ))}
    </div>
  );
}
