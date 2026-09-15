"use client";

import { useRouter } from "next/navigation";
import {
  type ClipboardEvent,
  type KeyboardEvent,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";

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
  RetryIcon,
  TagIcon,
} from "@/shared/ui/icons";

import {
  createPost,
  WriteRequestError,
} from "./community-write-client";
import { markPostCreated } from "@/features/community/presentation/dirty-posts";
import { useAutoResizeTextarea } from "./use-auto-resize-textarea";
import { MAX_IMAGES, useImageAttachments } from "./use-image-attachments";

/** 본문 글자 수 범위(10~800). 최대는 카운터/입력 제한, 최소는 등록 조건의 단일 출처. */
const BODY_MIN_LENGTH = 10;
const BODY_MAX_LENGTH = 800;
/** 제목 글자 수 범위(2~45). */
const TITLE_MIN_LENGTH = 2;
const TITLE_MAX_LENGTH = 45;
/** 태그 최대 개수(정책). */
const MAX_TAGS = 3;
/** 태그 1개 최대 글자 수(정책). */
const MAX_TAG_LENGTH = 12;
/**
 * 태그에 허용되지 않는 문자(정책: 한글·영문·숫자만). 입력 단계에서 제거한다.
 * 완성형(가-힣) 외에 자모(ㄱ-ㅎ·ㅏ-ㅣ)도 허용해야 IME 조합 중인 글자가 지워지지 않는다.
 */
