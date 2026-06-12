import type { Metadata, Viewport } from "next";

import { AuthProvider } from "@/features/auth/presentation/auth-provider";
import { ToastProvider } from "@/shared/ui";

import "./globals.css";

export const metadata: Metadata = {
  title: "oss-frontend",
  description: "Next.js App Router frontend with src-based structure",
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
        {/* 전역 인증/세션 + 네이티브 브릿지 소유자 / 전역 토스트 */}
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
