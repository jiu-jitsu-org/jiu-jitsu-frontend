"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import type { PostImage } from "@/features/community/domain/post";
import { cn } from "@/shared/lib/cn";

/**
 * 게시글 상세 이미지 영역 — 비율·크롭 정책(#57) + 가로 페이징 캐러셀(#45).
 *
 * 피드 카드(FeedCardImages)와 규격이 갈라져 재사용을 끊고 상세 전용으로 둔다.
 * 피드는 폭 343 고정이지만 상세는 기기 폭 기준 계산이라, 같은 컴포넌트로 묶으면
 * 한쪽 규격이 바뀔 때 다른 쪽이 조용히 끌려간다.
 *
 * 정책:
 * - 폭 W = 화면 폭 − 32 (좌우 여백 16) — 절대값 하드코딩 없이 부모 px-4 안에서 얻는다.
 * - 1장: 세로는 원본 비율 자동, 최대 min(W × 1.6, Hmax) 초과 시 하단 크롭 + 전체보기 인디케이터.
 * - 2장 이상: 높이 min(W, Hmax) 고정(장을 넘길 때 영역이 출렁이면 안 된다), 폭은 장마다
 *   원본 비율 자동이되 높이의 0.5~1.5배로 제한 — 범위 밖만 center crop.
 *
 * 크기를 JS 측정이 아니라 CSS(vw/vh)로 푼 이유: 측정 후 반영하면 첫 페인트에서 한 번 튄다.
 * 뷰포트 단위는 브라우저가 레이아웃 시점에 이미 알고 있어 회전·폴드 전환도 공짜로 따라온다.
 * 캐러셀 폭도 `height + width:auto + min/max-width`로 브라우저가 원본 비율대로 잡게 두고,
 * 범위를 넘는 장만 object-cover가 잘라낸다 — 장마다 JS로 폭을 계산하지 않는다.
 */

/** 좌우 여백 16 × 2 — 이미지 폭 W = 화면 폭 − 32. */
const SIDE_INSET = "32px";
/** 화면 높이 가드 Hmax — 폴드·태블릿에서 이미지 한 장이 화면을 다 먹지 않게 한다. */
const VIEWPORT_HEIGHT_GUARD = "70vh";
/** 1장 최대 높이 배수 — W × 1.6. 3:4, 2:3 등 일반적인 세로 사진은 이 상한 아래라 크롭되지 않는다. */
const SINGLE_MAX_HEIGHT_RATIO = 1.6;
/** 캐러셀 폭 허용 범위 — 높이의 0.5배(극단 세로) ~ 1.5배(파노라마). 범위 밖만 center crop. */
const SLIDE_MIN_WIDTH_RATIO = 0.5;
const SLIDE_MAX_WIDTH_RATIO = 1.5;
/** 슬라이드 사이 간격 12 — 장 경계가 붙어 한 장처럼 읽히지 않게 한다. */
const SLIDE_GAP = "12px";
/** 비율 비교 허용 오차 — 소수점 반올림으로 1px 차이가 크롭으로 오판되는 걸 막는다. */
const RATIO_EPSILON = 0.01;
/** 우측 페이드 폭 — 다음 장이 있다는 신호. 디자인 지정값. */
const EDGE_FADE_WIDTH = "59px";
/**
 * 우측 페이드 종료색 — 배경 토큰(--background-default = cool-gray-25)이 아니라 순백이다.
 * 토큰만 쓰는 규칙의 의도적 예외로, 디자인에서 #FFFFFF로 확정됐다.
 */
const EDGE_FADE_COLOR = "#FFFFFF";
/** 스크롤 끝 판정 허용 오차 — 소수점 스크롤 좌표가 1px 못 미쳐 페이드가 남는 걸 막는다. */
const SCROLL_END_EPSILON = 1;

/** 이미지 폭 W를 CSS 식으로. 부모 좌우 여백을 뺀 값이라 기기 폭을 따라간다. */
const IMAGE_WIDTH = `calc(100vw - ${SIDE_INSET})`;
/** 캐러셀 높이 — 전 장 공통 min(W, Hmax). */
const SLIDE_HEIGHT = `min(${IMAGE_WIDTH}, ${VIEWPORT_HEIGHT_GUARD})`;

/**
 * 재시도용 URL — 같은 src를 그대로 다시 넣으면 브라우저가 실패한 응답을 캐시에서 재사용할 수 있어
 * 시도 횟수를 쿼리로 붙여 매번 새 요청으로 만든다. (피드 카드와 동일 규칙)
 */
function withRetryParam(url: string, attempt: number): string {
  if (attempt === 0) return url;
  return `${url}${url.includes("?") ? "&" : "?"}retry=${attempt}`;
}

