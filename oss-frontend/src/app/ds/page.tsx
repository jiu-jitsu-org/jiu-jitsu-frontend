import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { isDesignSystemPageEnabled } from "@/features/design-system/application/is-design-system-page-enabled";
import { DesignSystemPage } from "@/features/design-system/presentation/design-system-page";

export const metadata: Metadata = {
  title: "디자인 시스템",
  robots: { index: false, follow: false },
};

export default async function DesignSystemRoutePage() {
  // 빌드 때 미리 그려 두지 않고 요청마다 판단한다 — 같은 빌드가 개발 서버와 운영에 함께 올라가도
  // 실행 환경(API 주소)에 따라 열리고 닫힌다.
  await connection();
  if (!isDesignSystemPageEnabled()) notFound();
  return <DesignSystemPage />;
}
