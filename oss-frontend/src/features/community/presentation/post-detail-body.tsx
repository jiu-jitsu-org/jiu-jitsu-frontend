import { PostMetaRow } from "@/features/community/presentation/post-meta-row";

/**
 * 상세 화면 제목 + 메타(날짜·조회·수정됨) + 본문 (서버 컴포넌트).
 *
 * - 제목: Body M(Pretendard Medium 16), 멀티라인 허용(클램프/말줄임 없음 → 줄 수 무제한).
 * - 날짜: 제목 바로 아래, Label M(12). 서버 상대 시각(timeAgo) 우선. 조회수·수정됨도 같은 줄.
 * - 본문: 원문 줄바꿈 보존, 클램프 없음.
 *
 * FeedCardBody(line-clamp + 더보기 클라이언트 훅)와 달리 상세는 전문을 펼쳐 보여주므로
 * 상세 전용 서버 컴포넌트로 분리한다.
 */
export function PostDetailBody({
  title,
  body,
  createdAt,
  timeAgo,
  views,
  edited,
}: {
  title: string;
  body: string;
  createdAt: string;
  timeAgo?: string;
  views?: number;
  edited: boolean;
}) {
  return (
    <div className="flex flex-col">
      {/* 제목: Body M, 멀티라인 허용 */}
      <h1 className="text-body-m text-feed-card-body-title-text">
        {title}
      </h1>
      {/* 날짜·조회·수정됨: 제목 바로 아래 6 */}
      <PostMetaRow
        createdAt={createdAt}
        timeAgo={timeAgo}
        views={views}
        edited={edited}
        className="mt-1.5"
      />
      {/* 본문: Body S(14/21), 메타 아래 12, 줄 수 제한 없음(클램프 없음) */}
      <p className="mt-3 whitespace-pre-wrap text-body-s text-feed-card-body-text">
        {body}
      </p>
    </div>
  );
}
