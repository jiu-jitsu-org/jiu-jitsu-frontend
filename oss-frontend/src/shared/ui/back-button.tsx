"use client";

import { useRouter } from "next/navigation";

import { BackArrowIcon } from "@/shared/ui/icons";

/**
 * 좌측 상단 뒤로가기 버튼 (개발용 테스트 페이지 전용).
 *
 * 개발용 테스트/플레이그라운드 페이지들이 진입 허브(메인 `/`)로 손쉽게 돌아오기 위한 버튼이다.
 * 이 페이지들은 네이티브 서브뷰가 아니라 일반 웹뷰/브라우저로 열리므로
 * 상세 앱바와 달리 네이티브 브릿지(CLOSE_SUBVIEW) 분기를 쓰지 않는다.
 * history가 있으면 뒤로, 없으면(직접 진입) 메인 허브로 이동한다.
 *
 * 공중에 띄우지 않고(`fixed` 아님) 페이지 흐름 최상단에 헤더처럼 배치한다.
 * 상단 여백(`pt-4`)을 두고 좌측에 정렬한다.
 */
export function BackButton({
  fallbackHref = "/",
  className = "",
}: {
  /** history가 없을 때(직접 진입) 돌아갈 경로. 기본 메인 허브. */
  fallbackHref?: string;
  /** 위치/여백 커스터마이즈용 추가 클래스. */
  className?: string;
}) {
  const router = useRouter();

  function goBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallbackHref);
  }

  return (
    <header className={`flex items-center px-2 pb-2 pt-4 ${className}`}>
      <button
        type="button"
        onClick={goBack}
        aria-label="뒤로 가기"
        className="inline-flex size-10 items-center justify-center text-zinc-900"
      >
        <BackArrowIcon size={24} />
      </button>
    </header>
  );
}
