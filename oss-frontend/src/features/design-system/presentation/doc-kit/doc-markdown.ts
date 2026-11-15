/**
 * 'AI용 복사' — 지금 보이는 문서를 화면에 그려진 그대로 마크다운으로 옮긴다.
 * 값을 따로 적지 않고 DOM에서 읽으므로 화면과 복사본이 어긋나지 않는다(실측 값·사용 수 포함).
 * 접힘(예전 설명)과 견본 판 안의 부품 글자는 뺀다 — 부품 이름·수치·규칙만 남긴다.
 */
export function docToMarkdown(pane: Element): string {
  const lines: string[] = [];
  // innerText는 화면 배치(블록·플렉스 칸)대로 줄을 나눠 준다 — 붙어 있던 칸 사이에 띄어쓰기를 넣는다.
  const text = (el: Element) =>
    ((el as HTMLElement).innerText ?? el.textContent ?? "").replace(/\s+/g, " ").trim();

  const walk = (el: Element) => {
    if (el.tagName === "DETAILS" || el.tagName === "FIGURE") return;
    const tag = el.tagName;
    if (tag === "H1") return void lines.push(`# ${text(el)}`, "");
    if (tag === "H2") return void lines.push("", `## ${text(el)}`, "");
    if (tag === "H3") return void lines.push("", `### ${text(el)}`, "");
    if (el.getAttribute("role") === "table") {
      const rows = [...el.querySelectorAll('[role="row"]')].map(
        (row) => `| ${[...row.children].map((cell) => text(cell) || " ").join(" | ")} |`,
      );
      if (rows.length > 0) {
        const cols = rows[0].split(" | ").length;
        rows.splice(1, 0, `|${" --- |".repeat(cols)}`);
      }
      return void lines.push(...rows, "");
    }
    if (tag === "P") return void (text(el) && lines.push(text(el)));
    if (tag === "LI") return void (text(el) && lines.push(`- ${text(el)}`));
    for (const child of el.children) walk(child);
  };

  walk(pane);
  return `${lines.join("\n").replace(/\n{3,}/g, "\n\n").trim()}\n`;
}
