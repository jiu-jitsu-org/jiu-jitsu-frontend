import Link from "next/link";

/**
 * 아직 목업이 연결되지 않은 상세 타입의 자리표시 (개발용).
 * 리스트로 돌아가는 링크와 "연결 예정" 안내만 둔다.
 */
export function DetailVariantPlaceholder({ title }: { title: string }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-white px-6 text-center text-zinc-900">
      <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-500">
        연결 예정
      </span>
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-sm text-zinc-600">
        목업이 아직 연결되지 않았습니다.
      </p>
      <Link
        href="/community-playground/detail"
        className="mt-2 text-sm font-medium text-zinc-900 underline underline-offset-4"
      >
        ← 타입 선택으로 돌아가기
      </Link>
    </main>
  );
}
