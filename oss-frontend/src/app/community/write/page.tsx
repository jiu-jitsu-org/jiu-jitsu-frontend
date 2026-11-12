import { getPostCategoriesOrFallback } from "@/features/community/application/get-post-write-page-data";
import { PostWriteScreen } from "@/features/community/presentation/post-write-screen";
import { getCompetitionPickerForWrite } from "@/features/competition/application/get-competition-picker-options";
import { parseCompetitionId } from "@/features/competition/domain/competition";
import { NativePageReady } from "@/shared/lib/native-bridge";
import { readServerNow, toKstDateKey } from "@/shared/lib/time";

/**
 * 게시글 작성 라우트 (얇은 엔트리).
 *
 * 카테고리 칩 목록만 서버에서 읽어 넘기고(실패 시 폴백), 나머지는 전 영역이 인터랙티브한
 * 클라이언트 화면(PostWriteScreen)에 위임한다.
 * `?competitionId=<숫자>`로 들어오면(대회 이야기의 "첫 글 남기기", #433) '대회' 카테고리와 그 대회를 미리 골라 둔다.
 * 숫자가 아니거나 고를 수 없는 대회면 무시하고 빈 글쓰기로 연다.
 */
export default async function CommunityWritePage({
  searchParams,
}: {
  searchParams: Promise<{ competitionId?: string | string[] }>;
}) {
  const now = readServerNow();
  const { competitionId: rawCompetitionId } = await searchParams;
  const preselectId =
    typeof rawCompetitionId === "string"
      ? parseCompetitionId(rawCompetitionId)
      : null;
  const [categories, competition] = await Promise.all([
    getPostCategoriesOrFallback(),
    // '대회' 카테고리에서 고를 대회(#367). 못 읽으면 빈 목록 — 고르기 칸이 안 나온다.
    getCompetitionPickerForWrite(preselectId),
  ]);
  return (
    <>
      <PostWriteScreen
        categories={categories}
        competitionPicker={
          competition.options.length > 0
            ? {
                options: competition.options,
                initialId: competition.initialId,
                currentYear: Number(toKstDateKey(now).slice(0, 4)),
              }
            : undefined
        }
      />
      {/* 글쓰기 화면이 그려지면 앱이 로딩 덮개를 걷는다(jiu-jitsu-ios#261). */}
      <NativePageReady />
    </>
  );
}
