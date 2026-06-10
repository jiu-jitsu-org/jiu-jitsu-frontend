"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
 *   확정 시 submit에서 { title, body, imageIds } 전송 → 생성된 글 id로 이동.
 */
export function PostWriteScreen() {
  const router = useRouter();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  // 등록 가능: 제목·본문 모두 공백 아님 + 전송 중 아님.
  const canSubmit =
    title.trim().length > 0 && body.trim().length > 0 && !submitting;
  // 한 글자라도 적었으면 "작성 중" → 닫기 시 이탈 가드를 띄운다.
  const isDirty = title.trim().length > 0 || body.trim().length > 0;

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
          className="mt-2 flex-1 resize-none px-4 pb-4 text-sm leading-[21px] text-feed-card-body-text outline-none placeholder:text-text-tertiary"
        />
      </main>

      {/* 하단 툴바: 좌측 사진 첨부, 우측 본문 글자수. safe-area bottom까지 같은 배경으로. */}
      <div className="sticky bottom-0 border-t border-border-subtle bg-[var(--bw-true-white)] pb-[env(safe-area-inset-bottom)]">
        <div className="flex h-[52px] items-center justify-between px-2 pr-4">
          {/* 좌측 입력 보조 액션 묶음: 사진 첨부 · 태그 추가. 아이콘 + 텍스트 라벨로 의미를 명시.
              버튼: 아이콘24 ↔ 텍스트(Body S) 간격 12(gap-3), 좌우 여백 8(px-2). */}
          <div className="flex items-center">
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
              className="inline-flex h-9 items-center gap-3 rounded-full px-2 text-text-secondary"
            >
              {/* FIXME(API): 태그 입력(칩 추가/삭제) 미구현 — 입력 UI 확정 후 연결. */}
              <HashIcon size={24} />
              <span className="text-sm font-medium">태그</span>
            </button>
          </div>
          <span className="text-xs font-medium text-text-tertiary tabular-nums">
            {body.length}/{BODY_MAX_LENGTH}
          </span>
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
