"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * 이미지 뷰어 제스처(#94) — 핀치 줌 · 더블탭 줌 토글 · 확대 상태 팬 · 아래로 스와이프 닫기.
 *
 * 브라우저 확대는 viewport(user-scalable=no)에서 막혀 있어 줌을 직접 구현한다. 라이브러리 없이
 * touch 이벤트로 푸는 이유: 가로 페이징은 네이티브 스크롤 스냅에 맡기고 줌·닫기만 JS가 맡는
 * 분업이라, 범용 제스처 라이브러리를 넣어도 이 경계(어느 제스처를 누가 가져갈지)는 결국 직접
 * 그려야 한다.
 *
 * 제스처 분배:
 * - 두 손가락 → 핀치. touchstart에서 preventDefault해 브라우저가 가로 스크롤로 오해하지 않게 한다.
 * - 한 손가락, 확대 상태 → 팬(범위 밖으로 못 나감). 확대 중엔 페이지 넘김 없음 — 축소해야 넘어간다.
 * - 한 손가락, 원본 배율 → 첫 이동 방향으로 판정: 가로면 브라우저 스크롤(페이징)에 넘기고,
 *   아래면 닫기 드래그. 위는 무시(스펙: 아래로 스와이프만 닫힘).
 *
 * 프레임마다 React 렌더를 돌리지 않도록 transform·opacity는 DOM에 직접 쓴다. 드래그 중엔
 * transition을 끄고(즉시 추종), 놓는 순간 클래스의 transition으로 되돌려 자연스럽게 정착시킨다.
 * React는 이 두 스타일 속성을 렌더하지 않으므로 리렌더가 값을 되돌리지 않는다.
 *
 * touchmove는 React 합성 이벤트가 passive라 preventDefault가 안 먹어 네이티브 리스너로 건다.
 */

/** 핀치·더블탭 최대 배율. 그 이상은 화질만 깨진다. */
const MAX_SCALE = 4;
/** 더블탭 한 번에 들어가는 배율 — 잘린 부분을 확인하기에 충분하고 팬 범위가 과하지 않은 값. */
const DOUBLE_TAP_SCALE = 2.5;
/** 핀치로 원본보다 작게 잠깐 줄어드는 것은 허용(손맛), 놓으면 1로 복귀. */
const PINCH_MIN_SCALE = 0.7;
/** 첫 이동 방향 판정 전 허용 흔들림. 이 안이면 아직 탭 후보다. */
const DIRECTION_SLOP = 8;
/** 탭으로 인정하는 최대 누름 시간. */
const TAP_MAX_MS = 250;
/** 두 탭 사이 최대 간격·거리 — 더블탭 판정. */
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_SLOP = 40;
/** 이만큼 아래로 끌면(또는 빠르게 튕기면) 닫는다. */
const DISMISS_DISTANCE = 100;
const DISMISS_VELOCITY = 0.6; // px/ms
/** 닫기 드래그 시각 피드백 — 이 거리에서 페이드·축소가 최대치에 닿는다. */
const DISMISS_RANGE = 400;
const DISMISS_MAX_FADE = 0.6;
const DISMISS_MIN_SCALE = 0.85;
/** 닫기 확정 시 손을 뗀 자리에서 더 내려가며 사라지는 거리. */
const DISMISS_EXIT_OFFSET = 120;

type Point = { x: number; y: number };
type Zoom = { scale: number; tx: number; ty: number };

const IDENTITY: Zoom = { scale: 1, tx: 0, ty: 0 };

type Gesture =
  | { kind: "idle" }
  /** 한 손가락 내려옴, 아직 방향 모름 — 탭·닫기·페이징 후보. */
  | { kind: "pending"; start: Point; startTime: number }
  /** 브라우저가 가져간 제스처(가로 페이징) 또는 무시(위로 스와이프). 끝날 때까지 손 뗀다. */
  | { kind: "native" }
  | { kind: "pan"; start: Point; startTime: number; origin: Zoom; moved: boolean }
  | { kind: "dismiss"; start: Point; startTime: number; dy: number }
  /** anchor: 핀치 시작 시 두 손가락 중점 아래 있던 그림 위 좌표(원본 배율 기준) — 이 점을 손가락에 붙여 둔다. */
  | { kind: "pinch"; startDistance: number; startScale: number; anchor: Point };

