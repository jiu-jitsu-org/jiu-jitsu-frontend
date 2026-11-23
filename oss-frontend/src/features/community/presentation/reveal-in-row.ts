/**
 * 가로로 밀리는 칩 줄에서 한 칩이 잘리지 않게 줄만 옆으로 민다(#588 · #590).
 *
 * scrollIntoView를 쓰지 않는 이유: 세로로도 맞추려 들어 화면(문서)까지 움직일 수 있다. 줄의 가로 스크롤만 바꾼다.
 * edge는 줄 끝에서 띄울 여백 — 칩 줄의 좌우 여백(16)과 같게 둬 칩이 화면 끝에 붙지 않게 한다.
 *
 * 모자란 만큼만 밀면 맨 앞 칩('전체')이 왼쪽 끝에서 반쯤 잘려 줄이 어긋나 보인다. 그래서
 * - 왼쪽으로 되돌릴 때, 줄을 처음에 둬도 칩이 다 보이면 처음(0)으로 돌린다.
 * - 오른쪽으로 밀 때는 왼쪽 끝이 다음 칩의 시작(여백 16)에 맞는 자리까지 민다.
 */
export function revealInRow(
  row: HTMLElement,
  item: HTMLElement,
  behavior: ScrollBehavior = "smooth",
  edge = 16,
) {
  const rowRect = row.getBoundingClientRect();
  const itemRect = item.getBoundingClientRect();
  // 줄을 처음(0)에 두었을 때의 왼쪽 위치 — 지금 얼마나 밀려 있는지와 상관없다.
  const startOf = (el: Element) =>
    el.getBoundingClientRect().left - rowRect.left + row.scrollLeft;

  if (itemRect.left < rowRect.left + edge) {
    const fitsAtStart =
      startOf(item) + itemRect.width <= row.clientWidth - edge;
    row.scrollTo({ left: fitsAtStart ? 0 : startOf(item) - edge, behavior });
  } else if (itemRect.right > rowRect.right - edge) {
    const needed = row.scrollLeft + itemRect.right - rowRect.right + edge;
    const chipStarts = Array.from(
      item.parentElement?.children ?? [],
      (el) => startOf(el) - edge,
    );
    // 칩이 줄보다 넓으면 다음 칩 자리까지 밀어 버리지 않게, 고른 칩 시작을 넘지 않는다.
    const left = Math.min(
      chipStarts.find((start) => start >= needed) ?? needed,
      startOf(item) - edge,
    );
    row.scrollTo({ left, behavior });
  }
}
