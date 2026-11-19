"use client";

import { useOpenPostWrite } from "@/features/community/presentation/use-open-post-write";
import { EmptyState } from "@/shared/ui/empty-state";

/** 0건 문구에 넣는 검색어 길이 상한 — 넘으면 줄임표. 긴 말이 문구를 여러 줄로 밀어내지 않게. */
const KEYWORD_PREVIEW_LENGTH = 20;

/**
 * 검색 0건 (#591) — "'○○' 글이 아직 없어요" + '이 주제로 글쓰기'.
 *
 * 오픈 초반엔 글이 적어 0건이 많다 — 찾던 말을 제목에 넣은 글쓰기로 바로 이어 준다(#588, 자르기는 작성 화면).
 * 글쓰기는 로그인이 필요하다(useOpenPostWrite가 막는다). 모양은 공통 EmptyState(피드 빈 화면과 같은 규격)다.
 * 0건 검색어 기록은 서버가 따로 남긴다(#266) — 웹은 할 일이 없다.
 */
export function PostSearchEmpty({ keyword }: { keyword: string }) {
  const openWrite = useOpenPostWrite({ title: keyword, from: "search_empty" });
  const preview =
    keyword.length > KEYWORD_PREVIEW_LENGTH
      ? `${keyword.slice(0, KEYWORD_PREVIEW_LENGTH)}…`
      : keyword;

  return (
    // 세로 위치는 다른 서브뷰 빈 화면(내 커뮤니티 활동)과 같은 35%.
    <EmptyState
      title={`'${preview}' 글이 아직 없어요`}
      action={{ label: "이 주제로 글쓰기", onClick: openWrite }}
      className="pt-[35vh] wrap-anywhere"
    />
  );
}
