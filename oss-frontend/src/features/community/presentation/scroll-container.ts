/**
 * 요소를 감싼 가장 가까운 세로 스크롤 컨테이너. 문서가 스크롤되는 화면이면 null.
 *
 * 같은 목록(CommunityFeedList)이 메인 피드에선 문서 스크롤로, 서브뷰 화면에선 SubviewScrollShell
 * 안에서 그려진다(#200). 스크롤 기준이 화면마다 달라 window 기준 코드가 셸 안에서는 동작하지 않으므로,
 * 목록 쪽 스크롤 처리는 이 함수로 기준을 찾는다.
 */
export function scrollContainerOf(element: Element): HTMLElement | null {
  let node = element.parentElement;
  while (node && node !== document.body && node !== document.documentElement) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll") return node;
    node = node.parentElement;
  }
  return null;
}
