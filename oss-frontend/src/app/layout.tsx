import type { Metadata } from "next";

import { AuthProvider } from "@/features/auth/presentation/auth-provider";
import { ToastProvider } from "@/shared/ui";

import "./globals.css";

export const metadata: Metadata = {
  title: "oss-frontend",
  description: "Next.js App Router frontend with src-based structure",
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
