"use client";

import { useRouter } from "next/navigation";
import { type KeyboardEvent, useRef, useState } from "react";

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
import { useNativeDialog } from "@/features/community/presentation/use-native-dialog";
import {
  BackArrowIcon,
  CheckIcon,
  CloseIcon,
  ImageIcon,
  TagIcon,
} from "@/shared/ui/icons";

import {
  createPost,
  WriteRequestError,
} from "./community-write-client";
import { markPostCreated } from "@/features/community/presentation/dirty-posts";
import { useAutoResizeTextarea } from "./use-auto-resize-textarea";
import { MAX_IMAGES, useImageAttachments } from "./use-image-attachments";

/** 본문 최대 글자 수. 카운터/입력 제한 단일 출처. */
const BODY_MAX_LENGTH = 800;
/** 제목 최대 글자 수. */
const TITLE_MAX_LENGTH = 45;
/** 태그 최대 개수. */
const MAX_TAGS = 10;
/** 태그 1개 최대 글자 수. */
const MAX_TAG_LENGTH = 20;
/** 앱바 좌우 아이콘 버튼(뒤로가기·등록) 한 변(px). 이미지 뷰어 닫기(44)보다 작은 앱바용 크기. */
const APP_BAR_BUTTON_SIZE = 36;
/** 첨부 미리보기 썸네일 한 변(px). */
const THUMBNAIL_SIZE = 60;
/** 썸네일 우상단 삭제(✕) 원 지름(px). 썸네일 모서리에 반쯤 걸쳐 얹는다. */
const THUMBNAIL_REMOVE_SIZE = 22;
/**
 * 게시글 카테고리 목록. 업스트림 카테고리 조회 응답(data) 기준 — 추후 API 조회로 대체 가능하나,
 * 고정 분류라 현재는 상수로 둔다. id는 POST /board의 필수 categoryId로 그대로 전송된다.
 */
const CATEGORIES: { id: number; name: string }[] = [
  { id: 1, name: "매트 위 수다" },
  { id: 2, name: "훈련 & 기술" },
  { id: 3, name: "도장" },
  { id: 4, name: "장비" },
  { id: 5, name: "대회" },
];

/**
 * 게시글 작성 화면 (클라이언트 화면 컴포넌트).
 *
 * 디자인: 44 앱바(좌 뒤로가기 tint 버튼 · 가운데 "글쓰기" · 우 체크 filled 버튼) → 카테고리 칩 가로
 * 스크롤 → 제목(Title 1) → 본문(Title 3) → "# 태그" 입력줄 → 안내문이 한 흐름으로 이어져 main 전체가
 * 스크롤된다. 첨부 썸네일 줄과 사진·태그 툴바는 바닥(=키보드 위)에 고정.
 *
 * compose 패턴:
 * - 우측 체크는 카테고리·제목·본문이 모두 채워지기 전엔 비활성(댓글 입력바의 canSubmit과 동일 철학).
 * - 입력 중 뒤로가면 이탈 가드로 실수 유실을 막는다. 알럿 표면은 useNativeDialog가
 *   "네이티브 우선, 없으면 웹"으로 처리한다 — 무엇을 물어볼지·확인 후 무엇을 할지는 여기가 쥔다.
 *
 * 전 영역이 인터랙티브하고 등록 버튼이 입력 상태에 의존하므로(앱바↔본문 상태 공유),
 * 상세처럼 서버 레이아웃 + 클라이언트 leaf로 쪼개지 않고 하나의 클라이언트 화면으로 둔다.
 *
 * 작성 흐름은 BFF에 연결돼 있다: ①②③(서명→ImageKit→등록)으로 imageFileIdList 확보 후
 * ④ POST /api/community/board로 생성. categoryId는 헤더와 제목 사이의 카테고리 칩에서
 * 사용자가 고른 값을 전송하며, 미선택이면 등록을 비활성화한다(canSubmit). 남은 공백:
 * - tags: /board 계약에 태그 필드가 없어 입력은 받되 전송하지 않음(백엔드 확정 시 연결).
 */
