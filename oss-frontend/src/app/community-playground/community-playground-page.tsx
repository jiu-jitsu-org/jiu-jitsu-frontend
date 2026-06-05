"use client";

/**
 * 커뮤니티 피드 공통 UI 쇼케이스 (개발용).
 *
 * shared/ui의 피드 콘텐츠 컴포넌트를 모바일 폭(~390px) 프레임 안에서 상태별로 나열한다.
 * 각 컴포넌트 Phase가 완료될 때마다 이 파일에 섹션을 추가한다.
 */
export function CommunityPlaygroundPage() {
  return (
    <main className="min-h-screen bg-surface-background px-4 py-8">
      <div className="mx-auto w-full max-w-[390px]">
        <header className="mb-6">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-secondary">
            Community UI Playground
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-text-primary">
            피드 공통 컴포넌트 쇼케이스
          </h1>
        </header>

        {/* 컴포넌트 섹션은 각 Phase에서 추가됩니다. */}
        <p className="rounded-xl border border-dashed border-border-default bg-surface-container p-6 text-center text-sm text-text-tertiary">
          아직 추가된 컴포넌트가 없습니다. Phase 1부터 여기에 표시됩니다.
        </p>
      </div>
    </main>
  );
}
