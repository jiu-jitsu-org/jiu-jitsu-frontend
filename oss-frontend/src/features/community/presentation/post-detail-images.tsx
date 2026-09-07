"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { PostImage } from "@/features/community/domain/post";
import {
  IMAGE_MAX_HEIGHT,
  IMAGE_MIN_HEIGHT,
  IMAGE_WIDTH,
  SLIDE_HEIGHT,
  SLIDE_MAX_WIDTH,
  SLIDE_MIN_WIDTH,
} from "@/features/community/presentation/image-aspect";
import {
  ImageLoadError,
  readSettledImage,
  withRetryParam,
} from "@/features/community/presentation/image-fallback";
import { cn } from "@/shared/lib/cn";

/**
 * 게시글 상세 이미지 영역 — 허용 비율 정책(#121) + 가로 스크롤 캐러셀(#45).
 *
 * 정책:
 * - 폭 W = 화면 폭 − 32 (좌우 여백 16) — 절대값 하드코딩 없이 부모 px-4 안에서 얻는다.
 * - 허용 비율 4:5 ~ 1.91:1. 벗어나는 장만 center crop — 세로가 길면 상하, 가로가 길면 좌우.
 * - 1장: 폭 W 고정, 높이는 원본 비율 자동.
 * - 2장 이상: 높이 W 고정(장을 넘길 때 영역이 출렁이면 안 된다), 폭은 장마다 원본 비율 자동.
 *   스크롤 영역만 화면 폭까지 넓히고(-mx-4), 좌우 16은 첫 장 앞 · 끝 장 뒤에만 둔다.
 *
 * 규격 상수는 목록 카드와 공유한다(image-aspect.ts) — 1장과 목록 카드가 같은 규칙이 되면서,
 * 각자 들고 있으면 정책이 바뀔 때 한쪽만 고쳐진다. 컴포넌트는 그래도 나눠 둔다: 이쪽은
 * 캐러셀과 스크롤 상태를, 목록은 +N 오버레이를 가져 합치면 어느 쪽도 아닌 분기 덩어리가 된다.
 *
 * 크롭됐다는 표시는 두지 않는다 — 크롭 여부와 무관하게 이미지를 탭하면 뷰어가 열린다(#94).
 * 캐러셀 위치를 알리는 N/M 인디케이터도 두지 않는다.
 *
 * 크기를 JS 측정이 아니라 CSS로 푼 이유: 측정 후 반영하면 첫 페인트에서 한 번 튄다.
 * 캐러셀 폭도 `height + width:auto + min/max-width`로 브라우저가 원본 비율대로 잡게 두고,
 * 범위를 넘는 장만 object-cover가 잘라낸다 — 장마다 JS로 폭을 계산하지 않는다.
 */

/** 슬라이드 사이 간격 12 — 장 경계가 붙어 한 장처럼 읽히지 않게 한다. */
const SLIDE_GAP = "12px";
/** 우측 페이드 폭 — 다음 장이 있다는 신호. 디자인 지정값. */
const EDGE_FADE_WIDTH = "59px";
/**
 * 우측 페이드 종료색 — 배경 토큰(--background-default = cool-gray-25)이 아니라 순백이다.
 * 토큰만 쓰는 규칙의 의도적 예외로, 디자인에서 #FFFFFF로 확정됐다.
 */
const EDGE_FADE_COLOR = "#FFFFFF";
/** 스크롤 끝 판정 허용 오차 — 소수점 스크롤 좌표가 1px 못 미쳐 페이드가 남는 걸 막는다. */
const SCROLL_END_EPSILON = 1;

/**
 * 로드 실패 폴백의 높이 비율 — 피드 카드 플레이스홀더(343:220)와 같은 모양으로 맞춘다.
 *
 * 실패하면 원본 비율을 알 수 없다(서버가 원본 치수를 안 준다 — jiu-jitsu-backend#116).
 * 예전에는 그래서 정사각으로 뒀는데, 상세 폭이 기기 폭 기준이라 피드보다 60% 넘게 높아져
 * 실패한 이미지 하나가 화면을 과하게 차지했다. 모르는 값을 임의로 정할 바에는 이미 화면에
 * 존재하는 규격(피드)을 따르는 편이 일관된다.
 */
const FALLBACK_HEIGHT_RATIO = 220 / 343;

/** 1장 실패 폴백 높이 — 폭 파생이라 기기를 따라간다. */
const SINGLE_FALLBACK_HEIGHT = `calc(${IMAGE_WIDTH} * ${FALLBACK_HEIGHT_RATIO})`;

export function PostDetailImages({
  images,
  className,
}: {
  images: PostImage[];
  className?: string;
}) {
  const [cover, ...rest] = images;
  if (!cover) return null;

  // 1장과 캐러셀은 규격이 완전히 달라(폭 고정 vs 높이 고정) 경로를 나눈다.
  if (rest.length === 0) {
    // key=URL: 이미지가 바뀌면 재마운트해 폴백 상태를 초기화한다.
    return <SingleImage key={cover.imageUrl} image={cover} className={className} />;
  }

  return <ImageCarousel images={images} className={className} />;
}

/**
 * 1장 — 폭 W에 원본 비율 그대로.
 * 높이가 허용 비율 밖으로 나가는 장만 min/max-height에 걸려 center crop 된다.
 */
