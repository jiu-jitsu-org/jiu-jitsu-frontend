"use client";

import { useRouter } from "next/navigation";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";

import { cn } from "@/shared/lib/cn";
import { useViewportRect } from "@/features/community/presentation/use-viewport-rect";
import {
  closeNativeSubview,
  isNativeBridgeAvailable,
  OutboundMessageType,
  postToNative,
  useNativeBackHandler,
} from "@/shared/lib/native-bridge";
import { useToast } from "@/shared/ui";
import { AppBarShell } from "@/features/community/presentation/app-bar-shell";
import { ConfirmDialog } from "@/features/community/presentation/confirm-dialog";
import { HashIcon, ImageIcon } from "@/shared/ui/icons";

import {
  createPost,
  WriteRequestError,
} from "./community-write-client";
import { MAX_IMAGES, useImageAttachments } from "./use-image-attachments";

/** 본문 최대 글자 수. 카운터/입력 제한 단일 출처. */
const BODY_MAX_LENGTH = 800;
/** 제목 최대 글자 수. */
const TITLE_MAX_LENGTH = 45;
/** 태그 최대 개수. */
const MAX_TAGS = 10;
/** 태그 1개 최대 글자 수. */
const MAX_TAG_LENGTH = 20;
/**
 * 게시글 카테고리 id. 작성 화면에 카테고리 선택 UI가 아직 없어 임시 기본값을 쓴다.
 * FIXME(UI/API): 카테고리 선택 컴포넌트 추가 후 사용자가 고른 값으로 교체(POST /board 필수 필드).
 */
const DEFAULT_CATEGORY_ID = 1;

/**
 * 게시글 작성 화면 초안 (클라이언트 화면 컴포넌트).
 *
 * 상세(PostDetailView)의 시각 시스템을 그대로 따른다 — True White 배경, 44pt 앱바,
 * 본문 좌우 16(px-4), 동일 색 토큰. 다만 상세가 "읽기"라면 여긴 "쓰기"이므로 compose 패턴을 더한다:
 * - 우측 "등록"은 제목·본문이 모두 채워지기 전엔 비활성(댓글 입력바의 canSubmit과 동일 철학).
 * - 입력 중 뒤로가면 이탈 가드(ConfirmDialog)로 실수 유실을 막는다.
 *
 * 전 영역이 인터랙티브하고 등록 버튼이 입력 상태에 의존하므로(앱바↔본문 상태 공유),
 * 상세처럼 서버 레이아웃 + 클라이언트 leaf로 쪼개지 않고 하나의 클라이언트 화면으로 둔다.
 *
 * 작성 흐름은 BFF에 연결돼 있다: ①②③(서명→ImageKit→등록)으로 imageFileIdList 확보 후
 * ④ POST /api/community/board로 생성. 남은 공백 2가지:
 * - categoryId: 카테고리 선택 UI가 없어 DEFAULT_CATEGORY_ID 임시 사용(FIXME).
 * - tags: /board 계약에 태그 필드가 없어 입력은 받되 전송하지 않음(백엔드 확정 시 연결).
 */
