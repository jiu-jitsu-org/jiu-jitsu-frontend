import { getPostCategoriesOrFallback } from "@/features/community/application/get-post-write-page-data";
import { PostWriteScreen } from "@/features/community/presentation/post-write-screen";
import { getCompetitionPickerOptions } from "@/features/competition/application/get-competition-picker-options";
import { NativePageReady } from "@/shared/lib/native-bridge";
import { readServerNow, toKstDateKey } from "@/shared/lib/time";

/**
 * 게시글 작성 라우트 (얇은 엔트리).
 *
 * 카테고리 칩 목록만 서버에서 읽어 넘기고(실패 시 폴백), 나머지는 전 영역이 인터랙티브한
 * 클라이언트 화면(PostWriteScreen)에 위임한다.
 */
export default async function CommunityWritePage() {
  const now = readServerNow();
  const [categories, competitionOptions] = await Promise.all([
    getPostCategoriesOrFallback(),
    // '대회' 카테고리에서 고를 대회(#367). 못 읽으면 빈 목록 — 고르기 칸이 안 나온다.
    getCompetitionPickerOptions(),
  ]);
  return (
    <>
      <PostWriteScreen
        categories={categories}
        competitionPicker={
          competitionOptions.length > 0
            ? {
                options: competitionOptions,
                initialId: null,
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
