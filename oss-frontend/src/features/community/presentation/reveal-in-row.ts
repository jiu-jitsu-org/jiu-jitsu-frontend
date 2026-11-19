/**
 * 가로로 밀리는 칩 줄에서 한 칩이 잘리지 않게 줄만 옆으로 민다(#588 · #590).
 *
 * scrollIntoView를 쓰지 않는 이유: 세로로도 맞추려 들어 화면(문서)까지 움직일 수 있다. 줄의 가로 스크롤만 바꾼다.
 * edge는 줄 끝에서 띄울 여백 — 칩 줄의 좌우 여백(16)과 같게 둬 칩이 화면 끝에 붙지 않게 한다.
 */
export function revealInRow(
  row: HTMLElement,
  item: HTMLElement,
  behavior: ScrollBehavior = "smooth",
  edge = 16,
) {
  const rowRect = row.getBoundingClientRect();
  const itemRect = item.getBoundingClientRect();
  if (itemRect.left < rowRect.left + edge) {
    row.scrollBy({ left: itemRect.left - rowRect.left - edge, behavior });
  } else if (itemRect.right > rowRect.right - edge) {
    row.scrollBy({ left: itemRect.right - rowRect.right + edge, behavior });
  }
}
