"use client";

import type { CSSProperties } from "react";

import { cn } from "@/shared/lib/cn";

/**
 * 이미지 로드 실패 폴백 · 재시도 공용 조각 (#104).
 *
 * 피드 카드와 상세 이미지는 규격이 갈라져 컴포넌트를 나눴지만(#57), 규격과 무관한 아래 셋은
 * 양쪽이 달라질 이유가 없어 여기 모은다. 사본이 두 벌이면 한쪽만 고쳤을 때 조용히 어긋난다.
 *
 * 컴포넌트 자체(FeedCardCover ↔ PostDetailImages)를 다시 합치자는 게 아니다 — 피드는 폭 343 고정,
 * 상세는 기기 폭 기준이라 묶어두면 한쪽 규격 변경이 다른 쪽을 끌고 간다.
 */

/**
 * 재시도용 URL — 같은 src를 그대로 다시 넣으면 브라우저가 실패한 응답을 캐시에서 재사용할 수 있어
 * 시도 횟수를 쿼리로 붙여 매번 새 요청으로 만든다.
 * 이미지 주소는 CDN 공개 URL(서명 파라미터 없음)이라 파라미터 추가가 접근을 깨지 않는다.
 */
export function withRetryParam(url: string, attempt: number): string {
  if (attempt === 0) return url;
  return `${url}${url.includes("?") ? "&" : "?"}retry=${attempt}`;
}

/** 부착 시점에 이미 끝나 있던 이미지의 결과. 아직 로드 중이면 null. */
export type SettledImage = "loaded" | "failed" | null;

/**
 * SSR로 그려진 `<img>`가 하이드레이션 전에 이미 끝났는지 판별한다.
 *
 * 그 경우 load/error 이벤트가 리스너 부착 전에 발화해 콜백을 놓친다. ref 콜백은 DOM 부착
 * 직후(커밋 시점)에 실행되므로, 거기서 complete/naturalWidth를 직접 읽어 결과를 확인한다.
 * `naturalWidth === 0`이 실패의 신호다.
 *
 * 판정만 여기서 공유하고 반응(폴백 전환 · 크롭 재측정 등)은 호출부가 소유한다 — 네 호출부가
 * 실패만 보거나 성공까지 보는 등 제각각이라, 훅으로 묶으면 옵션 분기가 원래 코드보다 길어진다.
 */
export function readSettledImage(img: HTMLImageElement | null): SettledImage {
  if (!img?.complete) return null;
  return img.naturalWidth === 0 ? "failed" : "loaded";
}

/**
 * 로드 실패 안내 + 재시도. 확보한 영역을 유지해 아래 요소가 밀려 올라오지 않게 한다.
 *
 * 바깥 영역 크기만 호출부가 주입하고(sizeClassName · style) 내용(문구 · 재시도 버튼)은 이쪽이
 * 소유한다 — 피드는 aspect 비율 클래스로, 상세는 계산식 인라인 스타일로 크기를 잡기 때문이다.
 */
export function ImageLoadError({
  onRetry,
  className,
  sizeClassName,
  style,
}: {
  onRetry: () => void;
  /** 바깥 래퍼에 붙는다 — 스냅 정렬·h-full 등 배치용. */
  className?: string;
  /** 크기를 클래스로 줄 때(피드: `aspect-[343/220]`). */
  sizeClassName?: string;
  /** 크기를 계산식으로 줄 때(상세: `min(W, Hmax)`). */
  style?: CSSProperties;
}) {
  return (
    <div className={cn("overflow-hidden rounded-2xl", className)}>
      {/* 안내 문구는 세로 가운데가 아니라 컨테이너 top에서 84에 붙인다(피드·상세 공통 규격). */}
      <div
        style={style}
        className={cn(
          "flex w-full flex-col items-center bg-image-load-error-bg pt-[84px]",
          sizeClassName,
        )}
      >
        <p className="text-body-s text-image-load-error-text">
          이미지를 불러올 수 없어요
        </p>
        {/* 재시도: 64(hug) x 32, radius 10 — 라벨이 길어지면 가로로만 늘어난다. */}
        <button
          type="button"
          onClick={onRetry}
          className="text-body-s mt-2 inline-flex h-8 min-w-16 items-center justify-center rounded-[10px] bg-button-neutral-default-bg px-2 text-button-neutral-default-text"
        >
          재시도
        </button>
      </div>
    </div>
  );
}
