import type { Metadata } from "next";

/**
 * 공유 미리보기(og:*) 공통 규칙.
 *
 * 카카오톡·iMessage 등은 링크의 og:title / og:description / og:image로 카드를 그린다.
 * 이 값이 없으면 스크래퍼가 페이지 첫 <img>(작성자 아바타)와 `<title>`을 임의로 긁어가
 * "oss-frontend · 여기를 눌러 링크를 확인하세요" 같은 카드가 된다.
 */

/** 서비스 표시명 — 앱 이름(CFBundleDisplayName)과 맞춘다. */
export const SITE_NAME = "OSS";

export const SITE_DESCRIPTION = "주짓수 커뮤니티 OSS";

/**
 * 콘텐츠에 이미지가 없을 때 쓰는 기본 카드(1200×630, 앱 아이콘).
 *
 * 작성자 아바타를 대신 쓰지 않는다 — 글의 내용과 무관한 얼굴이 썸네일로 잡히는 것이 어색하고,
 * 공유받는 사람에게는 서비스 브랜드가 더 유용한 단서다.
 * 앱 아이콘이 바뀌면 public/images/og-default.png · app-icon.png 두 파일만 교체한다.
 */
export const DEFAULT_OG_IMAGE_PATH = "/images/og-default.png";

/**
 * 미리보기 설명 최대 길이.
 *
 * 카카오톡 카드가 두 줄 남짓 보여주고 나머지는 잘라낸다 — 그 안에서 문장이 끝나도록 우리가 먼저 자른다.
 * 너무 길게 보내면 잘린 지점이 카드마다 달라 지저분하다.
 */
const SHARE_DESCRIPTION_MAX_LENGTH = 80;

/**
 * 본문을 미리보기 한 줄 요약으로 정리한다 — 줄바꿈·연속 공백을 한 칸으로 접고 길이를 자른다.
 * 비어 있으면 서비스 기본 설명으로 폴백(카드에 설명 칸이 빈 채로 남지 않게).
 */
export function summarizeForShare(body: string): string {
  const collapsed = body.replace(/\s+/g, " ").trim();
  if (!collapsed) return SITE_DESCRIPTION;
  if (collapsed.length <= SHARE_DESCRIPTION_MAX_LENGTH) return collapsed;
  return `${collapsed.slice(0, SHARE_DESCRIPTION_MAX_LENGTH).trimEnd()}…`;
}

/**
 * og:* 블록을 만든다.
 *
 * 이미지는 (1) 콘텐츠 이미지 → (2) 기본 카드 순. 콘텐츠 이미지는 업로드 서버의 절대 URL이라
 * metadataBase와 무관하고, 기본 카드만 상대 경로라 호출부가 metadataBase를 함께 넘겨야 한다.
 */
export function buildOpenGraph({
  title,
  description,
  imageUrl,
  type = "website",
}: {
  title: string;
  description: string;
  /** 콘텐츠 대표 이미지(절대 URL). 없으면 기본 카드. */
  imageUrl?: string | null;
  /** 게시글·밸런스 상세는 "article", 그 외 페이지는 "website". */
  type?: "website" | "article";
}): NonNullable<Metadata["openGraph"]> {
  return {
    type,
    siteName: SITE_NAME,
    locale: "ko_KR",
    title,
    description,
    ...(imageUrl ? { images: [{ url: imageUrl }] } : {}),
  };
}

/**
 * 콘텐츠 상세 페이지의 공유 메타데이터 한 벌.
 *
 * `title`은 탭 제목에도 쓰이므로 사이트명을 뒤에 붙이고, og:title은 콘텐츠 제목만 둔다 —
 * 카드는 siteName을 따로 표시해 제목에 사이트명이 두 번 나온다.
 */
export function buildShareMetadata({
  metadataBase,
  title,
  description,
  imageUrl,
}: {
  metadataBase: URL | null;
  title: string;
  description: string;
  imageUrl?: string | null;
}): Metadata {
  const openGraph = buildOpenGraph({
    title,
    description,
    imageUrl,
    type: "article",
  });
  // 기본 카드는 상대 경로라 절대화할 origin을 모르면(헤더에 host가 없는 비정상 요청) 빼고 보낸다 —
  // 잘못된 절대 URL을 내보내는 것보다 이미지 없는 카드가 낫다.
  const images = imageUrl
    ? openGraph.images
    : metadataBase
      ? [{ url: DEFAULT_OG_IMAGE_PATH, width: 1200, height: 630 }]
      : undefined;

  return {
    ...(metadataBase ? { metadataBase } : {}),
    title: `${title} | ${SITE_NAME}`,
    description,
    openGraph: { ...openGraph, images },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
