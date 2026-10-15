"use client";

import type { CSSProperties } from "react";

import { cn } from "@/shared/lib/cn";
import { NEUTRAL_BUTTON_PRESS } from "@/shared/ui/press-styles";

/**
 * 이미지 로드 실패 폴백 · 재시도 공용 조각 (#104).
 *
 * 피드 카드와 상세 이미지는 컴포넌트가 나뉘어 있지만, 규격과 무관한 아래 셋은 양쪽이 달라질
 * 이유가 없어 여기 모은다. 사본이 두 벌이면 한쪽만 고쳤을 때 조용히 어긋난다.
 *
 * 규격 자체는 #121에서 목록 카드와 상세 1장이 같아졌고, 그 상수는 image-aspect.ts가 갖는다.
 * 그래도 컴포넌트(FeedCardCover ↔ PostDetailImages)까지 합치지는 않는다 — 목록은 +N 오버레이와
 * 로드 전 플레이스홀더를, 상세는 캐러셀과 스크롤 상태를 갖고 있어 합치면 분기 덩어리가 된다.
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
 * 사진 등장 상태.
 * - undefined: 아무것도 하지 않는다(그대로 보인다). 서버 HTML과 첫 렌더, 부착 때 이미 끝나 있던 사진.
 * - "pending": 부착 때 아직 받는 중이라 투명하게 숨겼다.
 * - "loaded": 숨겼던 사진을 다 받아 옅게 나타나는 중.
 */
export type ImageReveal = "pending" | "loaded" | undefined;

/**
 * 부착 시점(ref 콜백)의 등장 상태 — 아직 받는 중일 때만 숨긴다.
 * 서버 HTML에서는 숨기지 않는다: 하이드레이션 전에 이미 받은 사진이 그때까지(JS가 실패하면 영영)
 * 투명하게 남기 때문이다. src가 바뀐 같은 img에도 다시 불러 새 사진 기준으로 고친다.
 */
export function revealOnAttach(img: HTMLImageElement): ImageReveal {
  return img.complete ? undefined : "pending";
}

/** load 이벤트의 등장 상태 — 숨겼던 사진만 나타나게 한다(숨긴 적 없으면 그대로 둔다). */
export function revealOnLoad(prev: ImageReveal): ImageReveal {
  return prev === "pending" ? "loaded" : prev;
}

/**
 * 다 불러온 사진만 옅게 나타나게 하는 클래스 — 반쯤 받은 사진이 위에서부터 그려지는 모습을 감춘다.
 *
 * 받는 중에는 투명하게 두고(자리 색은 감싼 칸의 바탕이 보인다), 받으면 image-in으로 0.35초 동안
 * 나타난다. 둘 다 motion-safe라 동작 줄이기면 숨기지 않고 그대로 보인다.
 * 호출부는 ref에서 revealOnAttach, onLoad에서 revealOnLoad로 상태를 옮긴다.
 */
export function imageRevealClassName(reveal: ImageReveal): string | undefined {
  if (reveal === "pending") return "motion-safe:opacity-0";
  if (reveal === "loaded") return "motion-safe:animate-image-in";
  return undefined;
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
  /** 바깥 래퍼에 붙는다 — h-full·shrink-0 등 배치용. */
  className?: string;
  /** 크기를 클래스로 줄 때(피드: `aspect-[343/220]`). */
  sizeClassName?: string;
  /** 크기를 계산식으로 줄 때(상세: 폭 W에서 파생한 계산식). */
  style?: CSSProperties;
}) {
  return (
    // 사진 자리에서 툭 바뀌지 않게 옅게 나타난다(사진 등장과 같은 image-in).
    <div
      className={cn(
        "overflow-hidden rounded-2xl motion-safe:animate-image-in",
        className,
      )}
    >
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
        {/* 재시도: 64(hug) x 32, radius 10 — 라벨이 길어지면 가로로만 늘어난다.
            누르는 동안 neutral 눌림 색으로 짙어진다(피드 재시도 버튼과 같은 눌림). */}
        <button
          type="button"
          onClick={onRetry}
          className={cn(
            "text-body-s mt-2 inline-flex h-8 min-w-16 items-center justify-center rounded-[10px] bg-button-neutral-default-bg px-2 text-button-neutral-default-text",
            NEUTRAL_BUTTON_PRESS,
          )}
        >
          재시도
        </button>
      </div>
    </div>
  );
}
