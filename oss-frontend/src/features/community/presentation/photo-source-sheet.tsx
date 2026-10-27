"use client";

import type { ReactNode } from "react";

import { BottomSheetFrame } from "@/features/community/presentation/bottom-sheet-frame";
import type { PhotoSource } from "@/features/community/presentation/use-image-attachments";
import { cn } from "@/shared/lib/cn";
import { CameraIcon, ImageIcon } from "@/shared/ui/icons";
import { SURFACE_PRESS } from "@/shared/ui/press-styles";

const PHOTO_SOURCES: { source: PhotoSource; label: string; icon: ReactNode }[] =
  [
    { source: "album", label: "앨범에서 선택", icon: <ImageIcon size={24} /> },
    { source: "camera", label: "촬영하기", icon: <CameraIcon size={24} /> },
  ];

/**
 * 글쓰기 사진 선택창 — 사진 버튼을 누르면 iOS 시스템 메뉴(보관함/사진 찍기/파일 선택) 대신 띄운다(#250).
 *
 * SelectSheet와 같은 껍데기(BottomSheetFrame)를 쓰되, 항목을 누르면 바로 실행한다(라디오·CTA 없음).
 * 네이티브 시트(SHOW_SELECT_SHEET)로 그리지 않는 이유: 결과가 비동기로 돌아오면 사용자 제스처가 끊겨
 * 웹뷰가 file input을 열어주지 않는다. 글쓰기는 탭바 없는 풀스크린 서브뷰라 웹 딤으로도 화면 전체가 덮인다.
 *
 * onSelect는 항목 탭 핸들러 안에서 동기로 불린다 — 호출부는 거기서 바로 피커를 열어야 한다.
 */
export function PhotoSourceSheet({
  open,
  onDismiss,
  onSelect,
}: {
  open: boolean;
  onDismiss: () => void;
  onSelect: (source: PhotoSource) => void;
}) {
  return (
    <BottomSheetFrame open={open} title="사진 추가" onDismiss={onDismiss}>
      <ul className="mt-4 flex flex-col">
        {PHOTO_SOURCES.map(({ source, label, icon }) => (
          <li key={source}>
            <button
              type="button"
              onClick={() => onSelect(source)}
              // SelectSheet 항목과 같은 높이 51 · 아이콘↔라벨 12. 눌림 면은 시트 좌우 끝(px-5)까지 닿게 음수 마진으로 넓힌다.
              className={cn(
                "-mx-5 flex h-[51px] w-[calc(100%+2.5rem)] items-center gap-3 px-5 text-left",
                SURFACE_PRESS,
              )}
            >
              <span className="inline-flex shrink-0 text-bottom-sheet-unselected-list-item-leading-icon">
                {icon}
              </span>
              <span className="text-body-m font-medium text-bottom-sheet-selected-list-item-label">
                {label}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </BottomSheetFrame>
  );
}
