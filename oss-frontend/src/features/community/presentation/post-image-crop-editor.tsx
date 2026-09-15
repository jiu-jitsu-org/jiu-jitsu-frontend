"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/shared/lib/cn";
import { CloseIcon } from "@/shared/ui/icons";

import {
  CROP_PRESETS,
  cropImageFile,
  MIN_CROP_SHORT_SIDE,
  nearestPreset,
  presetRatio,
  type CropPresetId,
  type CropRect,
  type CropState,
} from "./image-crop";

/** 스테이지 좌우·상하 여백 — 프레임 폭 = 화면 폭 − 32(정책, 상세 이미지 폭과 동일). */
const STAGE_INSET = 16;
/** 좌하단 취소(✕) 버튼 한 변(px) — 글쓰기 앱바 버튼과 같은 tint 어휘·크기. */
const CANCEL_BUTTON_SIZE = 36;
/** 프리셋 아이콘(비율 모양 사각형) 긴 변(px). 선택 배경 40 안에서 여백을 남기는 크기. */
const PRESET_ICON_LONG_SIDE = 20;
const PRESET_ICON_BOX = 40;
/**
 * <img> 요소의 CSS 긴 변 상한(px). 원본 px 크기 그대로 두면 4000px급 사진이 그만큼의 레이어를 잡아
 * iOS 웹뷰 메모리를 압박하므로 요소는 이 크기 이하로 두고, 배율 계산은 원본 px 기준을 유지한다.
 */
const IMAGE_ELEMENT_MAX_EDGE = 2048;

type Point = { x: number; y: number };
/** 스테이지 중심을 원점으로 한 그림 배치 — 배율과 중심 이동(px). */
type Geometry = { scale: number; tx: number; ty: number };
type Size = { width: number; height: number };

/**
 * 게시글 작성 이미지 편집(크롭) 화면 — 작성 화면 위를 덮는 모달.
 *
 * 정책: 썸네일 탭으로만 진입(자동 없음). 프리셋 4:3 / 1:1 / 4:5는 탭한 사진에만 적용되고, 팬·줌으로
 * 프레임 안에 보일 영역을 정한다. 좌측 ✕는 아무것도 반영하지 않고 닫고, 우측 완료만 잘라낸 File을
 * 돌려준다(첨부 교체 → 재업로드는 호출부 책임).
 *
 * 좌표계: 스테이지 중심이 원점, 배율은 "원본 px → 화면 px". <img> 요소는 고정 크기로 두고
 * transform(translate·scale)만 바꾼다 — 매 프레임 React 렌더 없이 DOM에 직접 써서 제스처를
 * 따라가게 하려는 뷰어와 같은 방식.
 * 프레임은 항상 스테이지 중심에 고정이고 그림이 그 아래에서 움직인다.
 *
 * 줌 한계: 아래는 프레임을 꽉 채우는 배율(빈 곳이 보이면 안 됨), 위는 잘라낸 결과의 짧은 변이
 * 300px(MIN_CROP_SHORT_SIDE) 아래로 내려가지 않는 배율. 원본이 그보다 작으면 확대 불가.
 *
 * 제스처는 Pointer Events로 받는다(한 손가락 팬, 두 손가락 핀치 — 핀치 중점 아래 그림이 손가락에 붙어
 * 따라온다). 스테이지에 touch-action: none을 줘 브라우저 스크롤·줌이 끼어들지 않게 한다.
 */