export function PostWriteScreen() {
  const router = useRouter();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  // 키보드 위 '실제 보이는 영역'에 셸을 맞춘다(visualViewport). dvh/fixed inset-0가 안 줄어드는
  // WKWebView에서 입력 보조 바를 키보드 바로 위에 떨어뜨리는 유일하게 신뢰 가능한 기준.
  const rect = useViewportRect();
  // 태그: 평소 숨김(tagsOpen=false) → 하단 "태그" 버튼으로 펼친다(progressive disclosure).
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tagsOpen, setTagsOpen] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  // 이미지 첨부(지연 업로드: 고를 땐 로컬 미리보기만, 등록 시점에만 CDN 업로드).
  // 선택은 표준 <input type=file> — 웹뷰가 네이티브 피커를 띄우고 웹에 File을 돌려준다.
  const {
    attachments,
    canAddMore,
    remaining,
    fileInputRef,
    onFileChange,
    pick,
    remove,
    discardAll,
    uploadAll,
  } = useImageAttachments();

  // 등록 가능: 제목·본문 모두 공백 아님 + 전송 중 아님.
  const canSubmit =
    title.trim().length > 0 && body.trim().length > 0 && !submitting;
  // 한 글자라도 적었거나 이미지를 담았으면 "작성 중" → 닫기 시 이탈 가드를 띄운다.
  const isDirty =
    title.trim().length > 0 ||
    body.trim().length > 0 ||
    tags.length > 0 ||
    attachments.length > 0;

  // 태그 입력칸이 펼쳐지면 바로 입력할 수 있게 포커스를 옮긴다.
  useEffect(() => {
    if (tagsOpen) tagInputRef.current?.focus();
  }, [tagsOpen]);

  function toggleTags() {
    // 토글: 열려 있으면 접고, 닫혀 있으면 펼친다(펼침 시 effect가 입력칸에 포커스).
    setTagsOpen((open) => !open);
  }

  function addTag(raw: string) {
    // 앞쪽 # 제거 + 공백 정리. 빈 값/중복은 무시, 한도 초과는 토스트로 알린다.
    const name = raw.trim().replace(/^#+/, "").trim();
    if (!name) return;
    if (tags.length >= MAX_TAGS) {
      toast.show(`태그는 최대 ${MAX_TAGS}개까지 추가할 수 있어요`);
      return;
    }
    if (name.length > MAX_TAG_LENGTH) {
      toast.show(`태그는 ${MAX_TAG_LENGTH}자 이내로 입력해주세요`);
      return;
    }
    if (tags.includes(name)) {
      setTagInput("");
      return;
    }
    setTags((prev) => [...prev, name]);
    setTagInput("");
  }

  function handleTagChange(value: string) {
    // 스페이스가 구분자 — 공백을 만나면 앞 토큰들을 칩으로 확정하고 마지막(미완성)만 입력에 남긴다.
    // keydown 대신 값 변화로 처리해 한글 조합(IME)·붙여넣기까지 안정적으로 분리한다.
    if (/\s/.test(value)) {
      const tokens = value.split(/\s+/);
      const remainder = tokens.pop() ?? "";
      tokens.forEach((token) => addTag(token));
      setTagInput(remainder);
      return;
    }
    setTagInput(value);
  }

  function handleTagKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // 엔터로도 칩 확정(한글 조합 확정 Enter는 제외). 빈 입력에서 Backspace는 마지막 칩 삭제.
    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      event.preventDefault();
      addTag(tagInput);
      return;
    }
    if (event.key === "Backspace" && tagInput === "" && tags.length > 0) {
      event.preventDefault();
      setTags((prev) => prev.slice(0, -1));
    }
  }

  function closeScreen() {
    // 화면을 떠나므로 로컬 첨부(미리보기 object URL)를 정리한다. 업로드 전이라 원격 자원은 없음.
    discardAll();
    // 네이티브 서브뷰(풀 웹뷰)면 CLOSE_SUBVIEW로 네이티브가 pop → 리스트 웹뷰로 복귀.
    if (isNativeBridgeAvailable()) {
      closeNativeSubview();
      return;
    }
    // 웹 단독: history가 있으면 뒤로, 없으면(딥링크 진입) 커뮤니티 목록으로.
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/community");
  }

  function requestClose() {
    if (isDirty) {
      setLeaveOpen(true);
      return;
    }
    closeScreen();
  }

  // 네이티브 뒤로가기 가드: 마운트 시 BACK_GUARD로 통지 → 네이티브가 직접 닫지 않고 BACK_PRESSED를 보낸다.
  // 작성 중이면 확인 다이얼로그, 아니면 닫기 → "계속 작성" 선택 시 CLOSE_SUBVIEW를 보내지 않아 화면 유지.
  useNativeBackHandler(requestClose);

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      // 지연 업로드: 작성 직전에만 ①②③(서명→ImageKit→등록) 실행 → 표시 순서대로 imageId 확보.
      const imageFileIdList = await uploadAll();
      console.info("[post-write] 이미지 등록 완료 imageFileIdList:", imageFileIdList);
      // ④ 게시글 생성. tags는 현재 /board 계약에 필드가 없어 전송하지 않는다(FIXME 참고).
      const created = await createPost({
        categoryId: DEFAULT_CATEGORY_ID,
        title: title.trim(),
        body: body.trim(),
        imageFileIdList,
      });
      // 여기 도달 = 생성 성공(2xx). created.id로 실제 추가 여부를 확인할 수 있다.
      console.info("[post-write] 게시글 생성 성공:", created);
      toast.show("게시글이 등록되었어요");
      // 성공일 때만 닫는다(closeScreen이 로컬 미리보기까지 정리).
      closeScreen();
    } catch (error) {
      // 실패 경로 — 절대 closeScreen()을 호출하지 않는다(화면 유지 = pop 안 됨).
      console.error("[post-write] 게시글 작성 실패:", error);
      // 인증 만료(401)면 네이티브 로그인 유도, 그 외(업로드/생성 실패)는 재시도 안내.
      if (error instanceof WriteRequestError && error.status === 401) {
        postToNative({ type: OutboundMessageType.AUTH_LOGIN_PROMPT });
        return;
      }
      toast.show("등록에 실패했어요. 잠시 후 다시 시도해주세요");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    // 키보드 위 '실제 보이는 영역'(visualViewport)에 핀되는 fixed 셸: 문서 전체 스크롤을 막고
    // (overflow-hidden) 헤더·하단 바를 고정, 가운데 본문만 내부 스크롤시킨다. dvh/fixed inset-0는 이
    // WKWebView에서 키보드가 떠도 즉시 안 줄어 하단 바가 키보드 뒤로 가려지므로, visualViewport top/height에
    // 직접 맞춰 하단 바를 항상 키보드 위에 떨어뜨린다.
    <div
      className="fixed left-0 right-0 flex flex-col overflow-hidden bg-[var(--bw-true-white)]"
      style={
        rect ? { top: rect.top, height: rect.height } : { top: 0, height: "100dvh" }
      }
    >
      {/* 앱바: 높이 44(h-11), 좌우 8(px-2). 우측 등록(텍스트 버튼). 닫기/취소는 네이티브 뒤로가기가
          BACK_PRESSED로 위임 → requestClose가 이탈 가드를 처리한다(웹 버튼 없음). */}
      <AppBarShell>
        {/* 가운데 타이틀 — 작성 맥락을 명확히. */}
        <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-base font-medium text-text-primary">
          글쓰기 (디자인 미적용 초안)
        </h1>

        <button
          type="button"
          onClick={() => void submit()}
          disabled={!canSubmit}
          className={cn(
            "ml-auto inline-flex h-10 items-center justify-center rounded-full px-3 text-base font-semibold",
            // 입력 완료: 브랜드 컬러(button/filled/default-bg). 미완: 비활성 텍스트.
            canSubmit ? "text-button-filled-default-bg" : "text-text-disabled",
          )}
        >
          등록
        </button>
      </AppBarShell>

      <main className="flex min-h-0 flex-1 flex-col">
        {/* 제목: 단행 입력 + 우측 글자수(n/45)로 한도를 자연 노출.
            헤더↔제목 간격 24(pt-6): 상세의 헤더→작성자 아이콘 간격(article pt-6)과 동일하게 맞춘다. */}
        <div className="flex items-center gap-2 px-4 pb-4 pt-6">
          {/* 폰트·색상은 상세 제목과 동일 토큰(Body M 16 medium / feed-card-body-title-text) → 입력=상세 미리보기. */}
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={TITLE_MAX_LENGTH}
            placeholder="제목을 입력하세요"
            aria-label="제목"
            className="min-w-0 flex-1 text-base font-medium text-feed-card-body-title-text outline-none placeholder:text-text-tertiary"
          />
          <span className="shrink-0 text-xs font-medium text-text-tertiary tabular-nums">
            {title.length}/{TITLE_MAX_LENGTH}
          </span>
        </div>

        {/* 본문: 남은 영역을 모두 채워 길게 쓰기 좋게. 상세 본문과 같은 Body S(14/21). */}
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={BODY_MAX_LENGTH}
          placeholder="자유롭게 이야기를 나눠보세요."
          aria-label="내용"
          // 폰트·색상은 상세 본문과 동일 토큰(Body S 14/21 / feed-card-body-text) → 입력=상세 미리보기.
          // 남은 영역을 채우되(flex-1) 내용이 길어지면 페이지가 아니라 textarea 내부만 스크롤(min-h-0 + overflow).
          className="mt-2 min-h-0 flex-1 resize-none overflow-y-auto overscroll-contain px-4 text-sm leading-[21px] text-feed-card-body-text outline-none placeholder:text-text-tertiary"
        />

        {/* 본문 글자수: 자신이 세는 본문 끝 우측에 둔다(상태값을 하단 액션 툴바와 분리). */}
        <span className="px-4 pb-3 pt-2 text-right text-xs font-medium text-text-tertiary tabular-nums">
          {body.length}/{BODY_MAX_LENGTH}
        </span>

        {/* 첨부 이미지 미리보기 — 가로 스크롤, ✕로 삭제. 등록 전엔 CDN 업로드 안 됨(지연 업로드).
            미리보기는 로컬 File의 object URL(blob:)이라 next/image가 아닌 img로 그린다. */}
        {attachments.length > 0 ? (
          <ul className="flex gap-2 overflow-x-auto px-4 pb-3">
            {attachments.map((image) => (
              <li key={image.localId} className="relative shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.preview}
                  alt="첨부 이미지 미리보기"
                  className="h-20 w-20 rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => remove(image.localId)}
                  aria-label="첨부 이미지 삭제"
                  className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {/* 태그 입력줄: 평소 숨김 → 하단 "태그" 버튼으로 펼친다(버튼 바로 위에 등장).
            상세가 본문 뒤에 태그를 두므로, 작성도 본문 아래·툴바 위에 배치해 위치 모델을 일치시킨다.
            입력 UX는 설명 없이 익히게 한다: 예시형 플레이스홀더(#드릴 #스파링)로 형식을 보이고,
            스페이스를 치면 즉시 #칩으로 바뀌어(즉각 피드백) 구분 규칙을 스스로 깨닫게 한다.
            칩은 탭하면 삭제(✕). */}
        {tagsOpen ? (
          <div className="flex flex-wrap items-center gap-2 px-4 pb-4">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                aria-label={`태그 ${tag} 삭제`}
                className="inline-flex items-center gap-1 rounded-full bg-[#F2F2F2] py-1 pl-2.5 pr-2 text-xs font-medium text-text-secondary"
              >
                #{tag}
                <span aria-hidden className="text-text-tertiary">
                  ✕
                </span>
              </button>
            ))}
            {tags.length < MAX_TAGS ? (
              <input
                ref={tagInputRef}
                value={tagInput}
                onChange={(event) => handleTagChange(event.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => addTag(tagInput)}
                maxLength={MAX_TAG_LENGTH}
                placeholder={tags.length === 0 ? "#드릴 #스파링" : ""}
                aria-label="태그 입력"
                className="min-w-[80px] flex-1 text-sm text-text-primary outline-none placeholder:text-text-tertiary"
              />
            ) : null}
          </div>
        ) : null}
      </main>

      {/* 하단 툴바: 사진·태그 입력 보조 액션 전용. 셸의 마지막 자식이라 항상 바닥(=키보드 위)에 붙는다.
          평소엔 safe-area bottom(홈 인디케이터)까지 칠하지만, 키보드가 떠 있는 동안엔 그 영역이 키보드에
          가려 의미가 없으므로 패딩을 0으로 줘 바를 키보드에 딱 붙인다(overlay 모드의 잔여 여백 제거). */}
      <div
        className={cn(
          "shrink-0 border-t border-border-subtle bg-[var(--bw-true-white)]",
          rect?.keyboardOpen ? "pb-0" : "pb-[env(safe-area-inset-bottom)]",
        )}
      >
        {/* 사진 첨부 · 태그 추가. 아이콘 + 텍스트 라벨로 의미를 명시.
            버튼: 아이콘24 ↔ 텍스트(Body S) 간격 12(gap-3), 좌우 여백 8(px-2). */}
        <div className="flex h-[52px] items-center px-2">
          {/* 숨겨진 표준 file input — 웹뷰가 탭 시 네이티브 사진/카메라 피커를 열고 File을 돌려준다.
              사진 버튼이 이 input을 click()으로 연다(버튼 탭 = 사용자 제스처).
              남은 슬롯이 1장이면 단일 선택으로 전환 → 마지막 한 장에서 초과 선택→잘림을 줄인다.
              (웹 표준상 "최대 N장" 지정은 불가 — 2장 이상 남았을 때의 초과분은 훅이 잘라내고 토스트) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={remaining > 1}
            onChange={onFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={pick}
            disabled={!canAddMore}
            className="inline-flex h-9 items-center gap-3 rounded-full px-2 text-text-secondary disabled:text-text-disabled"
          >
            {/* 사진 첨부(최대 3장). 등록 전까진 로컬 보관 → 등록 시점에만 CDN 업로드. */}
            <ImageIcon size={24} />
            {/* 제목/본문의 n/max 카운터와 같은 어휘로 한도(최대 3장)를 자연스럽게 노출. */}
            <span className="flex items-center gap-1 text-sm font-medium">
              사진
              <span className="text-xs text-text-tertiary tabular-nums">
                {attachments.length}/{MAX_IMAGES}
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={toggleTags}
            aria-expanded={tagsOpen}
            className="inline-flex h-9 items-center gap-3 rounded-full px-2 text-text-secondary"
          >
            {/* 탭하면 본문 아래 태그 입력줄을 펼치고 포커스(평소 숨김). 다시 탭하면 접는다. */}
            <HashIcon size={24} />
            <span className="text-sm font-medium">태그</span>
          </button>
        </div>
      </div>

      {/* 작성 이탈 가드 — 내용이 있을 때만 확인. */}
      <ConfirmDialog
        open={leaveOpen}
        title="작성 취소"
        message="작성 중인 내용은 저장되지 않아요."
        cancelText="계속 작성"
        confirmText="나가기"
        destructive
        onCancel={() => setLeaveOpen(false)}
        onConfirm={() => {
          setLeaveOpen(false);
          closeScreen();
        }}
      />
    </div>
  );
}