function SingleImage({
  image,
  className,
}: {
  image: PostImage;
  className?: string;
}) {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);

  // 실패만 본다 — 높이를 CSS가 잡으므로 성공 시 잴 것이 없다.
  const detectBrokenImage = useCallback((img: HTMLImageElement | null) => {
    if (readSettledImage(img) === "failed") setFailed(true);
  }, []);

  function handleRetry() {
    setFailed(false);
    setAttempt((value) => value + 1);
  }

  if (failed) {
    return (
      <ImageLoadError
        onRetry={handleRetry}
        className={className}
        // 성공 시 규격(원본 비율 + 허용 범위)을 쓸 수 없다 — 실패 경로에는 원본 비율 단서가 없다.
        style={{ height: SINGLE_FALLBACK_HEIGHT }}
      />
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-2xl", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={detectBrokenImage}
        src={withRetryParam(image.imageUrl, attempt)}
        alt=""
        style={{
          // 높이는 auto가 기본 — 원본 비율이 허용 범위 안이면 둘 다 걸리지 않는다.
          minHeight: IMAGE_MIN_HEIGHT,
          maxHeight: IMAGE_MAX_HEIGHT,
        }}
        onError={() => setFailed(true)}
        // block: inline 이미지의 baseline 여백을 없앤다.
        className="block w-full bg-[var(--cool-gray-50)] object-cover object-center"
      />
    </div>
  );
}

/**
 * 2장 이상 — 가로 스크롤 캐러셀(#45).
 *
 * 높이는 전 장 W로 고정하고 폭만 장마다 다르다.
 * 스냅 페이징이 아니라 자유 스크롤이다 — 손가락이 움직인 만큼 흐른다.
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
    // -mx-4: 부모 article의 px-4를 상쇄해 스크롤 영역을 화면 폭까지 넓힌다.
    // 여백 안에 스크롤러를 두면 장이 화면 끝이 아니라 16 지점에서 잘려, 스크롤하는 내내
    // 좌우에 흰 띠가 남는다. 여백은 스크롤러 안쪽 px-4가 맡아 첫 장 왼쪽과 끝 장 오른쪽에만 생긴다.
    <div className={cn("relative -mx-4", className)}>
      {/*
        스냅 없는 자유 가로 스크롤. 폭이 장마다 달라 "한 화면 = 한 장"이 성립하지 않는데,
        스냅으로 한 장씩 끊으면 넓은 장에서 스크롤이 끌려가는 느낌이 난다.
        px-4: 첫 장 왼쪽 · 끝 장 오른쪽 여백 16. 장 사이는 gap이 맡는다.
        overscroll-x-contain: 캐러셀 끝에서 웹뷰 뒤로가기 제스처가 먹지 않게 한다.
        스크롤바는 감춘다(모바일 전용 UI).
      */}
      <div
        ref={attachScroller}
        onScroll={syncHasNext}
        style={{ height: SLIDE_HEIGHT, gap: SLIDE_GAP }}
        className="relative flex overflow-x-auto overscroll-x-contain px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((image, index) => (
          <CarouselSlide
            key={image.imageUrl}
            image={image}
            label={`이미지 ${index + 1} / ${images.length}`}
          />
        ))}
      </div>
      {hasNext ? (
        // 우측 페이드 — 더 넘길 장이 있다는 유일한 신호(N/M 인디케이터는 두지 않는다).
        // 래퍼가 full-bleed라 화면 오른쪽 끝에 붙는다 — 장이 잘리는 지점과 같다.
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
 * 캐러셀 한 장. 높이 고정 + 폭은 원본 비율 자동이되 허용 비율 안으로 제한.
 * 제한에 걸린 장만 object-cover가 잘라낸다 — 파노라마는 좌우, 세로 사진은 상하.
 */
function CarouselSlide({
  image,
  label,
}: {
  image: PostImage;
  label: string;
}) {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);

  // 슬라이드는 실패만 본다 — 높이 고정이라 성공 시 측정할 것이 없다.
  const detectBrokenImage = useCallback((img: HTMLImageElement | null) => {
    if (readSettledImage(img) === "failed") setFailed(true);
  }, []);

  function handleRetry() {
    setFailed(false);
    setAttempt((value) => value + 1);
  }

  if (failed) {
    return (
      <ImageLoadError
        onRetry={handleRetry}
        className="h-full shrink-0"
        // 실패한 장도 자리를 차지해야 뒷장 위치가 어긋나지 않는다. 원본 비율을 모르니 정사각.
        // 1장(SINGLE_FALLBACK_HEIGHT)처럼 낮추지 않는 이유: 스크롤러 높이를 전 장이 공유해
        // 일부만 실패해도 높이가 하나여야 한다. 낮추면 성공한 장 옆에 빈 공간이 생긴다.
        // height 100%: 안내 박스에는 자체 높이가 없어, 주지 않으면 콘텐츠 높이(≈145)로 쪼그라들고
        // 슬라이드 아래가 흰 여백으로 남는다.
        style={{ width: SLIDE_HEIGHT, height: "100%" }}
      />
    );
  }

  return (
    <div className="relative h-full shrink-0 overflow-hidden rounded-2xl">
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
          minWidth: SLIDE_MIN_WIDTH,
          maxWidth: SLIDE_MAX_WIDTH,
        }}
        onError={() => setFailed(true)}
        className="block h-full bg-[var(--cool-gray-50)] object-cover object-center"
      />
    </div>
  );
}
