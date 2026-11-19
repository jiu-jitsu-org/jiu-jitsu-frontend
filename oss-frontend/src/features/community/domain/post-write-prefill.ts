import {
  POST_TITLE_MAX_LENGTH,
  type PostCategory,
} from "@/features/community/domain/post";

/**
 * 새 글쓰기를 미리 채워 여는 값(#588) — 글쓰기 주소 쿼리로 넘어온다.
 *
 * - categoryId(`?categoryId=`): 홈에서 카테고리를 고른 채 쓰기 버튼 · '이 주제로 쓰기'
 * - topic(`?topic=`): 이번 주 써 볼 주제 — 글쓰기 위에 보여 줄 뿐 제목에 넣지 않는다
 * - title(`?title=`): 검색 결과 0건의 '이 주제로 글쓰기' — 검색어를 제목에
 *
 * 대회 미리 고르기(`?competitionId=`, #433)는 대회 고르기 칸이 따로 읽는다. 수정 화면은 미리 채우지 않는다.
 */
export type PostWritePrefill = {
  /** 고른 채 열 카테고리. 목록에 없는 id면 null. */
  categoryId: number | null;
  /** 제목에 넣을 글. 없으면 "". */
  title: string;
  /** 글쓰기 위에 보여 줄 써 볼 주제. 없으면 null. */
  topic: string | null;
};

/** 써 볼 주제 글자 수 상한 — 서버 weeklyTopic 상한(backend#267, 100자)과 같다. 손으로 친 긴 주소를 자른다. */
const TOPIC_MAX_LENGTH = 100;

type RawParam = string | string[] | undefined;

function single(raw: RawParam): string {
  return typeof raw === "string" ? raw.trim() : "";
}

/**
 * 주소 쿼리를 미리 채울 값으로 좁힌다. 숫자가 아니거나 없는 카테고리 · 빈 값은 버리고,
 * 제목은 입력 제한(45자)까지만 남긴다. 주제는 카테고리가 있을 때만 뜻이 있다 — 어느 카테고리의 주제인지 모르면 버린다.
 */
export function parsePostWritePrefill(
  raw: { categoryId?: RawParam; title?: RawParam; topic?: RawParam },
  categories: PostCategory[],
): PostWritePrefill {
  const id = Number(single(raw.categoryId));
  const categoryId =
    Number.isInteger(id) && categories.some((category) => category.id === id)
      ? id
      : null;
  // 줄바꿈은 제목이 받지 않는다(글쓰기 입력과 같은 규칙) — 공백으로 바꾼다.
  const title = single(raw.title)
    .replace(/[\r\n]+/g, " ")
    .slice(0, POST_TITLE_MAX_LENGTH)
    .trim();
  const topic = single(raw.topic).slice(0, TOPIC_MAX_LENGTH).trim();
  return {
    categoryId,
    title,
    topic: categoryId !== null && topic.length > 0 ? topic : null,
  };
}
