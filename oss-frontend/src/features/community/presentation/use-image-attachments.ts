"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, RefObject } from "react";

import { uploadImageAndRegister } from "@/features/community/presentation/community-write-client";
import { useToast } from "@/shared/ui";

/** 게시글 1건 최대 첨부 장수(클라이언트 제한, 단일 출처). 한번에 여러 장 골라도 이 수까지만 담는다. */
export const MAX_IMAGES = 3;

/**
 * 화면이 보유하는 첨부 1장 (지연 업로드 모델).
 *
 * 원본 `file`을 그대로 들고 있다가 **등록(uploadAll) 시점에만** CDN에 올린다.
 * 고르는 동안엔 어디에도 업로드하지 않으므로, 작성 취소·앱 종료·미리보기 삭제로 생기는
 * CDN/서버 미아(orphan) 이미지가 원천적으로 없다.
 */
export type Attachment = {
  localId: string;
  /** 원본 File. 등록 전까진 로컬(브라우저 메모리)에만 존재. */
  file: File;
  /** 미리보기용 object URL(blob:). remove/이탈 시 revoke 해 메모리 해제. */
  preview: string;
};

/**
 * 게시글 작성 이미지 첨부 훅 (지연 업로드 / 웹 단독).
 *
 * 책임:
 * - 첨부 목록(원본 File + 미리보기)과 순서를 보유한다. 순서 = 서버 저장 순서.
 * - 선택은 표준 `<input type="file">`로 한다. 네이티브 웹뷰(WKWebView 등)는 이 input을
 *   탭하면 네이티브 사진/카메라 피커를 띄우고, 고른 결과를 웹에 실제 File로 돌려준다.
 *   → 별도 네이티브 브릿지 없이 "네이티브 피커 UX + 웹이 바이트 보유"가 동시에 된다.
 * - 업로드는 고를 때가 아니라 `uploadAll()`(등록 시점)에만 일어난다 → CDN/서버 미아 방지.
 *
 * 화면은 `fileInputRef`를 숨겨진 input에 연결하고 `onFileChange`를 그 onChange에 건다.
 * "사진" 버튼은 `pick()`으로 그 input을 연다(탭 = 사용자 제스처라 웹뷰가 피커를 띄움).
 */
export function useImageAttachments() {
  const toast = useToast();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 언마운트 시 남은 object URL을 모두 회수하기 위한 최신 첨부 미러.
  const attachmentsRef = useRef<Attachment[]>([]);
  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);
  useEffect(() => {
    return () => {
      attachmentsRef.current.forEach((item) =>
        URL.revokeObjectURL(item.preview),
      );
    };
  }, []);

  const remaining = MAX_IMAGES - attachments.length;
  const canAddMore = remaining > 0;

  /** 고른 파일들을 한도 내에서 첨부에 추가한다(원본 보관 + object URL 미리보기 생성). */
  const addFiles = useCallback(
    (fileList: FileList | null) => {
      const files = Array.from(fileList ?? []);
      if (files.length === 0) return;

      const room = MAX_IMAGES - attachments.length;
      if (room <= 0) {
        toast.show(`이미지는 최대 ${MAX_IMAGES}장까지 첨부할 수 있어요`);
        return;
      }
      if (files.length > room) {
        toast.show(`이미지는 최대 ${MAX_IMAGES}장까지 첨부할 수 있어요`);
      }

      const next = files.slice(0, room).map((file) => ({
        localId: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
      }));
      setAttachments((prev) => [...prev, ...next]);
    },
    [attachments.length, toast],
  );

  /** 숨겨진 file input의 onChange. 같은 파일 재선택도 발화되도록 value를 비운다. */
  const onFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      addFiles(event.target.files);
      event.target.value = "";
    },
    [addFiles],
  );

  /** "사진" 버튼: 한도면 토스트로 막고, 아니면 네이티브/웹 피커를 연다. */
  const pick = useCallback(() => {
    if (attachments.length >= MAX_IMAGES) {
      toast.show(`이미지는 최대 ${MAX_IMAGES}장까지 첨부할 수 있어요`);
      return;
    }
    fileInputRef.current?.click();
  }, [attachments.length, toast]);

  /** 미리보기 삭제. 로컬 object URL만 회수 — 업로드 전이라 CDN/서버 호출 없음. */
  const remove = useCallback((localId: string) => {
    setAttachments((prev) => {
      const target = prev.find((item) => item.localId === localId);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((item) => item.localId !== localId);
    });
  }, []);

  /** 작성 취소/이탈 시 전체 비우기(object URL 회수). 업로드 전이라 정리할 원격 자원 없음. */
  const discardAll = useCallback(() => {
    setAttachments((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.preview));
      return [];
    });
  }, []);

  /**
   * 등록 시점 업로드. 표시 순서대로 서버 int imageId 배열을 돌려준다(서버 imageIds로 그대로 전송).
   * 첨부가 없으면 빈 배열. 한 장이라도 실패하면 throw → 호출부가 토스트 + 화면 잔류.
   */
  const uploadAll = useCallback(async (): Promise<number[]> => {
    if (attachments.length === 0) return [];
    // 순서 보존: 표시 순서대로 순차로 ①②③(서명→ImageKit→등록)을 태워 imageId를 모은다.
    const imageIds: number[] = [];
    for (const item of attachments) {
      imageIds.push(await uploadImageAndRegister(item.file));
    }
    return imageIds;
  }, [attachments]);

  return {
    attachments,
    canAddMore,
    remaining,
    fileInputRef: fileInputRef as RefObject<HTMLInputElement>,
    onFileChange,
    pick,
    remove,
    discardAll,
    uploadAll,
  };
}
