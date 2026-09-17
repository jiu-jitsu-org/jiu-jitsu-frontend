"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { PostImage } from "@/features/community/domain/post";
import {
  ImageLoadError,
  readSettledImage,
  withRetryParam,
} from "@/features/community/presentation/image-fallback";
import { useImageViewerGestures } from "@/features/community/presentation/use-image-viewer-gestures";
import { cn } from "@/shared/lib/cn";
import { CloseIcon } from "@/shared/ui/icons";

/**
 * 게시글 이미지 뷰어 — 탭한 장을 원본 비율 그대로, 잘림 없이 본다(#94).
 *
 * 상세 이미지는 허용 비율(4:5 ~ 1.91:1) 밖이면 center crop 되는 게 정상 동작(#121)이라,
 * 잘린 부분을 확인할 수단이 정책상 전제돼 있다. 이 뷰어가 그 수단이다.
 *
 * 상세 웹뷰 **안의 오버레이**로 그린다 — OPEN_SUBVIEW로 새 웹뷰를 push하지 않는다.
 * - 상세 화면 자체가 이미 풀스크린 서브뷰라(GNB·탭바를 덮은 상태) 웹 오버레이만으로 화면 전체가 덮인다.
 *   "풀스크린 딤은 네이티브가 그린다"는 제약은 GNB·탭바 아래 메인 웹뷰에서의 얘기다.
 * - 별도 웹뷰 인스턴스가 아니라서 닫으면 즉시 상세로 돌아오고, 상세 상태(스크롤·댓글 입력)가 그대로다.
 *
 * 읽기 전용 — 저장·공유·편집 진입점 없음. 이미지 길게 눌러 뜨는 iOS 콜아웃(저장 시트)도 막는다.
 *
 * 열림/닫힘: 마운트 = 열림, 상태는 호출부가 소유한다(controlled). 닫힘 애니메이션은 이 안에서 처리한다 —
 * 닫기 요청이 오면 페이드 아웃을 먼저 돌리고 끝난 뒤 onClose를 부르므로, 호출부는 마운트만 끊으면 된다.
 * 닫기는 뷰어가 스스로 맡는다(닫기 버튼 · Esc · 아래로 스와이프) — 상세 앱바의 뒤로가기는 이 오버레이
 * 아래에 있어 뷰어가 열린 동안 상세가 닫힐 일이 없다.
 *
 * 제스처(핀치 줌·더블탭·팬·아래로 스와이프 닫기)는 useImageViewerGestures가 맡는다.
 */

/** 진입·닫기 페이드 시간 — ConfirmDialog와 같은 200. */
const FADE_MS = 200;
/** 닫기 버튼 44x44, radius 10 — 디자인 스펙. */
const CLOSE_BUTTON_SIZE = 44;
/** 스크롤 위치 → 현재 장 판정 시 소수점 좌표 보정. */
const INDEX_EPSILON = 0.5;
/**
 * FIXME(jiu-jitsu-frontend#138): 딤·인디케이터 색이 하드코딩이다.
 *
 * 디자인 지정 image-viewer/dim-overlay(#000000 92%) · image-viewer/page-indicator/text(#FAFAFA)가
 * 토큰 파일(design-tokens/*.json)에 아직 없다. 딤은 기존 overlay-scrim-heavy(80%)와 농도가 달라
 * 대체할 수 없고, 인디케이터는 값이 bw-white와 같지만 component 토큰이 생기면 그걸 거쳐야 하므로
 * 둘 다 값을 그대로 넣는다. 토큰이 등록되면 이 두 클래스만 바꾸면 된다.
 */
const DIM_CLASS = "bg-[#000000eb]";
const INDICATOR_TEXT_CLASS = "text-[#fafafa]";