const TAG_DISALLOWED_PATTERN = /[^0-9a-zA-Z가-힣ㄱ-ㅎㅏ-ㅣ]/g;
/** 앱바 좌우 아이콘 버튼(뒤로가기·등록) 한 변(px). 이미지 뷰어 닫기(44)보다 작은 앱바용 크기. */
const APP_BAR_BUTTON_SIZE = 36;
/** 첨부 미리보기 썸네일 한 변(px). */
const THUMBNAIL_SIZE = 60;
/** 썸네일 우상단 삭제(✕) 원 지름(px). 썸네일 모서리에 반쯤 걸쳐 얹는다. */
const THUMBNAIL_REMOVE_SIZE = 22;
/** 썸네일 위 상태 표시(스피너·↻) 한 변(px). 60 썸네일 안에서 여백을 남기는 크기. */
const THUMBNAIL_STATUS_SIZE = 24;
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
 * 스크롤된다(첨부 썸네일은 본문과 태그 사이). 사진·태그 툴바만 바닥(=키보드 위)에 고정.
 *
 * compose 패턴:
 * - 우측 체크는 항상 활성(정책). 탭 시 카테고리 → 제목 → 본문 순으로 검사해 첫 미충족 항목만 토스트로
 *   알린다(비활성 방식 아님). 예외로 첨부 업로드 중/실패·전송 중에는 잠근다(사진 정책).
 * - 입력 중 뒤로가면 이탈 가드로 실수 유실을 막는다. 알럿 표면은 useNativeDialog가
 *   "네이티브 우선, 없으면 웹"으로 처리한다 — 무엇을 물어볼지·확인 후 무엇을 할지는 여기가 쥔다.
 *
 * 전 영역이 인터랙티브하고 등록 버튼이 입력 상태에 의존하므로(앱바↔본문 상태 공유),
 * 상세처럼 서버 레이아웃 + 클라이언트 leaf로 쪼개지 않고 하나의 클라이언트 화면으로 둔다.
 *
 * 작성 흐름은 BFF에 연결돼 있다: 사진을 고르는 즉시 장별로 ①②③(서명→ImageKit→등록)을 태워
 * imageFileIdList를 확보해 두고, ④ POST /api/community/board로 생성. categoryId는 헤더와 제목
 * 사이의 카테고리 칩에서 사용자가 고른 값을 전송하며, 미선택이면 등록 탭 시 토스트로 막는다. 남은 공백:
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
  // 태그: 본문(→사진) 아래 "# 태그" 줄. 태그가 없으면 영역 자체가 없고(정책), 하단 "태그" 버튼으로 연다.
  // tagAreaOpen = 버튼으로 열어둔 상태. 태그가 하나라도 있으면 열림 여부와 무관하게 보인다.
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tagAreaOpen, setTagAreaOpen] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const isTagAreaVisible = tagAreaOpen || tags.length > 0;
  // 제목·본문은 내용만큼 자라는 textarea — 화면(main) 하나가 스크롤되는 디자인.
  const titleRef = useAutoResizeTextarea(title);
  const bodyRef = useAutoResizeTextarea(body);

  // 이미지 첨부(선택 즉시 장별 업로드 — 썸네일마다 업로드 중/실패/완료 상태를 따로 가진다).
  // 선택은 표준 <input type=file> — 웹뷰가 네이티브 피커를 띄우고 웹에 File을 돌려준다.
  const {
    attachments,
    canAddMore,
    remaining,
    isUploadSettled,
    imageFileIdList,
    fileInputRef,
    onFileChange,
    pick,
    retry,
    remove,
    discardAll,
  } = useImageAttachments();

  // 등록 버튼은 입력 충족 여부로 잠그지 않는다(정책: 항상 활성, 탭 시 검사 → 토스트). 잠그는 경우는 둘뿐:
  // 첨부 업로드 중/실패가 남아 있을 때(사진 정책 — 재시도 또는 ✕ 삭제 후 풀림)와 전송 중.
  const isSubmitLocked = !isUploadSettled || submitting;
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
    // 하단 "태그" 버튼: 영역이 닫혀 있으면 먼저 열고(#가 자동으로 보이는 상태) 입력칸으로 포커스.
    // 입력칸은 열린 뒤에야 마운트되므로 flushSync로 즉시 그린 다음 같은 탭 제스처 안에서 focus한다
    // (WKWebView는 사용자 제스처 밖의 focus로는 키보드를 띄우지 않는다).
    // 본문을 길게 쓴 뒤엔 화면 밖일 수 있어 보이게 스크롤한 뒤 포커스.
    flushSync(() => setTagAreaOpen(true));
    tagInputRef.current?.scrollIntoView({ block: "nearest" });
    tagInputRef.current?.focus();
  }

  /** 저장 정규화(정책): 허용 문자만 남기고 앞뒤 공백 제거 + 영문 소문자 통일. 빈 문자열이면 확정 대상 아님. */
  function normalizeTag(raw: string): string {
    return raw.replace(TAG_DISALLOWED_PATTERN, "").trim().toLowerCase();
  }

  /**
   * 태그 1개 확정. 정규화 후 빈 값·중복은 조용히 무시, 개수/글자 수 초과는 토스트.
   * 확정에 실패해도 입력은 지우지 않아(개수 초과) 사용자가 앞 태그를 지우고 다시 확정할 수 있다.
   */
  function addTag(raw: string): boolean {
    const name = normalizeTag(raw);
    if (!name) {
      setTagInput("");
      return false;
    }
    if (tags.includes(name)) {
      setTagInput("");
      return false;
    }
    if (tags.length >= MAX_TAGS) {
      toast.show(`태그는 최대 ${MAX_TAGS}개까지 추가할 수 있어요`);
      return false;
    }
    if (name.length > MAX_TAG_LENGTH) {
      toast.show(`태그는 ${MAX_TAG_LENGTH}자까지 입력할 수 있어요`);
      return false;
    }
    setTags((prev) => [...prev, name]);
    setTagInput("");
    return true;
  }

  function handleTagChange(value: string) {
    // 스페이스가 구분자 — 공백을 만나면 앞 토큰들을 확정하고 마지막(미완성)만 입력에 남긴다.
    // keydown 대신 값 변화로 처리해 한글 조합(IME)·붙여넣기까지 안정적으로 분리한다.
    if (/\s/.test(value)) {
      const tokens = value.split(/\s+/);
      const remainder = tokens.pop() ?? "";
      tokens.forEach((token) => addTag(token));
      setTagInput(sanitizeTagInput(remainder));
      return;
    }
    setTagInput(sanitizeTagInput(value));
  }

  /** 입력 단계 제한: 허용 문자 외(사용자가 직접 친 # 포함)는 지우고, 글자 수 초과는 잘라내며 토스트. */
  function sanitizeTagInput(value: string): string {
    const allowed = value.replace(TAG_DISALLOWED_PATTERN, "");
    if (allowed.length > MAX_TAG_LENGTH) {
      toast.show(`태그는 ${MAX_TAG_LENGTH}자까지 입력할 수 있어요`);
      return allowed.slice(0, MAX_TAG_LENGTH);
    }
    return allowed;
  }

  function handleTagKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // 엔터로도 확정(한글 조합 확정 Enter는 제외).
    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      event.preventDefault();
      addTag(tagInput);
      return;
    }
    // 빈 입력에서 Backspace: 직전 태그 삭제 → 태그가 하나도 없으면 영역 자체를 닫는다(정책: 모두 지우면 영역 제거).
    if (event.key === "Backspace" && tagInput === "") {
      event.preventDefault();
      if (tags.length > 0) {
        setTags((prev) => prev.slice(0, -1));
        return;
      }
      setTagAreaOpen(false);
    }
  }

  function closeScreen() {
    // 화면을 떠나므로 로컬 첨부(미리보기 object URL)를 정리한다(원격 TEMP 이미지 정리는 훅 FIXME 참고).
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

  /**
   * 등록 탭 시 검사(정책): 카테고리 → 제목 → 본문 순, 첫 번째 미충족 항목의 안내만 돌려준다.
   * 최대(45/800)는 maxLength가 입력 단계에서 막으므로 여기서 다시 보지 않는다.
   */
  function findValidationMessage(): string | null {
    if (categoryId === null) return "카테고리를 선택해주세요.";
    if (title.trim().length < TITLE_MIN_LENGTH) {
      return `제목을 ${TITLE_MIN_LENGTH}자 이상 입력해주세요.`;
    }
    if (body.trim().length < BODY_MIN_LENGTH) {
      return `내용을 ${BODY_MIN_LENGTH}자 이상 입력해주세요.`;
    }
    return null;
  }

  /**
   * 붙여넣기 초과 안내(정책): maxLength가 최대치까지만 반영하므로 잘리는지 여기서 미리 계산해 토스트만 띄운다.
   * 직접 타이핑은 한도에서 막히고 카운터가 red로 바뀔 뿐 토스트 없음 — onChange가 아닌 onPaste에만 거는 이유.
   */
  function notifyIfPasteOverflows(
    event: ClipboardEvent<HTMLTextAreaElement>,
    max: number,
    message: string,
  ) {
    const field = event.currentTarget;
    const pasted = event.clipboardData.getData("text");
    const selected = field.selectionEnd - field.selectionStart;
    if (field.value.length - selected + pasted.length > max) {
      toast.show(message);
    }
  }

  async function submit() {
    if (isSubmitLocked) return;
    const validationMessage = findValidationMessage();
    if (validationMessage !== null) {
      // 토스트는 나중 것이 이전 것을 덮는다(ToastProvider.show) — 연타해도 마지막 안내만 보인다.
      toast.show(validationMessage);
      return;
    }
    if (categoryId === null) return;
    setSubmitting(true);
    // 확정되지 않은 입력 중인 태그는 등록 시 자동 확정(정책). tags는 아직 전송 필드가 없어 상태만 맞춘다.
    if (tagInput) addTag(tagInput);
    try {
      // 이미지는 고를 때 이미 ①②③을 마쳤고 isSubmitLocked가 전 장 done을 보장하므로 표시 순서 imageId를 그대로 보낸다.
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
      // 인증 만료(401)면 네이티브 로그인 유도, 그 외(생성 실패)는 재시도 안내.
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
          disabled={isSubmitLocked}
          aria-label="등록"
          style={{ width: APP_BAR_BUTTON_SIZE, height: APP_BAR_BUTTON_SIZE }}
          className={cn(
            "ml-auto inline-flex items-center justify-center rounded-[10px] transition-colors",
            // 기본은 브랜드 채움(button/filled) — 입력 미충족이어도 활성으로 보이고 탭 시 토스트.
            // 첨부 업로드 중/실패·전송 중에만 비활성 채움 + 비활성 아이콘.
            isSubmitLocked
              ? "bg-button-filled-disabled-bg text-button-filled-disabled-text"
              : "bg-button-filled-default-bg text-button-filled-default-text active:bg-button-filled-pressed-bg",
          )}
        >
          <CheckIcon size={24} />
        </button>
      </AppBarShell>

      {/* 카테고리 선택: 헤더 바로 아래 가로 스크롤 칩(필수값 — 미선택이면 등록 탭 시 토스트).
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
        {/* 제목: Title 1(22/32 semibold), 여러 줄 허용(45자). 카테고리↔제목 간격 24(mt-6).
            첫 진입 시 제목에 자동 포커스 → 바로 타이핑 시작(정책). 키보드가 함께 올라오려면 WKWebView가
            사용자 제스처 없는 focus를 허용해야 한다(keyboardDisplayRequiresUserAction = false).
            FIXME: 앱에서 진입 시 키보드가 안 뜨면 iOS 쪽 위 설정 확인 — 웹에서는 autoFocus 이상 할 수 없다. */}
        <textarea
          ref={titleRef}
          autoFocus
          value={title}
          onChange={(event) => handleTitleChange(event.target.value)}
          onKeyDown={handleTitleKeyDown}
          onPaste={(event) =>
            notifyIfPasteOverflows(
              event,
              TITLE_MAX_LENGTH,
              `제목은 ${TITLE_MAX_LENGTH}자까지 입력할 수 있어요.`,
            )
          }
          maxLength={TITLE_MAX_LENGTH}
          rows={1}
          placeholder="제목을 입력해주세요"
          aria-label="제목"
          className="mt-6 w-full resize-none overflow-hidden text-title-1 text-text-primary outline-none placeholder:text-text-tertiary"
        />
        <CharCounter length={title.length} max={TITLE_MAX_LENGTH} />

        {/* 본문: Title 3(18/28 semibold), 800자. 카운터 아래 8. */}
        <textarea
          ref={bodyRef}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onPaste={(event) =>
            notifyIfPasteOverflows(
              event,
              BODY_MAX_LENGTH,
              `내용은 ${BODY_MAX_LENGTH}자까지 입력할 수 있어요.`,
            )
          }
          maxLength={BODY_MAX_LENGTH}
          rows={1}
          placeholder="내용을 입력해주세요"
          aria-label="내용"
          className="mt-2 w-full resize-none overflow-hidden text-title-3 text-text-primary outline-none placeholder:text-text-tertiary"
        />
        <CharCounter length={body.length} max={BODY_MAX_LENGTH} />

        {/* 첨부 이미지 미리보기 — 본문 → 사진 → 태그 순서 고정(정책). 가로 나열, 썸네일 60 + 우상단 ✕(즉시
            삭제, 확인 없음 — 업로드 중에도 가능). ✕가 썸네일 밖으로 나가므로 위쪽 여백(pt-3)을 둬 스크롤
            컨테이너에 잘리지 않게 하고, main의 px-4를 -mx-4/px-4로 되돌려 마지막 썸네일의 ✕도 오른쪽 패딩
            안에 들어오게 한다. 미리보기는 로컬 File의 object URL(blob:)이라 next/image가 아닌 img로 그린다.
            상태별 표시(정책): 업로드 중 = 흐림(white-60 스크림) + 스피너, 실패 = 흐림 + ↻(탭 = 그 장만 재업로드),
            완료 = 원본. 썸네일 자체를 버튼으로 두되 실패일 때만 탭이 의미를 가진다. */}
        {attachments.length > 0 ? (
          <ul className="-mx-4 mt-2 flex gap-4 overflow-x-auto px-4 pt-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {attachments.map((image) => {
              const isFailed = image.status === "failed";
              const isUploading = image.status === "uploading";
              return (
                <li key={image.localId} className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => retry(image.localId)}
                    disabled={!isFailed}
                    aria-label={
                      isFailed
                        ? "업로드 실패한 이미지 다시 올리기"
                        : isUploading
                          ? "이미지 업로드 중"
                          : "첨부 이미지"
                    }
                    aria-busy={isUploading}
                    style={{ width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE }}
                    className="relative block overflow-hidden rounded-lg"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.preview}
                      alt=""
                      style={{ width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE }}
                      className="object-cover"
                    />
                    {image.status !== "done" ? (
                      <span className="absolute inset-0 flex items-center justify-center bg-[var(--opacity-white-60)] text-icon-on-overlay">
                        {isFailed ? (
                          <RetryIcon size={THUMBNAIL_STATUS_SIZE} />
                        ) : (
                          <span
                            style={{
                              width: THUMBNAIL_STATUS_SIZE,
                              height: THUMBNAIL_STATUS_SIZE,
                            }}
                            className="animate-spin rounded-full border-2 border-current border-t-transparent"
                          />
                        )}
                      </span>
                    ) : null}
                  </button>
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
              );
            })}
          </ul>
        ) : null}

        {/* 태그 입력줄: 본문 → 사진 → 태그 순서(정책). 태그가 없으면 영역이 없고, 하단 "태그" 버튼으로 열면
            "#"이 자동으로 앞에 붙은 입력칸이 나타난다(사용자는 태그명만 친다). 스페이스/엔터로 확정 → 다음 "#"이
            자동 생성되며, 확정 태그는 "# 이름" 평문(브랜드 텍스트 컬러). 탭해도 아무 일 없음 — 태그 검색 화면이
            1차 범위 밖이라 표시 전용(정책 미결). "#"은 포커스 중엔 입력 텍스트와 같은 색, 아니면 secondary. */}
        {isTagAreaVisible ? (
          <div
            className="group mt-4 flex flex-wrap items-center gap-2"
            // 줄 아무 데나 탭해도 입력칸으로 포커스(입력칸이 짧아 맞추기 어려움).
            onClick={() => tagInputRef.current?.focus()}
          >
            {tags.map((tag) => (
              <span key={tag} className="text-body-s text-primary-text-subtle">
                # {tag}
              </span>
            ))}
            <span className="flex flex-1 items-center gap-1 text-body-s">
              <span
                aria-hidden
                className="text-text-secondary group-focus-within:text-primary-text-subtle"
              >
                #
              </span>
              <input
                ref={tagInputRef}
                value={tagInput}
                onChange={(event) => handleTagChange(event.target.value)}
                onKeyDown={handleTagKeyDown}
                aria-label="태그 입력"
                className="min-w-[80px] flex-1 text-body-s text-primary-text-subtle outline-none"
              />
            </span>
          </div>
        ) : null}

        {/* 안내문: Label M, tertiary. "커뮤니티 제한 사항"은 밑줄(디자인) — 연결 문서 확정 시 링크로 교체.
            FIXME: 커뮤니티 이용 제한 정책 페이지가 /policies에 아직 없다 — 페이지 생기면 <a href>로 연결. */}
        <p className="mt-4 text-label-m text-text-tertiary">
          <span className="underline">커뮤니티 제한 사항</span> 위반 시 삭제될 수
          있습니다.
        </p>
      </main>

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
          {/* 사진 첨부(최대 MAX_IMAGES장). 한도에 닿으면 비활성 — 고르는 즉시 장별로 CDN 업로드가 시작된다. */}
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

      {/* 등록 진행 오버레이 — 게시글 생성 중(submitting) 전 영역을 덮어 입력/버튼 재탭을 막고
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
 * 글자 수 카운터(n/max) — 자신이 세는 입력칸 바로 아래 우측, 항상 노출(정책).
 *
 * 한도에 닿으면 error 색으로 바꿔 "더 못 치는 이유"를 즉시 알린다(maxLength가 조용히 입력을 막는 걸 보완).
 */
function CharCounter({ length, max }: { length: number; max: number }) {
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
