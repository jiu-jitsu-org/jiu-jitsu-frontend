import { LinkedText } from "@/features/community/presentation/linked-text";
import { PostMetaRow } from "@/features/community/presentation/post-meta-row";

/**
 * 상세 화면 제목 + 메타(카테고리·날짜·조회·수정됨) + 본문 (서버 컴포넌트).
 *
 * - 제목: Body M(Pretendard Medium 16), 멀티라인 허용(클램프/말줄임 없음 → 줄 수 무제한).
 * - 날짜: 제목 바로 아래, Label M(12). 공통 상대 시간(탭하면 정확 시각). 카테고리(앞)·수정됨·조회수도 같은 줄.
 * - 본문: 원문 줄바꿈 보존, 클램프 없음. 속의 주소는 눌러 열 수 있다(#593).
 *
 * FeedCardBody(line-clamp + 더보기 클라이언트 훅)와 달리 상세는 전문을 펼쳐 보여주므로
 * 상세 전용 서버 컴포넌트로 분리한다.
 */
export function PostDetailBody({
  title,
  body,
  categoryName,
  createdAt,
  views,
  viewPath,
  edited,
}: {
  title: string;
  body: string;
  categoryName?: string;
  createdAt: string;
  views?: number;
  /** 상세를 연 것으로 세는 BFF 경로(#523). */
  viewPath?: string;
  edited: boolean;
}) {
  return (
    // 시각 보정: 위 동그란 띠 아바타보다 글줄이 왼쪽으로 튀어 보이지 않게 2 들인다(피드 카드와 같다).
    <div className="flex flex-col pl-0.5">
      {/* 제목: Body M, 멀티라인 허용 */}
      <h1 className="text-body-m wrap-anywhere text-feed-card-body-title-text">
        {title}
      </h1>
      {/* 카테고리·날짜·조회·수정됨: 제목 바로 아래 6 */}
      <PostMetaRow
        categoryName={categoryName}
        createdAt={createdAt}
        views={views}
        viewPath={viewPath}
        edited={edited}
        className="mt-1.5"
      />
      {/* 본문: Body S(14/21), 메타 아래 12, 줄 수 제한 없음(클램프 없음). 내용 없는 글(#589)은 줄째 뺀다. */}
      {body.trim() ? (
        <p className="mt-3 whitespace-pre-wrap wrap-anywhere text-body-s text-feed-card-body-text">
          <LinkedText text={body} />
        </p>
      ) : null}
    </div>
  );
}
