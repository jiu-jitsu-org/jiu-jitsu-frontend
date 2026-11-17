/**
 * /ds 문서 목록 — 왼쪽 사이드·개요 카드·문서 머리가 모두 이 목록 하나를 읽는다.
 *
 * 문서를 새로 쓰면 여기에 한 줄 더하고, docs/에 같은 id로 문서를 만든 뒤
 * design-system-page.tsx의 DOC_CONTENT에 이어 붙인다. 순서가 곧 사이드 순서다.
 */

export type DocGroup = "overview" | "foundation" | "component" | "pattern";

export type DocMeta = {
  /** 주소 뒤 앵커(`/ds#button`). 문서 안 소제목은 `#button--anatomy`. */
  id: string;
  group: DocGroup;
  title: string;
  /** 머리의 한 줄 설명이자 개요 카드 설명. */
  summary: string;
};

export const DOC_GROUP_LABEL: Record<DocGroup, string> = {
  overview: "개요",
  foundation: "기초",
  component: "부품",
  pattern: "패턴",
};

export const DOC_LIST: DocMeta[] = [
  {
    id: "overview",
    group: "overview",
    title: "개요",
    summary: "오스 웹의 색·글자·부품·화면 조각을 한곳에서 실물로 본다.",
  },

  // 기초
  {
    id: "color",
    group: "foundation",
    title: "색",
    summary: "기본 팔레트 → 의미 → 부품, 세 단으로 이어진 색 토큰.",
  },
  {
    id: "typography",
    group: "foundation",
    title: "글자",
    summary: "크기·행간·굵기를 한 벌로 묶은 10단계 글자 이름.",
  },
  {
    id: "radius",
    group: "foundation",
    title: "모서리",
    summary: "10 · 15 · 20 · 둥글게, 네 가지 모서리.",
  },
  {
    id: "motion",
    group: "foundation",
    title: "모션",
    summary: "누름은 120ms 색, 그 밖의 움직임은 한 동작 · 스프링.",
  },
  {
    id: "icon",
    group: "foundation",
    title: "아이콘",
    summary: "24 칸 선 아이콘. 색은 글자색을 따른다.",
  },
  {
    id: "layer",
    group: "foundation",
    title: "층",
    summary: "앞뒤로 겹치는 순서(z-index) — 머리줄 · 시트 · 토스트.",
  },
  {
    id: "character",
    group: "foundation",
    title: "캐릭터",
    summary: "띠 색 캐릭터 · 표정 · 자세 · 메달 — 오스만의 그림 재료.",
  },

  // 부품
  {
    id: "button",
    group: "component",
    title: "Button",
    summary: "글자가 든 버튼. 색 7가지 · 크기 3가지.",
  },
  {
    id: "icon-button",
    group: "component",
    title: "IconButton",
    summary: "아이콘 하나만 든 버튼. 앱바·입력 바·사진 보기에 쓴다.",
  },
  {
    id: "chip",
    group: "component",
    title: "Chip",
    summary: "고르면 켜지는 둥근 버튼. 글쓰기 카테고리 · 대회 필터.",
  },
  {
    id: "search-field",
    group: "component",
    title: "SearchField",
    summary: "돋보기 + 입력 + 지우기. 앱의 공용 입력칸.",
  },
  {
    id: "toast",
    group: "component",
    title: "Toast",
    summary: "아래에 잠깐 떴다 사라지는 결과 알림.",
  },
  {
    id: "empty-state",
    group: "component",
    title: "EmptyState",
    summary: "목록이 비었을 때 제목 · 설명 · 버튼.",
  },
  {
    id: "fallback-screen",
    group: "component",
    title: "FallbackScreen",
    summary: "없음 · 오류로 화면을 그릴 수 없을 때 안내와 나갈 길.",
  },
  {
    id: "skeleton",
    group: "component",
    title: "Skeleton",
    summary: "불러오는 동안 내용 자리에 까는 회색 면.",
  },
  {
    id: "spinner",
    group: "component",
    title: "Spinner",
    summary: "불러오는 중 도는 고리.",
  },
  {
    id: "divider",
    group: "component",
    title: "Divider",
    summary: "큰 덩어리 사이를 나누는 4px 회색 띠.",
  },
  {
    id: "back-button",
    group: "component",
    title: "BackButton",
    summary: "개발용 화면 왼쪽 위 뒤로 가기.",
  },
  {
    id: "open-in-app-prompt",
    group: "component",
    title: "OpenInAppPrompt",
    summary: "웹에서 앱 전용 동작을 누르면 뜨는 '앱에서 보기' 안내.",
  },
  {
    id: "relative-time",
    group: "component",
    title: "RelativeTime",
    summary: "'3분 전'처럼 지금 기준으로 쓴 시간.",
  },

  // 패턴
  {
    id: "belt-avatar",
    group: "pattern",
    title: "띠 아바타",
    summary: "프로필 사진 둘레에 띠 색을 두른 얼굴.",
  },
  {
    id: "competition-row",
    group: "pattern",
    title: "대회 줄",
    summary: "대회 목록 한 줄 — 날짜 · 이름 · 상태 · 관심.",
  },
  {
    id: "feed-card",
    group: "pattern",
    title: "피드 카드",
    summary: "커뮤니티 글 한 장 — 띠 아바타 · 본문 · 반응.",
  },
];

export function findDoc(id: string): DocMeta {
  const doc = DOC_LIST.find((item) => item.id === id);
  if (!doc) throw new Error(`/ds 문서 목록에 없는 id: ${id}`);
  return doc;
}

/**
 * 예전 /ds 앵커(#type · #component)로 들어와도 맞는 문서가 열리게 잇는다.
 * 소제목 앵커는 `문서--소제목`이라 앞 마디가 문서 id다.
 */
const LEGACY_ANCHOR: Record<string, string> = {
  type: "typography",
  component: "button",
};

/** 주소 앵커를 글자로 푼다. 깨진 %표기(#%E0)여도 페이지가 멈추지 않게 그대로 돌려준다. */
export function decodeHash(hash: string): string {
  const raw = hash.replace(/^#/, "");
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function docIdFromHash(hash: string): string {
  const raw = decodeHash(hash).split("--")[0];
  const id = LEGACY_ANCHOR[raw] ?? raw;
  return DOC_LIST.some((doc) => doc.id === id) ? id : "overview";
}
