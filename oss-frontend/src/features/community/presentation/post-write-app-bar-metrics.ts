/**
 * 글쓰기 앱바 규격 — 글쓰기 화면과 로딩 스켈레톤(WriteSkeleton)이 같이 쓴다.
 * 따로 들고 있으면 한쪽만 바뀌어 로딩이 끝날 때 앱바가 튄다(#452).
 */

/** 앱바 좌우 아이콘 버튼(뒤로가기·등록) 한 변(px). 이미지 뷰어 닫기(44)보다 작은 앱바용 크기. */
export const APP_BAR_BUTTON_SIZE = 36;
/** 글쓰기 앱바 높이(px, safe-area 제외). 공통 셸(44)과 달리 디자인이 52 — 아래 상단 마진들이 이 안에 들어간다. */
export const APP_BAR_HEIGHT = 52;
/** 앱바 버튼 상단 마진(px) — 12 + 36 = 48, 바 높이 52 안. */
export const APP_BAR_BUTTON_TOP = 12;
/** 앱바 타이틀 박스 상단 마진·높이(px) — 13 + 35 = 48. 텍스트는 박스 안 세로 가운데. */
export const APP_BAR_TITLE_TOP = 13;
export const APP_BAR_TITLE_HEIGHT = 35;
