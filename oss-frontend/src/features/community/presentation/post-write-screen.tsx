"use client";

import { useRouter } from "next/navigation";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";

import { cn } from "@/shared/lib/cn";
import {
  closeNativeSubview,
  isNativeBridgeAvailable,
} from "@/shared/lib/native-bridge";
import { ConfirmDialog, useToast } from "@/shared/ui";
import { HashIcon, ImageIcon } from "@/shared/ui/icons";

/** 본문 최대 글자 수. 카운터/입력 제한 단일 출처. */
const BODY_MAX_LENGTH = 800;
/** 제목 최대 글자 수. */
const TITLE_MAX_LENGTH = 45;
/** 태그 최대 개수. */
const MAX_TAGS = 10;
/** 태그 1개 최대 글자 수. */
const MAX_TAG_LENGTH = 20;

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
 * FIXME(API): 생성 엔드포인트(POST /api/community/posts)와 이미지 업로드 계약 미확정.
 *   확정 시 submit에서 { title, body, tags, imageIds } 전송 → 생성된 글 id로 이동.
 */
export function PostWriteScreen() {
  const router = useRouter();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  // 태그: 평소 숨김(tagsOpen=false) → 하단 "태그" 버튼으로 펼친다(progressive disclosure).
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tagsOpen, setTagsOpen] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  // 등록 가능: 제목·본문 모두 공백 아님 + 전송 중 아님.
  const canSubmit =
    title.trim().length > 0 && body.trim().length > 0 && !submitting;
  // 한 글자라도 적었으면 "작성 중" → 닫기 시 이탈 가드를 띄운다.
  const isDirty =
    title.trim().length > 0 || body.trim().length > 0 || tags.length > 0;

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

  function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      // FIXME(API): 실제 생성 POST로 교체. 성공 시 생성된 게시글 상세로 이동(현재는 진입 지점으로 복귀).
      toast.show("게시글이 등록되었어요");
      closeScreen();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bw-true-white)]">
      {/* 앱바: 높이 44(h-11), 좌우 8(px-2). 좌측 닫기, 우측 등록(텍스트 버튼). */}
      <header className="sticky top-0 z-30 flex h-11 items-center bg-[var(--bw-true-white)] px-2">
        {/* 좌측 "취소": 보조 동작이라 연한 회색(text-secondary)으로 빼 주동작 "등록"과 위계를 둔다. */}
        <button
          type="button"
          onClick={requestClose}
          className="inline-flex h-10 items-center justify-center px-1 text-base text-text-secondary"
        >
          취소
        </button>

        {/* 가운데 타이틀 — 작성 맥락을 명확히. */}
        <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-base font-medium text-text-primary">
          글쓰기 (디자인 미적용 초안)
        </h1>

        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className={cn(
            "ml-auto inline-flex h-10 items-center justify-center rounded-full px-3 text-base font-semibold",
            // 입력 완료: 브랜드 컬러(button/filled/default-bg). 미완: 비활성 텍스트.
            canSubmit ? "text-button-filled-default-bg" : "text-text-disabled",
          )}
        >
          등록
        </button>
      </header>

      <main className="flex flex-1 flex-col">
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
          className="mt-2 flex-1 resize-none px-4 text-sm leading-[21px] text-feed-card-body-text outline-none placeholder:text-text-tertiary"
        />

        {/* 본문 글자수: 자신이 세는 본문 끝 우측에 둔다(상태값을 하단 액션 툴바와 분리). */}
        <span className="px-4 pb-3 pt-2 text-right text-xs font-medium text-text-tertiary tabular-nums">
          {body.length}/{BODY_MAX_LENGTH}
        </span>

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

      {/* 하단 툴바: 사진·태그 입력 보조 액션 전용. safe-area bottom까지 같은 배경으로.
          키보드 추적은 JS로 억지로 하지 않는다 — 네이티브 웹뷰가 키보드만큼 리사이즈하면
          sticky bottom-0가 자연히 키보드 상단에 붙는다(가장 안정적). */}
      <div className="sticky bottom-0 border-t border-border-subtle bg-[var(--bw-true-white)] pb-[env(safe-area-inset-bottom)]">
        {/* 사진 첨부 · 태그 추가. 아이콘 + 텍스트 라벨로 의미를 명시.
            버튼: 아이콘24 ↔ 텍스트(Body S) 간격 12(gap-3), 좌우 여백 8(px-2). */}
        <div className="flex h-[52px] items-center px-2">
          <button
            type="button"
            className="inline-flex h-9 items-center gap-3 rounded-full px-2 text-text-secondary"
          >
            {/* FIXME(API): 이미지 선택/업로드 미구현(네이티브 피커 or 웹 input[file] 결정 후 연결). */}
            <ImageIcon size={24} />
            <span className="text-sm font-medium">사진</span>
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
        title="작성을 취소할까요?"
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
