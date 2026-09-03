import { notFound } from "next/navigation";

import { AppBarShell } from "@/features/community/presentation/app-bar-shell";

/**
 * 밸런스 게임 상세 라우트 — **스텁**.
 *
 * Next.js 16: params는 Promise이므로 await로 푼다.
 *
 * FIXME(jiu-jitsu-frontend#32 후속): 화면 구현은 상세 이슈에서 한다. 여기서는 리스트의 진입
 * 동선(카드 여백 · 댓글 링크 · sticky 바)을 실제로 검증할 수 있도록 목적지만 먼저 연다.
 *
 * 붙일 때 필요한 것은 이미 갖춰져 있다:
 * - 조회: GET /community/balance-game/{contentId} (마감된 판도 조회 가능, 결과만 노출)
 * - 댓글: 게시글과 같은 GET /community/comments?id={contentId} → 기존 댓글 인프라 재사용
 * - 투표율(%)·진행률 바는 상세 전용이며 토큰(poll-*-result-*)이 이미 들어와 있다
 *
 * 뒤로가기 버튼을 두지 않는 것은 게시글 상세(PostDetailAppBar)와 같은 이유다 — 앱에서는
 * 네이티브 내비게이션이, 웹 단독에서는 브라우저 히스토리가 담당한다.
 */
export default async function BalanceGameDetailPage({
  params,
}: {
  params: Promise<{ contentId: string }>;
}) {
  const { contentId } = await params;

  const parsed = Number(contentId);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-surface-container">
      {/* 내용 없는 빈 바 — 상태바 인셋만 확보한다(제목·액션은 상세 구현 때 채운다). */}
      <AppBarShell>{null}</AppBarShell>

      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 px-4">
        <p className="text-body-m text-text-primary">오늘의 밸런스 게임</p>
        <p className="text-body-s text-text-tertiary">
          상세 화면은 준비 중이에요
        </p>
      </div>
    </main>
  );
}
