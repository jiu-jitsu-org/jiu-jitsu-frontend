import { headers } from "next/headers";

import { VersionInfoPage } from "@/features/bootstrap/presentation/version-info-page";
import type { BootstrapInfoResponse } from "@/features/bootstrap/domain/bootstrap-info";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
} from "@/shared/types/api";

const DEFAULT_OS_NAME = "ANDROID";

type VersionInfoRoutePageProps = {
  searchParams?: Promise<{
    osName?: string;
  }>;
};

export default async function VersionInfoRoutePage({
  searchParams,
}: VersionInfoRoutePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const osName = resolvedSearchParams?.osName?.trim() || DEFAULT_OS_NAME;
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host?.includes("localhost") ? "http" : "https");

  if (!host) {
    return (
      <VersionInfoPage
        osName={osName}
        error="Unable to determine the current host for the internal BFF request."
      />
    );
  }

  const response = await fetch(
    `${protocol}://${host}/api/bootstrap/info?osName=${encodeURIComponent(osName)}`,
    {
      cache: "no-store",
    },
  );
  const json = (await response.json()) as
    | ApiSuccessResponse<BootstrapInfoResponse>
    | ApiErrorResponse;

  if (!response.ok || !json.success) {
    return (
      <VersionInfoPage
        osName={osName}
        error={
          "message" in json
            ? json.message
            : "Failed to load bootstrap version info."
        }
        errorDetails={"details" in json ? json.details : undefined}
      />
    );
  }

  return <VersionInfoPage osName={osName} data={json.data} />;
}