export function PostWriteScreen() {
  const router = useRouter();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { confirm, dialog } = useNativeDialog();
  // 카테고리: 미선택(null)으로 시작 → 사용자가 칩에서 고르기 전엔 등록 불가.
  const [categoryId, setCategoryId] = useState<number | null>(null);
  // 키보드 위 '실제 보이는 영역'에 셸을 맞춘다(visualViewport). dvh/fixed inset-0가 안 줄어드는
  // WKWebView에서 입력 보조 바를 키보드 바로 위에 떨어뜨리는 유일하게 신뢰 가능한 기준.
  const rect = useViewportRect();
  // 태그: 본문 아래 "# 태그" 줄에 항상 노출. 하단 "태그" 버튼은 이 입력칸으로 포커스만 옮긴다.
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const tagInputRef = useRef<HTMLInputElement>(null);
  // 제목·본문은 내용만큼 자라는 textarea — 화면(main) 하나가 스크롤되는 디자인.
  const titleRef = useAutoResizeTextarea(title);
  const bodyRef = useAutoResizeTextarea(body);

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

  // 등록 가능: 카테고리 선택 + 제목·본문 모두 공백 아님 + 전송 중 아님.
  const canSubmit =
    categoryId !== null &&
    title.trim().length > 0 &&
    body.trim().length > 0 &&
    !submitting;
  // 한 글자라도 적었거나 카테고리/이미지를 골랐으면 "작성 중" → 닫기 시 이탈 가드를 띄운다.
  const isDirty =
    categoryId !== null ||
    title.trim().length > 0 ||
    body.trim().length > 0 ||
    tags.length > 0 ||
    attachments.length > 0;

  function handleTitleChange(value: string) {
    // 제목은 여러 줄로 보이되(자동 줄바꿈) 실제 줄바꿈 문자는 받지 않는다 — 붙여넣기의 개행은 공백으로.
    setTitle(value.replace(/\n/g, " "));
  }

  function handleTitleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // 제목에서 엔터 = 본문으로 이동(한글 조합 확정 Enter는 제외).
    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      event.preventDefault();
      bodyRef.current?.focus();
    }
  }

  function focusTagInput() {
    // 하단 "태그" 버튼: 입력줄이 본문 아래에 있어 길게 쓴 뒤엔 화면 밖일 수 있다 → 보이게 스크롤 후 포커스.
    tagInputRef.current?.scrollIntoView({ block: "nearest" });
    tagInputRef.current?.focus();
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

  async function requestClose() {
    if (isDirty) {
      const confirmed = await confirm({
        title: "작성 취소",
        message: "작성 중인 내용은 저장되지 않아요.",
        cancelText: "계속 작성",
        confirmText: "나가기",
        destructive: true,
      });
      // 취소("계속 작성")면 화면을 유지한다 — CLOSE_SUBVIEW를 보내지 않는다.
      if (!confirmed) return;
    }
    closeScreen();
  }

  // 네이티브 뒤로가기 가드: 마운트 시 BACK_GUARD로 통지 → 네이티브가 직접 닫지 않고 BACK_PRESSED를 보낸다.
  // 작성 중이면 확인 다이얼로그, 아니면 닫기 → "계속 작성" 선택 시 CLOSE_SUBVIEW를 보내지 않아 화면 유지.
  useNativeBackHandler(() => void requestClose());

  async function submit() {
    if (!canSubmit || categoryId === null) return;
    setSubmitting(true);
    try {
      // 지연 업로드: 작성 직전에만 ①②③(서명→ImageKit→등록) 실행 → 표시 순서대로 imageId 확보.
      const imageFileIdList = await uploadAll();
      console.info("[post-write] 이미지 등록 완료 imageFileIdList:", imageFileIdList);
      // ④ 게시글 생성. tags는 현재 /board 계약에 필드가 없어 전송하지 않는다(FIXME 참고).
      const created = await createPost({
        categoryId,
        title: title.trim(),
        body: body.trim(),
        imageFileIdList,
      });
      // 여기 도달 = 생성 성공(2xx). created.id로 실제 추가 여부를 확인할 수 있다.
      console.info("[post-write] 게시글 생성 성공:", created);
      // 목록이 복귀 시 첫 페이지를 다시 읽어 이 글을 앞에 붙이고 최상단으로 올린다(#38).
      // 성공했을 때만 남긴다 — 취소로 닫으면 목록은 아무것도 하지 않는다.
      markPostCreated(created.id);
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
      {/* 앱바: 높이 44(h-11), 좌우 8(px-2). 좌 뒤로가기(tint) · 가운데 "글쓰기" · 우 등록(filled 체크).
          두 아이콘 버튼 모두 36 정사각 + radius 10 — 이미지 뷰어 닫기 버튼과 같은 tint 어휘.
          뒤로가기는 웹 버튼과 네이티브 BACK_PRESSED 둘 다 requestClose로 모아 이탈 가드를 한 곳에서 처리한다. */}
      <AppBarShell>
        <button
          type="button"
          onClick={() => void requestClose()}
          aria-label="뒤로 가기"
          style={{ width: APP_BAR_BUTTON_SIZE, height: APP_BAR_BUTTON_SIZE }}
          className="inline-flex items-center justify-center rounded-[10px] bg-button-tint-default-bg text-button-tint-default-text active:bg-button-tint-pressed-bg"
        >
          <BackArrowIcon size={24} />
        </button>

        <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-button-m text-header-text">
          글쓰기
        </h1>

        <button
          type="button"
          onClick={() => void submit()}
          disabled={!canSubmit}
          aria-label="등록"
          style={{ width: APP_BAR_BUTTON_SIZE, height: APP_BAR_BUTTON_SIZE }}
          className={cn(
            "ml-auto inline-flex items-center justify-center rounded-[10px] transition-colors",
            // 입력 완료: 브랜드 채움(button/filled). 미완: 비활성 채움 + 비활성 아이콘.
            canSubmit
              ? "bg-button-filled-default-bg text-button-filled-default-text active:bg-button-filled-pressed-bg"
              : "bg-button-filled-disabled-bg text-button-filled-disabled-text",
          )}
        >
          <CheckIcon size={24} />
        </button>
      </AppBarShell>

      {/* 카테고리 선택: 헤더 바로 아래 가로 스크롤 칩(필수값 — 미선택이면 등록 비활성, canSubmit).
          칩은 tag-chip 토큰: 비선택 = 투명 배경 + 기본 외곽선, 선택 = surface-field 배경 + 진한 외곽선.
          좌우 16(px-4)·칩 간격 8(gap-2), 넘치면 가로 스크롤(스크롤바 숨김). 스크롤 영역 밖(shrink-0)에 둬
          본문을 아래로 길게 내려도 항상 헤더 아래 고정. */}
      <div className="flex shrink-0 gap-2 overflow-x-auto px-4 pt-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CATEGORIES.map((category) => {
          const selected = category.id === categoryId;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => setCategoryId(category.id)}
              aria-pressed={selected}
              className={cn(
                "inline-flex h-8 shrink-0 items-center rounded-full border px-3 text-button-s transition-colors",
                selected
                  ? "border-text-primary bg-tag-chip-selected-bg text-tag-chip-selected-text"
                  : "border-border-default bg-tag-chip-default-bg text-tag-chip-default-text",
              )}
            >
              {category.name}
            </button>
          );
        })}
      </div>

      {/* 본문 영역: 제목 → 본문 → 태그 → 안내문이 한 덩어리로 스크롤된다(main 내부 스크롤).
          제목·본문 textarea는 자동으로 자라므로 스크롤은 이 main에서만 일어난다. */}
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4 pb-6">
        {/* 제목: Title 1(22/32 semibold), 여러 줄 허용(45자). 카테고리↔제목 간격 24(mt-6). */}
        <textarea
          ref={titleRef}
          value={title}
          onChange={(event) => handleTitleChange(event.target.value)}
          onKeyDown={handleTitleKeyDown}
          maxLength={TITLE_MAX_LENGTH}
          rows={1}
          placeholder="제목을 입력해주세요"
          aria-label="제목"
          className="mt-6 w-full resize-none overflow-hidden text-title-1 text-text-primary outline-none placeholder:text-text-tertiary"
        />
        <CharCounter length={title.length} max={TITLE_MAX_LENGTH} />

        {/* 본문: Title 3(18/28 semibold), 800자. 제목↔본문 간격 24(카운터가 뜨면 카운터 아래 8). */}
        <textarea
          ref={bodyRef}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={BODY_MAX_LENGTH}
          rows={1}
          placeholder="내용을 입력해주세요"
          aria-label="내용"
          className={cn(
            "w-full resize-none overflow-hidden text-title-3 text-text-primary outline-none placeholder:text-text-tertiary",
            title.length > 0 ? "mt-2" : "mt-6",
          )}
        />
        <CharCounter length={body.length} max={BODY_MAX_LENGTH} />

        {/* 태그 입력줄: 본문 아래 항상 노출(상세가 본문 뒤에 "# 태그"를 두므로 위치 모델 일치).
            확정된 태그는 "# 이름"(브랜드 텍스트 컬러), 입력 중 텍스트도 같은 색 → 곧 태그가 될 것을 예고.
            비어 있으면 "#" 플레이스홀더만 남겨 형식을 보여준다. 스페이스/엔터로 칩 확정, 칩 탭 = 삭제. */}
        <div
          className="mt-4 flex flex-wrap items-center gap-2"
          // 줄 아무 데나 탭해도 입력칸으로 포커스(입력칸이 짧아 맞추기 어려움).
          onClick={() => tagInputRef.current?.focus()}
        >
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setTags((prev) => prev.filter((t) => t !== tag));
              }}
              aria-label={`태그 ${tag} 삭제`}
              className="text-body-s text-primary-text-subtle"
            >
              # {tag}
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
              placeholder={tags.length === 0 ? "#" : ""}
              aria-label="태그 입력"
              className="min-w-[80px] flex-1 text-body-s text-primary-text-subtle outline-none placeholder:text-text-secondary"
            />
          ) : null}
        </div>

        {/* 안내문: Label M, tertiary. "커뮤니티 제한 사항"은 밑줄(디자인) — 연결 문서 확정 시 링크로 교체.
            FIXME: 커뮤니티 이용 제한 정책 페이지가 /policies에 아직 없다 — 페이지 생기면 <a href>로 연결. */}
        <p className="mt-4 text-label-m text-text-tertiary">
          <span className="underline">커뮤니티 제한 사항</span> 위반 시 삭제될 수
          있습니다.
        </p>
      </main>

      {/* 첨부 이미지 미리보기 — 툴바 바로 위 고정, 가로 스크롤. 썸네일 60 + 우상단 ✕(모서리에 걸침).
          ✕가 썸네일 밖으로 나가므로 위쪽 여백(pt-3)을 둬 스크롤 컨테이너에 잘리지 않게 한다.
          등록 전엔 CDN 업로드 안 됨(지연 업로드). 미리보기는 로컬 File의 object URL(blob:)이라
          next/image가 아닌 img로 그린다. */}
      {attachments.length > 0 ? (
        <ul className="flex shrink-0 gap-4 overflow-x-auto px-4 pb-2 pt-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {attachments.map((image) => (
            <li key={image.localId} className="relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.preview}
                alt="첨부 이미지 미리보기"
                style={{ width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE }}
                className="rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() => remove(image.localId)}
                aria-label="첨부 이미지 삭제"
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
      ) : null}

      {/* 하단 툴바: 사진·태그 입력 보조 액션 전용. 셸의 마지막 자식이라 항상 바닥(=키보드 위)에 붙는다.
          디자인은 구분선 없이 두 액션을 좌·우 절반에 각각 가운데 정렬한다.
          평소엔 safe-area bottom(홈 인디케이터)까지 칠하지만, 키보드가 떠 있는 동안엔 그 영역이 키보드에
          가려 의미가 없으므로 패딩을 0으로 줘 바를 키보드에 딱 붙인다(overlay 모드의 잔여 여백 제거). */}
      <div
        className={cn(
          "shrink-0 bg-[var(--bw-true-white)]",
          rect?.keyboardOpen ? "pb-0" : "pb-[env(safe-area-inset-bottom)]",
        )}
      >
        <div className="grid h-[52px] grid-cols-2">
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
          {/* 사진 첨부(최대 MAX_IMAGES장). 한도에 닿으면 비활성 — 등록 전까진 로컬 보관, 등록 시점에만 CDN 업로드. */}
          <button
            type="button"
            onClick={pick}
            disabled={!canAddMore}
            aria-label={`사진 첨부 (최대 ${MAX_IMAGES}장)`}
            className="inline-flex items-center justify-center gap-3 text-text-secondary disabled:text-text-disabled"
          >
            <ImageIcon size={24} className="text-icon-secondary" />
            <span className="text-body-s">사진</span>
          </button>
          {/* 탭하면 본문 아래 "# 태그" 입력칸으로 포커스(필요하면 그 줄이 보이게 스크롤). */}
          <button
            type="button"
            onClick={focusTagInput}
            className="inline-flex items-center justify-center gap-3 text-text-secondary"
          >
            <TagIcon size={24} className="text-icon-secondary" />
            <span className="text-body-s">태그</span>
          </button>
        </div>
      </div>

      {/* 등록 진행 오버레이 — 업로드·생성 중(submitting) 전 영역을 덮어 입력/버튼 재탭을 막고
          (overlay가 포인터 이벤트를 가로챔) 중앙 스피너로 진행을 알린다. 앱바(z-30)까지 덮도록 z-50.
          스피너 색은 Color/Blue/600(--blue-600). */}
      {submitting ? (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-white/60"
          role="status"
          aria-live="polite"
          aria-label="게시글 등록 중"
        >
          <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-[var(--blue-600)] border-t-transparent" />
        </div>
      ) : null}

      {/* 작성 이탈 가드(웹 단독 폴백 전용 — 앱에서는 네이티브가 그린다) */}
      {dialog}
    </div>
  );
}

/**
 * 글자 수 카운터(n/max) — 자신이 세는 입력칸 바로 아래 우측.
 *
 * 비어 있으면 그리지 않는다(빈 화면에 숫자만 떠 있지 않게). 한도에 닿으면 error 색으로 바꿔
 * "더 못 치는 이유"를 즉시 알린다(maxLength가 조용히 입력을 막는 걸 보완).
 */
function CharCounter({ length, max }: { length: number; max: number }) {
  if (length === 0) return null;
  return (
    <span
      className={cn(
        "mt-1.5 text-right text-label-m tabular-nums",
        length >= max ? "text-error" : "text-text-tertiary",
      )}
    >
      {length}/{max}
    </span>
  );
}
