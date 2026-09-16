"use client";

import { CloseIcon } from "@/shared/ui/icons";

import type { PostImage } from "@/features/community/domain/post";
import { IMAGE_WIDTH } from "./image-aspect";

/** 하단 닫기(✕) 버튼 한 변(px) — 이미지 뷰어 닫기와 같은 44. */
const CLOSE_BUTTON_SIZE = 44;

/**
 * 게시글 수정 화면의 이미지 상세 — 탭한 이미지 한 장을 등록된 그대로 보여주는 모달.
 *
 * 정책: 등록 후 재크롭은 없다(크롭 핸들·프레임 없음). 좌우 스와이프도 없고, 다른 장을 보려면 닫고
 * 수정 화면의 썸네일을 다시 탭한다 — 썸네일 스트립은 딤 뒤에 그대로 있으므로 상세 안에 다시 그리지
 * 않는다(FE 결정 2026-09-16). 삭제도 수정 화면 스트립의 ✕에서만 한다.
 * 완료 버튼이 없는 이유: 편집 행위가 없어 반영할 것이 없다.
 *
 * 이미지는 상세와 같은 폭(화면 − 32)으로 object-contain — 잘라 보이지 않고 저장된 그대로 노출.
 */
export function PostEditImageViewer({
  image,
  onClose,
}: {
  image: PostImage;
  onClose: () => void;
}) {
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
          src={image.imageUrl}
          alt=""
          style={{ width: IMAGE_WIDTH }}
          className="max-h-full object-contain"
        />
      </div>

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