export function PostDetailImages({
  images,
  className,
}: {
  images: PostImage[];
  className?: string;
}) {
  const [cover, ...rest] = images;
  if (!cover) return null;

  // 1장과 캐러셀은 규격이 완전히 달라(원본 비율 우선 vs 높이 고정) 경로를 나눈다.
  if (rest.length === 0) {
    // key=URL: 이미지가 바뀌면 재마운트해 폴백·크롭 측정 상태를 초기화한다.
    return <SingleImage key={cover.imageUrl} image={cover} className={className} />;
  }

  return <ImageCarousel images={images} className={className} />;
}

/**
 * 1장 — 폭 W에 원본 비율 그대로. 상한 min(W × 1.6, Hmax)을 넘으면 아래를 잘라낸다.
 * 자른 경우에만 전체보기 인디케이터를 띄운다.
 */
function SingleImage({
  image,
  className,
}: {
  image: PostImage;
  className?: string;
}) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const [cropped, setCropped] = useState(false);

  /**
   * 실제로 잘렸는지는 렌더된 뒤에만 알 수 있다. 원본 비율이 그려진 비율보다 세로로 길면
   * object-cover가 아래를 잘라낸 것이다.
   * 서버가 원본 크기를 주지 않아 로드 전에는 판단할 수 없다(jiu-jitsu-backend#116).
   */
  const measureCrop = useCallback(() => {
    const img = imageRef.current;
    if (!img?.complete || img.naturalWidth === 0 || img.clientWidth === 0) {
      return;
    }
    const naturalRatio = img.naturalHeight / img.naturalWidth;
    const renderedRatio = img.clientHeight / img.clientWidth;
    setCropped(naturalRatio > renderedRatio + RATIO_EPSILON);
  }, []);

  // 회전·폴드 전환으로 W와 상한이 같이 바뀌면 크롭 여부도 뒤집힐 수 있어 다시 잰다.
  useEffect(() => {
    window.addEventListener("resize", measureCrop);
    return () => window.removeEventListener("resize", measureCrop);
  }, [measureCrop]);

  // SSR로 그려진 <img>는 하이드레이션 전에 load/error가 끝나 콜백을 놓칠 수 있어,
  // 부착 직후 이미 끝난(complete) 상태를 직접 확인한다.
  const attachImage = useCallback(
    (img: HTMLImageElement | null) => {
      imageRef.current = img;
      if (!img?.complete) return;
      if (img.naturalWidth === 0) setFailed(true);
      else measureCrop();
    },
    [measureCrop],
  );

  function handleRetry() {
    setFailed(false);
    setCropped(false);
    setAttempt((value) => value + 1);
  }

  if (failed) {
    return (
      <ImageLoadError
        onRetry={handleRetry}
        className={className}
        style={{ height: SLIDE_HEIGHT }}
      />
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-2xl", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={attachImage}
        src={withRetryParam(image.imageUrl, attempt)}
        alt=""
        style={{
          maxHeight: `min(calc(${IMAGE_WIDTH} * ${SINGLE_MAX_HEIGHT_RATIO}), ${VIEWPORT_HEIGHT_GUARD})`,
        }}
        onLoad={measureCrop}
        onError={() => setFailed(true)}
        // block: inline 이미지의 baseline 여백을 없애 오버레이가 하단에 정확히 붙게 한다.
        // 상한 초과분은 하단 크롭이라 위를 기준으로 붙인다.
        className="block w-full bg-[var(--cool-gray-50)] object-cover object-top"
      />
      {cropped ? (
        // 잘린 부분이 있다는 신호. 전체는 이미지 뷰어에서 본다.
        // FIXME: 뷰어 진입 연결은 뷰어 화면 구현 후(#57 할 일 · 뷰어 이슈 미생성).
        <span className="text-body-s absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-feed-card-image-badge-bg px-3 py-1 text-feed-card-image-badge-text">
          전체보기
        </span>
      ) : null}
    </div>
  );
}

/**
 * 2장 이상 — 가로 페이징 캐러셀(#45).
 *
 * 높이는 전 장 min(W, Hmax)로 고정하고 폭만 장마다 다르다.
 * FIXME: 현재 장 인디케이터는 디자인 확정 후 추가한다(#45 — 숫자/점 스타일 미정).
 */
