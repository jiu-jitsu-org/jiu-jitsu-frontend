"use client";

import { useState } from "react";

import { cn } from "@/shared/lib/cn";
import { CloseIcon } from "@/shared/ui/icons";

import type { PostImage } from "@/features/community/domain/post";
import { IMAGE_WIDTH } from "./image-aspect";

/** 하단 썸네일 한 변(px) — 수정 화면 스트립과 같은 64. */
const THUMBNAIL_SIZE = 64;
/** 썸네일 우상단 삭제(✕) 원 지름(px). 작성/수정 화면 스트립과 동일. */
const THUMBNAIL_REMOVE_SIZE = 22;
/** 하단 닫기(✕) 버튼 한 변(px) — 이미지 뷰어 닫기와 같은 44. */
const CLOSE_BUTTON_SIZE = 44;

/**
 * 게시글 수정 화면의 이미지 상세 — 등록된 이미지를 그대로 보여주고 삭제만 하는 모달.
 *
 * 정책: 등록 후 재크롭은 없다(크롭 핸들·프레임 없음), 좌우 스와이프도 없고 하단 썸네일 탭으로만
 * 장을 바꾼다. 썸네일 ✕는 그 장을 즉시 삭제하고(확인 없음), 마지막 1장을 지우면 호출부가 닫는다.
 * 완료 버튼이 없는 이유: 편집 행위가 없어 반영할 것이 없다 — 삭제는 이미 수정 화면 상태에 반영됐다.
 *
 * 이미지는 상세와 같은 폭(화면 − 32)으로 object-contain — 잘라 보이지 않고 저장된 그대로 노출.
 */
export function PostEditImageViewer({
  images,
  initialIndex,
  onRemove,
  onClose,
}: {
  images: PostImage[];
  initialIndex: number;
  /** 썸네일 ✕ — 호출부가 목록에서 제거한다(수정 화면 상태와 동일 출처). */
  onRemove: (imageId: number) => void;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(initialIndex);
  // 삭제로 목록이 줄면 범위 안으로 — 뒤 장이 앞으로 당겨지므로 같은 자리의 다음 장이 보인다.
  const index = Math.min(current, images.length - 1);
  const image = images[index];
  if (!image) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="이미지 상세"
      className="fixed inset-0 z-50 flex flex-col bg-overlay-scrim-heavy"
    >
      {/* 본 이미지: 남는 높이 가운데, 폭은 상세와 같은 화면 − 32. 편집 불가라 프레임·제스처 없음. */}
      <div className="flex min-h-0 flex-1 items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={image.id}
          src={image.imageUrl}
          alt=""
          style={{ width: IMAGE_WIDTH }}
          className="max-h-full object-contain"
        />
      </div>

      {/* 썸네일 스트립: 탭 = 장 전환(보고 있는 장은 흰 테두리), ✕ = 삭제. 좌우 16, 간격 16.
          ✕가 위로 삐져나오므로 pt-3. */}
      <ul className="flex shrink-0 gap-4 overflow-x-auto px-4 pt-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {images.map((item, itemIndex) => (
          <li key={item.id} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setCurrent(itemIndex)}
              aria-label={`${itemIndex + 1}번째 이미지 보기`}
              aria-current={itemIndex === index}
              style={{ width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE }}
              className={cn(
                "block overflow-hidden rounded-lg border-2",
                itemIndex === index
                  ? "border-[var(--bw-white)]"
                  : "border-transparent",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              aria-label="이미지 삭제"
              style={{
                width: THUMBNAIL_REMOVE_SIZE,
                height: THUMBNAIL_REMOVE_SIZE,
                top: -THUMBNAIL_REMOVE_SIZE / 2,
                right: -THUMBNAIL_REMOVE_SIZE / 2,
              }}
              className="absolute inline-flex items-center justify-center rounded-full bg-surface-tertiary text-icon-primary"
            >
              <CloseIcon size={14} />
            </button>
          </li>
        ))}
      </ul>

      {/* 하단: 닫기(✕ tint)만 가운데. 완료 없음. 홈 인디케이터 위까지 여백. */}
      <div className="flex shrink-0 justify-center pb-[calc(env(safe-area-inset-bottom)+12px)] pt-4">
        <button
          type="button"
          onClick={onClose}
          aria-label="이미지 상세 닫기"
          style={{ width: CLOSE_BUTTON_SIZE, height: CLOSE_BUTTON_SIZE }}
          className="inline-flex items-center justify-center rounded-[10px] bg-button-tint-default-bg text-button-tint-default-text active:bg-button-tint-pressed-bg"
        >
          <CloseIcon size={24} />
        </button>
      </div>
    </div>
  );
}
