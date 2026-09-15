"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, RefObject } from "react";

import { uploadImageAndRegister } from "@/features/community/presentation/community-write-client";
import { useToast } from "@/shared/ui";

import { isWithinAllowedAspect } from "./image-aspect";
import { readImageSize, type CropState } from "./image-crop";

/** 게시글 1건 최대 첨부 장수(클라이언트 제한, 단일 출처). 한번에 여러 장 골라도 이 수까지만 담는다. */
export const MAX_IMAGES = 3;

/** 첨부 한도 초과 안내(정책 문구). */
const MAX_IMAGES_MESSAGE = `사진은 최대 ${MAX_IMAGES}장까지 첨부할 수 있어요`;
/** 재시도 반복 실패 안내(정책 문구). 첫 실패는 썸네일의 ↻만으로 알리고, 재시도가 또 실패했을 때만 띄운다. */
const RETRY_FAILED_MESSAGE = "업로드에 실패했어요. 잠시 후 다시 시도해주세요.";

/**
 * 썸네일 1장의 업로드 상태(정책: 각 썸네일은 개별 상태).
 * - uploading: 흐림 + 스피너. 삭제(✕)는 가능, 탭은 무시(편집은 done만).
 * - failed: 흐림 + ↻. 썸네일 탭 = 그 장만 재업로드.
 * - done: 원본 썸네일. imageId 확보.
 */
export type AttachmentStatus = "uploading" | "failed" | "done";

/**
 * 화면이 보유하는 첨부 1장 (선택 즉시 업로드 모델).
 *
 * 고르는 순간 ⓪압축→①서명→②ImageKit→③서버 등록을 그 장만 따로 태운다. 한 장이 실패해도
 * 나머지는 독립적으로 진행되고, 실패한 장은 사용자가 썸네일을 탭해 다시 올린다.
 */
export type Attachment = {
  localId: string;
  /** 피커에서 고른 원본 File. 편집(크롭)은 항상 이 원본에서 다시 잘라내므로 이어 편집이 된다. */
  source: File;
  /** 원본 픽셀 크기(EXIF 보정 후). 디코드 전/실패면 0 — 편집 불가·비율 판단 보류. */
  sourceWidth: number;
  sourceHeight: number;
  /** 실제 업로드되는 File — 편집 전엔 원본과 동일, 완료 후엔 크롭본. 재시도도 이 파일을 올린다. */
  file: File;
  /** 미리보기용 object URL(blob:) — `file` 기준. remove/교체/이탈 시 revoke 해 메모리 해제. */
  preview: string;
  status: AttachmentStatus;
  /** ③ 서버 등록까지 끝났을 때의 int imageId. done일 때만 존재. */
  imageId?: number;
  /** 마지막 편집 결과. 없으면 원본 그대로(자동 크롭 없음). */
  crop?: CropState;
  /**
   * 업로드 세대. 편집으로 파일이 바뀌면 +1 — 이전 파일의 업로드 결과가 늦게 도착해도
   * 세대가 다르면 버려서 크롭 전 이미지의 imageId가 붙는 사고를 막는다.
   */
  uploadSeq: number;
};

/** 허용 비율(4:5~1.91:1) 밖이라 이대로 올리면 상세/목록에서 잘리는 장 — 편집을 유도한다. 크롭본은 항상 안. */
export function isAttachmentOutOfAspect(item: Attachment): boolean {
  if (item.crop) return false;
  return !isWithinAllowedAspect(item.sourceWidth, item.sourceHeight);
}

