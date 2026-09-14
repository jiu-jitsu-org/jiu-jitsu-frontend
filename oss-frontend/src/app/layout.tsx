import type { Metadata, Viewport } from "next";

import { AuthProvider } from "@/features/auth/presentation/auth-provider";
import { OpenInAppPromptProvider, ToastProvider } from "@/shared/ui";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  buildOpenGraph,
} from "@/shared/lib/site-metadata";

import "./globals.css";

/**
 * 전역 기본 메타데이터 — 상세 라우트(generateMetadata)가 덮어쓰지 않은 페이지의 공유 미리보기.
 *
 * 카카오톡 등 링크 미리보기는 og:* 를 읽는다. 없으면 페이지 첫 <img>와 `<title>`을 임의로 긁어가
 * 작성자 아바타 + "oss-frontend" 같은 엉뚱한 카드가 나온다 — 그래서 루트에서도 기본값을 깔아 둔다.
 */
export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  openGraph: buildOpenGraph({
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  }),
};

// 네이티브 웹뷰 내 핀치 줌·더블탭 확대 차단 (확대 시 좌우 오버스크롤 인디케이터 발생)
// viewportFit: "cover" — iOS WKWebView에서 env(safe-area-inset-*)를 활성화한다.
// 이게 없으면 인셋이 0으로 깔려 sticky 헤더가 상태바를, 하단 바가 홈 인디케이터를 침범한다.
//
// 키보드 처리는 네이티브 단일 소스(키보드 높이만큼 WKWebView 프레임 축소)로 일원화한다. 따라서
// interactive-widget=resizes-content는 두지 않는다 — WKWebView에서 불완전 동작하면서 프레임 축소와
// 이중으로 레이아웃 뷰포트를 건드려 dvh↔실제 프레임이 어긋나고, 그 오버플로를 스크롤하면 고정 헤더가
// 밀린다. 프레임 축소 방식에선 100dvh = 줄어든 웹뷰 바운스라 셸이 프레임과 정확히 맞아 오버플로가 없다.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {/* "앱에서 계속하기" 안내가 AuthProvider 바깥에 있는 이유: 네이티브가 없을 때(외부 브라우저)
            requireAuth의 로그인 유도가 이 안내로 떨어져야 하므로 AuthProvider가 이를 소비한다. */}
        <OpenInAppPromptProvider>
          {/* 전역 인증/세션 + 네이티브 브릿지 소유자 / 전역 토스트 */}
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </OpenInAppPromptProvider>
      </body>
    </html>
  );
}
