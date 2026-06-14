/**
 * 메인 피드 로딩 스켈레톤.
 *
 * Server Component가 GET /board 응답을 기다리는 동안 노출된다(Next.js route loading).
 * 실제 FeedCard 레이아웃(좌우 px-4, 카드 사이 16)을 흉내 낸 자리표시 카드.
 */
export default function Loading() {
  return (
    <main className="min-h-screen bg-[var(--bw-white)]">
      <div className="flex flex-col gap-4 py-4" aria-hidden>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-3 px-4 py-4">
            <div className="flex items-center gap-2">
              <div className="size-6 animate-pulse rounded-full bg-feed-card-header-avatar-bg" />
              <div className="h-4 w-24 animate-pulse rounded bg-feed-card-header-avatar-bg" />
            </div>
            <div className="h-4 w-2/3 animate-pulse rounded bg-feed-card-header-avatar-bg" />
            <div className="h-3 w-full animate-pulse rounded bg-feed-card-header-avatar-bg" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-feed-card-header-avatar-bg" />
          </div>
        ))}
      </div>
    </main>
  );
}