/**
 * 게시글 작성 이미지 첨부 훅 (선택 즉시 개별 업로드 / 웹 단독).
 *
 * 책임:
 * - 첨부 목록(원본 File + 미리보기 + 업로드 상태)과 순서를 보유한다. 순서 = 서버 저장 순서.
 * - 선택은 표준 `<input type="file">`로 한다. 네이티브 웹뷰(WKWebView 등)는 이 input을
 *   탭하면 네이티브 사진/카메라 피커를 띄우고, 고른 결과를 웹에 실제 File로 돌려준다.
 *   → 별도 네이티브 브릿지 없이 "네이티브 피커 UX + 웹이 바이트 보유"가 동시에 된다.
 * - 업로드는 고르는 즉시 장별로 시작한다(정책: 썸네일별 업로드 중/실패/완료 표시). 등록 버튼은
 *   전 장이 done일 때만 열리므로(`isUploadSettled`) 화면은 `imageFileIdList`를 그대로 전송하면 된다.
 *
 * 화면은 `fileInputRef`를 숨겨진 input에 연결하고 `onFileChange`를 그 onChange에 건다.
 * "사진" 버튼은 `pick()`으로 그 input을 연다(탭 = 사용자 제스처라 웹뷰가 피커를 띄움).
 *
 * 편집(크롭)은 `replaceFile`로 파일만 갈아 끼우고 다시 올린다. 원본은 `source`에 남겨 다음 편집이
 * 크롭본이 아니라 원본에서 다시 잘라내게 한다(등록 전까지는 몇 번이든 되돌릴 수 있음).
 *
 * FIXME(미아 정리): 업로드 완료 후 ✕로 지우거나 편집으로 교체하거나 작성을 취소하면 CDN/서버(TEMP)
 * 이미지가 남는다. 게시글에 연결되지 않은 TEMP 이미지의 서버 측 정리 정책이 확정되면 삭제 API 호출을 붙인다.
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
  /** 모든 첨부가 done(업로드 중·실패 없음). 첨부가 없어도 true — 등록 버튼 조건의 단일 출처. */
  const isUploadSettled = attachments.every((item) => item.status === "done");
  /** 표시 순서대로의 서버 imageId. isUploadSettled일 때만 완전하다. */
  const imageFileIdList = attachments.flatMap((item) =>
    item.imageId === undefined ? [] : [item.imageId],
  );

  /**
   * 한 장 상태 갱신. 결과가 돌아왔을 때 이미 ✕로 지워진 장이면 prev에 없어 map이 건너뛴다 —
   * 업로드 중 삭제를 허용하면서도 늦게 도착한 결과가 목록을 되살리지 않게 하는 장치.
   */
  const patch = useCallback((localId: string, next: Partial<Attachment>) => {
    setAttachments((prev) =>
      prev.map((item) =>
        item.localId === localId ? { ...item, ...next } : item,
      ),
    );
  }, []);

  /**
   * 한 장 업로드 실행. isRetry면 실패 시 정책 토스트까지 띄운다(첫 실패는 ↻ 표시로 충분).
   * 결과는 시작 시점의 uploadSeq와 같은 세대일 때만 반영 — 도중에 편집으로 파일이 바뀌었으면 버린다.
   */
  const startUpload = useCallback(
    async (localId: string, file: File, seq: number, isRetry: boolean) => {
      const isCurrent = () =>
        attachmentsRef.current.some(
          (item) => item.localId === localId && item.uploadSeq === seq,
        );
      try {
        const imageId = await uploadImageAndRegister(file);
        if (!isCurrent()) return;
        patch(localId, { status: "done", imageId });
      } catch (error) {
        console.error("[post-write] 이미지 업로드 실패:", file.name, error);
        if (!isCurrent()) return;
        patch(localId, { status: "failed", imageId: undefined });
        if (isRetry) toast.show(RETRY_FAILED_MESSAGE);
      }
    },
    [patch, toast],
  );

  /** 원본 크기를 읽어 채운다 — 비율 밖 경고·편집 가능 여부의 근거. 늦게 와도 patch가 흡수한다. */
  const measureSource = useCallback(
    async (localId: string, source: File) => {
      const size = await readImageSize(source);
      patch(localId, { sourceWidth: size.width, sourceHeight: size.height });
    },
    [patch],
  );

  /** 고른 파일들을 한도 내에서 첨부에 추가하고 즉시 장별 업로드를 시작한다. */
  const addFiles = useCallback(
    (fileList: FileList | null) => {
      const files = Array.from(fileList ?? []);
      if (files.length === 0) return;

      const room = MAX_IMAGES - attachments.length;
      if (room <= 0) {
        toast.show(MAX_IMAGES_MESSAGE);
        return;
      }
      // 초과분은 앞에서부터 room장만 담고 나머지는 무시(정책) + 안내.
      if (files.length > room) {
        toast.show(MAX_IMAGES_MESSAGE);
      }

      const next: Attachment[] = files.slice(0, room).map((file) => ({
        localId: crypto.randomUUID(),
        source: file,
        sourceWidth: 0,
        sourceHeight: 0,
        file,
        preview: URL.createObjectURL(file),
        status: "uploading",
        uploadSeq: 0,
      }));
      setAttachments((prev) => [...prev, ...next]);
      // 장별로 독립 실행 — 한 장 실패가 다른 장을 막지 않는다. 크기 읽기는 업로드와 병행.
      next.forEach((item) => {
        void measureSource(item.localId, item.source);
        void startUpload(item.localId, item.file, item.uploadSeq, false);
      });
    },
    [attachments.length, measureSource, startUpload, toast],
  );

  /** 숨겨진 file input의 onChange. 같은 파일 재선택도 발화되도록 value를 비운다. */
  const onFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      addFiles(event.target.files);
      event.target.value = "";
    },
    [addFiles],
  );

  /** "사진" 버튼: 이미 3장이면 피커를 열지 않고 토스트(정책 — 버튼은 비활성이 아님), 아니면 피커를 연다. */
  const pick = useCallback(() => {
    if (attachments.length >= MAX_IMAGES) {
      toast.show(MAX_IMAGES_MESSAGE);
      return;
    }
    fileInputRef.current?.click();
  }, [attachments.length, toast]);

  /** 실패한 장만 다시 올린다(썸네일 탭). 실패 상태가 아니면 무시. */
  const retry = useCallback(
    (localId: string) => {
      const target = attachmentsRef.current.find(
        (item) => item.localId === localId,
      );
      if (!target || target.status !== "failed") return;
      patch(localId, { status: "uploading" });
      void startUpload(localId, target.file, target.uploadSeq, true);
    },
    [patch, startUpload],
  );

  /**
   * 편집 완료: 업로드 파일을 크롭본으로 교체하고 새 세대로 다시 올린다. 이전 미리보기 URL은 회수.
   * 업로드 중이던 이전 세대의 결과는 세대가 달라 자동으로 버려진다.
   */
  const replaceFile = useCallback(
    (localId: string, file: File, crop: CropState) => {
      const target = attachmentsRef.current.find(
        (item) => item.localId === localId,
      );
      if (!target) return;
      URL.revokeObjectURL(target.preview);
      const seq = target.uploadSeq + 1;
      patch(localId, {
        file,
        preview: URL.createObjectURL(file),
        crop,
        status: "uploading",
        imageId: undefined,
        uploadSeq: seq,
      });
      void startUpload(localId, file, seq, false);
    },
    [patch, startUpload],
  );

  /** 썸네일 삭제(업로드 중이어도 가능, 확인 없음). 뒤 장이 앞으로 당겨져 순서는 유지된다. */
  const remove = useCallback((localId: string) => {
    setAttachments((prev) => {
      const target = prev.find((item) => item.localId === localId);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((item) => item.localId !== localId);
    });
  }, []);

  /** 작성 취소/이탈 시 전체 비우기(object URL 회수). */
  const discardAll = useCallback(() => {
    setAttachments((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.preview));
      return [];
    });
  }, []);

  return {
    attachments,
    canAddMore,
    remaining,
    isUploadSettled,
    imageFileIdList,
    fileInputRef: fileInputRef as RefObject<HTMLInputElement>,
    onFileChange,
    pick,
    retry,
    replaceFile,
    remove,
    discardAll,
  };
}
