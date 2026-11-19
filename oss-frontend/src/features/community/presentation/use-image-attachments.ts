"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, RefObject } from "react";

import {
  deleteUploadedImage,
  uploadImageAndRegister,
} from "@/features/community/presentation/community-write-client";
import { track } from "@/shared/lib/analytics";
import {
  OutboundMessageType,
  requestNativePhotos,
  supportsNativeMessage,
} from "@/shared/lib/native-bridge";
import { useToast } from "@/shared/ui";

import { isWithinAllowedAspect } from "./image-aspect";
import { readImageSize, type CropState } from "./image-crop";

/** 게시글 1건 최대 첨부 장수(클라이언트 제한, 단일 출처). 한번에 여러 장 골라도 이 수까지만 담는다. */
export const MAX_IMAGES = 3;

/** 첨부 한도 초과 안내(정책 문구). */
const MAX_IMAGES_MESSAGE = `사진은 최대 ${MAX_IMAGES}장까지 첨부할 수 있어요`;

/** 사진을 어디서 가져올지 — 글쓰기 사진 선택창(PhotoSourceSheet)의 두 항목. */
export type PhotoSource = "album" | "camera";
/** 재시도 반복 실패 안내(정책 문구). 첫 실패는 썸네일의 ↻만으로 알리고, 재시도가 또 실패했을 때만 띄운다. */
const RETRY_FAILED_MESSAGE = "업로드하지 못했어요. 잠시 후 다시 시도해주세요";
/** 앱 사진 선택에서 골랐지만 받지 못한 장이 있을 때(#264 후속). */
const photosNotLoadedMessage = (count: number) =>
  `사진 ${count}장을 불러오지 못했어요`;
/**
 * 이만큼 이상 백그라운드에 있다 돌아오면 업로드 중인 장을 실패(↻)로 돌린다. WKWebView는 백그라운드에서
 * 네트워크·타이머가 멈춰 응답도 타임아웃도 안 올 수 있다. 피커 왕복 같은 짧은 전환은 건드리지 않는다.
 */
