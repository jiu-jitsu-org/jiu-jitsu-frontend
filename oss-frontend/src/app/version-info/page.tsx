import { getBootstrapInfoPageData } from "@/features/bootstrap/application/get-bootstrap-info-page-data";
import { VersionInfoPage } from "@/features/bootstrap/presentation/version-info-page";

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

  /**
   * Server Components already execute on the server, so this page can call the
   * feature application query directly. The BFF Route Handler remains available
   * for browser/client-side JSON access, but initial SSR avoids calling our own
   * HTTP endpoint.
   */
  const result = await getBootstrapInfoPageData(osName);

  if (!result.ok) {
    return (
      <VersionInfoPage
        osName={osName}
        error={result.error}
        errorDetails={result.errorDetails}
      />
    );
  }

  return <VersionInfoPage osName={osName} data={result.data} />;
}
