import type { Metadata } from "next";

import { SupportPage } from "@/features/policies/presentation/support-page";

export const metadata: Metadata = {
  title: "고객 지원",
};

export default function SupportRoutePage() {
  return <SupportPage />;
}