export function useImageViewerGestures({
  scrollerRef,
  containerRef,
  getCurrentImage,
  onZoomedChange,
  onDismiss,
}: {
  /** 가로 페이징 스크롤러. 제스처 리스너가 붙고, 닫기 드래그 시 통째로 끌려 내려간다. */
  scrollerRef: RefObject<HTMLDivElement | null>;
  /** 딤 컨테이너 — 닫기 드래그 진행에 따라 옅어진다. */
  containerRef: RefObject<HTMLDivElement | null>;
  /** 지금 보고 있는 장의 <img>. 로드 실패 장이면 null(줌 없음, 닫기 드래그는 됨). */
  getCurrentImage: () => HTMLImageElement | null;
  /** 확대 진입/해제 시점 — 호출부가 touch-action을 바꿔 브라우저 페이징을 잠근다. */
  onZoomedChange: (zoomed: boolean) => void;
  /** 아래로 스와이프가 닫기 거리를 넘겨 손을 뗀 순간. 콘텐츠는 이미 내려가는 중이다. */
  onDismiss: () => void;
}): void {
  const callbacks = useRef({ getCurrentImage, onZoomedChange, onDismiss });
  useEffect(() => {
    callbacks.current = { getCurrentImage, onZoomedChange, onDismiss };
  });

  useEffect(() => {
    // 중첩 함수 안까지 non-null 좁힘이 이어지지 않아 여기서 확정된 로컬로 받는다.
    const scrollerEl = scrollerRef.current;
    const containerEl = containerRef.current;
    if (!scrollerEl || !containerEl) return;
    const scroller: HTMLDivElement = scrollerEl;
    const container: HTMLDivElement = containerEl;

    let zoom = IDENTITY;
    let zoomed = false;
    let gesture: Gesture = { kind: "idle" };
    let lastTap: { time: number; point: Point } | null = null;

    // 스크롤러 뷰포트 중심 = 현재 장의 중심 = <img> transform-origin. transform의 영향을 받지 않는 기준점.
    function center(): Point {
      const rect = scroller.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }

    function relativeToCenter(point: Point): Point {
      const c = center();
      return { x: point.x - c.x, y: point.y - c.y };
    }

    function pointOf(touch: Touch): Point {
      return { x: touch.clientX, y: touch.clientY };
    }

    function distance(a: Point, b: Point): number {
      return Math.hypot(a.x - b.x, a.y - b.y);
    }

    function midpoint(a: Point, b: Point): Point {
      return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    }

    function firstTwoTouches(list: TouchList): [Point, Point] | null {
      const a = list.item(0);
      const b = list.item(1);
      return a && b ? [pointOf(a), pointOf(b)] : null;
    }

    /**
     * 팬 허용 범위 — 확대된 그림이 뷰포트보다 큰 만큼만 중심에서 벗어날 수 있다.
     * <img>는 object-contain이라 요소 박스가 아니라 그 안에 그려진 그림 크기를 써야 한다.
     * 아직 로드 전이라 원본 크기를 모르면 박스를 그림으로 친다.
     */
    function panBounds(img: HTMLImageElement, scale: number): Point {
      const boxWidth = img.clientWidth;
      const boxHeight = img.clientHeight;
      const fit =
        img.naturalWidth > 0
          ? Math.min(boxWidth / img.naturalWidth, boxHeight / img.naturalHeight)
          : 0;
      const drawnWidth = fit > 0 ? img.naturalWidth * fit : boxWidth;
      const drawnHeight = fit > 0 ? img.naturalHeight * fit : boxHeight;
      return {
        x: Math.max(0, (drawnWidth * scale - boxWidth) / 2),
        y: Math.max(0, (drawnHeight * scale - boxHeight) / 2),
      };
    }

    function clampZoom(img: HTMLImageElement, next: Zoom): Zoom {
      const bounds = panBounds(img, next.scale);
      return {
        scale: next.scale,
        tx: Math.min(Math.max(next.tx, -bounds.x), bounds.x),
        ty: Math.min(Math.max(next.ty, -bounds.y), bounds.y),
      };
    }

    function applyZoom(img: HTMLImageElement, next: Zoom, animated: boolean) {
      zoom = next;
      const identity = next.scale === 1 && next.tx === 0 && next.ty === 0;
      img.style.transition = animated ? "" : "none";
      img.style.transform = identity
        ? ""
        : `translate(${next.tx}px, ${next.ty}px) scale(${next.scale})`;

      const nowZoomed = next.scale > 1;
      if (nowZoomed !== zoomed) {
        zoomed = nowZoomed;
        callbacks.current.onZoomedChange(nowZoomed);
      }
    }

    /** 닫기 드래그 진행 표시 — 끌린 만큼 내려가며 살짝 작아지고, 딤은 옅어진다. */
    function applyDismissProgress(dy: number, animated: boolean) {
      const progress = Math.min(dy / DISMISS_RANGE, 1);
      const transition = animated ? "" : "none";
      scroller.style.transition = transition;
      container.style.transition = transition;
      scroller.style.transform =
        dy === 0
          ? ""
          : `translateY(${dy}px) scale(${1 - progress * (1 - DISMISS_MIN_SCALE)})`;
      container.style.opacity = String(1 - progress * DISMISS_MAX_FADE);
    }

    function toggleDoubleTapZoom(img: HTMLImageElement, point: Point) {
      if (zoom.scale > 1) {
        applyZoom(img, IDENTITY, true);
        return;
      }
      // 탭한 지점이 제자리에 남도록 그 점을 기준으로 확대한다: 원본 배율에서 중심 대비 p에 있던 점은
      // s배 후 p·s에 놓이므로 -p·(s-1)만큼 되돌린다.
      const p = relativeToCenter(point);
      const scale = DOUBLE_TAP_SCALE;
      applyZoom(
        img,
        clampZoom(img, {
          scale,
          tx: -p.x * (scale - 1),
          ty: -p.y * (scale - 1),
        }),
        true,
      );
    }

    /** 탭 종료 처리 — 두 번째 탭이면 줌 토글, 아니면 다음 탭을 기다린다. */
    function settleTap(point: Point, startTime: number, endTime: number) {
      if (endTime - startTime > TAP_MAX_MS) return;
      const isDoubleTap =
        lastTap !== null &&
        endTime - lastTap.time < DOUBLE_TAP_MS &&
        distance(lastTap.point, point) < DOUBLE_TAP_SLOP;
      if (isDoubleTap) {
        lastTap = null;
        const img = callbacks.current.getCurrentImage();
        if (img) toggleDoubleTapZoom(img, point);
        return;
      }
      lastTap = { time: endTime, point };
    }

    function handleTouchStart(event: TouchEvent) {
      if (event.touches.length >= 2) {
        // 브라우저가 이미 가로 스크롤을 시작한 뒤 얹힌 손가락은 무시 — 스크롤과 핀치가 겹쳐 튄다.
        if (gesture.kind === "native") return;
        const img = callbacks.current.getCurrentImage();
        const pair = firstTwoTouches(event.touches);
        if (!img || !pair) return;
        event.preventDefault();
        const mid = relativeToCenter(midpoint(pair[0], pair[1]));
        gesture = {
          kind: "pinch",
          startDistance: distance(pair[0], pair[1]),
          startScale: zoom.scale,
          anchor: {
            x: (mid.x - zoom.tx) / zoom.scale,
            y: (mid.y - zoom.ty) / zoom.scale,
          },
        };
        return;
      }

      const touch = event.touches.item(0);
      if (!touch) return;
      const start = pointOf(touch);
      const startTime = event.timeStamp;
      gesture =
        zoom.scale > 1
          ? { kind: "pan", start, startTime, origin: zoom, moved: false }
          : { kind: "pending", start, startTime };
    }

    function handleTouchMove(event: TouchEvent) {
      if (gesture.kind === "pinch") {
        const img = callbacks.current.getCurrentImage();
        const pair = firstTwoTouches(event.touches);
        if (!img || !pair) return;
        event.preventDefault();
        const scale = Math.min(
          Math.max(
            gesture.startScale * (distance(pair[0], pair[1]) / gesture.startDistance),
            PINCH_MIN_SCALE,
          ),
          MAX_SCALE,
        );
        // 손가락 중점이 옮겨가면 그 이동은 팬으로 흡수된다(핀치 중 팬).
        const mid = relativeToCenter(midpoint(pair[0], pair[1]));
        applyZoom(
          img,
          clampZoom(img, {
            scale,
            tx: mid.x - gesture.anchor.x * scale,
            ty: mid.y - gesture.anchor.y * scale,
          }),
          false,
        );
        return;
      }

      const touch = event.touches.item(0);
      if (!touch) return;
      const point = pointOf(touch);

      if (gesture.kind === "pan") {
        const img = callbacks.current.getCurrentImage();
        if (!img) return;
        event.preventDefault();
        const dx = point.x - gesture.start.x;
        const dy = point.y - gesture.start.y;
        if (Math.hypot(dx, dy) > DIRECTION_SLOP) gesture.moved = true;
        applyZoom(
          img,
          clampZoom(img, {
            scale: gesture.origin.scale,
            tx: gesture.origin.tx + dx,
            ty: gesture.origin.ty + dy,
          }),
          false,
        );
        return;
      }

      if (gesture.kind === "pending") {
        const dx = point.x - gesture.start.x;
        const dy = point.y - gesture.start.y;
        if (Math.abs(dx) < DIRECTION_SLOP && Math.abs(dy) < DIRECTION_SLOP) return;
        if (Math.abs(dy) > Math.abs(dx) && dy > 0) {
          gesture = {
            kind: "dismiss",
            start: gesture.start,
            startTime: gesture.startTime,
            dy: 0,
          };
        } else {
          gesture = { kind: "native" };
          return;
        }
      }

      if (gesture.kind === "dismiss") {
        event.preventDefault();
        gesture.dy = Math.max(0, point.y - gesture.start.y);
        applyDismissProgress(gesture.dy, false);
      }
    }

    function handleTouchEnd(event: TouchEvent) {
      const current = gesture;

      if (current.kind === "pinch") {
        // 두 손가락 중 하나만 떼도 핀치는 끝. 남은 손가락은 새로 내려놓아야 팬이 된다.
        if (event.touches.length >= 2) return;
        const img = callbacks.current.getCurrentImage();
        if (img && zoom.scale < 1) applyZoom(img, IDENTITY, true);
        gesture = { kind: "idle" };
        return;
      }

      if (event.touches.length > 0) return;
      gesture = { kind: "idle" };

      if (current.kind === "pending") {
        settleTap(current.start, current.startTime, event.timeStamp);
        return;
      }

      if (current.kind === "pan") {
        if (!current.moved) settleTap(current.start, current.startTime, event.timeStamp);
        return;
      }

      if (current.kind === "dismiss") {
        const elapsed = Math.max(event.timeStamp - current.startTime, 1);
        const velocity = current.dy / elapsed;
        if (current.dy > DISMISS_DISTANCE || velocity > DISMISS_VELOCITY) {
          scroller.style.transition = "";
          scroller.style.transform = `translateY(${current.dy + DISMISS_EXIT_OFFSET}px) scale(${DISMISS_MIN_SCALE})`;
          callbacks.current.onDismiss();
          return;
        }
        applyDismissProgress(0, true);
      }
    }

    function handleTouchCancel() {
      const current = gesture;
      gesture = { kind: "idle" };
      if (current.kind === "dismiss") applyDismissProgress(0, true);
      if (current.kind === "pinch") {
        const img = callbacks.current.getCurrentImage();
        if (img && zoom.scale < 1) applyZoom(img, IDENTITY, true);
      }
    }

    const nonPassive: AddEventListenerOptions = { passive: false };
    scroller.addEventListener("touchstart", handleTouchStart, nonPassive);
    scroller.addEventListener("touchmove", handleTouchMove, nonPassive);
    scroller.addEventListener("touchend", handleTouchEnd);
    scroller.addEventListener("touchcancel", handleTouchCancel);
    return () => {
      scroller.removeEventListener("touchstart", handleTouchStart);
      scroller.removeEventListener("touchmove", handleTouchMove);
      scroller.removeEventListener("touchend", handleTouchEnd);
      scroller.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [scrollerRef, containerRef]);
}
