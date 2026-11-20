"use client";

import { AppBarShell } from "@/features/community/presentation/app-bar-shell";
import { closeDetail } from "@/features/community/presentation/close-detail";
import { SearchField } from "@/shared/ui";
import { IconButton } from "@/shared/ui/icon-button";
import { BackArrowIcon } from "@/shared/ui/icons";

/** 검색칸 안내 문구 — 무엇으로 찾는지(제목 · 내용 · 태그)를 바로 읽히게. */
const SEARCH_PLACEHOLDER = "제목 · 내용 · 태그로 찾기";

/**
 * 글 검색 앱바 (#591) — 뒤로가기 + 검색칸.
 *
 * 뒤로가기는 내 커뮤니티 활동 앱바와 같은 규격 · 같은 경로(closeDetail)다 — 앱은 홈 검색 버튼이 이 화면을
 * 서브뷰로 열어 네이티브가 팝하고, 웹 단독이면 히스토리를 되돌린다. 제목 대신 검색칸이 바를 채운다.
 * 검색칸은 공통 부품 SearchField(대회 이름 검색과 같은 모양)다.
 *
 * 엔터(키보드의 '검색')로 찾는다. 한글 조합 중의 엔터는 조합을 끝내는 데 쓰여 건너뛴다 — 조합이 끝난 뒤의
 * 엔터가 한 번 더 온다. 값은 입력칸에서 바로 읽는다(마지막 글자가 상태에 들어오기 전일 수 있다).
 *
 * showBack=false는 로딩 뼈대용 — 앱이 그동안 자기 비상용 뒤로가기를 띄워 둘이 겹쳐 보인다(알림함과 같은 이유, #452).
 * 자리는 남겨 검색칸이 같은 위치에 그려진다.
 */
export function PostSearchAppBar({
  value,
  onValueChange,
  onSubmit,
  autoFocus = false,
  showBack = true,
  disabled = false,
}: {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: (value: string) => void;
  autoFocus?: boolean;
  showBack?: boolean;
  disabled?: boolean;
}) {
  return (
    // 배경은 화면 바탕(피드와 같은 색)에 맞춘다 — 셸 기본(true white)이면 앱바 아래로 옅은 띠가 생긴다.
    <AppBarShell className="gap-1 bg-surface-container pr-4">
      {showBack ? (
        <IconButton data-ga="back" onClick={closeDetail} aria-label="뒤로 가기">
          <BackArrowIcon size={24} />
        </IconButton>
      ) : (
        <span aria-hidden className="size-10 shrink-0" />
      )}
      <form
        role="search"
        className="min-w-0 flex-1"
        onSubmit={(event) => event.preventDefault()}
      >
        <SearchField
          value={value}
          onValueChange={onValueChange}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
            onSubmit(event.currentTarget.value);
          }}
          autoFocus={autoFocus}
          disabled={disabled}
          placeholder={SEARCH_PLACEHOLDER}
          aria-label="글 검색어"
        />
      </form>
    </AppBarShell>
  );
}
