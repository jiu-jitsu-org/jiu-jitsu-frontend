"use client";

import { AppBarShell } from "@/features/community/presentation/app-bar-shell";
import { closeDetail } from "@/features/community/presentation/close-detail";
import { OpenInAppBanner } from "@/features/community/presentation/open-in-app-banner";
import { shareCurrentPage } from "@/features/community/presentation/share-current-page";
import { useIsExternalBrowser } from "@/shared/lib/native-bridge";
import { IconButton } from "@/shared/ui/icon-button";
import { BackArrowIcon, ShareIcon } from "@/shared/ui/icons";

/**
 * 대회 상세 머리 (#361 · #369) — 게시글 상세와 같은 앱바: 왼쪽 뒤로 가기, 오른쪽 공유.
 *
 * 공유는 게시글과 같은 길(shareCurrentPage — OS 공유 시트 → 앱 브릿지 → 링크 복사)이다.
 * 앱 밖 브라우저(공유 링크로 들어온 사람)는 앱바 대신 '앱으로 보기' 배너다 — 게시글 상세와 같다(#72).
 */
export function CompetitionDetailHeader() {
  const externalBrowser = useIsExternalBrowser();
  if (externalBrowser) return <OpenInAppBanner />;

  return (
    <AppBarShell>
      <IconButton onClick={closeDetail} aria-label="뒤로 가기">
        <BackArrowIcon size={24} />
      </IconButton>
      <IconButton
        onClick={() => void shareCurrentPage()}
        aria-label="대회 공유하기"
        className="ml-auto"
      >
        <ShareIcon size={24} />
      </IconButton>
    </AppBarShell>
  );
}