function ImageCarousel({
  images,
  className,
}: {
  images: PostImage[];
  className?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [hasNext, setHasNext] = useState(false);

  // 오른쪽에 아직 볼 장이 남았는지. 끝까지 밀면 페이드를 걷어 "더 없음"을 알린다.
  const syncHasNext = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const remaining =
      scroller.scrollWidth - (scroller.scrollLeft + scroller.clientWidth);
    setHasNext(remaining > SCROLL_END_EPSILON);
  }, []);

  // 부착 시점에 한 번 재둔다 — 커밋 단계라 첫 페인트 전에 반영돼 페이드가 깜빡이지 않는다.
  const attachScroller = useCallback(
    (scroller: HTMLDivElement | null) => {
      scrollerRef.current = scroller;
      syncHasNext();
    },
    [syncHasNext],
  );

  // 회전·폴드 전환으로 영역 폭이 바뀌면 남은 장 유무도 뒤집힐 수 있어 다시 잰다.
  useEffect(() => {
    window.addEventListener("resize", syncHasNext);
    return () => window.removeEventListener("resize", syncHasNext);
  }, [syncHasNext]);

  return (
    <div className={cn("relative", className)}>
      {/*
        페이징 1회 = 이미지 1장이 좌측에 정렬. 폭이 장마다 달라(높이의 0.5~1.5배)
        "한 화면 = 한 장"이 성립하지 않으므로, 영역보다 좁은 장 뒤로는 다음 장이 그만큼 엿보인다.
        마지막 장만 끝 정렬 — 좌측 정렬 지점이 최대 스크롤을 넘어 도달 불가라 mandatory 스냅이
        이전 장으로 되돌리면 마지막 사진을 끝까지 볼 수 없다.
        폭이 좁은 장은 한 번의 스와이프 관성으로 두 장을 지나칠 수 있어 각 장에 snap-always를 둔다.
        overscroll-x-contain: 캐러셀 끝에서 웹뷰 뒤로가기 제스처가 먹지 않게 한다.
        스크롤바는 감춘다(모바일 전용 UI).
      */}
      <div
        ref={attachScroller}
        onScroll={syncHasNext}
        style={{ height: SLIDE_HEIGHT, gap: SLIDE_GAP }}
        className="relative flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((image, index) => (
          <CarouselSlide
            key={image.imageUrl}
            image={image}
            label={`이미지 ${index + 1} / ${images.length}`}
            isLast={index === images.length - 1}
          />
        ))}
      </div>
      {hasNext ? (
        // 우측 페이드 — 더 넘길 장이 있다는 신호. 잘린 게 아니라 이어진다는 인상을 준다.
        // inset-y-0: 높이는 스크롤러(= 이미지 높이)와 동일.
        // pointer-events-none: 스와이프를 가로채면 안 된다.
        <span
          aria-hidden
          style={{
            width: EDGE_FADE_WIDTH,
            backgroundImage: `linear-gradient(to right, transparent, ${EDGE_FADE_COLOR})`,
          }}
          className="pointer-events-none absolute inset-y-0 right-0"
        />
      ) : null}
    </div>
  );
}

/**
 * 캐러셀 한 장. 높이 고정 + 폭은 원본 비율 자동이되 높이의 0.5~1.5배로 제한.
 * 제한에 걸린 장만 object-cover가 잘라낸다 — 파노라마는 좌우, 극단 세로는 상하.
 */
function CarouselSlide({
  image,
  label,
  isLast,
}: {
  image: PostImage;
  label: string;
  isLast: boolean;
}) {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);

  // 마지막 장은 오른쪽 끝에 닿는 지점이 마지막 페이지다(좌측 정렬은 도달 불가).
  // snap-always: 스와이프 관성이 스냅 지점을 지나쳐 두 장씩 넘어가는 걸 막는다 — 한 번에 한 장.
  const snapAlign = cn("snap-always", isLast ? "snap-end" : "snap-start");

  const detectBrokenImage = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  function handleRetry() {
    setFailed(false);
    setAttempt((value) => value + 1);
  }

  if (failed) {
    return (
      <ImageLoadError
        onRetry={handleRetry}
        className={cn("h-full shrink-0", snapAlign)}
        // 실패한 장도 자리를 차지해야 페이징이 어긋나지 않는다. 원본 비율을 모르니 정사각.
        style={{ width: SLIDE_HEIGHT }}
      />
    );
  }

  return (
    <div className={cn(
        "relative h-full shrink-0 overflow-hidden rounded-2xl",
        snapAlign,
      )}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={detectBrokenImage}
        src={withRetryParam(image.imageUrl, attempt)}
        alt=""
        aria-label={label}
        style={{
          // width:auto + 높이 고정 → 브라우저가 원본 비율대로 폭을 잡는다.
          // min/max-width가 허용 범위 밖만 잘라내므로 장별 폭 계산이 필요 없다.
          width: "auto",
          minWidth: `calc(${SLIDE_HEIGHT} * ${SLIDE_MIN_WIDTH_RATIO})`,
          maxWidth: `calc(${SLIDE_HEIGHT} * ${SLIDE_MAX_WIDTH_RATIO})`,
        }}
        onError={() => setFailed(true)}
        className="block h-full bg-[var(--cool-gray-50)] object-cover object-center"
      />
    </div>
  );
}

/** 로드 실패 안내 + 재시도. 확보한 영역을 유지해 아래 요소가 밀려 올라오지 않게 한다. */
function ImageLoadError({
  onRetry,
  className,
  style,
}: {
  onRetry: () => void;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={cn("overflow-hidden rounded-2xl", className)}>
      {/* 안내 문구는 세로 가운데가 아니라 컨테이너 top에서 84에 붙인다(피드와 동일 규격). */}
      <div
        style={style}
        className="flex w-full flex-col items-center bg-image-load-error-bg pt-[84px]"
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