const BACKGROUND_STALE_MS = 30_000;

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
 * 한 번 고른 사진 묶음(`photo_attach`, #619). 그 장들이 모두 끝나면(올라감 · 실패) 한 번 남긴다 — 묶음이 끝나기 전에
 * 편집(크롭) · ↻ 다시 올리기로 다시 올리는 장은 그 결과를, 백그라운드 복귀로 실패가 된 장은 실패를 센다.
 * 도중에 ✕로 지운 장은 뺀다. 묶음의 장이 모두 빠졌으면(✕ · 작성 취소) 앱 사진 선택에서 못 받은 장까지 함께
 * 버린다 — 사용자가 그 묶음을 버린 것으로 본다.
 * seen: 첨부 목록에 들어간 것을 본 적이 있는지 — 묶음을 넣은 직후 앞 렌더의 effect가 늦게 돌면 아직 목록에
 * 없는데, 그때 지운 것으로 보지 않게 한다.
 */
type PhotoBatch = {
  method: PhotoSource;
  ids: string[];
  notLoaded: number;
  seen: boolean;
};

/**
 * 묶음 결과 기록. photo_count = 남은 장 + 받지 못한 장(앱 사진 선택), result는 같은 장들 기준으로
 * 전부 올라감 ok · 일부 partial · 하나도 못 올림 fail. 셀 장이 없으면 남기지 않는다.
 * 업로드 · 받기 실패 안내 자체는 `error_shown`(#583) 몫.
 */
function trackPhotoAttach(
  method: PhotoSource,
  statuses: AttachmentStatus[],
  notLoaded: number,
): void {
  const total = statuses.length + notLoaded;
  if (total === 0) return;
  const done = statuses.filter((status) => status === "done").length;
  track("photo_attach", {
    method,
    photo_count: total,
    result: done === total ? "ok" : done === 0 ? "fail" : "partial",
  });
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
 * 화면은 `fileInputRef`(앨범)·`cameraInputRef`(촬영)를 숨겨진 input 둘에 연결하고 `onFileChange`를
 * 둘의 onChange에 건다. "사진" 버튼은 `ensureRoom()`으로 장수를 확인한 뒤 우리 선택창을 띄우고,
 * 선택창 항목 탭이 `pick(source)`로 해당 input을 연다(탭 = 사용자 제스처라 웹뷰가 피커를 띄움, #250).
 * 단, 앨범은 앱이 `PICK_PHOTOS`를 지원하면 input 대신 네이티브 사진 선택 화면을 연다(#264) — input은
 * iOS 시스템 메뉴(보관함/사진 찍기/파일 선택)를 한 번 더 띄우기 때문. 받은 사진은 같은 `addFiles`로 들어간다.
 *
 * 편집(크롭)은 `replaceFile`로 파일만 갈아 끼우고 다시 올린다. 원본은 `source`에 남겨 다음 편집이
 * 크롭본이 아니라 원본에서 다시 잘라내게 한다(등록 전까지는 몇 번이든 되돌릴 수 있음).
 *
 * 버려진 업로드 정리(#146): 업로드가 끝난 장을 ✕로 지우거나(`remove`), 크롭으로 갈아 끼우거나(`replaceFile`),
 * 작성을 취소하면(`abandonAll`) 그 imageId를 서버에서 바로 지운다(best-effort, 실패는 서버 배치가 수거).
 * 편집 · 삭제 · 백그라운드 복귀로 세대가 바뀐 뒤 늦게 도착한 업로드 결과도 받는 즉시 지운다.
 * 등록 · 수정에 성공한 뒤 화면을 비우는 `discardAll`은 지우지 않는다 — 그 이미지는 이미 글에 붙어 있다.
 *
 * 기록(GA, #619): 한 번 고른 묶음의 장이 모두 끝나면 `photo_attach`를 한 번 남긴다(PhotoBatch).
 */
export function useImageAttachments() {
  const toast = useToast();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  /** 네이티브 사진 선택(#264) 응답을 기다리는 중인지 — 중복 요청 방지. */
  const nativePickingRef = useRef(false);

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

  // 사진 묶음 기록(GA, #619) — 묶음의 장이 모두 끝나는 렌더에서 남긴다.
  const photoBatchesRef = useRef<PhotoBatch[]>([]);
  useEffect(() => {
    if (photoBatchesRef.current.length === 0) return;
    photoBatchesRef.current = photoBatchesRef.current.filter((batch) => {
      const items = attachments.filter((item) =>
        batch.ids.includes(item.localId),
      );
      if (items.length > 0) batch.seen = true;
      if (!batch.seen) return true;
      if (items.some((item) => item.status === "uploading")) return true;
      if (items.length === 0) return false;
      trackPhotoAttach(
        batch.method,
        items.map((item) => item.status),
        batch.notLoaded,
      );
      return false;
    });
  }, [attachments]);

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
        // 기다리는 사이 이 장이 지워졌거나 편집으로 바뀌었다 — 어디에도 붙지 않을 이미지라 바로 지운다.
        if (!isCurrent()) {
          deleteUploadedImage(imageId);
          return;
        }
        patch(localId, { status: "done", imageId });
      } catch (error) {
        console.error("[post-write] 이미지 업로드 실패:", file.name, error);
        if (!isCurrent()) return;
        patch(localId, { status: "failed", imageId: undefined });
        if (isRetry) toast.show(RETRY_FAILED_MESSAGE, { tone: "error" });
      }
    },
    [patch, toast],
  );

  /**
   * 백그라운드 복귀: 오래 숨겨져 있었다면 업로드 중인 장을 실패로 돌린다. 세대를 올려 멈춰 있던
   * 이전 요청의 결과가 늦게 와도 버린다(↻ 재시도한 결과를 덮지 않게). 첫 실패라 토스트는 없다.
   */
  useEffect(() => {
    let hiddenAt: number | null = null;
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
        return;
      }
      const hiddenFor = hiddenAt === null ? 0 : Date.now() - hiddenAt;
      hiddenAt = null;
      if (hiddenFor < BACKGROUND_STALE_MS) return;
      // 업로드 중인 장이 없으면 prev를 그대로 돌려 불필요한 리렌더를 막는다(수정 모드·첨부 없음 포함).
      setAttachments((prev) =>
        prev.some((item) => item.status === "uploading")
          ? prev.map((item) =>
              item.status === "uploading"
                ? { ...item, status: "failed", uploadSeq: item.uploadSeq + 1 }
                : item,
            )
          : prev,
      );
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  /** 원본 크기를 읽어 채운다 — 비율 밖 경고·편집 가능 여부의 근거. 늦게 와도 patch가 흡수한다. */
  const measureSource = useCallback(
    async (localId: string, source: File) => {
      const size = await readImageSize(source);
      patch(localId, { sourceWidth: size.width, sourceHeight: size.height });
    },
    [patch],
  );

  /**
   * 고른 파일들을 한도 내에서 첨부에 추가하고 즉시 장별 업로드를 시작한다.
   * 남은 자리는 최신 목록(attachmentsRef)으로 센다 — 네이티브 선택 결과는 피커를 연 시점보다 늦게 도착한다.
   * method · notLoadedCount(앱 사진 선택에서 받지 못한 장)는 사진 묶음 기록(GA, #619)에 쓴다. 한 장도 못 받았으면
   * 바로 fail로 남기고, 자리가 없어 하나도 담지 않았으면(한도 토스트) 받아 올린 것이 아니라 남기지 않는다.
   */
  const addFiles = useCallback(
    (
      fileList: FileList | File[] | null,
      method: PhotoSource,
      notLoadedCount = 0,
    ) => {
      const files = Array.from(fileList ?? []);
      if (files.length === 0) {
        // 앱 사진 선택에서 고른 사진을 하나도 못 받았으면 실패로 남긴다(취소는 0장 · 0실패라 남기지 않음).
        trackPhotoAttach(method, [], notLoadedCount);
        return;
      }

      const room = MAX_IMAGES - attachmentsRef.current.length;
      if (room <= 0) {
        toast.show(MAX_IMAGES_MESSAGE, { tone: "warning" });
        return;
      }
      // 초과분은 앞에서부터 room장만 담고 나머지는 무시(정책) + 안내.
      if (files.length > room) {
        toast.show(MAX_IMAGES_MESSAGE, { tone: "warning" });
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
      photoBatchesRef.current.push({
        method,
        ids: next.map((item) => item.localId),
        notLoaded: notLoadedCount,
        seen: false,
      });
      // 장별로 독립 실행 — 한 장 실패가 다른 장을 막지 않는다. 크기 읽기는 업로드와 병행.
      next.forEach((item) => {
        void measureSource(item.localId, item.source);
        void startUpload(item.localId, item.file, item.uploadSeq, false);
      });
    },
    [measureSource, startUpload, toast],
  );

  /** 숨겨진 file input의 onChange. 같은 파일 재선택도 발화되도록 value를 비운다. */
  const onFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      addFiles(
        event.target.files,
        event.target === cameraInputRef.current ? "camera" : "album",
      );
      event.target.value = "";
    },
    [addFiles],
  );

  /** "사진" 버튼: 이미 3장이면 선택창을 열지 않고 토스트(정책 — 버튼은 비활성이 아님). 열 수 있으면 true. */
  const ensureRoom = useCallback(() => {
    if (attachments.length >= MAX_IMAGES) {
      toast.show(MAX_IMAGES_MESSAGE, { tone: "warning" });
      return false;
    }
    return true;
  }, [attachments.length, toast]);

  /**
   * 선택창에서 고른 곳의 피커를 연다 — 앨범은 보관함 input, 촬영은 capture input(바로 카메라).
   * 반드시 탭 핸들러 안에서 동기로 불러야 한다. 비동기 뒤(await·타이머)면 웹뷰가 사용자 제스처로 보지 않아 피커가 안 뜬다.
   * 앱이 지원하면 앨범은 네이티브 사진 선택 화면(#264) — 남은 장수만큼만 고르게 한다. 취소면 빈 배열이라 아무 일 없음.
   */
  const pick = useCallback(
    (source: PhotoSource) => {
      if (
        source === "album" &&
        supportsNativeMessage(OutboundMessageType.PICK_PHOTOS)
      ) {
        // 선택 화면이 뜨기 전 다시 눌러도 요청은 하나만 — 결과가 겹쳐 들어오면 장수 계산이 어긋난다.
        if (nativePickingRef.current) return;
        const limit = MAX_IMAGES - attachmentsRef.current.length;
        // 0을 보내면 PHPicker는 무제한으로 받는다.
        if (limit <= 0) {
          toast.show(MAX_IMAGES_MESSAGE, { tone: "warning" });
          return;
        }
        nativePickingRef.current = true;
        requestNativePhotos(limit)
          .then(({ files, failedCount }) => {
            addFiles(files, "album", failedCount);
            if (failedCount > 0)
              toast.show(photosNotLoadedMessage(failedCount), { tone: "error" });
          })
          .catch((error) => {
            console.error("[post-write] 네이티브 사진 선택 실패:", error);
          })
          .finally(() => {
            nativePickingRef.current = false;
          });
        return;
      }
      const input =
        source === "camera" ? cameraInputRef.current : fileInputRef.current;
      input?.click();
    },
    [addFiles, toast],
  );

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
      // 크롭 전 파일로 이미 올라간 이미지는 이제 붙지 않는다.
      if (target.imageId !== undefined) deleteUploadedImage(target.imageId);
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

  /**
   * 서버가 imageId를 이미 지운 경우(등록 응답 C0000 — TEMP 만료) 완료된 장을 전부 실패(↻)로 되돌린다.
   * 어느 id가 없는지 서버가 알려주지 않아 전 장을 되돌린다(드문 케이스). 이후 복구는 기존 재시도(retry)
   * 그대로 — 업로드 파일(크롭본 포함)은 남아 있으므로 썸네일 탭만으로 다시 올라간다.
   */
  const expireUploaded = useCallback(() => {
    setAttachments((prev) =>
      prev.map((item) =>
        item.status === "done"
          ? { ...item, status: "failed", imageId: undefined }
          : item,
      ),
    );
  }, []);

  /** 썸네일 삭제(업로드 중이어도 가능, 확인 없음). 뒤 장이 앞으로 당겨져 순서는 유지된다. */
  const remove = useCallback((localId: string) => {
    // 서버 삭제는 상태 갱신 함수 밖에서 한 번만 부른다(갱신 함수는 개발 모드에서 두 번 돈다).
    // 업로드 중인 장은 아직 id가 없다 — 결과가 늦게 오면 startUpload가 지운다.
    const removed = attachmentsRef.current.find(
      (item) => item.localId === localId,
    );
    if (removed?.imageId !== undefined) deleteUploadedImage(removed.imageId);
    setAttachments((prev) => {
      const target = prev.find((item) => item.localId === localId);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((item) => item.localId !== localId);
    });
  }, []);

  /**
   * 등록 · 수정에 성공해 화면을 떠날 때 전체 비우기(object URL 회수). 서버 이미지는 지우지 않는다 —
   * 이미 글에 붙었다. 작성 취소는 `abandonAll`.
   */
  const discardAll = useCallback(() => {
    setAttachments((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.preview));
      return [];
    });
  }, []);

  /**
   * 작성 취소 · 이탈: 올려 둔 이미지를 서버에서 지우고 전체를 비운다(#146). 업로드 중인 장은 결과가 오면
   * startUpload가 지운다(목록에서 빠져 세대가 맞지 않음).
   */
  const abandonAll = useCallback(() => {
    attachmentsRef.current.forEach((item) => {
      if (item.imageId !== undefined) deleteUploadedImage(item.imageId);
    });
    discardAll();
  }, [discardAll]);

  return {
    attachments,
    canAddMore,
    remaining,
    isUploadSettled,
    imageFileIdList,
    fileInputRef: fileInputRef as RefObject<HTMLInputElement>,
    cameraInputRef: cameraInputRef as RefObject<HTMLInputElement>,
    onFileChange,
    ensureRoom,
    pick,
    retry,
    replaceFile,
    expireUploaded,
    remove,
    discardAll,
    abandonAll,
  };
}
