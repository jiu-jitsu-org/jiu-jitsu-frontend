import type { Metadata, Viewport } from "next";

import { AuthProvider } from "@/features/auth/presentation/auth-provider";
import { ToastProvider } from "@/shared/ui";

import "./globals.css";

export const metadata: Metadata = {
  title: "oss-frontend",
  description: "Next.js App Router frontend with src-based structure",
};

// 네이티브 웹뷰 내 핀치 줌·더블탭 확대 차단 (확대 시 좌우 오버스크롤 인디케이터 발생)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
