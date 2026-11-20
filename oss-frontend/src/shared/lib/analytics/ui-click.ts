import { isDevelopmentRuntime } from "@/config/env";

import { currentScreenName } from "./screen-view";
import { track } from "./track";

/**
 * 이름 없는 누름 기록(#584) — `data-ga="요소"`가 달린 요소를 누르면 `ui_click {element: "화면.요소"}`.
 *
 * - 이름 붙은 이벤트(좋아요 · 공유 · 필터 등)가 나는 버튼에는 `data-ga`를 달지 않는다. 동작 없는 버튼 · 안 쓰는 메뉴를
 *   찾고, 나중에 이름 붙일 후보를 고르는 용도다.
 * - `data-ga`에는 요소 이름만 적고 화면 부분은 누른 순간의 화면(`currentScreenName()`)을 붙인다 — 뒤로 · 검색어
 *   지우기 · 피드 카드 ⋯처럼 여러 화면에 쓰이는 부품이 많아서. 화면을 모르는 주소(기록하지 않는 화면)는 버린다.
 * - document capture 단계에서 받는다: 전파를 끊는 버튼(카드 안 작성자 등)도 받고, 화면을 옮기는 버튼도 옮기기 전
 *   화면으로 남는다. 누름의 기본 동작 · 전파는 건드리지 않는다.
 */

/** 요소 이름 — 소문자 snake_case. 화면 이름과 합쳐도 꼬리표 값 100자 안에 든다. */
const ELEMENT_PATTERN = /^[a-z][a-z0-9_]{0,59}$/;

let installed = false;

export function installUiClickTracking(): void {
  if (installed || typeof document === "undefined") return;
  installed = true;
  document.addEventListener("click", handleClick, { capture: true });
}

function handleClick(event: MouseEvent): void {
  try {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const element = target.closest<HTMLElement>("[data-ga]")?.dataset.ga;
    if (!element) return;
    if (!ELEMENT_PATTERN.test(element)) {
      if (isDevelopmentRuntime()) {
        console.warn(`[analytics] data-ga 이름이 규칙에 맞지 않아 버림: ${element}`);
      }
      return;
    }
    const screen = currentScreenName();
    if (!screen) return;
    track("ui_click", { element: `${screen}.${element}` });
  } catch {
    // 기록 실패는 무시한다.
  }
}