export function PostImageViewer({
  images,
  initialIndex,
  onClose,
}: {
  images: PostImage[];
  /** 진입한 장 — 뷰어는 이 장부터 시작한다. */
  initialIndex: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  // 제스처 훅이 "지금 보고 있는 장의 <img>"를 렌더 없이 찾을 수 있도록 ref로 들고 있는다.
  const imageRefs = useRef(new Map<number, HTMLImageElement>());
  const currentRef = useRef(initialIndex);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // 닫기 요청은 여러 경로(X · 네이티브 back · Esc · 스와이프)에서 오지만 페이드는 한 번만 돈다.
  const closeTimer = useRef<number | null>(null);
  const requestClose = useCallback(() => {
    if (closeTimer.current !== null) return;
    const container = containerRef.current;
    if (container) {
      container.style.transition = "";
      container.style.opacity = "0";
    }
    closeTimer.current = window.setTimeout(() => onCloseRef.current(), FADE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    };
  }, []);

  // 진입 페이드: opacity-0으로 마운트된 뒤 강제 reflow로 그 값을 확정시키고 1로 올린다 —
  // 같은 스타일 계산 안에서 0→1이 되면 transition이 시작점을 못 잡아 그냥 나타난다.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.getBoundingClientRect();
    container.style.opacity = "1";
  }, []);

  // 웹 단독(브라우저) 실행에서는 Esc로도 닫히게 한다.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") requestClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [requestClose]);

  useImageViewerGestures({
    scrollerRef,
    containerRef,
    getCurrentImage: () => imageRefs.current.get(currentRef.current) ?? null,
    onZoomedChange: setZoomed,
    onDismiss: requestClose,
  });

  // 진입한 장으로 첫 페인트 전에 이동한다 — ref 콜백은 커밋 시점이라 0번 장이 잠깐 보이지 않는다.
  const attachScroller = useCallback(
    (scroller: HTMLDivElement | null) => {
      scrollerRef.current = scroller;
      if (scroller) scroller.scrollLeft = scroller.clientWidth * initialIndex;
    },
    [initialIndex],
  );

  // 스냅 페이징이라 "한 화면 = 한 장"이 성립한다 — 스크롤 좌표를 화면 폭으로 나누면 현재 장이다.
  function syncCurrent(scroller: HTMLDivElement) {
    const index = Math.floor(
      scroller.scrollLeft / scroller.clientWidth + INDEX_EPSILON,
    );
    const next = Math.min(Math.max(index, 0), images.length - 1);
    currentRef.current = next;
    setCurrent(next);
  }

  const registerImage = useCallback(
    (index: number, img: HTMLImageElement | null) => {
      if (img) imageRefs.current.set(index, img);
      else imageRefs.current.delete(index);
    },
    [],
  );

  return (
    // opacity는 진입·닫기·스와이프 드래그가 모두 inline style로 직접 다룬다(클래스의 opacity-0은 초기값).
    // 상태바 영역까지 딤 — inset-0이 safe-area를 포함한다.
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="이미지 뷰어"
      className={cn(
        "fixed inset-0 z-50 opacity-0 transition-opacity duration-200",
        DIM_CLASS,
      )}
    >
      {/*
        가로 스냅 페이징. 상세 캐러셀(자유 스크롤)과 달리 한 번에 한 장을 보는 화면이라 장 단위로 끊는다.
        1장이면 넘길 게 없어 자연히 스와이프가 없다.
        touch-action: 원본 배율에선 가로만 브라우저에 맡기고(pan-x) 세로·핀치는 제스처 훅이 받는다.
        확대 상태에선 가로도 팬이라 브라우저 스크롤을 완전히 잠근다(none) — 축소해야 다음 장으로 넘어간다.
        overscroll-contain(양축): 첫/끝 장에서 웹뷰 뒤로가기 제스처가 먹지 않게 하고, DOM상 조상인
        상세 본문 스크롤러(main)로 스크롤이 체이닝돼 딤 뒤의 상세가 움직이는 것도 막는다.
        스크롤바는 감춘다(모바일 전용 UI).
      */}
      <div
        ref={attachScroller}
        onScroll={(event) => syncCurrent(event.currentTarget)}
        className={cn(
          "flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-contain transition-transform duration-200 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          zoomed ? "touch-none" : "touch-pan-x",
        )}
      >
        {images.map((image, index) => (
          <ViewerSlide
            key={image.imageUrl}
            image={image}
            index={index}
            label={`이미지 ${index + 1} / ${images.length}`}
            registerImage={registerImage}
          />
        ))}
      </div>

      {/* 하단 컨트롤: 현재 장 인디케이터 → 16 → 닫기 → 하단 24(+safe-area), 수평 가운데.
          이미지는 화면을 꽉 채우므로(letterbox) 그 위에 겹쳐 얹는다. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 pb-[calc(24px+env(safe-area-inset-bottom))]">
        {images.length > 1 ? (
          // 한 장이면 넘길 곳이 없어 인디케이터를 두지 않는다(스펙).
          <span
            aria-live="polite"
            className={cn("text-body-s", INDICATOR_TEXT_CLASS)}
          >
            {current + 1}/{images.length}
          </span>
        ) : null}
        <button
          type="button"
          onClick={requestClose}
          aria-label="닫기"
          style={{ width: CLOSE_BUTTON_SIZE, height: CLOSE_BUTTON_SIZE }}
          className="pointer-events-auto flex items-center justify-center rounded-[10px] bg-button-tint-default-bg text-button-tint-default-text"
        >
          <CloseIcon size={24} />
        </button>
      </div>
    </div>
  );
}

/**
 * 뷰어 한 장 — 화면 전체를 차지하고, 이미지는 여백 없이 원본 비율로 꽉 채운다(object-contain, letterbox).
 * 잘라내지 않는다 — 그게 이 화면의 존재 이유다.
 *
 * overflow-hidden: 확대(transform)된 이미지가 장 밖으로 삐져나와 스크롤러의 스크롤 범위를 늘리지 않게 한다 —
 * 늘어나면 스냅 지점이 어긋나고 세로 스크롤까지 생긴다.
 */
function ViewerSlide({
  image,
  index,
  label,
  registerImage,
}: {
  image: PostImage;
  index: number;
  label: string;
  /** 제스처 훅이 transform을 직접 쓸 <img> 등록. 로드 실패로 폴백이 뜨면 null이 넘어가 해제된다. */
  registerImage: (index: number, img: HTMLImageElement | null) => void;
}) {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);

  const attachImage = useCallback(
    (img: HTMLImageElement | null) => {
      registerImage(index, img);
      if (readSettledImage(img) === "failed") setFailed(true);
    },
    [registerImage, index],
  );

  function handleRetry() {
    setFailed(false);
    setAttempt((value) => value + 1);
  }

  return (
    // 실패 폴백은 카드 형태라 가장자리까지 붙이지 않고 좌우 16을 둔다. 이미지는 여백 없음(스펙).
    <div
      className={cn(
        "flex h-full w-full shrink-0 snap-center items-center justify-center overflow-hidden",
        failed && "px-4",
      )}
    >
      {failed ? (
        // 상세와 같은 실패 정책(#104) — 안내 + 재시도. 원본 비율을 모르니 피드 플레이스홀더 비율을 따른다.
        <ImageLoadError
          onRetry={handleRetry}
          className="w-full"
          sizeClassName="aspect-[343/220]"
        />
      ) : (
        // transition-transform: 더블탭 줌·핀치 복귀 같은 "놓았을 때" 이동용. 드래그 중엔 훅이 inline으로 끈다.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={attachImage}
          src={withRetryParam(image.imageUrl, attempt)}
          alt=""
          aria-label={label}
          draggable={false}
          onError={() => setFailed(true)}
          className="block h-full w-full select-none object-contain transition-transform duration-200 [-webkit-touch-callout:none]"
        />
      )}
    </div>
  );
}