export function PostImageCropEditor({
  source,
  sourceWidth,
  sourceHeight,
  initialCrop,
  onCancel,
  onDone,
}: {
  /** 편집 대상 원본 File(EXIF 방향은 브라우저가 표시 시 보정 — readImageSize와 같은 기준). */
  source: File;
  sourceWidth: number;
  sourceHeight: number;
  /** 이전 편집 결과 — 있으면 같은 프리셋·영역에서 이어 편집한다. */
  initialCrop?: CropState;
  onCancel: () => void;
  /** 완료: 잘라낸 File과 다음에 이어 편집할 상태. */
  onDone: (file: File, crop: CropState) => void;
}) {
  const [preset, setPreset] = useState<CropPresetId>(
    initialCrop?.preset ?? nearestPreset(sourceWidth, sourceHeight),
  );
  const [saving, setSaving] = useState(false);
  const [stageSize, setStageSize] = useState<Size | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const geometryRef = useRef<Geometry>({ scale: 1, tx: 0, ty: 0 });
  const initializedRef = useRef(false);
  // 요소 축소 계수 — 요소 크기 = 원본 × elementScale, transform scale = 배율 ÷ elementScale.
  const elementScale = Math.min(
    1,
    IMAGE_ELEMENT_MAX_EDGE / Math.max(sourceWidth, sourceHeight, 1),
  );

  // 원본 미리보기 URL — 이 모달이 살아 있는 동안만 유지.
  const sourceUrl = useMemo(() => URL.createObjectURL(source), [source]);
  useEffect(() => () => URL.revokeObjectURL(sourceUrl), [sourceUrl]);

  // 스테이지 실측 → 프레임 크기. 회전 등으로 크기가 바뀌면 프레임도 따라간다.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () =>
      setStageSize({ width: stage.clientWidth, height: stage.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  /**
   * 프레임: 폭 = 스테이지 폭 − 32, 높이 = 프리셋 비율. 세로가 긴 프리셋이 스테이지 높이를 넘으면
   * 높이 기준으로 줄인다(작은 화면·가로 모드 보호) — 비율은 유지된다.
   */
  const frame = useMemo<Size | null>(() => {
    if (!stageSize) return null;
    const ratio = presetRatio(preset);
    const maxWidth = stageSize.width - STAGE_INSET * 2;
    const maxHeight = stageSize.height - STAGE_INSET * 2;
    const width = Math.max(1, Math.min(maxWidth, maxHeight * ratio));
    return { width, height: width / ratio };
  }, [stageSize, preset]);

  /** 배율 한계 — 아래: 프레임을 덮는 배율, 위: 잘라낸 짧은 변이 MIN_CROP_SHORT_SIDE 이상인 배율. */
  function scaleBounds(frameSize: Size): { min: number; max: number } {
    const min = Math.max(
      frameSize.width / sourceWidth,
      frameSize.height / sourceHeight,
    );
    const max = Math.max(
      min,
      Math.min(frameSize.width, frameSize.height) / MIN_CROP_SHORT_SIDE,
    );
    return { min, max };
  }

  /** 배율·이동을 한계 안으로 — 프레임 밖으로 그림 가장자리가 들어오지 않게. */
  function clamp(next: Geometry, frameSize: Size): Geometry {
    const { min, max } = scaleBounds(frameSize);
    const scale = Math.min(max, Math.max(min, next.scale));
    const maxTx = Math.max(0, (sourceWidth * scale - frameSize.width) / 2);
    const maxTy = Math.max(0, (sourceHeight * scale - frameSize.height) / 2);
    return {
      scale,
      tx: Math.min(maxTx, Math.max(-maxTx, next.tx)),
      ty: Math.min(maxTy, Math.max(-maxTy, next.ty)),
    };
  }

  function apply(next: Geometry) {
    geometryRef.current = next;
    const image = imageRef.current;
    if (!image) return;
    // translate(-50%)로 그림 중심을 원점에 맞춘 뒤 이동·배율. 원점(transform-origin)은 그림 중심.
    // scale은 "원본 px → 화면 px" 배율이므로 요소가 이미 축소된 만큼(elementScale) 되돌려 적용한다.
    image.style.transform = `translate(calc(-50% + ${next.tx}px), calc(-50% + ${next.ty}px)) scale(${next.scale / elementScale})`;
  }

  /** 이전 편집 영역(원본 px) → 현재 프레임 기준 배치. 프레임 폭이 곧 영역 폭이 되도록 배율을 잡는다. */
  function geometryFromRect(rect: CropRect, frameSize: Size): Geometry {
    const scale = frameSize.width / rect.width;
    return {
      scale,
      tx: (sourceWidth * scale - frameSize.width) / 2 - rect.x * scale,
      ty: (sourceHeight * scale - frameSize.height) / 2 - rect.y * scale,
    };
  }

  /** 현재 배치 → 잘라낼 영역(원본 px). 프레임의 좌상단이 그림 어디에 닿는지를 역산한다. */
  function rectFromGeometry(frameSize: Size): CropRect {
    const { scale, tx, ty } = geometryRef.current;
    const width = frameSize.width / scale;
    const height = frameSize.height / scale;
    const x = (sourceWidth * scale - frameSize.width) / 2 / scale - tx / scale;
    const y =
      (sourceHeight * scale - frameSize.height) / 2 / scale - ty / scale;
    return {
      x: Math.min(Math.max(0, x), sourceWidth - width),
      y: Math.min(Math.max(0, y), sourceHeight - height),
      width,
      height,
    };
  }

  // 프레임이 정해지거나(첫 실측) 바뀌면(프리셋 전환) 배치를 맞춘다. 첫 번째는 이전 편집 상태 또는
  // "프레임 채우기"로 시작하고, 이후 전환은 지금 보던 중심을 유지한 채 한계만 다시 건다.
  useLayoutEffect(() => {
    if (!frame) return;
    if (!initializedRef.current) {
      initializedRef.current = true;
      const start =
        initialCrop && initialCrop.preset === preset
          ? geometryFromRect(initialCrop.rect, frame)
          : { scale: 0, tx: 0, ty: 0 };
      apply(clamp(start, frame));
      return;
    }
    apply(clamp(geometryRef.current, frame));
    // geometry 헬퍼는 렌더마다 새로 만들어지지만 frame·원본 크기에만 의존한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame]);

  // 제스처: 한 손가락 팬 / 두 손가락 핀치(중점 아래 그림 고정). 프레임은 ref로 최신값을 본다.
  const frameRef = useRef(frame);
  useEffect(() => {
    frameRef.current = frame;
  }, [frame]);
  useEffect(() => {
    // 중첩 함수 안까지 non-null 좁힘이 이어지지 않아 확정된 로컬로 받는다.
    const stageEl = stageRef.current;
    if (!stageEl) return;
    const stage: HTMLDivElement = stageEl;

    const pointers = new Map<number, Point>();
    let pan: { point: Point; origin: Geometry } | null = null;
    let pinch: {
      distance: number;
      midpoint: Point;
      origin: Geometry;
    } | null = null;

    function relative(event: PointerEvent): Point {
      const rect = stage.getBoundingClientRect();
      return {
        x: event.clientX - rect.left - rect.width / 2,
        y: event.clientY - rect.top - rect.height / 2,
      };
    }
    function pair(): [Point, Point] | null {
      const values = Array.from(pointers.values());
      return values.length >= 2 ? [values[0], values[1]] : null;
    }
    function distance(a: Point, b: Point): number {
      return Math.hypot(a.x - b.x, a.y - b.y);
    }
    function midpoint(a: Point, b: Point): Point {
      return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    }
    function commit(next: Geometry) {
      const currentFrame = frameRef.current;
      if (currentFrame) apply(clamp(next, currentFrame));
    }

    function onDown(event: PointerEvent) {
      stage.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId, relative(event));
      const two = pair();
      if (two) {
        pan = null;
        pinch = {
          distance: distance(two[0], two[1]),
          midpoint: midpoint(two[0], two[1]),
          origin: geometryRef.current,
        };
        return;
      }
      pan = { point: relative(event), origin: geometryRef.current };
    }

    function onMove(event: PointerEvent) {
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, relative(event));
      const two = pair();
      if (two && pinch) {
        // 시작 중점 아래에 있던 그림 점이 지금 중점 아래에 오도록 이동을 보정 — 두 손가락 팬까지 포함.
        const ratio = distance(two[0], two[1]) / pinch.distance;
        const scale = pinch.origin.scale * ratio;
        const now = midpoint(two[0], two[1]);
        commit({
          scale,
          tx: now.x - (pinch.midpoint.x - pinch.origin.tx) * ratio,
          ty: now.y - (pinch.midpoint.y - pinch.origin.ty) * ratio,
        });
        return;
      }
      if (pan && pointers.size === 1) {
        const point = relative(event);
        commit({
          scale: pan.origin.scale,
          tx: pan.origin.tx + (point.x - pan.point.x),
          ty: pan.origin.ty + (point.y - pan.point.y),
        });
      }
    }

    function onUp(event: PointerEvent) {
      pointers.delete(event.pointerId);
      if (pointers.size < 2) pinch = null;
      // 핀치에서 한 손가락만 남으면 그 자리에서 팬으로 이어간다(튐 방지).
      const remaining = Array.from(pointers.values())[0];
      pan =
        pointers.size === 1 && remaining
          ? { point: remaining, origin: geometryRef.current }
          : null;
    }

    stage.addEventListener("pointerdown", onDown);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerup", onUp);
    stage.addEventListener("pointercancel", onUp);
    return () => {
      stage.removeEventListener("pointerdown", onDown);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerup", onUp);
      stage.removeEventListener("pointercancel", onUp);
    };
    // clamp/apply는 원본 크기에만 의존 — 모달 수명 동안 불변.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function finish() {
    if (!frame || saving) return;
    setSaving(true);
    try {
      const rect = rectFromGeometry(frame);
      const file = await cropImageFile(source, rect);
      onDone(file, { preset, rect });
    } catch (error) {
      // 인코딩 실패는 드물다(메모리 부족 등). 편집 화면을 유지해 다시 시도하거나 취소할 수 있게 둔다.
      console.error("[post-write] 이미지 크롭 실패:", error);
      setSaving(false);
    }
  }

  return (
    // 상태바 영역까지 딤(inset-0). 작성 화면(z-30 앱바) 위, 토스트와 같은 층(z-50).
    <div
      role="dialog"
      aria-modal="true"
      aria-label="이미지 편집"
      className="fixed inset-0 z-50 flex flex-col bg-overlay-scrim-heavy"
    >
      {/* 스테이지: 남는 높이 전부. 그림은 원본 px 크기로 두고 transform만 바꾼다(제스처 훅이 직접 씀).
          프레임은 중앙 고정 + 바깥을 scrim으로 덮어 "잘려 나갈 부분"을 흐리게 보여준다. */}
      <div
        ref={stageRef}
        className="relative min-h-0 flex-1 touch-none select-none overflow-hidden"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imageRef}
          src={sourceUrl}
          alt=""
          draggable={false}
          style={{
            width: sourceWidth * elementScale,
            height: sourceHeight * elementScale,
          }}
          className="absolute left-1/2 top-1/2 max-w-none origin-center"
        />
        {frame ? (
          <div
            aria-hidden
            style={{
              width: frame.width,
              height: frame.height,
              boxShadow: "0 0 0 100vmax var(--overlay-scrim)",
            }}
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border border-[var(--bw-white)]"
          />
        ) : null}
      </div>

      {/* 프리셋: 비율 모양의 작은 사각형 + 라벨. 선택된 것만 overlay-surface 배경. */}
      <div className="flex shrink-0 justify-center gap-8 py-3">
        {CROP_PRESETS.map((item) => {
          const selected = item.id === preset;
          const wide = item.ratio >= 1;
          const iconWidth = wide
            ? PRESET_ICON_LONG_SIDE
            : PRESET_ICON_LONG_SIDE * item.ratio;
          const iconHeight = wide
            ? PRESET_ICON_LONG_SIDE / item.ratio
            : PRESET_ICON_LONG_SIDE;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setPreset(item.id)}
              aria-pressed={selected}
              aria-label={`비율 ${item.label}`}
              className="flex flex-col items-center gap-1 text-label-m text-text-on-overlay"
            >
              <span
                style={{ width: PRESET_ICON_BOX, height: PRESET_ICON_BOX }}
                className={cn(
                  "inline-flex items-center justify-center rounded-lg",
                  selected && "bg-overlay-surface",
                )}
              >
                <span
                  style={{ width: iconWidth, height: iconHeight }}
                  className="rounded-[3px] border-[1.5px] border-[var(--bw-white)]"
                />
              </span>
              {item.label}
            </button>
          );
        })}
      </div>

      {/* 하단: 좌 취소(✕ tint) · 우 완료(filled). 홈 인디케이터 위까지 여백. */}
      <div className="flex shrink-0 items-center justify-between px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          aria-label="편집 취소"
          style={{ width: CANCEL_BUTTON_SIZE, height: CANCEL_BUTTON_SIZE }}
          className="inline-flex items-center justify-center rounded-[10px] bg-button-tint-default-bg text-button-tint-default-text active:bg-button-tint-pressed-bg"
        >
          <CloseIcon size={24} />
        </button>
        <button
          type="button"
          onClick={() => void finish()}
          disabled={saving}
          className="h-[38px] rounded-[10px] bg-button-filled-default-bg px-5 text-button-m text-button-filled-default-text active:bg-button-filled-pressed-bg disabled:bg-button-filled-disabled-bg disabled:text-button-filled-disabled-text"
        >
          완료
        </button>
      </div>
    </div>
  );
}
